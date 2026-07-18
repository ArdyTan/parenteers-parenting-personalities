# data-spec.md — JSON Database Specification
**What this is:** the authoritative spec for the app's entire database — five JSON files under `src/data/`. Expands plan.md §4; on any conflict, **this file wins**. The JSON is transcribed once from the content .md files (§8 map); after that, JSON is runtime truth and the .md files are editorial reference.

```
src/data/
├── questions.json      # 12 questions
├── types.json          # 16 result types
├── config.json         # links, flags, tunables
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
  "id": 7, "dimension": "emotion",
  "scenario": { "en": "Meltdown at the mall. (Yes, that one.)", "id": "Tantrum di mal. (Iya, yg itu.)" },
  "answers": [
    { "pole": "T", "en": "I crouch down and name it: “You're really upset, huh…”", "id": "Aku jongkok, sebut perasaannya: “Kamu kesel ya…”" },
    { "pole": "D", "en": "Scoop up, hug, change of scenery, offer water", "id": "Gendong, peluk, ganti suasana, tawarin minum" }
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
| `popCousin` | `{en, id}` | from research §4 table; ID may localize |
| `image` | string | `/characters/{slug}-{bake}.webp` (§4 table) |
| `accent` | hex | per-type accent; **draft until final art lands**, then matched to the character palette |
| `activityTags` | letter[2] | 2 distinct letters from the code; defaults deterministically to D2+D3, with an explicit editorial override allowed |

## 3. config.json

```json
{
  "links": { "activities": "TBD", "instagram": "https://instagram.com/parenteers", "site": "TBD" },
  "flags": { "founderNote": true, "sound": true, "desktopEscapeHatch": true, "analytics": "plausible" },
  "loading": { "lineMs": 2500, "skippableAfterLine": 2 },
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

- Keys are dot-namespaced exactly as in `quiz-02-ui-strings.md` (`nav.*`, `landing.*`, `intro.*`, `quiz.*`, `loading.*`, `result.*`, `gallery.*`, `end.*`, `share.*`, `footer.*`, `error.*`, `meta.*`, `a11y.*`).
- **Page content from quiz-01 that quiz-02 doesn't cover gets new keys in the same namespaces:** `landing.h1`, `landing.subtitle`, `landing.trust` · `intro.h2`, `intro.point1..3` · `quiz.interstitial_q6`, `quiz.interstitial_q9` · `loading.line1..4` · `result.softsell_body` · `gallery.intro` · `end.h2`, `end.body`, `end.founder_note` · `activity.P` … `activity.N` (the 8 activity-tag labels).
- **Boundary rule:** if a string belongs to a *record* (a question, a type), it lives embedded in that record's JSON. If it belongs to a *page or reusable UI*, it lives in i18n. No third place.
- Interpolation variables `{n} {total} {type} {emoji} {link} {year} {lang}` — never translated/reordered (conventions.md §6.5).
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

## 7. Validation invariants (enforced by `npm run test` + dev-boot assert)

- **questions:** exactly 12 · ids 1–12 contiguous · 3 questions per dimension in the fixed order · each has exactly 2 answers carrying that dimension's two opposing poles · all `en`/`id` non-empty.
- **types:** exactly 16 · codes = full cartesian product, unique · slug = lowercase code · every `image` file exists (build-time check) · `superpowers` length 3 in both languages · all text fields non-empty both languages · `accent` valid hex · `activityTags` ⊂ code letters, length 2, values distinct.
- **i18n:** identical key sets across languages · interpolation vars per key match across languages.
- **scoring:** all 16 codes reachable · shuffle-invariance (randomizing answer order never changes the result).
- **config:** no `TBD` remaining at production build (warning in dev, error in release build).

## 8. Transcription map (content .md → JSON, done once in Phase 1)

| Source | Target |
|---|---|
| quiz-01 PAGE 1 (hero) | `i18n landing.h1 / .subtitle / .trust` (meta chips already in quiz-02) |
| quiz-01 PAGE 2 (intro) | `i18n intro.h2 / .point1..3` |
| quiz-01 PAGES 3–14 (12 questions) | `questions.json` (scenario, answers, poles) |
| quiz-01 interstitials (post-Q6/Q9) | `i18n quiz.interstitial_q6 / _q9` |
| quiz-01 PAGE 15 (loading lines) | `i18n loading.line1..4` |
| quiz-01 PAGE 16 (result template + soft-sell) | labels from quiz-02 `result.*`; `i18n result.softsell_body`; activity-tag letter labels → `i18n activity.*` |
| quiz-01 THE 16 RESULT COPIES | `types.json` tagline / superpowers / watchout / emoji |
| research §4 table (pop cousins) | `types.json popCousin` |
| quiz-01 PAGE 17 (gallery) | `i18n gallery.intro` (title/CTAs already in quiz-02) |
| quiz-01 PAGE 18 (end) | `i18n end.h2 / .body / .founder_note` |
| quiz-02 (all tables) | `i18n en.json / id.json` keys **verbatim** |
| quiz-03 §5 (naming only) | asset filenames (§4); nothing else from that file enters the app |

## 9. Client persistence (not files — browser storage)

| Key | Store | Value |
|---|---|---|
| `pb1.lang` | localStorage | `"id"` (default) or `"en"` |
| `pb1.lastResult` | localStorage | `{ "code": "PCTE", "ts": 1789… }` |
| `pb1.answers` | sessionStorage | `[{ "q": 1, "pole": "P" }, …]` — in-progress quiz, cleared on completion |

Prefix `pb1.` is the schema version; bump to `pb2.` on any breaking shape change (old keys ignored, never migrated — the data is disposable).
