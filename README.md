# econotifier

Energy market dashboard backed by PSE data.

## Redis cache

Production PSE requests go through the Vercel Function at `/api/pse/[dataset]`.
Responses are cached in Redis for five minutes using dataset, date, and limit as
the cache key. Set these variables in Vercel (and locally in `.env.local`) to
enable it:

```bash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

The route also accepts Vercel KV-compatible `KV_REST_API_URL` and
`KV_REST_API_TOKEN` variables. It remains available if Redis is temporarily
unavailable; the `X-Cache` response header reports `HIT`, `MISS`, or `BYPASS`.

Run the app with `bun run dev`; Vite proxies `/api/pse` to PSE locally. Deploy
with Vercel to use the Redis-backed route.

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
