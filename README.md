# Parenting Bakes

A mobile-only, bilingual personality quiz for Parenteers: 12 parenting scenarios resolve to one of 16 bake-character personalities, followed by a 9:16 Instagram Story result.

Indonesian is the default language. The application is a static Vite site deployed through Cloudflare Workers static assets at [quiz.parenteers.id](https://quiz.parenteers.id/); content lives in bundled JSON rather than a backend.

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
npm run assets:pdf-art
npm run assets:pdf
npm run qa:pdf
npm run assets:placeholders
npm run deploy:dry
```

`npm test` includes scoring and JSON integrity checks. `npm run build:release` and `npm run deploy` enforce that every launch link in `src/data/config.json` is resolved before publishing.

`npm run assets:phase4` deterministically rebuilds the active character, ordered opening, and 404 WebPs from `images/`. `npm run assets:placeholders` is a legacy fallback that creates only missing character WebPs and never overwrites delivered production assets unless explicitly run with `--force`.

`npm run assets:pdf-art` derives the 54 commissioned booklet illustrations. `npm run assets:pdf`
rebuilds the 32 committed 16-page A-layout booklets and fails if any page clips. `npm run qa:pdf`
then verifies the canonical file set, content, activity coverage, page count, size and embedded fonts.

## Project map

- `progress.md` — current status and next action
- `plan.md` — phases, budgets, animation blueprint, and decisions
- `structure.md` — runtime architecture and scene contracts
- `conventions.md` — interaction, performance, accessibility, copy, and Git rules
- `data-spec.md` — authoritative JSON schemas and validation invariants
- `src/data/` — runtime content database
- `docs/motion/` — the 34 selected WebAnimation Library implementation guides
- `docs/deployment.md` — Cloudflare Workers and Workers Builds handoff
- `docs/personality-pdf-plan.md` — booklet content, generation and QA contract
- `docs/personality-pdf-art-brief.md` — 54-slot art production/QC contract and prompt handoff status

## Deployment

Production: [https://quiz.parenteers.id/](https://quiz.parenteers.id/)

```bash
npm run deploy
```

See `docs/deployment.md` for the dashboard configuration. Never commit `.dev.vars`, `.env` files, Wrangler state, or generated production bundles.

## Content rules

Do not rewrite the source copy while transcribing it. Indonesian shorthand such as `yg`, `dr`, `tp`, and `gak` is intentional. The quiz is for fun and reflection, not a clinical or diagnostic assessment.
