# data-spec.md — JSON Database Specification
**What this is:** the authoritative spec for the app's entire database: six runtime registries plus
three booklet-only registries under `src/data/`. Expands plan.md §4; on any conflict, **this file
wins**. The JSON is transcribed once from the content .md files (§8 map); after that, JSON is truth
and the .md files are editorial reference.

```
src/data/
├── questions.json      # 12 questions
├── types.json          # 16 result types
├── products.json       # 9 Indonesian products shown on Result
├── scene-art.json      # question/checkpoint/continuity illustration manifest
├── config.json         # links, flags, tunables
├── parent-care.json    # 25 parent-recovery activities for the PDF generator
├── child-activities.json # 20 age-banded child activities for the PDF generator
├── weekly-extras.json  # 16 pole-keyed checklist additions for the PDF generator
└── i18n/
    ├── en.json         # all UI + page strings
    └── id.json
```

**Bilingual convention:** data-bound content embeds `{ "en": …, "id": … }` objects; page/UI strings live flat in `i18n/{lang}.json` under dot-namespaced keys. Boundary defined in §5.

---

## 1. questions.json

Array of exactly 12 objects, ordered by `id`:

| Field | Type | Rules |
|---|---|---|
| `id` | int | 1–12, contiguous, array-ordered |
| `dimension` | `"structure" \| "guidance" \| "emotion" \| "adventure"` | Q1–3 structure · Q4–6 guidance · Q7–9 emotion · Q10–12 adventure |
| `scenario` | `{en, id}` | non-empty both languages |
| `answers` | array(2) | exactly two, opposing poles of the question's dimension |
| `answers[].pole` | letter | structure `P/F` · guidance `C/G` · emotion `T/D` · adventure `E/N` |
| `answers[].en` / `.id` | string | non-empty |

```json
{
  "id": 7,
  "dimension": "emotion",
  "scenario": {
    "en": "A mall meltdown. Your usual first move…",
    "id": "Anak tantrum di mal. Kamu biasanya mulai dr…"
  },
  "answers": [
    {
      "pole": "T",
      "en": "Crouch down: “You’re really upset, huh…”",
      "id": "Jongkok, bilang: “Kamu kesel ya…”"
    },
    {
      "pole": "D",
      "en": "Give a hug and move somewhere calmer",
      "id": "Peluk, ajak ke tempat yg lebih tenang"
    }
  ]
}
```

**Randomization rule (binding):** the two answers are shuffled **per render**; the pole travels with the answer object, never with the position. UI labels A/B come from `quiz.answer_a_label`/`_b_label` and attach to positions after the shuffle.

## 2. types.json

Array of exactly 16 objects — the full cartesian product of the four dimensions:

| Field | Type | Rules |
|---|---|---|
| `code` | string | `[PF][CG][TD][EN]`, unique |
| `slug` | string | lowercase `code` — used in routes `/r/{slug}` and asset names |
| `emoji` | string | from quiz-01 result headers; rendered in share captions + cards |
| `name` | `{en, id}` | bake names are identical in both languages by design |
| `tagline` | `{en, id}` | from quiz-01 result copy |
| `superpowers` | `{en: string[3], id: string[3]}` | exactly 3 each — equal-love rule |
| `watchout` | `{en, id}` | one line incl. the tip |
| `parentStory` | object | parent-first narrative opener: localized `title`, localized multi-paragraph `body`, `image`, localized `imageAlt`, and `imageAfterParagraph: 2`; the illustration interrupts the story after paragraph two, before the summary points |
| `parentSupport` | object | parent-first depth layer: `realLife`, `guiltRelease`, `careForYou`, `forYourChild` as localized text plus `tryThisWeek` as exactly 3 localized actions |
| `popCousin` | `{en, id}` | from research §4 table; ID may localize |
| `image` | string | `/characters/{slug}-{bake}.webp` (§4 table) |
| `accent` | hex | per-type accent; **draft until final art lands**, then matched to the character palette |
| `activityTags` | letter[2] | 2 distinct letters from the code; defaults deterministically to D2+D3, with an explicit editorial override allowed |
| `pdfSelection` | optional object | Booklet editorial overrides: five `parentCare` ids, five `childPlay` ids and optionally four `weeklyExtras` ids; omitted by default so deterministic selection applies |

### products.json

Array of exactly nine unique Indonesian Parenteers products. Each object contains non-empty `id`,
`meta`, `title`, and `alt` strings plus a root-relative 400×400 WebP `image` under
`/products/`. This registry drives only the Indonesian Result rail; English deliberately renders a
localized Coming Soon state. The companion landing page's `stimulation-guide-large.webp` is a layout
variant of the same guide and is not a tenth record.

### PDF booklet derivative registries

These three files are consumed by `scripts/generate-pdf-booklets.mjs`; they do not enter the browser
bundle or `appData`. The generated PDFs are committed derivatives at `public/pdf/{lang}/{slug}.pdf`.

**`parent-care.json`** contains exactly 25 records: one universal `pole: "*"` activity and three
variants for each pole `P/F/C/G/T/D/E/N`. Each record has a unique `id`, `minutes` in
`2 | 5 | 10 | 15`, localized `title`, `why`, `how` and `imageAlt`, plus `image`. The image field is
temporarily empty while the commissioned art is pending; after art intake it becomes a
root-relative `/pdf-art/care/{id}.webp` path.

**`child-activities.json`** contains exactly 20 records: four in each band
`0-12m | 1-2y | 2-3y | 3-4y | 4-5y`. Each band has two variants for each pole of its selecting
dimension. Records carry a unique `id`, `poleAffinity`, an approved `method`, `minutes`, localized
`title`, `why`, 2–3 `steps`, `materials`, `safety`, `imageAlt` and `image`. Image is temporarily
empty, then becomes `/pdf-art/play/{id}.webp` after art intake. Approved methods are
`serve-return`, `cprt-special-play`, `cprt-reflect`, `montessori-practical-life`,
`montessori-sensorial`, `montessori-movement`, `montessori-order` and `montessori-heuristic`.

**`weekly-extras.json`** contains exactly 16 records: two per pole. Each has a unique `id`, its
`pole`, and a non-empty localized `action`. The booklet chooses four—one for each letter in the
reader's type code—to extend the three authored `tryThisWeek` actions without changing the Result
page's three-item contract.

Selection is deterministic and specified in `docs/personality-pdf-plan.md` §4.3. The parent set is
the universal record plus one variant for each code letter; the child set is one activity per age
band; weekly extras contribute one action per code letter. Optional `types.json.pdfSelection`
overrides must resolve to existing ids with the same shape.

## 3. config.json

```json
{
  "links": { "activities": "https://parenteers.id/", "instagram": "https://instagram.com/parenteers", "site": "TBD" },
  "flags": { "founderNote": true, "sound": true, "desktopEscapeHatch": true, "analytics": "plausible" },
  "loading": { "holdMs": 5000 },
  "gate": { "minDesktopWidth": 900 },
  "story": { "panels": 3 },
  "utm": { "source": "quiz", "medium": "share", "campaign": "parenting-bakes" }
}
```

`TBD` values are launch blockers tracked in plan.md §15. Flags map 1:1 to plan.md §14 decisions.

## 4. Type registry (fixed enumeration)

| Code | Slug | Name | Emoji | Image file |
|---|---|---|---|---|
| PCTE | pcte | The Croquembouche | 🍮 | `pcte-croquembouche.webp` |
| PCTN | pctn | The Lapis Legit | 🍰 | `pctn-lapis-legit.webp` |
| PCDE | pcde | The Baguette | 🥖 | `pcde-baguette.webp` |
| PCDN | pcdn | The Milk Bread | 🍞 | `pcdn-milk-bread.webp` |
| PGTE | pgte | The Cronut | 🍩 | `pgte-cronut.webp` |
| PGTN | pgtn | The Pandan Chiffon | 🍃 | `pgtn-pandan-chiffon.webp` |
| PGDE | pgde | The Pretzel | 🥨 | `pgde-pretzel.webp` |
| PGDN | pgdn | The Muffin | 🧁 | `pgdn-muffin.webp` |
| FCTE | fcte | The Molten Lava Cake | 🍫 | `fcte-molten-lava-cake.webp` |
| FCTN | fctn | The Cinnamon Roll | 🍯 | `fctn-cinnamon-roll.webp` |
| FCDE | fcde | The Bagel | 🥯 | `fcde-bagel.webp` |
| FCDN | fcdn | The Banana Bread | 🍌 | `fcdn-banana-bread.webp` |
| FGTE | fgte | The Pavlova | ✨ | `fgte-pavlova.webp` |
| FGTN | fgtn | The Tiramisu | ☕ | `fgtn-tiramisu.webp` |
| FGDE | fgde | The Focaccia | 🫒 | `fgde-focaccia.webp` |
| FGDN | fgdn | The Bolu Kukus | 🌸 | `fgdn-bolu-kukus.webp` |

## 5. i18n files — key conventions & content boundary

- Keys are dot-namespaced exactly as in `quiz-02-ui-strings.md` (`nav.*`, `landing.*`, `intro.*`, `quiz.*`, `loading.*`, `result.*`, `gallery.*`, `share.*`, `footer.*`, `error.*`, `meta.*`, `a11y.*`). The `end.*` namespace was retired with the `/end` route on 2026-08-02.
- **Page content from quiz-01 that quiz-02 doesn't cover gets new keys in the same namespaces:** `landing.h1`, `landing.subtitle`, `landing.trust` · `intro.h2`, `intro.point1..3` · `quiz.interstitial_q6`, `quiz.interstitial_q9` · `loading.line1..4` · `result.softsell_body`, `result.other_types_label` · `gallery.intro` · `share.hold_hint`, `share.image_shared`, `share.image_saved`, `share.link_shared` · `activity.P` … `activity.N` (the 8 activity-tag labels).
- **Boundary rule:** if a string belongs to a *record* (a question, a type), it lives embedded in that record's JSON. If it belongs to a *page or reusable UI*, it lives in i18n. No third place.
- Interpolation variables `{n} {total} {type} {emoji} {link} {year} {lang} {answer}` — never translated/reordered (conventions.md §6.5). The directional answer labels interpolate the displayed answer text after shuffling; the stored pole comes from that answer object, never from left/right.
- `en.json` and `id.json` must have **identical key sets** (validated).

## 6. Scoring (core/scoring.ts)

```
score(poles): TypeCode
  # poles = exactly 12 Pole values sorted by question id
  d1 = majority(poles[q1..q3],  P, F)
  d2 = majority(poles[q4..q6],  C, G)
  d3 = majority(poles[q7..q9],  T, D)
  d4 = majority(poles[q10..q12], E, N)
  return d1 + d2 + d3 + d4     # e.g. "PCTE" → types.json lookup
```

At `/baking`, load the persisted `{q, pole}[]` records from `pb1.answers`, sort them by `q`, then map them to the derived `Pole[]` passed to `score`. Storage order is not a scoring input. 3 questions per dimension ⇒ majority always exists, **ties are structurally impossible**. Pure function; no state.

## 7. Validation invariants

The six runtime registries are enforced by `npm run test` plus the dev-boot assertion. The three
booklet-only registries are consumed successfully by `npm run assets:pdf`, but dedicated structural
tests and the planned `qa:pdf` command remain Phase 8 QA work; the rules below are nevertheless the
authoritative contract.

- **questions:** exactly 12 · ids 1–12 contiguous · 3 questions per dimension in the fixed order · each has exactly 2 answers carrying that dimension's two opposing poles · all `en`/`id` non-empty.
- **types:** exactly 16 · codes = full cartesian product, unique · slug = lowercase code · every `image` file exists (build-time check) · `superpowers` length 3 in both languages · every `parentStory` has a non-empty localized title, a multi-paragraph localized body, localized image alt text, the matching 1200×800 story WebP, and `imageAfterParagraph: 2` · every `parentSupport` contains four non-empty localized parent-first fields plus exactly 3 `tryThisWeek` actions per language · all text fields non-empty both languages · `accent` valid hex · `activityTags` ⊂ code letters, length 2, values distinct.
- **products:** exactly 9 unique ids · every metadata field non-empty · every image is a root-relative 400×400 WebP under `public/products/`.
- **i18n:** identical key sets across languages · interpolation vars per key match across languages.
- **scoring:** all 16 codes reachable · shuffle-invariance (randomizing answer order never changes the result).
- **config:** no `TBD` remaining at production build (warning in dev, error in release build).
- **parent care:** exactly 25 unique ids · one universal record · three records per pole · allowed
  minute values only · every localized content field non-empty · production image paths match ids.
- **child activities:** exactly 20 unique ids · four per age band · two per relevant pole within
  every band · method in the approved registry · 2–3 steps in both languages · a non-empty safety
  line in both languages for every record · production image paths match ids.
- **weekly extras:** exactly 16 unique ids · two per pole · localized actions non-empty.
- **booklet selection:** deterministic selection resolves five parent-care records, five child
  activities and four weekly extras for all 16 types; the default child selection covers all 20
  activity records across the roster; any editorial override preserves the per-type shape.

## 8. Transcription map (content .md → JSON, done once in Phase 1)

| Source | Target |
|---|---|
| quiz-01 PAGE 1 (hero) | `i18n landing.h1 / .subtitle / .trust` (meta chips already in quiz-02) |
| quiz-01 PAGE 2 (intro) | `i18n intro.h2 / .point1..3` |
| quiz-01 PAGES 3–14 (12 questions) | `questions.json` (scenario, answers, poles) |
| quiz-01 interstitials (post-Q6/Q9) | `i18n quiz.interstitial_q6 / _q9` |
| quiz-01 PAGE 15 (loading lines) | `i18n loading.line1..4` |
| quiz-01 PAGE 16 (result template) + 2026-08-15 product override | labels from quiz-02 `result.*`; ID product rail → `products.json` + `result.products_*`; EN → localized Coming Soon |
| quiz-01 THE 16 RESULT COPIES | `types.json` tagline / superpowers / watchout / emoji |
| research §4 table (pop cousins) | `types.json popCousin` |
| `docs/personality-parent-first-content.md` | research/editorial basis → `types.json parentStory` + `parentSupport`; each result opens with a daily-life story, inserts its matching illustration after paragraph two, then summarizes the parent-first takeaways as points; the 16 profiles are interpretations of the four dimensions, not separately validated psychological types |
| `docs/personality-pdf-plan.md` | `parent-care.json`, `child-activities.json`, `weekly-extras.json`, selection rules and booklet-only i18n keys |
| quiz-01 PAGE 17 (gallery) | `i18n gallery.intro` (title/CTAs already in quiz-02) |
| ~~quiz-01 PAGE 18 (end)~~ | ~~`i18n end.h2 / .body / .founder_note`~~ — route removed 2026-08-02, keys retired |
| quiz-02 (all tables) | `i18n en.json / id.json` keys **verbatim** |
| archived `images/old images/quiz-03-image-prompts.md` §5 (naming only) | runtime asset filenames (§4); nothing else from that file enters the app |
| `images/README.md` | delivered source folders, exact source/reference order, and archive boundary; never runtime content |

## 9. Client persistence (not files — browser storage)

| Key | Store | Value |
|---|---|---|
| `pb1.lang` | localStorage | `"id"` (default) or `"en"` |
| `pb1.lastResult` | localStorage | `{ "code": "PCTE", "ts": 1789… }` |
| `pb1.answers` | sessionStorage | `[{ "q": 1, "pole": "P" }, …]` — in-progress quiz, cleared on completion |

Prefix `pb1.` is the schema version; bump to `pb2.` on any breaking shape change (old keys ignored, never migrated — the data is disposable).
