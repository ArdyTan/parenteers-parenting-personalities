# Parenting Bakes — Asset Intake and Order

**Status:** scanned, reconciled, and implemented for Phase 4 on 2026-07-29.

This file is authoritative for the source-art inventory, folder roles, and image order. Runtime filenames and the 16-type registry remain authoritative in `data-spec.md`.

## Folder roles

| Folder | Role | Runtime status |
|---|---|---|
| `Interface-Reference/` | Portrait UI composition references for Phase 4 | Reference only; never bundled |
| `opening-image/` | Ordered opening/landing artwork variants | Four 540×960 WebPs in `public/opening/` |
| `scene-art/` | Phase 4.5 text-free question and checkpoint source illustrations | Twelve 720×480 question WebPs and two 600×900 checkpoint WebPs in `public/art/scenes/` |
| `Pastries-personalities/` | Active 16-character source set | Full-bleed 900×900 result WebPs plus 360×360 shelf WebPs in `public/characters/` |
| `web-component/` | Supporting 404 art and preloader motion reference | 404 derivative in `public/art/`; MP4 retained as reference-only |
| `old images/` | Superseded first delivery plus the archived image-prompt document | Archive only; never use as the active source |

## 1. Interface reference order

Use this order when reviewing or implementing the Phase 4 visual flow:

1. `reference-start.png`
2. `reference-question.png`
3. `reference-section-chekpoint.png`
4. `reference-result-main-1.png`
5. `reference-result-main-2.png`
6. `reference-result-detailed.png`

All six files are 941×1672 portrait PNGs. `reference-result-main-1.png` and `reference-result-main-2.png` are two personality examples of the same main-result template, not two consecutive result scenes. The references control visual direction and hierarchy; content still comes from the bilingual JSON/copy sources.

**Phase 4.5 clarification (2026-07-30):** the references are direct composition targets, not merely loose inspiration. Landing, questions, Q6/Q9 checkpoints, and the main result should reproduce their hierarchy and art-led warmth with real responsive DOM. Cute bakery illustration should remain present across every primary interface. Never bundle the reference screenshots themselves because their UI and localized text are baked in; use standalone source art and real ID/EN controls/copy.

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
`checkpoint-q9-nearly-baked.png`. Runtime order and paths are controlled by
`src/data/scene-art.json`. The generated sources contain no interface text,
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
- `Preloader2.mp4` — 10-second, 1.76 MB preloader motion reference; added 2026-07-29.

The MP4 duration and file integrity were verified. Frame-level visual inspection was not completed during intake because the local headless browser did not decode the file reliably. Inspect playback before using it as Phase 4 implementation authority.

Phase 4 intentionally implements the preloader in lightweight DOM/CSS/GSAP rather than shipping the 1.76 MB MP4. This preserves the 45→180°C reference idea, real loading progress, interruptible exit, and a static reduced-motion path without adding a video decode dependency.

## Production rules

- Do not import directly from `images/`; production derivatives belong under `public/`.
- Do not restore or consume files from `old images/` unless the user explicitly asks for rollback/reference comparison.
- The active character PNGs have full cream backgrounds, not transparency. Phase 4 deliberately retains them as full-bleed card art in optimized 900×900 result WebPs and 360×360 gallery thumbnails; do not treat them as transparent cutouts.
- Keep source order separate from runtime preload order. Runtime should eagerly load only the current critical scene, then idle-preload result assets after Q1.
- No active replacement for `asset-pattern.png` is present outside the archive. Continue with the existing CSS/grain treatment unless a new pattern is supplied or explicitly selected.
- Rebuild and verify all current derivatives with `npm run assets:phase4` followed by `npm run assets:audit -- --strict`.
