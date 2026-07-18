# progress.md — Living Status
**What this is:** the single place a fresh session looks to know where the project stands. **Every working session ends by updating this file** — flip phase statuses and prepend a dated log entry. Keep it terse; detail belongs in the other docs.

## Status snapshot

| Phase (plan.md §13) | Status |
|---|---|
| Content & research docs (pre-project) | ✅ done |
| Planning & architecture docs | ✅ done (2026-07-17) |
| 0 — Setup (scaffold, tokens, deploy, copy guides) | 🟨 local + dry run done; live deploy pending auth |
| 1 — Data & i18n (transcribe .md → JSON, scoring + tests) | ⬜ |
| 2 — Core flow, zero polish | ⬜ |
| 3 — Gesture & WebGL foundations | ⬜ |
| 4 — Motion layer | ⬜ |
| 5 — Share pipeline | ⬜ |
| 6 — QA hardening | ⬜ |
| 7 — Launch extras (optional) | ⬜ |

## Next action

Finish the external edge of **Phase 0**: authenticate Wrangler to the intended Cloudflare account, run `npm run deploy`, verify the live `/` and `/r/pcte` routes, then connect the Git remote to Workers Builds for branch previews. Once the URL is recorded, close Phase 0 and start Phase 1 per `data-spec.md` §8.

## Waiting on user (plan.md §15)

- [~] 16 character masters delivered in `images/` at 1254×1254; all are opaque and need background removal/alpha prep before Phase 3
- [~] Support art delivered in `images/` at 1254×1254; production WebP processing remains for Phase 4
- [ ] Parenteers activities URL — Phase 2 (`config.json links.activities`)
- [ ] Final domain — Phase 5 (`config.json links.site`)
- [ ] Cloudflare Wrangler authentication + Git remote/Workers Builds connection — required to close Phase 0
- [~] Palette/font defaults are implemented; sign-off remains optional unless changed
- [ ] Any overrides to plan.md §14 decision defaults

## Session log (newest first)

**2026-07-18 — Local Git trust repaired for the user account.**
The workspace folder is owned by `NagaPutih\tanar`, while the `.git` directory created by Codex is owned by `NagaPutih\CodexSandboxOffline`. Its inherited ACL grants Modify access and there is no stale `index.lock`, but the owner mismatch can trigger Git's dubious-ownership guard in desktop/local clients. Windows denied a non-administrator ownership transfer without changing any files, so the exact repository path—not a wildcard—was added to the user's global `safe.directory` list. Repository remains healthy on `main`.

**2026-07-18 — Phase 0 implemented locally; live Cloudflare authentication is the only closeout gap.**
Initialized Git on `main`; scaffolded pinned Vite 8 + TypeScript 7 + Vitest + Wrangler; added the Cloudflare static-assets SPA configuration, Workers Builds handoff, self-hosted Fraunces/Plus Jakarta Sans subsets (89,780 bytes total), design tokens/base shell, favicon, and deterministic asset audit. Added a safe CLI launcher for the workspace's `#` path. Copied and SHA-256 verified the exact 34 motion guides, and normalized cross-document contract drift before coding. Final verification passes: 3/3 tests, typecheck/build, Wrangler upload dry run, local fonts, 390×844 mobile edge, reduced-motion tokens, 1200px desktop 390×844 frame, no horizontal overflow, and `/r/pcte` SPA fallback. Visual QA caught and fixed framed-container typography/overflow. Intake audit found all 20 supplied PNGs at 1254×1254 RGB; the 16 characters still need alpha backgrounds. `wrangler whoami` is unauthenticated, so no live URL is claimed yet.

**2026-07-17 — Hosting decided: Cloudflare Workers (free plan, static assets).**
Chosen over the user's Cloudways box (1GB Basic, $11/mo): the app is fully static, Workers serves static assets free/unlimited (viral IG spikes cost $0 and can't saturate a VPS), and Cloudflare's Jakarta edge PoP serves the Indonesian audience faster than a single-origin server — which the plan §10 LCP budget depends on. Cloudways stays for whatever it already hosts; this project doesn't touch it. plan.md §1 + Phase 0 updated accordingly.

**2026-07-17 — Planning complete.**
Read the three content docs; researched Awwwards criteria; user redirected taste source to `D:\#dev\WebAnimation Library` (99 techniques + guides — now the benchmark, saved to memory). Produced the doc set: `plan.md` (phases, budgets, §8 moment→technique blueprint, §14 decisions), `structure.md` (architecture + reuse recipe), `conventions.md` (rules), `data-spec.md` (JSON db spec), `progress.md` (this file), `CLAUDE.md` (orchestrator). No code exists yet. All §14 decision defaults stand unless the user says otherwise.
