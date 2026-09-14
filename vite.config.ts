import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
