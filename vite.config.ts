import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

function localApiDevPlugin(): Plugin {
  return {
    name: "local-api-dev-plugin",
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
            res.end(JSON.stringify({ error: "Błąd serwera lokalnego jakości powietrza" }));
          }
          return;
        }

        if (req.url?.startsWith("/api/pse")) {
          try {
            const module = await server.ssrLoadModule("./api/pse/[dataset].ts");
            await module.default(req, res);
          } catch (err) {
            console.error("Vite PSE dev API error:", err);
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Błąd serwera lokalnego PSE" }));
          }
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localApiDevPlugin()],
  server: {
    proxy: {
      "/api/pse-upstream-direct": {
        target: "https://api.raporty.pse.pl",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
