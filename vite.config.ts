import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

function airQualityApiPlugin(): Plugin {
  return {
    name: "air-quality-api-plugin",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith("/api/air-quality")) {
          try {
            const module = await server.ssrLoadModule("./api/air-quality.ts");
            await module.default(req, res);
          } catch (err) {
            console.error("Vite air-quality dev API error:", err);
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Błąd serwera lokalnego" }));
          }
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), airQualityApiPlugin()],
  server: {
    proxy: {
      "/api/pse": {
        target: "https://api.raporty.pse.pl",
        changeOrigin: true,
        rewrite: (path) => {
          const url = new URL(path, "http://vite.local");
          const dataset = url.pathname.replace("/api/pse/", "");
          const date =
            url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
          const limit = url.searchParams.get("limit") ?? "100";
          const upstream = new URL(`/api/${dataset}`, "https://api.raporty.pse.pl");
          upstream.searchParams.set("$filter", `business_date eq '${date}'`);
          upstream.searchParams.set("$orderby", "dtime_utc asc");
          upstream.searchParams.set("$first", limit);
          return `${upstream.pathname}${upstream.search}`;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
