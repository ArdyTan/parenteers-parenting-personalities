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

**Source normalization, 2026-08-15.** Every question master now uses the same 1536×1024 (3:2)
canvas as `q01-sunday-morning.png`, and every runtime derivative remains 720×480. Q6/Q9 were
padded rather than cropped to preserve their compositions. The portrait Q10 master was rejected
and replaced with a newly generated landscape concept: the tall slide sweeps diagonally across the
frame, with parent and child pastry characters readable at phone size. `assets:normalize-question-art`
now refuses portrait question art rather than trying to crop it. The strict asset audit enforces
both dimensions, and `qa:phase55` captures Q10 at 390×844 and 390×720 so the original small-screen
regression cannot return silently.

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

**After scroll** now begins with the parent-first reading flow before the original personality
summary. The story uses four or more editorial paragraphs, with its 1200x800 illustration inserted
full-bleed after paragraph two. The conclusion remains scannable and keeps this order: daily
reality, guilt release, care for the parent, connection with the child, then three small actions.
The four-part conclusion is one full-width brand-blue reflection block with white copy. Orange stays
on its four numbered markers. Parent care receives the sole translucent-white inset, which makes
that promise visible without turning the whole page into a card stack. The three weekly actions
follow as a separate cream-canvas section with a blue heading and orange outlined number markers.

```
Cerita sehari-hari      Fraunces title + long-form body
[mid-story image]       full-bleed 3:2 illustration after paragraph two
Yang perlu kamu ingat   full-width blue block, white copy, 4 orange number markers
Coba minggu ini         separate cream section, blue heading + 3 orange outlined actions
Superpower kamu         Fraunces 24 + numbered Text Points (27px circles)
Watch-out, with love    Fraunces 24 + paragraph
Sepupu pop-culture      Fraunces 24 + line
Kenalan sm bake lainnya Fraunces 24 + 3 quick-changing tiles + wide button
──────────────────────  hairline in --color-outline
product shelf           ID: 9-card product rail + parenteers.id CTA · EN: Coming Soon
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
"Lanjutkan" left with `/end`. On 2026-08-15 the former soft-sell tags were replaced by a localized
product surface: Indonesian renders nine unique 400×400 product cards from `src/data/products.json`
in a horizontally scrollable rail, and every card plus the outlined CTA targets
`https://parenteers.id/`; English renders no Indonesian cards and shows an English-products Coming
Soon panel instead. The duplicate `stimulation-guide-large.webp` source is intentionally not treated
as a tenth product.

`decorateChip` **prepends** the icon rather than replacing the button's children, because
`createAsyncButtonController` rebuilds a button's children from its text — the copy chip is
decorated after the controller is attached.

Text block insets `34px 40px`, `gap 34` between groups, `10` inside. The old six-button stack
collapsed into one primary action: `deliverResultImage` already routes to `/story` when the
WebView can only offer a screenshot, so the single CTA covers both share entry points. Nothing is
orphaned — `/story` and `/gallery` both keep a reachable entry point (the gallery through the
"other bakes" section added 2026-08-02). `/end` was removed the same day.

### Desktop gate (`createGateScene`)

The only surface a desktop visitor ever sees, so it has to sell the quiz as well as redirect. One
card, two columns at `min-width: 56.25rem`: **copy left, scan right.**

Left is eyebrow chip, headline, lead, three fact pills (`landing.meta_*`), the reason line, and the
"continue on this screen" escape hatch. Right is a warm `--color-editorial-canvas` panel holding the
scan title, the QR, the **typeable host**, and a camera hint. The host in plain text is the manual
path: a visitor who cannot scan can still read four words and type them.

Three details worth keeping:

- **The QR tile is `--brand-canvas`** because that is exactly `QR_CANVAS` in `core/qr.ts`, the
  code's own light-module colour. Tile and code are one surface rather than a square in a square.
- **The card does not repeat the wordmark.** The page header already carries it, plus the language
  toggle.
- **The portrait art is hidden in the two-column layout.** `/opening/var-1.webp` is 540x960 and only
  reads at roughly 4:3 or taller. Across a wide card a full-width band is about a 10% horizontal
  slice, which decapitates the characters at every `object-position` worth trying (measured at
  11/14/9rem and 62/64/66%). It returns below the breakpoint, where the card stacks and there is
  width for a proper 4:3 crop at the landing's own `center 58%`. A landscape gate illustration
  would let the wide layout carry a hero image; there isn't one in the asset set.

Under `56.25rem` the card stacks and `.gate__scan` takes `order: -1`, so the QR leads instead of
sitting under a full column of copy.

**It fits, rather than scrolling.** A gate is a hand-off, not a page to read. Above
`max-height: 53rem` the full layout fits 1440x900 exactly; below it a tightening block trims
padding, gaps, the headline tier and the QR so 1440x720, 1366x768 and 1280x800 all land at **zero**
vertical overflow.

Copy: four new `gate.*` keys. Unlike every other row in `quiz-02-ui-strings.md` they were written
for this layout rather than transcribed, because the gate has no page in
`quiz-01-flow-dialogue.md`. **All four are placeholders awaiting a copy pass.**

### Preloader (`runExperiencePreloader`)

The launch overlay is wordmark, artwork, oven temperature, meter. The artwork is now the
`Preloader2.mp4` stirring bowl rather than a still, served from `public/motion/preloader.mp4`.

**Seamless, by construction.** The old still was drawn with `mix-blend-mode: multiply`, and
multiplying the artwork's cream against the page cream is precisely what painted a darker
rectangle around it: the "card" look. The blend mode is gone, along with any border, radius or
shadow. The clip's own paper is still a shade deeper than `--color-editorial-canvas` and is
textured, so the rectangle cannot be colour-matched away. `.experience-preloader__stage::after`
dissolves it with a radial wash painted *over* the video, fully transparent to 56% and reaching
the page colour by 98%. This is deliberately a wash and not a `mask-image` on the video: ordinary
paint does not depend on how a given engine composites a video layer. Measured across the whole
perimeter of the box, the composited edge differs from the page by **0**.

**It can never hold the launch up.** `<video>` is `muted` + `playsinline` (which is what makes
autoplay legal before a gesture, and keeps the preloader silent while sound is still off),
`loop`, `aria-hidden`, no controls. The preload gate waits on the first frame for at most
`FIRST_FRAME_BUDGET_MS` (900ms) and never rejects: a clip that cannot play is a missing
decoration, not a broken launch. On exit the element is paused and its `src` removed, which
cancels the range requests still in flight, so a visitor only pays for the seconds they saw.
Under reduced motion `autoplay` is false, so the bake holds on its first frame instead of
stirring.

**The clip is the one runtime asset that is not an image**, so `sceneArt.continuity.preloader` is
validated as a root-relative `.mp4` while the other four continuity paths keep the WebP rule, and
`assets:audit` checks its weight and its atom order. See `images/README.md` §5 for why the master
is remuxed by `npm run assets:preloader` before it ships, and what a real encoder would still
improve.

### Shareable result card (`composeResultStoryCard`)

The 1080×1920 PNG people save and post reproduces `images/Result Card.jpg`, which is authored at
**390×768**. That is a phone screen, not the 9:16 the export has to be, so rather than stretch the
artwork into a different aspect the whole design is scaled uniformly to the card's **height**
(`CARD_SCALE = 1920/768 = 2.5`) and centred (`CARD_INSET = 52.5`). Type sizes, gaps and margins
therefore keep their authored proportions. `CARD_LAYOUT` in `src/core/share.ts` holds the measured
ink bounds of the source file in its own units, so a `baseline` really is a text baseline.

Order, top to bottom: centred wordmark · full-width character square · tracked `KAMU ADALAH…`
eyebrow · Fraunces name · `#F3E3CA` code pill with the four letters tracked in brand orange ·
the tagline, wrapping to at most three lines · a footer of `share.card_cta` over the underlined
quiz host on the left, and the outline-family Instagram glyph plus handle on the right.

Three things it deliberately does **not** carry any more: the superpowers list, the watch-out
paragraph and the disclaimer. `ShareCardLabels` narrowed to `{ intro, cta }` to match.

Two consequences worth knowing:

- **The character square is 975px, not the card's full 1080.** A full-width square at this aspect
  would either overrun the eyebrow or paint over the wordmark. Because the character WebPs carry
  the same opaque `#FDF2E1` as the canvas, the 52.5px columns are invisible except where a
  character's own ink reaches its frame edge (the Croquembouche is the one that does).
- **Tracked type is drawn glyph by glyph** (`drawTrackedText`), not via canvas `letterSpacing`,
  which is not available on every WebView that offers `navigator.share`. The eyebrow is sized
  against its *tracked* width so a longer label shrinks instead of overflowing.

Verified across all 16 types in both languages: no name reaches the code pill and no tagline
reaches the footer. Tightest case is the descender in "The Bagel" / "The Baguette", which clears
the pill horizontally rather than vertically.

**Docked share bar** (technique 65): `position: fixed` at the bottom, `translateY(115%)` when
away. It remains hidden at the Result top, then appears after one deliberate first scroll, currently
28% of the viewport height. It retreats only within 12% of the top, so asymmetric thresholds stop
chatter and a 180ms dwell stops a fast flick flashing it.
`.result__detail` reserves `7rem` at the bottom so the last links are never covered, and the toast
stack lifts above the bar. Browser QA locks it off at the top, on after a 280px first scroll, and
available throughout the story and support captures.

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
  cousin-section weight, a full-width ≥48px see-all button, ID's **9** linked product cards versus
  EN's Coming Soon state, both music beds set to loop, and the docked bar's appear/hide cycle
- desktop gate at **1440×900**, **1366×768** and a stacked **820×900**: presentation `gate`, the
  scan panel starting at or after the copy column's right edge on the two wide passes (and above
  the copy when stacked), start-aligned copy, the portrait art `display: none` while two columns
  are in play, an accessible name on the QR, the typeable host present, exactly **3** fact pills,
  a continue-anyway control, **0** horizontal overflow everywhere and **0** vertical overflow on
  both wide passes
- preloader: the artwork is a `<video>` inside `.experience-preloader__stage`, muted, playsinline,
  `aria-hidden`, with **no** blend mode, border, radius or shadow, the stage wash present, and the
  composited edge within **0** of the page colour around the whole box. Normal motion additionally
  requires it to be autoplaying with a decoded frame; reduced motion requires `autoplay` false
- share card: composed at **1080×1920**, its wordmark / character / eyebrow / name / pill / footer
  ink bands within tolerance of the `images/Result Card.jpg` positions (reported in that file's
  390×768 units), the pill filled `#F3E3CA`, the tagline block above the footer, and **zero**
  pixels of name ink over the code pill

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
