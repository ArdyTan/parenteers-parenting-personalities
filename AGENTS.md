# AGENTS.md: Project Orchestrator

**Parenting Bakes** is an Awwwards-caliber, mobile-only quiz web app for Parenteers. 12 scenario questions → 1 of 16 bake-character parenting personalities → a 9:16 result built to be screenshotted into an Instagram Story. Bilingual (ID default / EN). Static site, no backend: the database is JSON files. This file routes you to everything; keep it lean and don't duplicate doc content here.

## Fresh-session protocol

1. Read **`progress.md`** for the current phase, next action, blockers and session log. This is the only file that tells you *where we are*.
2. Read the current phase's section in **`plan.md` §13** and its referenced blueprint rows (**§8**).
3. Pull in `structure.md` / `conventions.md` / `data-spec.md` as the work requires (map below). Don't re-read everything every time.
4. Never re-litigate decided things: decisions live in **`plan.md` §14** (defaults apply unless the user overrides) and past context lives in the `progress.md` log.
5. **Before ending a session: update `progress.md`** (statuses + a dated log entry). This is mandatory: it is what keeps the next chat sterile.

## Doc map (single source of truth per topic)

| File | Authoritative for |
|---|---|
| `progress.md` | Current status, next action, waiting-on, session history |
| `plan.md` | Build phases + ✓ criteria, §8 moment→technique blueprint, §10 budgets, §14 open decisions, §15 user blockers |
| `structure.md` | Architecture: scene machine, routing, boot, share pipeline, plus the §11 recipe to clone this architecture for similar projects. Its §8 GL world facade is historical; that layer was removed in Phase 5.5 |
| `conventions.md` | Non-negotiable rules: interaction ground rules, motion, code, perf, a11y, copy/i18n, assets, git |
| `data-spec.md` | JSON database schemas, type registry, scoring, i18n key conventions, validation invariants, .md→JSON transcription map |
| `parenting-personality-research.md` | Science layer, the 16 types' source definitions |
| `docs/personality-parent-first-content.md` | Research/editorial basis for the guilt-reducing, parent-first `types.json parentSupport` layer |
| `docs/personality-pdf-plan.md` | The downloadable per-type PDF booklet: research basis (Montessori · filial/CPRT · serve-and-return), the 16-page structure, the three activity registries and their selection rule, the generation pipeline and its QA contract |
| `docs/personality-pdf-art-brief.md` | Production contract for the booklet's 54 installed illustrations: source/derivative inventory, reference anchoring, hard rules, legal sizes and slot ids |
| `quiz-01-flow-dialogue.md` | Page-by-page copy EN/ID (transcribe, never rewrite) |
| `quiz-02-ui-strings.md` | UI string table → i18n JSON verbatim |
| `docs/phase-5-5-interface-plan.md` | Phase 5.5 interface spec: the design-system token table, the three-band shell, per-screen composition, and the `qa:phase55` contract |
| `docs/question-swipe-plan.md` | Phase 9: rewritten bilingual question contract, directional swipe + tap auto-advance, correction, implementation sequence and QA |
| `docs/performance-probes.md` | How runtime cost is measured: the `perf:probe`/`perf:canvas` harnesses, the recorded baselines, and the interpretation traps |
| `docs/design-tokens.md` | Figma-facing export of the implemented token system (colour, type, spacing, motion, the 16 result accents) |
| `docs/deployment.md` | Cloudflare Workers deploy: asset fallback, the prerendered `/r/{slug}` exception, custom domain and Workers Builds |
| `images/README.md` | Current source-art inventory, folder roles, exact reference/opening/type order, archive boundary, and production caveats |
| `images/old images/quiz-03-image-prompts.md` | **Archived; ignore for build.** Only its §5 asset naming remains relevant (mirrored in conventions.md §7) |

## Hard invariants (violating any of these is a bug)

- **Mobile-only:** ≥900px (or fine-pointer, no touch) gets the QR gate; "continue anyway" runs the app in a 390×844 phone frame.
- **ID is the default language;** EN via persisted toggle. ID copy register stays conversational (`yg`, `dr`, `tp`, `gak`). Never formalize.
- **Scoring:** majority letter per dimension over 12 questions (3 per dimension, ties impossible) → `[PF][CG][TD][EN]` code. Answer positions randomized per render; the pole travels with the answer.
- **Database = bundled JSON files** per `data-spec.md`. No backend, no accounts. Content is never hardcoded in scenes.
- **Endgame:** the story-mode screen must produce a clean screenshot in the Instagram in-app browser, so that path can't depend on downloads or Web Share.
- **Taste benchmark:** `D:\#dev\WebAnimation Library`. Port from its `guides/`, don't invent patterns or cite blog posts.
- **Visual authority (Phase 5.5):** the **Brilliant** design file `C:\Users\tanar\.config\brilliant\scratch\Canvas.design` (design system `figma-parenting-personalities`). Read exact geometry and tokens from it through the Brilliant connector rather than measuring the exports in `images/new-layout/`. Layout tokens are `universal-padding 34` / `header-to-body 16` / `component-spacing 12`; every scene is the three-band column (header 70/pad 17 · body fill · bottom section pad 0/34/34). **One deliberate exception:** Baking has no bottom section, because it advances on a timer and has nothing to press. Copy/data documents still control wording. `images/Interface-Reference/` is historical and no longer in the tree.
- **No WebGL in the runtime** (removed Phase 5.5, plan §6). Before adding any full-bleed or fixed decorative layer, prove it contributes visible pixels with `npm run perf:canvas`. See `docs/performance-probes.md`.
- **Copy honesty:** "built on 4 research-backed parenting dimensions," never "science says there are 16 types." Disclaimer on the result page (the terminal surface). Equal love across all 16 types.
- **The journey ends on the Result.** `/end` was removed on 2026-08-02 (scene, route, guard, `end.*` keys, art entry, CSS). Result is the terminal surface, so anything that used to live on the closing page has to earn a place there or not exist. Currently homeless: the "Follow @parenteers" CTA and the made-by/copyright footer. `config.flags.founderNote` still validates but is **unwired**.
- **Baking advances itself.** `config.loading.holdMs` (5000) then `/r/{slug}`; a tap anywhere skips. No button, no bottom band. Any timer added here must be idempotent against the tap and cleared in `onDestroy`.
- **Question art is a layer, not a graded overlay.** The band spans the headline's row so the illustration always keeps its native 390×260; the copy sits over it by z-index (band 0, stack 1, `.scene__body` isolated). `mask-image` is `none` by default and a bottom fade is reinstated only under `@media (max-height: 51.25rem)`, the measured height at which the copy first reaches real picture rather than the image's empty margin. All three bands must stay pinned to `grid-column: 1` or the stack auto-places into an implicit second column and halves the scene.
- **Type scales on both axes.** Display tiers are `clamp(floor, min(Ncqi, Msvh), ceiling)`: `cqi` alone only answers "how wide", and a phone with browser chrome is the same width as the canvas but ~120px shorter. Headline tier is also chosen by scenario length (`data-scale` md >40 chars, sm >58). **Never add a viewport-height unit without a `:root[data-presentation="framed"]` override**, since `svh` measures the browser window rather than the 390×844 preview frame.
- **Audio:** on by default for fresh visitors, subject to the browser's autoplay gate; the first trusted interaction unlocks playback. A persisted explicit `off` always wins, and the header toggle must stay reachable wherever sound can play (WCAG 1.4.2). One-shots are synthesized in `core/audio.ts`, no SFX files. The theme streams via `<audio preload="none">`; **never** decode it (152.6s = 55.88 MB of Float32). Reduced motion drops choreography, not sound.
- **The share card is `images/Result Card.jpg`.** `composeResultStoryCard` reproduces that 390×768 artwork, scaled uniformly to the card height and centred inside the 1080×1920 export. `CARD_LAYOUT` in `core/share.ts` holds its measured ink bounds in the artwork’s own units, so change the design there rather than nudging offsets. The card carries no superpowers list, watch-out or disclaimer.
- **The preloader clip must stay faststart, and must never block launch.** `public/motion/preloader.mp4` is built by `npm run assets:preloader` from the master in `images/web-component/`; `moov` ahead of `mdat` is what lets a frame decode in a few KB instead of 1.8 MB. The first-frame gate is capped at 900ms and never rejects, and the overlay clears its `src` on exit so in-flight requests stop. Reduced motion holds frame one.
- **The desktop gate is copy left, QR right:** one card, one breakpoint at `56.25rem`, tightening under `max-height: 53rem` so a hand-off screen never becomes a scroll. Below the breakpoint it stacks and the scan panel leads. Its four `gate.*` strings are placeholders awaiting a copy pass.
- **The PDF booklet is a committed derivative, never a runtime feature.** Layout A is the sole final template: 16 A4 pages, one file per type per language at `public/pdf/{lang}/{slug}.pdf`, generated by `npm run assets:pdf` through headless Chrome, byte-normalized for stable rebuilds, and checked by `npm run qa:pdf`. All 54 commissioned illustrations are installed through `images/pdf-art/**` → `public/pdf-art/**`; no placeholder frames or B/C generator paths remain. Filling every slot puts each booklet at ~1.1 MB (34 MB committed). The generator asserts every page's `scrollHeight` against its `clientHeight`, so a clipped page fails the run instead of silently losing copy — and a band frame must keep `flex: 1 1 0`, because sizing it from its own 3:2 ratio pins the column's min-content height and overruns page 15. No PDF library may enter the bundle. The Result link is plain markup with `target="_blank"` and **no** `download` attribute, because Instagram's WebView silently drops both `download` and `blob:`. Every child activity carries a method tag and bilingual safety line; the section closes with explicit permission to skip. Spec: `docs/personality-pdf-plan.md`.
- conventions.md §1 ground rules (Pointer Events only, `touch-action` discipline, transform/opacity-only, paired haptics, reduced-motion parity, one `gsap.ticker` clock) apply to every line of interaction code.

## WebAnimation Library workflow

The library at `D:\#dev\WebAnimation Library` holds 99 offline technique demos; `guides/<nn>-<slug>.md` are self-contained implementation briefs. Phase 0 copies exactly **34 guides** into `docs/motion/`: the 32 unique technique guides cited by plan §8, plus gesture-utility guides 59 and 60. To build any animated moment:

1. Find its row in plan.md §8 → technique number(s).
2. Read `docs/motion/<nn>-<slug>.md` (fall back to the library path if not yet copied).
3. Port the **core mechanism, not the demo chrome**: swap its dark-editorial theme for our tokens, reuse our existing Lenis/ticker instances, keep its reduced-motion + performance structure. Skip the WebGL guides (08/09/16): that layer was removed in Phase 5.5 (plan §6).

## Commands

```bash
npm run dev        # Vite dev server (test on phone via LAN IP)
npm run test       # scoring + data-integrity validation (data-spec.md §7)
npm run build      # static build incl. 16 prerendered /r/{slug} OG stubs
npm run preview    # production preview
npm run qa:phase55 # interface contract at 390x844 plus a 390x720 short-viewport pass
npm run qa:phase55 -- --reduced   # the same contract under prefers-reduced-motion; both must pass
npm run perf:probe # heap, decoded-image footprint, throttled fps, leak check
npm run perf:canvas # proves no background layer is rendering behind opaque paint
npm run assets:audit     # strict inventory: every derivative's size, weight and format
npm run assets:preloader # rebuilds public/motion/preloader.mp4 (faststart) from its master
npm run assets:pdf-art   # derives the 54 booklet illustrations into public/pdf-art/
npm run assets:pdf       # rebuilds the 32 booklets; asserts no page clips its content
npm run qa:pdf           # verifies the 32 final PDF artifacts and bilingual content
npm run deploy           # release gate, build, then wrangler deploy to quiz.parenteers.id
```

The three browser harnesses need `npm run dev` plus a Chrome started with
`--remote-debugging-port=9223`, and write their captures into `artifacts/`.
`npm run assets:pdf` also drives Chrome, but renders a local template and does not need the dev
server.

## Working agreements

- Verify at 390×844 **and at a short viewport (~720)** **and** with `prefers-reduced-motion` before calling any scene done; a phase closes only when its plan §13 ✓ criteria pass. 844 is the design canvas, not a real phone: an A55 or S25 FE with browser chrome is ~720–790 CSS px, and every layout defect reported from a real device in this project has been invisible at 844.
- Real-device surface for QA is the **Instagram in-app browser**, not just Safari/Chrome.
- Ask the user only for §15 blockers or genuine scope changes; everything else has a default.
- **Seed `sessionStorage['pb1.answers']` before any probe that deep-links to `/q/N`.** The route guard silently redirects to the first unanswered question, so an unseeded sweep measures Q1 every time while looking like it covered many. This has already produced one wrong measurement claim.
- Measure before concluding: pixel-diff a layer before assuming it is visible, and read `docs/performance-probes.md` §Interpretation traps before trusting any probe output. Prefer measuring a threshold over guessing one; the question-art fade breakpoint was set from a copy-on-art sweep, not taste.
- Session hygiene: small commits scoped by phase (`feat(scenes): …`, `data: …`), and always leave `progress.md` current.
