# econotifier

Energy and environmental dashboard backed by PSE and GIOŚ data.

## Redis cache

- **PSE data**: Requests go through `/api/pse/[dataset]`, cached in Redis for 5 minutes (`pse:<dataset>:<date>:<limit>`).
- **GIOŚ Air Quality data**: Requests go through `/api/air-quality`, backed by GIOŚ v1 REST API.
  - Active stations metadata is cached in Redis for 24 hours (`gios:stations:v1`).
  - Station air quality index and sensor readings are cached in Redis for 15 minutes (`gios:station:<id>:aq`).
  - Supports geolocation query params (`?lat=...&lon=...`) using the Haversine formula to find the closest active measuring station, or station lookup (`?stationId=...`).

Set these variables in Vercel (and locally in `.env.local` / `.env.development.local`) to enable Redis caching:

```bash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

The routes also accept Vercel KV-compatible `KV_REST_API_URL` and `KV_REST_API_TOKEN` variables. If Redis credentials are not present, an in-memory process cache acts as a fast fallback; the `X-Cache` response header reports `HIT`, `MISS`, or `BYPASS`.

Run the app with `bun run dev` (Vite dev server handles `/api/air-quality` with local middleware and proxies `/api/pse`). Deploy with Vercel for serverless edge/node execution.

## Frontend setup

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
