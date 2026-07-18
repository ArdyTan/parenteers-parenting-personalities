# conventions.md — Engineering, Motion & Content Rules
**What this is:** the non-negotiable rules for building this project (and any sibling built from `structure.md` §11). Most are adopted verbatim from the WebAnimation Library's ground rules — the taste benchmark for this work.

---

## 1. Interaction Ground Rules (from the library — always on)

1. **Pointer Events only** — `pointerdown/move/up` + `setPointerCapture`. One code path for mouse and touch. Never separate `touchstart` handlers.
2. **`touch-action` discipline** — every gesture surface declares `none` / `pan-y` / `pan-x` explicitly so the browser never fights a gesture. Passive listeners everywhere else.
3. **60fps on mid-range phones** — animate `transform` and `opacity` only. No layout-property animation (use GSAP Flip for layout changes), no filters/blur on large surfaces, no `background-attachment` parallax.
4. **rAF loops stop when idle** — anything per-frame (world render, springs, marquees) must idle when nothing moves and pause on `document.hidden`.
5. **Haptics are paired** — `navigator.vibrate()` (Android) always ships with a visual pulse so iOS users feel the same beat. Patterns live in `core/haptics.ts`: `tick` (answer select, ~10ms), `celebrate` (result, short pattern), `boundary` (detents).
6. **`prefers-reduced-motion` in every scene** — choreography degrades to crossfades/instant states via `gsap.matchMedia()`; function is never lost. Particles/shader drift freeze; the world may render a static frame.
7. **Gestures are never the only path** — every swipe/drag action has a visible tap alternative (buttons). A11y and discoverability both.

## 2. Motion Rules

- **One clock:** all per-frame work hangs off `gsap.ticker` (Lenis included — technique 01 sync). Creating a second rAF loop is a bug.
- **Dough ease:** register once in `anim/ease.ts` (`CustomEase` soft overshoot) and use it everywhere squashy. Standard eases: `power2.out` (exits/fades), `back.out(1.4)` (pops), `doughEase` (presses, morphs, character moments).
- **Duration scale:** micro-feedback 120–200ms · element reveals 400–600ms · scene transitions 600–900ms. Nothing blocks input longer than 200ms; long choreography must be interruptible or skippable (tap-to-skip).
- **Interruptibility contract:** every `enter`/`exit` timeline can be killed mid-flight and jumped to its end state without visual debris.
- **Stagger taste:** 40–70ms between siblings; max ~8 staggered items before grouping.
- **`will-change` hygiene:** add just before animating, remove on complete (the library does this everywhere — copy the pattern).
- **Squash-and-stretch over fades:** this brand's motion is physical (dough). Prefer scale/skew deformation with settle to plain opacity, except for text.

## 3. Code Rules

- TypeScript strict; no framework; ES modules; kebab-case filenames.
- **Scene contract compliance** (structure.md §4): symmetric mount/unmount, zero leaks on swap (listeners, tweens, ScrollTriggers, Lenis).
- **Layer boundaries:** scenes ↛ three.js (use `world.ts` facade) · `gl/` ↛ store (values are pushed in) · `core/` ↛ scenes.
- Three.js imported tree-shaken (`three/src/...` or careful named imports); no postprocessing chain.
- All design values from `styles/tokens.css` custom properties — **no raw hex/px-magic in scene CSS**.
- Content **never hardcoded** — strings via `i18n`, data via `data/*.json` (boundary in data-spec.md §5).
- Dev-time data validation runs in tests AND on app boot in dev mode (fail loud, not blank).
- Comments only for non-obvious constraints (e.g. *why* a listener is non-passive).

## 4. Performance Rules

Budgets live in plan.md §10 (JS ≤300KB gz, fonts ≤120KB, ≤300KB images/screen, LCP <2.5s). Enforcement rules:

- DPR clamped ≤2; quality tier from the boot fps probe scales particles/noise/trail.
- Character images: 1024px WebP with alpha for UI (masters stay out of the bundle); OG images pre-baked at build.
- Fonts: 2 families max, subset (latin + latin-ext), self-hosted woff2, loaded behind the preloader.
- Idle preloading (`requestIdleCallback`) for everything the result needs, started after Q1.
- Shader compile + texture upload happen during the preloader (warm-up) — never on first interaction.
- Test gate: Lighthouse perf ≥90 mobile; manual scroll/gesture check on a real mid-range Android.

## 5. Accessibility Rules

- Reduced-motion parity (rule 1.6) — verified per scene before a phase closes.
- Touch targets ≥44px; thumb-zone primary CTAs (bottom half).
- Focus moved to the new scene's heading on swap; visible focus styles.
- All ARIA copy from `a11y.*` i18n keys — progressbar announces "Question {n} of {total}"; illustrations use the alt pattern.
- `<html lang>` flips with the language toggle.
- Contrast: cocoa `#5C4033` on cream `#FFF6EC` for body text; accent colors are decorative only, never the sole signal.
- Landscape shows the rotate-lock overlay; the app never renders broken sideways.

## 6. Copy & i18n Rules (from quiz-02 QA notes — binding)

1. **ID register stays conversational** — `yg`, `dr`, `tp`, `gak` are intentional. Never formalize during dev.
2. **"Watch-out, with love" stays in English** in the ID interface (brandable label). Full-ID variant if ever requested: `Catatan sayang`.
3. **Emoji are copy, not decoration** — keep them inside strings, render them in the share card.
4. EN uses simple sentence structures (accessible to Indonesian readers on the EN toggle).
5. Interpolation variables (`{n}`, `{total}`, `{type}`, `{emoji}`, `{link}`, `{year}`, `{lang}`) are never translated or reordered without updating template logic.
6. **Honesty rule:** "built on 4 research-backed parenting dimensions" — never "science says there are 16 parenting types."
7. **Equal love:** all 16 types keep the same compliment density and word counts; no type reads as the default good one.
8. Disclaimer appears on result + end pages: *"For fun & reflection — not a clinical assessment or diagnostic tool."*
9. Humor targets the parent experience (cold coffee, cardboard boxes) — never the child, never outcomes.

## 7. Asset Conventions (from quiz-03 §5 — the only part of that file used in-app)

- Characters: `public/characters/{code}-{bake}.webp` — e.g. `pcte-croquembouche.webp`, `fgdn-bolu-kukus.webp` (16 total; full list in data-spec.md §4). Delivered masters: 2048×2048 PNG, background-removed → converted to ~1024px WebP for UI.
- Support art: `asset-loading`, `asset-404`, `asset-pattern` (same pipeline).
- OG images: `public/og/{slug}.png` 1080×1350 (4:5) + `default.png` 1200×630.
- SFX (optional): `public/sfx/{name}.mp3`, ≤20KB each, muted-by-default toggle.
- Alt text pattern (both languages, from i18n): "Cute illustration of {type}, a parenting-style bake character."

## 8. Git & Session Conventions

- Conventional-ish commits scoped by phase: `feat(scenes): question deck fling (lib 52)` · `data: transcribe types.json`.
- One phase = one milestone; phases close only when their ✓ criteria (plan.md §13) pass.
- **Every working session ends by updating `progress.md`** (status + dated log entry) — this is what keeps cross-chat handoff clean.
