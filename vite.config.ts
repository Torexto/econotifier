import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { type Plugin, defineConfig } from "vite";

function apiDevMiddleware(): Plugin {
   return {
      name: "api-dev-middleware",
      configureServer(server) {
         server.middlewares.use(async (req, res, next) => {
            if (!req.url?.startsWith("/api/")) return next();

            try {
               const parsedUrl = new URL(
                  req.url,
                  `http://${req.headers.host || "localhost"}`,
               );
               const pathname = parsedUrl.pathname;

               if (pathname.startsWith("/api/pse/")) {
                  const dataset = pathname.replace("/api/pse/", "") as any;
                  const { fetchPseDataset, validDate, validLimit } =
                     await import("./api/pse/_shared.js");
                  const date = validDate(parsedUrl.searchParams.get("date"));
                  const limit = validLimit(parsedUrl.searchParams.get("limit"));
                  const { data } = await fetchPseDataset(dataset, date, limit);
                  res.setHeader(
                     "Content-Type",
                     "application/json; charset=utf-8",
                  );
                  res.end(JSON.stringify(data));
                  return;
               }

               if (pathname === "/api/air-quality") {
                  const { handleAirQualityRequest } = await import(
                     "./api/air-quality.js"
                  );
                  const { status, body } =
                     await handleAirQualityRequest(parsedUrl);
                  res.statusCode = status;
                  res.setHeader(
                     "Content-Type",
                     "application/json; charset=utf-8",
                  );
                  res.end(JSON.stringify(body));
                  return;
               }

               next();
            } catch (error) {
               console.error("Dev API middleware error:", error);
               res.statusCode = 502;
               res.setHeader(
                  "Content-Type",
                  "application/json; charset=utf-8",
               );
               res.end(JSON.stringify({ error: (error as Error).message }));
            }
         });
      },
   };
}

export default defineConfig({
   plugins: [react(), tailwindcss(), apiDevMiddleware()],
   resolve: {
      alias: {
         "@": "/src",
      },
   },
});
