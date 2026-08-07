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
  **Corrected 2026-08-02:** the padding was `2px 4px`, which with `box-sizing: border-box` left the
  thumb 28×30 and each label 28×32 — ovals, the same defect already fixed on `.sound-toggle`.
  Uniform `3px` padding gives a square 28px content row (and an inline track of exactly 2 × 28), so
  `border-radius: 50%` on the thumb and both labels can only describe circles. The QA contract now
  asserts every ring is square at 50%.
- **`sound-on.svg` / `sound-off.svg` recentred 2026-08-02.** A `center / contain` mask centres the
  *viewBox*, not the drawing: both glyphs sat 6–7 units right of centre inside their 64×64 box, so
  the icon read visibly off-centre in its circle. The artwork now centres at 31.84 / 32.0 (was
  38.35 / 39.0), and both states share one speaker path so nothing shifts when the toggle flips.
  Asserted in QA via `getBBox()` rather than by eye.
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
viewport height** — and always runs edge to edge with a matching cream, so there is no visible
seam.

**Revised 2026-08-02 — the band spans the headline row.** Centring the art in the *leftover* space
only worked at the 844px design canvas. A Galaxy A55 with browser chrome is ~720 CSS px, where a
five-line Q5 headline left the band **~40px of a 260px image** — the user's "the picture is
trimmed". The band is now `grid-row: 2 / 4` with `align-content: start`, so it keeps its full 260
regardless of how tall the copy is, and the copy sits *over* its lower half rather than pushing it
out. Every band is pinned to `grid-column: 1` — without that the stack, whose row the band now
occupies, auto-places into an implicit second column and halves the scene. That failure is now
asserted by name in `qa:phase55`, because the symptom (a cropped art band) is a long way from the
cause.

**The overlap is z-order, with the fade scoped to where it is needed** (user's calls, 2026-08-02).
The first pass masked the image everywhere; the user asked for a plain background *layer* instead,
then for the gradient back "just for the risk potential device, to make the image feel one with the
environment". Both are now true, split by a measured threshold rather than a guess.

The layer is the base state: the band is the scene's background at `z-index: 0`, the stack paints
over it at `1`, and `.scene__body`'s `isolation: isolate` keeps both scoped to the scene. The
image's own canvas is the page colour, so its frame edge is seamless, and the band is always taller
than the image, so `overflow: clip` never bites.

How far the copy runs onto the picture is purely a function of viewport height, because the image
is a fixed 260px starting just below the rail:

| viewport height | 915 | 870 | 844 | 820 | 800 | 780 | 730 | 667 |
|---|---|---|---|---|---|---|---|---|
| copy on art (px, worst prompt) | 0 | 3 | 30 | 49 | 66 | 83 | 95 | 151 |
| headline starts at (% down) | — | 99 | 88 | 81 | 75 | 68 | 65 | 43 |

At 844 and above the copy only reaches the image's empty bottom margin, which is why a full-height
phone reads clean with no mask at all. **820px is where it first reaches real picture**, so that is
the breakpoint: `@media (max-height: 51.25rem)` reinstates the fade (full to 50%, 45% at 72%, 14%
at 88%, gone by 100%). Verified the switch flips at exactly 820 — 821 is unfaded with 15px of
overlap, 820 is faded. `:root[data-presentation="framed"]` keeps the escape hatch unfaded for the
same reason it keeps the width-only type scale: the query measures the window, not the 390×844
frame, and a short laptop window would otherwise fade art a real phone would not (confirmed
unfaded at 700px and 620px windows).

Below about 700px the headline starts above the halfway mark and the fade can no longer fully keep
ahead of it — that is below every device in the target matrix, and the type scale has stepped the
headline down to ~20px by then.

(A first sweep claiming the no-clip result ran without seeding `pb1.answers`, so the route guard
bounced every case to Q1 and it only ever measured the shortest prompt; the 40-case table below is
the one that actually exercises all three tiers.)

**Two independent axes size the headline**, because two different things make it too big.

*Copy length* — the reference headline is ~20 characters; the real scenarios run to 74.
`data-scale="md"` (>40 chars) and `"sm"` (>58) pick the tier, the same device
`result__name[data-long-name]` already uses for "Croquembouche".

*Screen height* — `cqi` alone only answers "how wide". An A55 with browser chrome is the same 390
wide as the design canvas but ~120px shorter, so a width-only scale hands a short screen exactly
the 36px that overwhelmed it. Each display tier is now
`clamp(floor, min(Ncqi, Msvh), ceiling)`, with both terms resolving to the same value on the
390×844 canvas — so the reference frames are untouched and the height term only bites below them.
`svh`, not `dvh`: the small viewport is stable, whereas `dvh` would resize the headline as the URL
bar hides and shows. The floors were lowered from 2/1.7/1.45rem to 1.4/1.25/1.1rem, or they would
have blocked the shrink they exist to bound.

Measured across 8 screens × 5 prompts × both languages, **40 cases, route guard satisfied**
(seeding `pb1.answers` matters — without it every deep link bounces to Q1 and the sweep silently
measures the same question eight times):

| screen | base | md | sm |
|---|---|---|---|
| design canvas 390×844 | 36 | 30 | 26 |
| A55 full 393×851 | 36.3 | 30.2 | 26.2 |
| A55 + chrome 393×730 | 31.1 | 25.9 | 22.5 |
| S25 FE + chrome 411×790 | 33.7 | 28.1 | 24.3 |
| iPhone SE 375×667 | 28.4 | 23.7 | 20.6 |
| 390×560 | 23.9 | 20 | 17.6 |

In all 40: ≤3 lines, CTA above the fold, art at its native 260 with no clip, no overflow.

**The indicator row is muted blue, not outline tan.** The design file draws `← Kembali`, the
counter and the close control in `--color-outline`, which is 1.4:1 against the cream page. That is
a WCAG 1.4.3 failure on a real phone; `--color-text-muted` keeps the quiet hierarchy at ~4.9:1.

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
- Items are square and sized from the row they are given rather than a fixed px, and spaced with a
  right margin rather than a flex `gap`: the marquee measures one row as its repeat unit, and a gap
  would add an extra space at every clone boundary — a drifting seam.
- **Revised 2026-08-02.** The body is `auto / minmax(0,1fr) / auto` — title, *marquee*, status
  line. Handing the flexible row to the cast instead of to the copy is what makes the bakes big:
  **164px at 390×844**, up from the fixed 104 (68 on short viewports). A shorter screen shrinks
  them on its own, so the `max-height: 46rem` override is gone.
- **One status line, held still.** The four lines used to hand over to each other on a
  `lineMs` timer; at this length that reads as flashing text rather than progress. One line is
  picked per run — the same "no two runs look the same" idea as the shuffled marquee — and never
  animates, at **18px** (`--font-size-ref-lead`).
- **No button.** `config.loading.holdMs` (5000) replaces `lineMs`/`skippableAfterLine`: the scene
  advances to `/r/{slug}` on its own, and a tap anywhere skips ahead so nobody is held by a timer
  they cannot see. It is consequently the one scene with no `Bottom Section`. The timer is
  idempotent against the tap and cleared in `onDestroy`.
- Reduced motion drops the marquee animation and the entrance, not the hold or the advance.

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
Kenalan sm bake lainnya Fraunces 24 + 3 quick-changing tiles + wide button
──────────────────────  hairline in --color-outline
soft-sell               warm activity tags + outlined "Intip aktivitas Parenteers"
disclaimer              required by the CLAUDE.md copy-honesty rule
[ 🔗 Salin link ]  [ ⏱ Ulangi quiz ]              2-up warm chip tray
```

**The other bakes** (added 2026-08-02) is a fourth `result__section`, deliberately at the same
weight as the pop-culture cousin above it: a 24px Fraunces heading, three square tiles, and one
full-width `Capsules-warm` button into `/gallery`. The other fifteen types are shuffled and dealt
round-robin into three disjoint decks, so no two tiles can show the same bake; a `gsap.delayedCall`
chain swaps **one tile every 520ms** with an elastic pop. An `IntersectionObserver` runs it only
while the row is on screen — it sits well below the fold, so there is no reason to be swapping (or
fetching) images while the user is still reading the hero — and warms all fifteen thumbnails the
first time it starts, so a swap can never land on an unfetched tile. Reduced motion keeps three
static bakes. Verified: static off screen, one change at a time on screen, never a duplicate in a
row, stops again when scrolled away.

**The chip tray** replaces what was a stack of underlined text links. Each secondary destination is
a `Capsules-warm` pill — tan fill, orange label, `border-radius: 25px` — with a 20px icon from the
existing 16-icon family (`share`, `stopwatch`), laid out 2-up. On press the icon kicks with an
elastic rotate (`bindChipWiggle`) on top of the shared press squash, so both have something to
feel. It was a 2×2 of four: the gallery chip was promoted into its own section above, and
"Lanjutkan" left with `/end`. The soft-sell block was brought into the same warm
language — activity tags as small tan labels instead of blue outlines, and the Parenteers CTA as an
orange-outlined capsule that mutes to `--color-outline` while its URL is still `TBD`.

`decorateChip` **prepends** the icon rather than replacing the button's children, because
`createAsyncButtonController` rebuilds a button's children from its text — the copy chip is
decorated after the controller is attached.

Text block insets `34px 40px`, `gap 34` between groups, `10` inside. The old six-button stack
collapsed into one primary action: `deliverResultImage` already routes to `/story` when the
WebView can only offer a screenshot, so the single CTA covers both share entry points. Nothing is
orphaned — `/story` and `/gallery` both keep a reachable entry point (the gallery through the
"other bakes" section added 2026-08-02). `/end` was removed the same day.

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
- header in flow, no dead space between header and body, bottom band flush with the scene bottom.
  Baking is the one listed exception — it is asserted to have *no* bottom band
- every bottom CTA: the expression mark present, **52px** tall, ≤3px label gap, unrotated, and a
  mark shorter than the label's line box
- header controls: the language thumb, both language labels and the sound capsule are square boxes
  at `border-radius: 50%`, and both sound glyphs centre within 0.75 units of 32 in their viewBox
  (read with `getBBox()`, since a `contain` mask hides the offset from every layout measurement)
- art bands full-bleed and at their **native 260px**, carrying **no mask at 844** (the copy clears
  the artwork there) but **a fade at 720**, with the copy stack positioned above the band by
  z-index inside an isolated `.scene__body`; the star rail clear of the artwork; the copy stack in
  `grid-column: 1` at full viewport width
- questions sampled at **1 / 2 / 5 / 12** — one at each headline tier — and no scenario may run
  more than three lines; the indicator row may not be the outline tan
- a dedicated **390×720** pass on Q5 (the A55-with-chrome case): art still 260px, art bottom below
  the headline top, CTA above the fold
- baking: no dial or card, 3 marquee rows, **square thumbnails ≥120px**, 16 unique thumb requests,
  ≤300 KB, exactly one 18px status line at full opacity, no continue button, and the scene on
  `result` after the 5s hold
- result: character exactly 390px wide, name inside the inset, 27px circular bullets, **4** detail
  sections, **2** icon chips in warm capsules, **3** other-type tiles under a heading at
  cousin-section weight, a full-width ≥48px see-all button, and the docked bar's appear/hide cycle

Screenshots land in `artifacts/phase55-qa/`. Requires `npm run dev` plus Chrome on
`--remote-debugging-port=9223`.

Note for anyone extending it: measure with `offsetWidth`, not `getBoundingClientRect()`, on the
result character — its entrance tween scales it, so a rect read mid-flight reports the animated
size and produces a phantom ~5px failure. More of these are collected in
`docs/performance-probes.md` §Interpretation traps.

Last run (2026-08-02, after the seven-note revision): **0 failures, 0 runtime errors** in both
`no-preference` and `reduce`; typecheck clean; 14 test files / 143 tests; production build
**80.58 KB JS gzip** and **13.95 KB CSS gzip**; strict asset audit 0 issues across 51 derivatives
and 17 OG images.

## Still open

- Final copy. The reference wording is layout-only this pass; `landing.eyebrow` and
  `quiz.cta_pick` ship as marked placeholders in both locales. Any new key must also be added to
  `REQUIRED_I18N_KEYS` in `src/data/validation.ts` — `data-integrity.test.ts` asserts the key set
  matches it exactly, and all 70 keys from `quiz-02-ui-strings.md` must survive.
- The founder note. `config.flags.founderNote` still exists but is unwired: its only surface was
  `/end`, which was removed 2026-08-02. It needs a home on the Result before it can ship.
- Physical Samsung A55 / S25 FE and Instagram in-app-browser sign-off. A Samsung A23 (or similar
  Snapdragon 680 class) is worth adding: the throttled proxy says it should be fine, but GPU cost
  and memory bandwidth were never measured on real silicon.
