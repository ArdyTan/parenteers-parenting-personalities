# structure.md — Architecture Guide
**What this is:** the complete architecture of the Parenting Bakes app — and a reusable blueprint. The final section (§11) explains how to clone this architecture for any similar project: a linear, animation-heavy, mobile-only experience with a shareable endgame (quizzes, interactive stories, campaign microsites, product reveals).

**Companions:** `CLAUDE.md` (orchestrator) · `plan.md` (phases, §8 interaction blueprint) · `conventions.md` (rules) · `data-spec.md` (JSON schemas).

---

## 1. The Shape of the App

This architecture serves one class of product: **a guided linear flow on a phone, choreographed like a native app, ending in a moment worth sharing.** No backend, no accounts, static hosting.

Two pillars, and every decision follows from them:

1. **A scene state machine over the DOM** — the "screens." Each screen is an isolated Scene module with a strict lifecycle contract; a manager choreographs transitions between them.
2. **One clock** — `gsap.ticker` is the only rAF loop. Lenis smooth scroll and all tweens hang off it. Two competing loops is how sites drop frames.

> A third pillar — a persistent WebGL "world" canvas under the DOM — was **removed in Phase 5.5** (plan §6). Phase 5.5 made every scene a flat opaque surface, which occluded it entirely: a pixel diff proved it painted nothing while costing 134.6 KB gzip and a per-frame draw. Everything the app ships is now DOM + GSAP.

```
┌──────────────────────────────────────────────┐
│  overlays (toasts, dialogs, rotate-lock)  z50│
│  ┌────────────────────────────────────────┐  │
│  │  active DOM scene (one at a time)   z10│  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
             ▲ all driven by gsap.ticker
```

## 2. Runtime Anatomy — boot to share

1. **`main.ts` boots:** parse the URL, hydrate persisted state (`lang`, in-progress answers), register CustomEases.
2. **Device gate check:** viewport ≥ 900px or (`pointer:fine` + no touch) → mount the **gate scene** (QR + "continue anyway" → app inside a 390×844 phone-bezel frame). Otherwise continue full-viewport.
3. **Preloader scene:** loads the critical manifest with *real* progress (fonts → critical images), so the first revealed frame is already warm.
4. **Scene machine starts** at the routed scene (usually landing; deep links like `/r/pcte` go straight to a result).
5. **During the quiz,** `requestIdleCallback` quietly preloads everything the endgame needs (all 16 characters, share assets) — by the reveal, nothing loads.
6. **Share:** the story scene (DOM, screenshot-proof) is the guaranteed path; the canvas compositor + Web Share API is the enhanced path.

## 3. Directory Map

```
├── index.html
├── vite.config.ts            # Vite production build; scripts/ adds OG route shells
├── docs/motion/              # technique guides copied from the WebAnimation Library
├── images/                    # source art + visual references; never imported directly
│   ├── README.md              # authoritative inventory, roles, and order
│   ├── Interface-Reference/   # ordered Phase 4 UI references
│   ├── opening-image/         # ordered var-1 → var-4 source sequence
│   ├── Pastries-personalities/ # active 16-character source set
│   ├── web-component/         # preloader + 404 source/reference
│   └── old images/            # archive only
├── public/
│   ├── characters/           # 16 × {code}-{bake}.webp
│   ├── og/                   # per-type social preview images
│   ├── fonts/                # subset woff2, self-hosted
│   └── sfx/                  # optional one-shots
└── src/
    ├── main.ts               # boot sequence (§2)
    ├── app.ts                # scene manager + router
    ├── core/
    │   ├── store.ts          # observable state + persistence (§6)
    │   ├── i18n.ts           # string lookup + interpolation + <html lang>
    │   ├── assets.ts         # manifest loader, progress events, idle preloader
    │   ├── scoring.ts        # answers[] → 4-letter code (pure, tested)
    │   ├── share.ts          # canvas compositor + share/download fallback chain
    │   ├── haptics.ts        # vibrate patterns, always paired w/ visual pulse
    │   ├── qr.ts             # gate QR (SVG)
    │   └── audio.ts          # enabled-by-default engine, autoplay-gated: synthesized one-shots +
    │                         # streamed theme; never decodes long audio
    ├── gestures/
    │   ├── pointer.ts        # unified Pointer Events tracking + capture helpers
    │   ├── spring.ts         # spring/friction integrators
    │   └── velocity.ts       # velocity tracker (flings, momentum)
    ├── motion/
    │   ├── shared.ts         # scene timelines, splitter, press, reveal, tilt, confetti
    │   └── preloader.ts      # real-progress 45→180°C boot + curtain exit
    ├── data/                 # THE DATABASE — see data-spec.md
    │   ├── questions.json · types.json · products.json
    │   ├── scene-art.json · config.json
    │   └── i18n/en.json · id.json
    ├── scenes/               # one file per screen, all implementing Scene (§4)
    │   ├── gate.ts · landing.ts · intro.ts
    │   ├── question.ts · calculating.ts
    │   ├── result.ts · story.ts · gallery.ts · notFound.ts
    └── styles/
        ├── tokens.css        # ALL design values live here (colors, type, space, ease)
        ├── base.css          # reset, grain overlay, phone-frame, rotate-lock
        ├── scenes.css        # functional scene composition
        └── motion.css        # Phase 4 choreography surfaces and reduced-motion fork
```

**Responsibility rule:** `core/` knows nothing about scenes. Data flows one way: `data/ → core → scenes`; events flow back through the store.

## 4. The Scene Contract

Every screen implements the same interface — this is the heart of the architecture:

```ts
interface Scene {
  el: HTMLElement;                      // root node, created in mount
  mount(ctx: AppCtx): void;             // build DOM, bind gestures — NO animation
  enter(from: SceneName): Promise<void>; // entrance timeline (interruptible)
  exit(to: SceneName): Promise<void>;    // exit timeline (interruptible)
  unmount(): void;                      // symmetric teardown: listeners, tweens, ST
  resize?(w: number, h: number): void;
  tick?(t: number, dt: number): void;   // opt-in per-frame hook (rare)
}
```

Rules that keep it sane:

- **`enter`/`exit` own their timelines** and must be safely killable mid-flight (interrupt = jump to end state, never a stuck half-state).
- **Scenes never reference each other.** Cross-scene communication goes through the store.
- **`unmount` is symmetric to `mount`** — every listener, ScrollTrigger, Lenis instance, and tween registered gets destroyed. Scene swap must leak nothing.
- The **manager** (`app.ts`) runs swaps: `await guard() → current.exit(next) → swapDOM → next.enter(current)` — or overlapped, per the transition preset. Guards are async gates (e.g. the exit-confirm sheet mid-quiz).

## 5. Routing

| Route | Scene | Notes |
|---|---|---|
| `/` | landing | |
| `/intro` | intro | |
| `/q/1 … /q/12` | question | guarded: no session answers → redirect `/` |
| `/baking` | calculating | computes + stores result |
| `/r/:slug` | result | shareable deep link; **prerendered ×16** at build with per-type OG meta |
| `/story` | story | guarded: needs a result |
| `/gallery` | gallery | |
| `*` | notFound | "This page got eaten 🍪" |

History API routing; the router only translates URL ↔ machine state — it owns no logic. After Vite builds, the OG prerender copies the final executable SPA shell into 16 static `r/{slug}/index.html` files and injects type-specific social meta. Crawlers read the per-type tags; humans boot the same routed app without a redirect loop.

## 6. State & Persistence

```ts
type PersistedAnswer = { q: number; pole: Pole };

type State = {
  lang: 'id' | 'en';               // localStorage 'pb1.lang'
  scene: SceneName;
  answers: PersistedAnswer[];       // sessionStorage 'pb1.answers'
  result?: TypeCode;                // restored from localStorage 'pb1.lastResult' {code, ts}
  tier: 'high' | 'mid' | 'low';     // from fps probe, not persisted
}
```

A ~40-line observable store (get/set/subscribe). No state library. `pb1.answers` persists `{q, pole}[]`; at `/baking`, the app derives the scoring input with `[...answers].sort((a, b) => a.q - b.q).map(({ pole }) => pole)`. Result is always **derived** from that sorted `Pole[]` by `scoring.ts` — never accumulated during the quiz, so refresh-mid-quiz can't corrupt it. The versioned key names and stored shapes are authoritative in data-spec.md §9.

## 7. The Clock & Performance Model

```ts
gsap.ticker.add((time, dt) => {
  lenis.raf(time * 1000);   // technique 01's sync — never lenis's own rAF
  world.render(dt);         // skips work when idle (see below)
});
lenis.on('scroll', ScrollTrigger.update);
```

- **Idle discipline:** tweens stop when nothing moves; scenes tear down their tickers and listeners on exit through the scene AbortSignal.
- Lenis exists **only on scrollable scenes** (landing, result, gallery); quiz scenes are fixed-viewport and gesture-driven.

## 8. The GL World (facade pattern) — **removed in Phase 5.5**

**No longer in the runtime** (plan §6). Kept here because the facade pattern is the transferable idea, and because reverting the removal means restoring exactly this contract. Scenes never imported three.js; they called a tiny API that was also the complete list of ways the app could affect the background:

```ts
world.setHeat(t)        // 0..1 — quiz progress warms the palette (uniform lerp)
world.setAccent(hex)    // result page tints toward the type's accent
world.pointer(x, y)     // feeds the flour-trail flowmap
world.burst(x, y, n)    // particle poof (answer select, confetti crumbs)
world.pause() / resume()
```

Internally: one fullscreen-quad `ShaderMaterial` (fbm gradient + grain), a flowmap render-target feeding UV distortion, and one instanced particle buffer with a pooled burst emitter.

The lesson worth carrying forward: *atmosphere behind opaque paint is invisible atmosphere.* Verify a background layer actually contributes pixels before paying for it — `npm run perf:canvas` does exactly that.

## 9. Data Flow (the JSON database)

```
data/*.json ──(typed loaders + dev-time validation)──▶ core ──▶ scenes render from it
```

Content is **never hardcoded in scenes**. Copy lives in `i18n/*.json` (page strings) or embedded per-record (`questions.json`, `types.json`) — the boundary and every schema is defined in `data-spec.md`. Within the fixed invariants in data-spec.md §7 (12 questions, 3 per dimension, and the 16-code cartesian registry), copy and record-content edits require **zero scene-code changes**. Changing quiz length, dimension cardinality, or type count changes those invariants and therefore requires coordinated schema, routing, validation, and scene updates.

## 10. Share Pipeline Anatomy

Two independent paths, cheapest-guarantee first:

1. **Story scene (DOM)** — 9:16 panels styled for screenshots (technique 66 viewer: tap-thirds, hold-to-pause hides chrome). Works in every WebView including Instagram's. This is the product promise; it can't fail.
2. **`share.ts` compositor (canvas)** — draws the true 1080×1920 PNG off-screen: pattern bg → character bitmap → text blocks (after `document.fonts.ready`). Export chain: `canShare({files})` → native sheet → anchor download → "try screenshotting" hint. Button states via technique 84, toasts via 86.

## 11. Reuse Recipe — build "something similar"

To clone this architecture for a new linear mobile experience:

| Keep as-is (generic) | Replace (project-specific) |
|---|---|
| `core/` (store, i18n, assets, haptics, share skeleton) | `core/scoring.ts` → your domain logic |
| `gestures/` (pointer, spring, velocity) | `data/*.json` → your content model |
| ~~`gl/context.ts` + world facade~~ | Removed here (plan §6) — port it only if your design has somewhere *visible* for a background layer to live |
| `motion/` (shared scene timelines, splitter, preloader) | `scenes/` → your flow's screens |
| Scene contract + manager + router skeleton | `styles/tokens.css` → your brand |
| Boot sequence, gate, preloader mechanics | Character/OG assets, route table |
| conventions.md rules + budgets (project-agnostic) | plan.md §8 → your moment→technique map |

Step order that works:

1. **Scaffold** Vite + TS; copy `core/`, `gestures/`, `motion/`, the scene manager, and `tokens.css`.
2. **Define the flow** as a scene list + route table (paper first — every screen, every transition, every guard).
3. **Write the data model** (data-spec style: JSON schemas + a pure logic module + validation tests) and transcribe content into it.
4. **Build all scenes ugly** — functional DOM, real data, zero animation. The whole flow must work before choreography starts.
5. **Map every moment to a WebAnimation Library technique** (plan §8 style), copy those guides into `docs/motion/`, then implement scene by scene: "Read docs/motion/NN-… and adapt the core mechanism to [scene], using our tokens."
6. **Layer the world last-ish** (shader atmosphere reacting to one normalized progress value is the cheapest "alive" signal a linear flow can have).
7. **Wire the endgame** (share/export path with fallback chain) and QA on the real target surface (for IG-funnel products: the Instagram in-app browser, not just Safari/Chrome).

The taste source is always `D:\#dev\WebAnimation Library` — 99 techniques, briefs in `guides/`, conventions in its README/ROADMAP.

## 12. Quick Index — "I want to change X"

| Change | Edit |
|---|---|
| Any copy/string | `src/data/i18n/*.json` (or the source .md, then re-transcribe) |
| A question / scenario | `src/data/questions.json` |
| A type's name, powers, accent | `src/data/types.json` |
| Scoring behavior | `core/scoring.ts` (+ its tests) |
| Colors / spacing / fonts | `styles/tokens.css` |
| A transition between screens | `motion/shared.ts` lifecycle preset plus the owning scene hook |
| Add a screen | new file in `scenes/` + route entry + transition preset |

| Share card layout | `core/share.ts` draw list + story scene CSS |
| Links / flags / toggles | `src/data/config.json` |
