# Phase 5.5 — Interface revision against the Brilliant `Canvas.design` spec

**Status:** implemented locally 2026-08-01, refined against the user's review 2026-08-02;
headless-Chrome QA green at 390×844 in both motion modes. Fresh Samsung A55/S25 FE and Instagram
in-app-browser visual sign-off remains.

## Why this pass exists

Phase 4.5 recomposed the app from flat JPG references. The user then rebuilt the interface
properly in **Brilliant** (`C:\Users\tanar\.config\brilliant\scratch\Canvas.design`, design
system `figma-parenting-personalities`), exported it to `images/new-layout/`, and screenshotted
the running app into `images/current-layout/`. Comparing the two found four structural defects:
illustrations hard-cropped, CTAs floating wherever content ended, a headline clipping its own
descenders, and the loading screen burying the art inside a white card.

This pass works from **exact element values read out of the design file**, not eyeballed
screenshots. The goal is not pixel compliance for its own sake — the art has to be the star and
every screen has to feel playful. The information is just for fun; the experience is the product.

## Visual authority

| Source | Role |
|---|---|
| `Canvas.design` (Brilliant) | Authoritative geometry, tokens, and component specs |
| `images/new-layout/` | Exported frames — 1 Splash, 2 Quiz Opening, 3 Questions ×2, 5 Result short/long |
| `images/current-layout/` | The pre-revision runtime, for comparison only |
| `images/Interface-Reference/` | Historical (Phase 4.5); its files are deleted from the tree |

Copy and data documents still control wording. The reference wording that appears in the frames
is **layout-only** for this pass — see "Copy" below.

## The design-system contract

| Token | Value | Applied to |
|---|---|---|
| `$spacing.universal-padding` | **34** | page inset on every Header and Bottom Section |
| `$number.header-to-body` | **16** | headline → body block |
| `$spacing.component-spacing` | **12** | between repeated items (intro points) |
| `$color.blue-parenteers` | `#182799` | text, controls, bullets |
| `$color.surface` | `#FEF2E1` | the editorial canvas |
| `$color.outline` | `#DFC7AB` | hairlines, muted micro-labels |
| — | `#F3E3CB` / `#E86811` | warm capsule fill / its text |

Deliberate literals the spec also uses, all carried over: `17` (header-navbar padding, Top
Indicator inset), `26` (Splash capsule→h1→sub), `10` (tight pairs), `11` (bullet→copy), `15`
(answer bullet→copy), `34` (Result text-group gap), `40` (Result text horizontal inset).

Type is anchored so a 390px container resolves the reference px exactly (`px / 390 = cqi`):
36 → `9.231cqi`, 48 → `12.308cqi`, 24 → `6.154cqi`, 16 → `4.103cqi`, 12 → `3.077cqi`,
10 → `2.564cqi`. All of it lives in `src/styles/tokens.css` as `--pad-*`, `--gap-*`,
`--font-size-ref-*`.

**Correction on record:** the user proposed "35 / 14 / 16". The real tokens are **34 / 16 / 12**.

## The structural change

Every Brilliant frame is the same three-band column — `al(v, y(sb))` at 390×768 with `clip`:

```
header-navbar        70px, pad 17           ← in flow
Body                 fill, min-height 0
Bottom Section       hug, pad 0/34/34/34    ← CTA + caption, gap 10
```

The runtime instead floated `.app-header` absolutely over a `.scene` that only set
`min-block-size` and grew with content. That single difference caused the drifting question CTA,
gave the Result bottom bar nowhere to dock, and forced a per-scene
`padding-block-start: calc(safe-top + 4.8rem)` on every screen — 94px stolen from the artwork.

Now: `.app-runtime` is a flex column, the header is in flow at 70px/pad 17, and `.scene` is a
grid of `minmax(0, 1fr) auto`. One-screen scenes (`landing`, `intro`, `question`, `calculating`,
`story`) additionally get a **definite** runtime height via `:has()`, so their flexible rows
actually compress instead of pushing the CTA off the bottom. Scrolling scenes (`result`,
`gallery`, `end`, `notFound`, `gate`) keep `min-block-size` and document scroll.

Shared band primitives live in `src/scenes/dom.ts`: `sceneBody`, `sceneBottom`, `sceneCaption`.

## Per-screen work, against the user's notes

### Shared chrome
- `.button--primary` is now the spec's `Button-blue`: `border-radius: 25px`, `padding: 16px 32px`,
  16px bold white label, `min-block-size: var(--target-min-size)`, and `button-expression.svg` as
  an `::after`. Applying it on the class means every bottom CTA inherits it with no DOM change
  (note 5). Measured height **52px** — `pad(16,32)` around a 16/1.25 label.
  - The button read as too tall because Phase 4.5 pinned `.button--primary { min-block-size: 3.7rem }`
    (59.2px). The `::after` was never the cause, but it is now deliberately shorter than the
    label's line box (`0.95rem` vs `1.25rem`) so it can never drive the height.
  - The mark sits `2px` from the label and is **unrotated**, lifted `0.28rem` so it reads as a
    flourish rather than a glyph on the baseline.
- `.language-switch` restyled to `language-selection`: 64×36, `border-radius: 18px`, 1px outline,
  two 28×28 capsules. The draggable thumb (technique 64) is retained at the new geometry.
- The toggle is hidden on Quiz Opening and Q1–Q12 via `.app-runtime:has(.scene--intro/…)`, per
  the frames — zero JS.
- `button-expression.svg` (12×20) and `progress-bar-star.svg` (18×20) are now runtime assets in
  `public/icons/`, documented there as **layout marks**, deliberately outside the 64×64 icon
  family.

### 1 · Splash — `src/scenes/landing.ts`
| Note | Resolution |
|---|---|
| 1 · "3 minutes" must not be a capsule | The capsule slot holds an eyebrow label (`Capsules-warm`); the duration line moved under the CTA as plain 12px text. New key `landing.eyebrow`. |
| 2 · Header character trimmed | **Root cause:** `.split-char-mask { overflow: hidden }` clips at the inline-block content box, and `line-height: 0.95` made that box shorter than the glyph. Fixed with the spec's `1.20` plus `padding-block-end: 0.2em; margin-block-end: -0.2em` on the mask, so the clip edge always clears the deepest descender. |
| 3 · Sub-header too wide | Now a fixed 284.8px (`73cqi`) centered block at 12px/1.5. |
| 4 · Follow the reference under the button | Bottom band is CTA then caption, gap 10. |
| 5 · Expression icon | Inherited from `.button--primary`. |

Layout: copy hugs the top (`grid-row: 1`), art takes every remaining pixel (`grid-row: 2`). The
DOM order is header-then-art so the subtitle can never be printed over the illustration — the
first attempt anchored the art absolutely and did exactly that. The Phase 4.5 gradient veil over
the art is gone.

### 2 · Quiz Opening — `src/scenes/intro.ts`
- Spacing on the tokens: header `padding 34`, `gap 16`, points `gap 12`, bottom band `0/34/34`.
- **Seamless art:** `sceneArt.continuity.intro` now points at `/art/scenes/q03-daily-schedule.webp`,
  a native **720×480 (3:2)** derivative, in a full-bleed `aspect-ratio: 3/2` band with the mask
  gradient removed. Nothing is cropped. The old `/opening/var-2.webp` was 540×960 portrait forced
  into a `clamp(18rem, 71cqi, 23rem)` box — that was the "cut" the user reported.
  Accepted trade: the same clock scene also appears as Q3's scenario art.
- **Centred, never rescaled.** The body is `minmax(0, 1fr) auto`: an `.intro__art-band` owns the
  leftover space above the copy and centres the illustration in it, while the illustration itself
  stays at its native 3:2 (390×260 at 390 wide) whatever the viewport height. The band clips; the
  image is never scaled up or down. Verified: `260px` tall, equidistant from the band's edges.
- Points are `Text Point`: 27px blue circle + 12px/1.5 copy, gap 11.

### 3 & 4 · Questions — `src/scenes/question.ts`
| Note | Resolution |
|---|---|
| 1 · `progress-bar-star.svg` | The rail is now 35px tall, `border-radius: 60px`, 1px outline, 12 stops each an 18×20 star image — answered at `opacity: 1`, remaining at `0.20` per spec. The `content: "✱"` glyph hack and three competing stale rule blocks are deleted. The `<progress>` element stays, visually hidden, for the a11y semantic. |
| 2 · Answers and CTA always at the bottom | Body is `auto / minmax(0,1fr) / auto` = indicator / `.question__art-band` / headline+answers, and the CTA + helper live in the shared bottom band. The headline and answers always get their full height; the **band is the flexible row** and centres the illustration inside it, so the art absorbs the slack rather than competing with the copy. |
| 3 · "pertanyaan 1 dr 12" not inline | **Root cause:** the number was split into `.quiz-progress__number-window`, an `inline-grid` with `block-size: 1.2em`, so the digit left the label's baseline. It is now a single text node, matching the spec's `indicator-text`. The odometer delight moved to the star rail. |

Also: `Choice Capsules` styling (`border-radius: 10`, 1px outline, no fill, `padding: 10px 20px`,
`gap: 15`, `min-block-size: 68`), the `backdrop-filter` dropped (a compositing pass the spec
doesn't ask for), and the "Ubah jawaban" link removed — it was absent from both frames and was
what shoved the CTA around. Re-selecting either card already changes the answer, and the CTA
label carries the affordance (`quiz.cta_pick` → `nav.next`).

**The illustration is never rescaled.** It renders at its native 3:2 — **390×260 at every
viewport height** — centred in the band. Where the band is shorter than 260 (a three-line scenario
at 844px leaves it ~238) the band clips the illustration symmetrically top and bottom, which in
these crops is empty cream. Taller phones give the band its full height. It always runs edge to
edge with a matching cream, so there is no visible seam either way.

One deliberate deviation: the frames float the band at `y=25` *behind* the indicator, because
their sample artwork has an empty top. Our twelve scenarios are full-frame crops, so the band
starts below the indicator instead — same composition, but the star rail always reads against
flat cream.

### Baking — `src/scenes/calculating.ts`
The oven dial, the temperature readout and the white centred card are gone. In their place, three
counter-scrolling marquee rows of the whole cast, shuffled per render (technique 10: clone each
row until the copies cover 2× the stage, translate with a modulo wrap on the shared `gsap.ticker`,
speed riding the oven ramp instead of scroll velocity).

- Uses `public/characters/thumbs/` via the shared `characterThumbnail()` helper in
  `src/data/index.ts` — **16 unique requests, 204 KB measured**, inside the §10 ≤300 KB/screen
  budget. The full-size set is 1020 KB and would break it.
- Items are fixed-size with a right margin rather than a flex `gap`: the marquee measures one row
  as its repeat unit, and a gap would add an extra space at every clone boundary — a drifting seam.
- The timing contract is untouched: `config.loading.lineMs`, the four `loading.line*` reveals,
  `skippableAfterLine`, and abort-safe teardown.
- **One status line at a time.** The body is `auto / auto / minmax(0,1fr)` — title, marquee, then
  the status line owning the leftover space and centring itself in it. `loading-lines--sequential`
  (added from TS only when motion is allowed) collapses all four `<li>` into a single grid cell so
  they cross-fade in place instead of stacking into a growing list, at **18px**
  (`--font-size-ref-lead`) rather than body size.
- Reduced motion keeps the plain vertical list with all four lines visible at once — no stacking,
  since overlapping text would be unreadable without the cross-fade.

### 5 · Result — `src/scenes/result.ts`
**First screen** now leads with the art, per the frames: character (full-width, `contain`) →
`KAMU ADALAH …` (10px bold, `letter-spacing: 2px`) → name (Fraunces 48/1.2) → warm code capsule →
tagline (284.8px centred) → muted scroll cue with the orange arrow. `formatCode` joins with a
space (`P G D E`) and the capsule moved off lavender onto the warm tan.

**One unbreakable word was breaking two things.** "The Croquembouche" has no break opportunity, so
at 48px it ran past the viewport — and because the hero's grid column was content-sized, it dragged
the column to **439.8px**, taking the character illustration out to the same width. The
illustration only *looked* mis-cropped; it was 50px wider than the screen. Two fixes:
`grid-template-columns: minmax(0, 1fr)` on `.result__body` so no word can widen the column, and a
`data-long-name` flag (set when the longest word exceeds 10 characters) stepping the name down to
`--font-size-ref-display`. Croquembouche is the only one of the sixteen that trips it. Verified:
illustration exactly 390px, name right edge inside the 34px inset.

**The power bullets were pills, not circles.** Phase 4.5's `.scene--result .result__power-list >
li::before` (0,2,1) outranked the Phase 5.5 rule (0,1,1) and stretched them to 42×27 with
`--radius-pill`. Both bullet rules are now scene-scoped and pinned with
`min/max-inline-size: 27px`, so they are the spec's 27px circle. Same fix on `.intro__point`.

**After scroll** (the layout the user asked me to propose):

```
Superpower kamu         Fraunces 24 + numbered Text Points (27px circles)
Watch-out, with love    Fraunces 24 + paragraph
Sepupu pop-culture      Fraunces 24 + line
──────────────────────  hairline in --color-outline
soft-sell               warm activity tags + outlined "Intip aktivitas Parenteers"
disclaimer              required by the CLAUDE.md copy-honesty rule
[ 🔗 Salin link ]  [ ⭐ Lihat semua 16 tipe ]      2x2 warm chip tray
[ ⏱ Ulangi quiz ]  [ 👍 Lanjutkan          ]
```

**The chip tray** replaces what was a stack of underlined text links. Each secondary destination is
a `Capsules-warm` pill — tan fill, orange label, `border-radius: 25px` — with a 20px icon from the
existing 16-icon family (`share`, `star-featured`, `stopwatch`, `thumbs-up`), laid out 2×2. On
press the icon kicks with an elastic rotate (`bindChipWiggle`) on top of the shared press squash,
so every one of them has something to feel. The soft-sell block was brought into the same warm
language — activity tags as small tan labels instead of blue outlines, and the Parenteers CTA as an
orange-outlined capsule that mutes to `--color-outline` while its URL is still `TBD`.

`decorateChip` **prepends** the icon rather than replacing the button's children, because
`createAsyncButtonController` rebuilds a button's children from its text — the copy chip is
decorated after the controller is attached.

Text block insets `34px 40px`, `gap 34` between groups, `10` inside. The old six-button stack
collapsed into one primary action: `deliverResultImage` already routes to `/story` when the
WebView can only offer a screenshot, so the single CTA covers both share entry points. Nothing is
orphaned — `/story`, `/gallery` and `/end` all keep a reachable entry point.

**Docked share bar** (technique 65): `position: fixed` at the bottom, `translateY(115%)` when
away. It is driven by **scroll offset**, not an element sentinel — the hero is taller than the
viewport, so a sentinel placed after the scroll cue read as "already scrolled past" on first
paint. Asymmetric thresholds (dock past `0.55 × vh`, undock below `0.35 × vh`) stop it chattering,
and a 180ms dwell stops a fast flick flashing it. `.result__detail` reserves `7rem` at the bottom
so the last links are never covered, and the toast stack lifts above the bar.

## Two defects the screenshots caught that the DOM assertions did not

1. **The scenes were 96% alpha.** Phase 4.5 tinted them so the WebGL atmosphere showed through.
   That translucency was what made the art bands read as pasted-on rectangles: the band was
   opaque while the page around it picked up the shader. Both the scene and the now-in-flow header
   are flat `--color-editorial-canvas`. That left the WebGL layer with nothing to show, and on
   2026-08-02 it was measured and **removed** (plan §6): a pixel diff proved it painted nothing on
   any route, so cutting it took JS from 214.86 KB to **78.84 KB gzip** and the Result page from
   40.4 fps to **51 fps** at 8× CPU throttle.
2. **The canvas colour was one unit off the art.** Every derivative encodes the authored `#FEF2E1`
   flat field as `#FDF2E1` (verified across all 51). `--color-editorial-canvas` now matches the
   *encoder's* output, so the bands are mathematically seamless rather than one red unit off. The
   Story compositor (`src/core/share.ts`) and the OG generator were aligned to the same value so
   the shareable artefacts have no halo either.

## Fun factor

Reused rather than rebuilt: `createSceneMotion`, `bindPressFeedback`, `splitTextForReveal` /
`revealSplitText`, `revealOnScroll`, `burstAt`, `runConfetti`, `createAsyncButtonController`,
`createToastStack`, and the single `gsap.ticker` clock.

| Moment | Delight |
|---|---|
| Splash entry | Warm capsule pops in on an elastic ease; headline chars proof up (now unclipped) |
| Quiz Opening | Each numbered bullet proofs up after its line lands |
| Question advance | The star for this question pops `0.2 → 1` with a rotation and an orange burst at the rail — this is where the retired odometer's beat went |
| Answer select | Existing `burstAt` + elastic scale; the capsule border springs to blue |
| Baking | Three rows drift in alternating directions, accelerating with the oven ramp |
| Result reveal | Existing confetti, plus the character landing with squash-and-stretch before its name |
| Docked CTA | Slides up on `--ease-out` after its dwell |

Also fixed on the way through: `--ease-spring` and `--ease-in-out` were referenced by the
stylesheets but never declared, which made those `transition` shorthands invalid — so the language
thumb and the loading shimmer silently never animated. Both are now declared as aliases and
linearised under reduced motion.

## Verification

`npm run qa:phase55` (and `-- --reduced`) drives a CDP-attached Chrome at 390×844 with touch
emulation, which bypasses the desktop QR gate. It asserts, per surface:

- scene mounted, no horizontal overflow, no broken images, no runtime errors
- header in flow, no dead space between header and body, bottom band flush with the scene bottom
- every bottom CTA: the expression mark present, **52px** tall, ≤3px label gap, unrotated, and a
  mark shorter than the label's line box
- art bands full-bleed, at their **native 260px**, and **centred** in their band
- the star rail clear of the artwork; the band clear of the headline
- the progress label a single text node; no change-answer link; the CTA disabled until an answer
- baking: no dial or card, 3 marquee rows, 16 unique thumb requests, ≤300 KB, 18px status line,
  and exactly **one** line visible at a time (plain list under reduced motion)
- result: character exactly 390px wide, name inside the inset, 27px circular bullets, 4 icon chips
  in warm capsules, and the docked bar's full appear/hide cycle

Screenshots land in `artifacts/phase55-qa/`. Requires `npm run dev` plus Chrome on
`--remote-debugging-port=9223`.

Note for anyone extending it: measure with `offsetWidth`, not `getBoundingClientRect()`, on the
result character — its entrance tween scales it, so a rect read mid-flight reports the animated
size and produces a phantom ~5px failure. More of these are collected in
`docs/performance-probes.md` §Interpretation traps.

Last run: **0 failures, 0 runtime errors** in both `no-preference` and `reduce`; typecheck clean;
17 test files / 151 tests; production build **214.86 KB JS gzip** and **13.83 KB CSS gzip** (down
from 14.35 after ~47 dead rules were removed); strict asset audit 0 issues across 51 derivatives
and 17 OG images.

## Still open

- Final copy. The reference wording is layout-only this pass; `landing.eyebrow` and
  `quiz.cta_pick` ship as marked placeholders in both locales. Any new key must also be added to
  `REQUIRED_I18N_KEYS` in `src/data/validation.ts` — `data-integrity.test.ts` asserts the key set
  matches it exactly, and all 70 keys from `quiz-02-ui-strings.md` must survive.
- Physical Samsung A55 / S25 FE and Instagram in-app-browser sign-off. A Samsung A23 (or similar
  Snapdragon 680 class) is worth adding: the throttled proxy says it should be fine, but GPU cost
  and memory bandwidth were never measured on real silicon.
