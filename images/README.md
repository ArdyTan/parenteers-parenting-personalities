# Parenting Bakes — Asset Intake and Order

**Status:** scanned and reconciled through the finalized Phase 8 booklet assets on 2026-08-27.

This file is authoritative for the source-art inventory, folder roles, and image order. Runtime filenames and the 16-type registry remain authoritative in `data-spec.md`.

## Folder roles

| Folder | Role | Runtime status |
|---|---|---|
| `new-layout/` | **Phase 5.5 visual authority.** Frames exported from the Brilliant design file | Reference only; never bundled |
| `current-layout/` | Phase 5.5 "before" screenshots of the running app, for comparison | Reference only; never bundled |
| `icons/` | Icon and layout-mark sources | Sixteen 64×64 icons plus `button-expression.svg` and `progress-bar-star.svg` in `public/icons/` |
| `Interface-Reference/` | Historical Phase 4/4.5 composition references; superseded by `new-layout/` and removed from the tree | Not reference; do not restore for build |
| `opening-image/` | Ordered opening/landing artwork variants | Four 540×960 WebPs in `public/opening/` |
| `scene-art/` | Phase 4.5 text-free question art plus retained checkpoint sources | Twelve normalized 1536×1024 question PNGs feed active 720×480 WebPs; two 600×900 checkpoint WebPs remain as inactive rollback assets |
| `Pastries-personalities/` | Active 16-character source set | Full-bleed 900×900 result WebPs plus 360×360 shelf WebPs in `public/characters/` |
| `story-illustrations/` | Sixteen 1536×1024 narrative sources, one per personality | `npm run assets:stories` builds matching 1200×800 WebPs in `public/story-illustrations/`; each appears after story paragraph two |
| `pdf-art/` | Source home for the 54 finalized booklet illustrations | 25 care + 20 play + 9 furniture PNGs; `npm run assets:pdf-art` derives the matching committed WebPs in `public/pdf-art/` |
| `web-component/` | Supporting 404 art and preloader motion reference | 404 derivative in `public/art/`; MP4 retained as reference-only |
| `old images/` | Superseded first delivery plus the archived image-prompt document | Archive only; never use as the active source |

## 0. Phase 5.5 layout authority (current)

The authoritative interface source is the **Brilliant** design file
`C:\Users\tanar\.config\brilliant\scratch\Canvas.design` (design system
`figma-parenting-personalities`). Read exact geometry and tokens from it via the Brilliant
connector rather than measuring the exports. `new-layout/` holds its exported frames, in flow
order:

1. `1 Splash.jpg`
2. `2 Quiz Opening.jpg`
3. `3 Questions-sample1.jpg` and `3 Questions-sample2.jpg` — two states of one template (Q1 and Q10)
4. `5 Result - short.jpg` (first screen) and `5 Result - long.jpg` (scrolled, with the docked CTA)

`current-layout/` holds the matching pre-revision screenshots (`home`, `intro`, `question`,
`baking-loading`, `result`) so the two can be diffed. There is no Phase 5.5 frame for the baking
screen — it was specified in the user's notes, not the design file.

Spacing tokens: `universal-padding 34`, `header-to-body 16`, `component-spacing 12`. Full spec in
`docs/phase-5-5-interface-plan.md`.

## 1. Interface reference order (historical — Phase 4)

The six `Interface-Reference/` files below are no longer in the tree; the section is kept so the
Phase 4 log stays readable. Use this order when reviewing or implementing the Phase 4 visual flow:

1. `reference-start.png`
2. `reference-question.png`
3. `reference-section-chekpoint.png`
4. `reference-result-main-1.png`
5. `reference-result-main-2.png`
6. `reference-result-detailed.png`

All six files are 941×1672 portrait PNGs. `reference-result-main-1.png` and `reference-result-main-2.png` are two personality examples of the same main-result template, not two consecutive result scenes. The references control visual direction and hierarchy; content still comes from the bilingual JSON/copy sources.

**Phase 4.5 clarification (2026-07-30):** the references are direct composition targets, not merely loose inspiration. Landing, questions, and the main result should reproduce their hierarchy and art-led warmth with real responsive DOM. Cute bakery illustration should remain present across every primary interface. Never bundle the reference screenshots themselves because their UI and localized text are baked in; use standalone source art and real ID/EN controls/copy.

**Flow override (2026-07-31):** `reference-section-chekpoint.png` remains in the source inventory, but the Q6/Q9 checkpoint screens were removed because they interrupted quiz momentum. Its generated checkpoint art is retained only for rollback and has no runtime scene consumer.

## 2. Opening image order

The supplied order is:

1. `var-1.png`
2. `var-2.png`
3. `var-3.png`
4. `var-4.png`

All four are 941×1672 opaque portrait PNGs. Preserve this order if Phase 4 uses them as a sequence. The filenames establish order but do not, by themselves, require a carousel or select one variant as the permanent hero.

## 3. Phase 4.5 scene-art order

Question sources follow quiz order:

1. `q01-sunday-morning.png`
2. `q02-family-day-out.png`
3. `q03-daily-schedule.png`
4. `q04-play-activity.png`
5. `q05-family-lunch-outfit.png`
6. `q06-tidying-toys.png`
7. `q07-mall-meltdown.png`
8. `q08-block-tower.png`
9. `q09-sad-bedtime.png`
10. `q10-tall-slide.png`
11. `q11-puddles.png`
12. `q12-new-kids-party.png`

Checkpoint sources are `checkpoint-q6-rising-dough.png` and
`checkpoint-q9-nearly-baked.png`. Their retained paths remain recorded in
`src/data/scene-art.json`, but no runtime scene consumes them after the
2026-07-31 flow override. The generated sources contain no interface text,
answer labels, or preferred-answer cues.

## 4. Personality image order

Use the fixed type-registry order from `data-spec.md`, not alphabetical filesystem order:

1. `pcte-croquembouche.png`
2. `pctn-lapis-legit.png`
3. `pcde-baguette.png`
4. `pcdn-milk-bread.png`
5. `pgte-cronut.png`
6. `pgtn-pandan-chiffon.png`
7. `pgde-pretzel.png`
8. `pgdn-muffin.png`
9. `fcte-molten-lava-cake.png`
10. `fctn-cinnamon-roll.png`
11. `fcde-bagel.png`
12. `fcdn-banana-bread.png`
13. `fgte-pavlova.png`
14. `fgtn-tiramisu.png`
15. `fgde-focaccia.png`
16. `fgdn-bolu-kukus.png`

The active set contains all 16 expected filenames. Each file is 1254×1254, opaque, and visually different from its archived counterpart in `old images/`.

## 5. Web components

- `asset-404.png` — 1254×1254 opaque source illustration.
- `Preloader2.mp4`: the preloader clip. 500×500, 10.008s, 300 H.264 frames at 30fps, plus an AAC track. 1.76 MB. Added 2026-07-29; promoted from reference to production on 2026-08-16.

Frame-level inspection is now complete: it is a stirring mixing bowl on a textured cream paper, roughly `#F5EDE1`, which is a shade deeper than `--color-editorial-canvas` (`#FDF2E1`). The artwork sits in the middle of the frame with its own soft shadow baked in, and the paper reaches every edge.

**This master is not what ships.** Its `moov` atom sits after `mdat`, so a browser cannot decode a single frame until the whole 1.8 MB has arrived, which for a preloader is worse than having no clip at all. `npm run assets:preloader` relocates `moov` to the front and rewrites the chunk offset tables into `public/motion/preloader.mp4`. Nothing is re-encoded, so the derivative is pixel-identical (verified frame by frame against this master) and the same size.

Two things a real encoder would still fix, and this project carries none: the AAC track is dead weight (244 KB of the 1.76 MB) and the clip is 10 seconds long when the preloader is only on screen for about one. Trimming to roughly 3 seconds and dropping the audio would take it under 600 KB. An animated WebP was measured as an alternative and rejected: 3 seconds at 400px/15fps already costs 816 KB.

## 6. Result product assets

The Indonesian Result product rail uses nine unique 400×400 WebPs in `public/products/`, registered
in `src/data/products.json`. They are exact runtime copies of the matching product assets from
`D:\#dev\parenteers-landingpage\dist\assets\images\products`. The source folder also contains
`stimulation-guide-large.webp`; it is a wide layout variant of `stimulation-guide.webp`, not a
tenth product, and is intentionally excluded from the rail. English renders a localized Coming Soon
panel instead of these Indonesian product cards. Every Indonesian card and its CTA target
`https://parenteers.id/` through `config.links.activities`.

## 7. PDF booklet art (finalized 2026-08-27)

All 54 commissioned sources are installed under `images/pdf-art/{care,play,furniture}/`: 25
parent-care tiles, 20 child-activity tiles and 9 furniture bands. `npm run assets:pdf-art` validates
their ids and dimensions, then writes the optimized WebPs under `public/pdf-art/`; `npm run
assets:pdf` embeds those derivatives into the 32 bilingual A-layout booklets. The exact filename,
size and QC contract lives in `docs/personality-pdf-art-brief.md`. The historical expanded prompt is
retained at the repository root as `parenteers-booklet-art-prompts.txt` for correction work only.

## Production rules

- Do not import directly from `images/`; production derivatives belong under `public/`.
- Question source art is normalized to 1536×1024 (3:2), matching `q01-sunday-morning.png`. Run `npm run assets:normalize-question-art` after adding or replacing question art. Portrait sources are rejected: question compositions must be generated as native landscape artwork rather than recovered with a crop.
- The base background of every PNG in `opening-image/`, `Pastries-personalities/`, and `scene-art/` is normalized to exact `#FEF2E1`. Run `npm run assets:recolor-backgrounds -- --apply` after adding replacement source art, then rebuild derivatives with `npm run assets:phase4`.
- Do not restore or consume files from `old images/` unless the user explicitly asks for rollback/reference comparison.
- The active character PNGs have full cream backgrounds, not transparency. Phase 4 deliberately retains them as full-bleed card art in optimized 900×900 result WebPs and 360×360 gallery thumbnails; do not treat them as transparent cutouts.
- Keep source order separate from runtime preload order. Runtime should eagerly load only the current critical scene, then idle-preload result assets after Q1.
- No active replacement for `asset-pattern.png` is present outside the archive. Continue with the existing CSS/grain treatment unless a new pattern is supplied or explicitly selected.
- Rebuild and verify all current derivatives with `npm run assets:phase4` followed by `npm run assets:audit -- --strict`.
