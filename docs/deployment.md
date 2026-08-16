# Cloudflare Workers deployment

The app deploys as an assets-only Cloudflare Worker. `wrangler.jsonc` points to Vite's `dist/` and uses `single-page-application` fallback so direct navigation to client routes receives `index.html`.

Project-level Wrangler usage metrics and dependency instrumentation are disabled in `wrangler.jsonc`; this applies to both local CLI runs and Workers Builds.

Production custom domain: `https://quiz.parenteers.id/`. Wrangler owns this hostname as a Custom Domain, allowing Cloudflare to provision its DNS record and TLS certificate automatically.

## Local verification

```bash
npm run test
npm run build
npm run build:release
npm run deploy:dry
```

Use `npm run deploy` only when authenticated with the intended Cloudflare account.

## Workers Builds settings

When the repository is connected in Cloudflare Workers Builds:

- Worker name: `parenting-bakes` (must match `wrangler.jsonc`)
- Production branch: `main`
- Preview build command: `npm run build`
- Production release build command: `npm run build:release`
- Deploy command: `npx wrangler deploy`
- Non-production deploy command: `npx wrangler versions upload`
- Root directory: repository root

The Git connection itself is configured in the Cloudflare dashboard after this repository has a GitHub or GitLab remote. No account IDs or secrets belong in this repository.

References: [Cloudflare SPA static-assets routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/) and [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).
