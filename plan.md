# Parenting Bakes — Build Plan
**Project:** Parenteers "Parenting Bakes" Quiz Web App · "Gaya Parenting Kamu, Roti atau Kue Apa?"
**Goal:** An Awwwards-caliber, mobile-only interactive quiz. 12 questions → 1 of 16 bake personalities → a 9:16 result screen built to be screenshotted straight into an Instagram Story.

**Sources of truth (content):** `parenting-personality-research.md` (science + 16 types) · `quiz-01-flow-dialogue.md` (page copy EN/ID) · `quiz-02-ui-strings.md` (i18n strings) · `images/old images/quiz-03-image-prompts.md` (archived; asset naming/specs only).

**Source of truth (delivered art and visual order):** `images/README.md`. Phase 4 follows the ordered portrait flow in `images/Interface-Reference/`, the opening sequence `var-1` → `var-4`, and the fixed type-registry order for `Pastries-personalities/`. These files guide composition; bilingual copy and runtime data remain authoritative elsewhere.

**Source of truth (motion & interaction taste):** **`D:\#dev\WebAnimation Library`** — 99 offline, self-contained technique demos (52–99 are the mobile wave), each with a Claude-Code-ready brief in `guides/<nn>-<slug>.md`. This library defines the quality bar and the implementation vocabulary for this project; every animated moment below cites the technique(s) it steals from.

---

## 1. Product Summary

| Aspect | Decision |
|---|---|
| Audience | Indonesian parents (0–5 kids) on Instagram; international secondary |
| Language | **ID default**, EN toggle, persisted in `localStorage` |
| Quiz | 12 scenario questions, forced choice A/B, 3 per dimension → no ties |
| Dimensions | D1 Structure **P**lanner/**F**low · D2 Guidance **C**aptain/**G**ardener · D3 Emotion **T**alker/**D**oer · D4 Adventure **E**xplorer/**N**ester |
| Result | 4-letter code (e.g. `PCTE`) → 1 of 16 bake characters |
| End goal | Story-mode screen (1080×1920-proportioned) the user screenshots or saves/shares natively |
| Platform | **Mobile only.** Desktop/tablet gets a designed gate: QR code + optional phone-frame preview |
| Database | Static JSON files bundled with the app — no backend, no accounts |
| Hosting | Static build → **Cloudflare Workers static assets, free plan** (decided 2026-07-17; static requests are free/unlimited, Jakarta edge PoP) |

**Flow:** Preloader → Landing → Intro → Q1–Q12 without mid-quiz interruption → Calculating (auto-advances) → Result → Story-share mode → Gallery (all 16). The journey ends on the Result; the separate End page was removed 2026-08-02. Plus: 404 ("This page got eaten 🍪") and the desktop QR gate.

---

## 2. Quality Bar & Engineering Ground Rules

Awwwards jury scoring is **Design 40% · Usability 30% · Creativity 20% · Content 10%**; SOTD winners land ~7.5+/10 and hold ~60fps on mid-range phones. The WebAnimation Library was built to exactly that bar ("every sample must feel like an Awwwards Site-of-the-Month interaction" — its ROADMAP), so **we adopt its ground rules wholesale as this project's engineering conventions:**

1. **Pointer Events only** (`pointerdown/move/up` + `setPointerCapture`) — one code path for mouse and touch everywhere.
2. **`touch-action` discipline** — every gesture surface declares `none`/`pan-y`/`pan-x` explicitly; passive listeners everywhere else.
3. **60fps on mid-range phones** — animate only `transform`/`opacity`, no layout thrash, no filters on large surfaces, rAF loops stop when idle.
4. **Haptics paired with visuals** — `navigator.vibrate()` where supported (Android), always with a visual pulse so iOS feels it too (technique 98's patterns).
5. **`prefers-reduced-motion` respected in every scene** — degrade to static/instant states, never lose function.
6. **One clock** — Lenis is driven from `gsap.ticker` (technique 01's sync pattern); never two rAF loops.
7. **Phone frame on desktop** — above ~760–900px the experience renders inside the library's ~390×844 bezel snippet; edge-to-edge on real phones.

What the library doesn't dictate: **theme**. Its demos are dark-editorial; we keep the warm bakery world (§5). We steal the *motion*, not the look.

---

## 3. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Build | **Vite + TypeScript** (vanilla, no framework) | Screens are a linear state machine; full control of the single render loop; guides port cleanly (they're vanilla) |
| Animation | **GSAP** (npm, 3.13+) + ScrollTrigger, Flip, CustomEase | Library vendors 3.12.5 where SplitText was paid — on 3.13+ all plugins are free, so use real SplitText *or* port technique 02's tiny DIY splitter (zero extra bytes); decide at build |
| Smooth scroll | **Lenis** (npm, 1.x) | Synced per technique 01; only on scrollable scenes (landing, result, gallery, end) |
| WebGL | **Three.js** (current ESM, tree-shaken) | Library vendors r128 global build for file:// portability — production uses the modern module build; shader/mesh code from guides ports 1:1 |
| Share image | Native `<canvas>` composition | Programmatic draw of the 1080×1920 export — reliable inside Instagram's in-app browser where DOM-to-image is flaky |
| QR | `qrcode` (client-side SVG) | Desktop gate |
| i18n | Tiny custom module over `en.json` / `id.json` | Strings already keyed in `quiz-02-ui-strings.md` |
| State | Tiny store + `sessionStorage` (progress) + `localStorage` (lang, last result) | No backend |
| Physics helpers | Pointer math, spring/friction, velocity trackers | Ported from the library's gesture demos (52/59/60), not from a physics dependency |

---

## 4. Data Layer (the JSON "database")

All content lives in versioned JSON under `src/data/`. The three .md content files are transcribed once (Phase 1); JSON is the runtime truth.

```
src/data/
├── questions.json      # 12 questions
├── types.json          # 16 result types
├── products.json       # 9 Indonesian Parenteers products shown on Result
├── i18n/en.json        # UI strings (from quiz-02)
├── i18n/id.json
└── config.json         # links, handles, toggles, share templates
```

**questions.json** (per question):
```json
{
  "id": 7, "dimension": "emotion",
  "scenario": { "en": "Meltdown at the mall. (Yes, that one.)", "id": "Tantrum di mal. (Iya, yg itu.)" },
  "answers": [
    { "pole": "T", "en": "I crouch down and name it: “You're really upset, huh…”", "id": "Aku jongkok, sebut perasaannya: “Kamu kesel ya…”" },
    { "pole": "D", "en": "Scoop up, hug, change of scenery, offer water", "id": "Gendong, peluk, ganti suasana, tawarin minum" }
  ]
}
```
Answer render order is **randomized per render** (pole travels with the answer, not the position) — per dev note in quiz-01.

**types.json** (per type):
```json
{
  "code": "PCTE", "slug": "pcte", "emoji": "🍮",
  "name": { "en": "The Croquembouche", "id": "The Croquembouche" },
  "tagline": { "en": "…", "id": "…" },
  "superpowers": { "en": ["…","…","…"], "id": ["…","…","…"] },
  "watchout": { "en": "…", "id": "…" },
  "popCousin": { "en": "Ambitious Pinterest-parent energy", "id": "…" },
  "image": "/characters/pcte-croquembouche.webp",
  "accent": "#D69E62",
  "activityTags": ["C", "T"]
}
```
`activityTags`: 2 distinct letters from the code. The deterministic default is D2+D3 (the second and third letters; `PCTE` → `["C", "T"]`), with an explicit editorial override allowed per type (mapping per quiz-01: P structured printables · F no-prep play · C guided step-by-step · G open-ended invitations · T Big Feelings sheets · D hands-on sensory · E gross-motor/outdoor · N calm & cozy).

**Scoring:** count majority letter per dimension across its 3 questions → concatenate D1D2D3D4 → lookup in types.json. Pure function, unit-tested with all 16 paths.

**Persistence (schema authoritative in data-spec.md §9):** `localStorage`: `pb1.lang`, `pb1.lastResult` (code + timestamp). `sessionStorage`: `pb1.answers` as persisted `{q, pole}[]` records (survives accidental refresh; the exit-confirm dialog from strings file guards back-navigation). Scoring receives a derived `Pole[]` sorted by `q`, never the storage array's incidental order.

---

## 5. Design System

- **Palette** (approved Parenteers brand guide, 2026-07-18): Canvas `#F0F1F5` · deep blue `#182799` · bright blue `#3073E9` · orange `#E86811`. Deep blue on canvas is the readable text/control pair; bright blue and orange are accents and may be used through derived tints. Per-type accents in `types.json` remain decorative character-identity exceptions.
- **Typography:** **Fraunces** (variable display serif — its SOFT/WONK axes are bakery-shaped) + **Plus Jakarta Sans** (UI — designed in Jakarta; on-brand for the ID audience). Subset woff2, self-hosted (same pattern as the library's `vendor/fonts.css`), preloaded behind the preloader.
- **Motion language:** "everything proofs like dough" — soft squash-and-stretch, `CustomEase` with gentle overshoot ("dough ease"), steam/flour particles as punctuation. Durations 0.4–0.8s; nothing blocks input longer than 200ms; every transition interruptible.
- **Layout:** fluid mobile, design canvas 390×844 (matches the library's frame), `dvh` units, thumb-zone CTAs, 44px minimum targets, portrait-locked (landscape shows a "rotate back 🍞" overlay).
- **Texture:** subtle grain overlay + tone-on-tone pastry pattern (asset from file 3) so flat areas never feel empty.

---

## 6. WebGL Layer (Three.js) — **removed in Phase 5.5**

**Status: cut on 2026-08-02.** Phase 5.5 made every editorial scene a flat opaque cream surface, which occluded this canvas completely. A pixel diff (capture → hide the canvas → capture again, motion frozen) came back identical on `result`/`story`/`end`; the 0.4–1.5% differences on `intro`/`question`/`gallery` were text antialiasing flipping from subpixel to grayscale because a composited layer disappeared, not canvas content. It was rendering every frame behind opaque paint.

Removing it deleted `src/gl/`, the boot fps probe, and the store's performance tier, and dropped three.js from the dependencies:

| | before | after |
|---|---|---|
| JS gzip | 214.86 KB | **78.84 KB** |
| raw JS to parse | 753.52 KB | 215.26 KB |
| GL drawing buffer | 2.83 MB (585×1266 @ mid tier) | none |
| JS heap, landing → result | 11.95 → 17.32 MB | 9.32 → 12.04 MB |
| Result page @ 8× CPU throttle | 40.4 fps, 100 ms worst frame | **51 fps, 33 ms worst frame** |

Re-checkable with `npm run perf:canvas` (occlusion) and `npm run perf:probe` (heap, image footprint, throttled fps, leak) — methodology, baselines and interpretation traps in **`docs/performance-probes.md`**. The three shader guides stay in `docs/motion/` — recovering this layer is a `git revert` away if a future phase gives it somewhere visible to live.

The original design, for reference:

1. **Dough gradient** — fbm-noise mesh gradient from **09 · Animated Shader Gradient** (`guides/09-animated-shader-gradient.md`), ported from raw WebGL to a Three.js fullscreen-quad `ShaderMaterial`, recolored to the approved Parenteers palette. Uniforms: `uHeat` (0–1, rises with quiz progress — the atmosphere warms from cool blue toward orange as the result nears), `uAccent` (tints toward the type's accent on the result page).

1. **Dough gradient** — fbm-noise mesh gradient from **09 · Animated Shader Gradient** (`guides/09-animated-shader-gradient.md`), ported from raw WebGL to a Three.js fullscreen-quad `ShaderMaterial`, recolored to the approved Parenteers palette. Uniforms: `uHeat` (0–1, rises with quiz progress — the atmosphere warms from cool blue toward orange as the result nears), `uAccent` (tints toward the type's accent on the result page).
2. **Flour touch trail** — the flowmap-lite cursor swirl from **16 · WebGL Ripple Cursor** (`guides/16-webgl-ripple-cursor.md`), driven by Pointer Events; a soft wake follows the finger everywhere.
3. **Flour particles** — a scaled-down (~150–200 instances, quality-tiered) descendant of **08 · Particle Galaxy** (`guides/08-particle-galaxy.md`): drifting motes + a reusable burst emitter for answer-select poofs and result confetti-crumbs.

**Performance rules (historical):** DPR clamped ≤2; 2-second fps probe assigns quality tier (particle count, noise octaves); render loop pauses on `document.hidden` and idles between animations (library rule 3); shaders compiled + textures uploaded during the preloader so first interaction never hitches.

Everything the app still ships is DOM + GSAP. Answer-select feedback keeps its visual+haptic pairing through the DOM `burstAt` and `triggerHaptic('tick')` in `scenes/question.ts`.

---

## 7. Desktop / Tablet Gate (QR)

Trigger: viewport ≥ 900px **or** (`pointer: fine` and no touch points). The gate is a designed scene, not a wall:

- Same WebGL dough background; characters peeking from the edges on gentle float loops.
- Headline: "This one's baked for your phone 📱" / "Quiz ini dipanggang khusus buat HP kamu 📱".
- Live QR (SVG, deep-blue-on-brand-canvas, current URL + UTM) framed like an oven window; "Scan to start baking."
- Ghost link **"or continue here anyway"** → the app loads inside the library's phone bezel snippet (ground rule 7). Awwwards jurors open on desktop first — they must still be able to complete the experience beautifully.

---

## 8. Interaction Blueprint — moment → library technique

The core of the build. Each row names the technique number(s) and guide file(s) to port. During Phase 0 the needed guides are copied into `docs/motion/` in this repo so build prompts are turnkey ("Read docs/motion/52-… and implement…").

| Moment | Behavior | Steal from |
|---|---|---|
| **Preloader** | Oven display counts real asset progress as `45°C → 180°C`; curtain-wipe out; the logo mark FLIP-flies into the landing header as UI cascades in | **13** Preloader & Counter · **71** Splash → Hero Launch |
| **Landing hero** | H1 chars "proof" up with masked stagger; 16-character marquee drifts with scroll-velocity skew; layered hero parallax from gyro (iOS permission flow included, pointer fallback) | **02** Split-Text Hero · **10** Marquee & Velocity Skew · **95** Gyro Parallax Hero |
| **Lang toggle EN/ID** | Grabbable springy thumb, content crossfades in sync | **64** Springy Segmented Control |
| **Intro screen** | Three points stagger in with masked line reveals; CTA squash-on-press | **01** reveal pattern · **83** Tactile Toggles (press physics) |
| **Question deck** | Questions live as a card deck: current scenario card on top, next peeking beneath (scales up on advance). Answer = tap one of two answer cards (spec) — the answered card **flings off with rotation ∝ offset toward its side**, deck refills. Optional swipe-to-answer as enhancement (§14.3) | **52** Swipe Card Stack (deck physics, fling, refill) · **83** press squash |
| **Answer feedback** | Particle burst at exact tap point + haptic tick (visual pulse pair); chosen card Flip-morphs into the thermometer | **82** Double-Tap Heart Burst (burst-at-point) · **21** GSAP Flip Layout · **98** Haptic patterns |
| **Progress thermometer** | Oven temperature climbs 12 notches (45°→180°C); the °C readout rolls per-digit with direction awareness | **85** Odometer Stepper |
| **Back one question** | Edge-swipe drags the previous question back in 1:1 with counter-parallax | **73** iOS Back-Swipe |
| **Exit-confirm dialog** | Sheet pops over a depth-pushed page (page scales/tucks/dims behind) | **72** Stacked Modal Sheets |
| **Calculating** | The 4 rotating copy lines swap via masked line reveals (tap-to-skip once computed); shader swirl syncs to line changes; a skeleton of the result card shimmers and **morphs into the real card** as the reveal begins | **01** masked lines · **70** Skeleton → Content Morph |
| **Result reveal** | Oven-door wipe; character springs out (squash-and-stretch); self-drawing accent ring + **one-shot canvas confetti with gravity** (battery-friendly, stops itself); background tints to type accent; haptic celebration pattern | **89** Success Confetti Moment · **17** wipe · **98** haptics |
| **Result card** | Orientation-driven 3D tilt with moving specular glare + holo sheen; content layers at `translateZ` depths; pointer fallback | **97** Tilt 3D Product Card · **95** gyro plumbing |
| **Result page scroll** | Parent-first editorial flow: daily-life story, full-bleed midpoint illustration, concise parent support, then the legacy personality details | **01** Smooth Scroll & Reveal · **65** Collapsing Large-Title Header |
| **Story-share mode** | IG-native: segment bars across the top, **tap thirds to move between 2–3 panels** (card / superpowers / watch-out), hold-to-pause hides all chrome for a clean screenshot, swipe-down dismisses with scale-away follow. No auto-advance (screenshot-friendly) | **66** Stories Viewer |
| **Save / share buttons** | One button node morphs idle → loading pill → success tick / error shake ("Couldn't save — try screenshotting") | **84** Button State Machine |
| **"Link copied!"** | Toast stack with squish, velocity swipe-to-dismiss, auto-expire bar | **86** Toast Choreography |
| **Gallery (all 16)** | Bakery shelves: horizontal snap rows with peek margins + per-shelf entrance cascade; tap a bake → cell FLIP-expands to a detail sheet with snap points (peek/half/full), drag-dismiss | **79** Horizontal Snap Shelves · **69** Shared-Element Card → Detail · **53** Bottom Sheet |
| ~~**End page**~~ | ~~Fixed footer revealed curtain-lift style; CTA marquee band~~ — **cut 2026-08-02**: the journey now ends on the Result, so `/end` no longer exists | ~~48 · 10~~ |
| **404** | Bitten-cookie illustration + tap to fling crumb reactions | **30** Floating Emoji Reactions |
| **Baking marquee** | Three counter-scrolling rows of the whole 16-bake cast, shuffled per render, accelerating with the oven ramp; replaces the dial-in-a-card so the art carries the wait | **10** Marquee & Velocity Skew |
| **Result share dock** | The share CTA stays hidden at the Result top, appears after one deliberate first scroll, and retreats only when the reader returns near the top | **65** Collapsing Large-Title Header |
| ~~**Ambient (all screens)**~~ | ~~Dough gradient + flour trail + particles~~ — **cut in Phase 5.5**: the flat opaque editorial surfaces occluded it entirely, so it cost 134.6 KB gzip and a per-frame draw for zero pixels (§6) | ~~09 · 16 · 08~~ |

Rejected on purpose (desktop-only patterns): magnetic cursor (05), hover index (44), mega-menu (37) — no cursor on the target device.

---

## 9. Share / IG Story Pipeline (the endgame)

Most opens happen inside the **Instagram in-app browser**, where downloads and `navigator.share({ files })` are unreliable. Layered fallbacks, guaranteed path first:

1. **Story mode (always works):** the technique-66 viewer above — every panel is a full-viewport 9:16 composition (character upper 60%, name + code chip `P·C·T·E`, tagline, superpowers, watch-out, `@parenteers` + URL at the bottom). Hold-to-pause hides chrome → clean screenshot in any WebView.
2. **Save image:** compose a true 1080×1920 PNG on an offscreen `<canvas>` (pattern bg → character PNG → text, fonts preloaded). Then `navigator.canShare({ files })` → native share sheet (Instagram appears directly) → else anchor-download → else the copy's own fallback hint (*"Try screenshotting instead"*), with button states from technique 84.
3. **Link sharing:** Web Share API for caption + URL (template from strings); copy-link + technique-86 toast fallback.
4. **Link previews:** prerender 16 static routes `/r/{slug}/` at build, each with type-specific OG meta + image (1080×1350 4:5 per file-3 spec) so WhatsApp/IG DM shares unfurl with the person's actual bake.

---

## 10. Performance Budget (mid-range Android, 4G)

How these are measured, plus the recorded baselines and the traps that produce false readings: **`docs/performance-probes.md`**.

| Metric | Budget |
|---|---|
| JS (gz) | ≤ 300 KB. **Actual: 106.27 KB** (measured 2026-08-17, two consecutive builds, identical hashes) with the 16 bilingual stories, parent-first summary, localized product surface, and current audio behavior |
| Fonts | ≤ 120 KB (2 families, subset woff2, self-hosted) |
| Images per screen | ≤ 300 KB (characters use optimized ≤1024px WebP derivatives; alpha only when the chosen composition needs separation; only the result's character loads eagerly) |
| Audio | One-shots are synthesized — 0 KB download, +0.12 MB heap measured after 240 cues. Fresh visitors default to sound enabled, so the current scene's streamed bed may buffer before the first interaction: `theme` 3.67 MB / 152.6s and `result` 3.57 MB / 147.4s (both ~200 kbps AAC; ~1.75 MB each at 96 kbps). An explicit stored "off" keeps both at 0 bytes. Only the bed a scene asks for is fetched. Never decode them: 150s at 48 kHz stereo is ~55 MB of Float32 |
| LCP | < 2.5s · TTI < 3.5s |
| Frame rate | 60fps target / 30fps floor. Measured 60fps to 6× CPU throttle and 51fps at 8× on the heaviest screen (Result); quality tiers were removed with the WebGL layer |
| Preload trick | Quiz takes ~3 min — after Q1, `requestIdleCallback`-preload all 16 characters + share assets so the reveal is instant |

Plus library rules: transform/opacity only, idle rAF stops, no filters on large surfaces, `will-change` added only during animation and removed after.

---

## 11. Accessibility & Motion Safety

- `prefers-reduced-motion`: crossfades instead of choreography, particles/shader drift frozen, 100% of function kept (every library demo models this).
- ARIA strings already specced (`a11y.*` keys): per-question progressbar announcements, illustration alt pattern, loading state.
- Focus management on scene swap; `lang` attribute flips with the toggle; deep blue `#182799` on brand canvas `#F0F1F5` is the AA text pair.
- Exit-confirm (from strings) intercepts back-navigation mid-quiz; gestures never the *only* path (buttons everywhere).

---

## 12. Project Structure

```
parenting-bakes/
├── index.html
├── vite.config.ts            # Vite build; scripts/ adds /r/{slug} OG route shells
├── docs/motion/              # copied guides from the WebAnimation Library (build reference)
├── public/
│   ├── characters/           # 16 × {code}-{bake}.webp; PNG masters stay outside public/
│   ├── og/                   # 16 + 1 social preview images
│   ├── fonts/                # fraunces*, plus-jakarta* (subset woff2)
│   └── sfx/                  # optional one-shots
└── src/
    ├── main.ts               # boot: preload → gate check → app
    ├── app.ts                # scene manager (state machine) + router (/, /q/7, /r/pcte…)
    ├── core/                 # store, i18n, assets, haptics, audio, qr, share, scoring
    ├── gestures/             # pointer math, springs, velocity — ported from lib 52/59/60
    ├── data/                 # questions.json, types.json, config.json, i18n/
    ├── anim/                 # transitions, splitter, doughEase, flip morphs
    ├── scenes/               # preloader, gate, landing, intro, question, interstitial,
    │                         # calculating, result, story, gallery, end, notFound
    └── styles/               # tokens.css, base.css, per-scene css
```

---

## 13. Build Phases

**Phase 0 — Setup (S)**
`git init`, Vite + TS scaffold, tokens.css, fonts subset, deploy pipeline (Cloudflare Workers static assets — `wrangler.jsonc` + Workers Builds from the repo for preview URLs). **Copy exactly 34 guides from `D:\#dev\WebAnimation Library\guides\` into `docs/motion/`: the 32 unique guides cited by §8, plus gesture-utility guides 59 and 60.** Document the deterministic asset step from delivered source PNGs in `images/Pastries-personalities/` to optimized UI derivatives in `public/characters/`; alpha removal/masking is required only where the chosen composition needs separation from the supplied cream background. Support art follows the same source→derivative boundary.
✓ Blank app deploys; fonts render; all 34 guides are in repo; PNG → optimized ≤1024px WebP conversion is documented and repeatable, with masking/alpha used only when the chosen composition needs separation.

**Phase 1 — Data & i18n (S)**
Transcribe the 3 content .md files into `questions.json`, `types.json`, `en/id.json`, `config.json`. Scoring function + unit tests (all 16 codes reachable; randomization keeps pole-answer binding).
✓ `score(answers)` passes; every string renders from JSON in both languages.

**Phase 2 — Core flow, zero polish (M)**
Scene manager + router + all screens as functional DOM (landing → … → end, 404, exit-confirm, resume). Lang toggle persisting. Desktop gate with live QR + phone-frame fallback (lib frame snippet).
✓ Full quiz completable on a phone; refresh resumes; `/r/pcte` deep link renders.

**Phase 3 — Gesture & WebGL foundations (M)**
Port `gestures/` utilities (52/59/60 math). Persistent canvas: dough gradient (09), flour trail (16), particles (08), `uHeat` wired, quality tiers, preloader warm-up. **The WebGL half of this phase was removed in Phase 5.5** (§6) once the flat editorial surfaces made it invisible; the gesture utilities remain in use.
✓ 60fps on mid-range Android with shader live; gestures share one Pointer-Events path.

**Phase 4 — Motion layer (L)**
First reconcile each existing scene with the ordered visual references in `images/README.md`, without replacing source copy or data. Then implement everything in §8: preloader (13+71), landing (02+10+95), question deck (52+83+82+21+85), back-swipe (73), exit sheet (72), calculating (01+70), reveal (89+17), result card (97), result scroll (01+65+77), gallery (79+69+53), end (48). Reduced-motion fork throughout. Treat `Preloader2.mp4` as a motion reference until playback, codec, file-size, and reduced-motion behavior are validated.
✓ Every Phase-4-owned §8 row listed above ships; transitions interruptible; reduced-motion verified.

**Phase 4.5 — Art-led interface realignment (M)**
Recompose landing, question, and main result around the corresponding ordered `images/Interface-Reference/` files. Make warm bakery illustration a persistent part of every primary interface rather than a contained thumbnail. Preserve real copy/data/interactions; generate standalone text-free question art and map it through bundled JSON. The Q6/Q9 checkpoint screens were removed by user direction on 2026-07-31 so the 12 questions advance continuously. Full implementation plan: `docs/phase-4-5-interface-plan.md`.
Implemented locally 2026-07-30; physical Samsung and Instagram in-app-browser visual sign-off remains before closure.
✓ Four named reference surfaces match their composition hierarchy at 390×844; every primary route contains art; ID/EN, reduced motion, payload budgets, and existing behavior all pass.

**Phase 5.5 — Brilliant-spec interface revision (M)**
Rebuild the interface against the authoritative Brilliant design file (`Canvas.design`, design system `figma-parenting-personalities`) rather than flat screenshots: the three-band scene shell (header 70/pad 17 · body fill · bottom section pad 0/34/34), the 34/16/12 spacing tokens, seamless full-bleed art bands, the real `progress-bar-star.svg` rail, `button-expression.svg` on every bottom CTA, a character marquee in place of the baking dial, and an art-first Result with a scroll-docked share bar. Exported frames in `images/new-layout/` are the visual authority; `images/current-layout/` records the surface being replaced. Full implementation plan: `docs/phase-5-5-interface-plan.md`.
Implemented locally 2026-08-01; physical Samsung and Instagram in-app-browser visual sign-off remains before closure.
✓ `npm run qa:phase55` passes in both motion modes at 390×844; every one-screen scene is exactly one viewport with its CTA in the thumb zone; art bands are full-bleed with no seam; §10 budgets hold.

**Phase 5 — Share pipeline (M)**
Story mode (66), canvas PNG compositor, share/download/screenshot fallback chain (84 buttons, 86 toasts), caption templates, OG prerender ×16.
Implemented locally 2026-07-30; the final domain, physical Story screenshot approval, and live WhatsApp unfurl remain before closure.
✓ Story screenshot pixel-perfect on iPhone + Android; WhatsApp unfurl shows per-type card.

**Phase 6 — QA hardening (M)**
Device matrix: iOS Safari, **Instagram in-app browser (iOS + Android)** — the primary real surface, Android Chrome, WhatsApp WebView. Landscape overlay, safe-areas, Lighthouse ≥90, a11y audit, copy QA (equal-love rule across 16 types).
✓ Matrix passes; §10 budgets hold.

**Phase 7 — Launch extras (S, optional)**
Analytics (quiz_start, answer, complete{code}, share{channel}, activities_click — Plausible default), re-homing the founder note now that `/end` is gone, Awwwards submission assets (gate screenshots, 30s capture). Sound design moved out of this phase and shipped early (§14 decision 5).

**Phase 8 — Personality PDF booklet (L)**
A 16-page A4 illustrated booklet per type per language (32 files), downloadable from the Result. Built from existing `types.json` content plus three new registries — `parent-care.json` (25 recovery activities keyed to the eight dimension poles), `child-activities.json` (20 activities across five age bands, 0–5) and `weekly-extras.json` (16 one-line checklist actions, 2 per pole) — grounded in Montessori, filial therapy/CPRT special play time, serve-and-return and the AAP play report. Prerendered through headless Chrome by `npm run assets:pdf` and committed; **no PDF library may enter the runtime bundle**. Delivered by a plain `<a target="_blank">` with no `download` attribute, plus a copy-link toast fallback, because Instagram's WebView drops `download` and `blob:`. Page 16 re-homes `footer.made_by`, `footer.copyright`, `footer.disclaimer` and the Follow CTA, orphaned since `/end` was removed. Full spec and activity libraries: `docs/personality-pdf-plan.md`; the 54 illustration prompts and their `gpt-image-2` handover: `docs/personality-pdf-art-brief.md`.
✓ 32 files exist at 16 pages and ≤1.2 MB each; `qa:pdf` confirms extractable per-language text and embedded fonts; the Result section and dock link pass `qa:phase55` in both motion modes at 390×844 and 390×720; the booklet opens in the Instagram in-app browser on a real device.

---

## 14. Open Decisions (defaults chosen, flag to change)

1. **Bake roster** — the 16 as drafted (incl. Lapis Legit, Pandan Chiffon, Bolu Kukus). Swappable via types.json.
2. **Loading duration** — 4 lines × 2.5s ≈ 10s, tap-to-skip after line 2. Tunable constant.
3. **Swipe-to-answer** — deck fling is technique 52 either way; default is **tap to choose** (spec-safe, faster), with directional swipe as a progressive enhancement. Flag if you want swipe primary.
4. **Activity-tag pairs per type** — deterministic default: D2+D3 letters; editorial override in types.json.
5. **Sound** — ✅ **shipped 2026-08-02; default revised 2026-08-15.** Fresh visitors start with sound enabled: playback is attempted immediately and, where mobile autoplay blocks it, begins on the first pointer or keyboard interaction anywhere. An explicit stored "off" remains off. The reachable header toggle satisfies WCAG 1.4.2. Synthesized one-shots run on press/select/swipe/boundary/confetti/reveal; `ayo-main-bersama-asik` plays under Landing→Calculating and crossfades to `ayo-main-bersama-asik-result` at the reveal. Both streamed beds loop while active. Story and everything after stay silent so a screen recording of the share moment carries no music.
6. **Desktop escape hatch** — phone-frame "continue here anyway." Default: yes.
7. **Founder note** — `config.flags.founderNote` survives but is unwired since `/end` was removed (2026-08-02); it needs a new home on the Result before it can ship. Default: on.
8. **Analytics** — none / Plausible / Meta Pixel. Default: Plausible (cookieless).
9. **Story-mode panels** — 1 static panel vs 2–3 tap-through panels (technique 66). Default: 3 panels, no auto-advance.
10. **Couple mode** (compare two results) — v2 backlog.

---

## 15. Needed From You (blockers by phase)

| Item | Needed by | Notes |
|---|---|---|
| 16 character images | ✅ Phase 4 derivatives complete | Active 1254×1254 opaque sources are rendered as intentional full-bleed 900×900 WebPs in registry order |
| Interface + opening references | ✅ delivered 2026-07-18; indexed 2026-07-29 | Six ordered UI references and four ordered opening variants; see `images/README.md` |
| Supporting art (preloader, 404, pattern) | ✅ Phase 4 path settled | Optimized 404 WebP ships; the 1.76 MB MP4 remains reference-only and the preloader is DOM/CSS/GSAP; CSS/grain is the intentional no-pattern default |
| Parenteers products URL | ✅ set 2026-08-15 | Result product rail → `https://parenteers.id/` |
| Final domain + IG handle link | Phase 5 | Share card + QR |
| Official palette/logo assets | ✅ delivered 2026-07-18 | Applied per §5; existing fonts retained because the brand folder includes no typography specification |
| 54 PDF booklet illustrations | Phase 8.3 | Ready-to-run handover in `docs/personality-pdf-art-brief.md`; Ardy generates with `gpt-image-2` |
| PDF booklet open questions | Phase 8 | QR target, closing CTA, selection overrides, launch languages — `docs/personality-pdf-plan.md` §15 |
| Decisions §14 | Rolling | Defaults apply otherwise |

---

## 16. Running the Project (once scaffolded)

```bash
npm install
npm run dev        # Vite dev server (open on phone via LAN IP)
npm run test       # scoring + data-integrity tests
npm run build      # static build incl. OG prerender
npm run preview    # production preview
```

**Immediate next step:** Phase 0–1 — scaffold, copy the referenced guides into `docs/motion/`, transcribe the three .md files into the JSON database.

---

*Secondary references:* [Awwwards evaluation system](https://www.awwwards.com/about-evaluation/) (judging weights) · [Codrops: coordinating GSAP, Three.js, Lenis & Web Audio](https://tympanus.net/codrops/2026/07/15/the-architecture-behind-trionn-coordinating-gsap-three-js-lenis-and-web-audio/) (render-loop architecture cross-check). Primary reference remains the WebAnimation Library and its guides.
