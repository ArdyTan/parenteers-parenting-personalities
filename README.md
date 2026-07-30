# Parenting Bakes

A mobile-only, bilingual personality quiz for Parenteers: 12 parenting scenarios resolve to one of 16 bake-character personalities, followed by a 9:16 Instagram Story result.

Indonesian is the default language. The application is a static Vite site deployed through Cloudflare Workers static assets; content lives in bundled JSON rather than a backend.

## Requirements

- Node.js 24.14.0 (see `.nvmrc`)
- npm 11.9.0 or the version declared in `package.json`

## Local development

```bash
npm ci
npm run dev
```

The development server binds to the LAN so the quiz can be tested on a phone. The canonical canvas is 390×844. Desktop and fine-pointer clients are routed to the desktop gate or framed fallback as each phase is implemented.

## Verification

```bash
npm test
npm run typecheck
npm run build
npm run build:release
npm run assets:phase4
npm run assets:audit
npm run assets:placeholders
npm run deploy:dry
```

`npm test` includes scoring and JSON integrity checks. `npm run build` remains available for local/preview validation while launch links are unresolved; `npm run build:release` and `npm run deploy` fail until every `TBD` in `src/data/config.json` is replaced.

`npm run assets:phase4` deterministically rebuilds the active character, ordered opening, and 404 WebPs from `images/`. `npm run assets:placeholders` is a legacy fallback that creates only missing character WebPs and never overwrites delivered production assets unless explicitly run with `--force`.

## Project map

- `progress.md` — current status and next action
- `plan.md` — phases, budgets, animation blueprint, and decisions
- `structure.md` — runtime architecture and scene contracts
- `conventions.md` — interaction, performance, accessibility, copy, and Git rules
- `data-spec.md` — authoritative JSON schemas and validation invariants
- `src/data/` — runtime content database
- `docs/motion/` — the 34 selected WebAnimation Library implementation guides
- `docs/deployment.md` — Cloudflare Workers and Workers Builds handoff

## Deployment

```bash
npm run deploy
```

See `docs/deployment.md` for the dashboard configuration. Never commit `.dev.vars`, `.env` files, Wrangler state, or generated production bundles.

## Content rules

Do not rewrite the source copy while transcribing it. Indonesian shorthand such as `yg`, `dr`, `tp`, and `gak` is intentional. The quiz is for fun and reflection, not a clinical or diagnostic assessment.
