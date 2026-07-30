# Phase 4.5 — Art-led Interface Realignment

**Status:** implemented locally 2026-07-30; physical Samsung and Instagram in-app-browser visual sign-off remains.

## Direction

The ordered files in `images/Interface-Reference/` are composition authority for this pass:

1. Landing → `reference-start.png`
2. Question template → `reference-question.png`
3. Checkpoints after Q6/Q9 → `reference-section-chekpoint.png`
4. Main result reveal → `reference-result-main-1.png` and `reference-result-main-2.png`

The user’s binding visual principle is that every primary interface should contain warm, cute bakery illustration. Art is not a detached thumbnail or decorative afterthought; it participates in the hierarchy and emotional pacing of the page.

Copy, scoring, randomized answer/pole binding, language behavior, gestures, persistence, accessibility, and the Phase 4 motion lifecycle remain unchanged unless this document explicitly says otherwise.

“Ending” is interpreted as the main result route (`/r/{slug}`), because the supplied references are result templates. The final `/end` route also receives illustration in the continuity pass so the experience does not become visually empty after the result.

## What the references establish

- Warm cream editorial canvas with brand blue as the readable anchor and orange/lavender as highlights.
- Full Parenteers wordmark plus a compact ID/EN switch in shared chrome.
- Large, left-led display typography and generous negative space.
- Illustration occupying roughly one-third to one-half of the first visual composition.
- Character art integrated into the page, with props bleeding toward edges; avoid framed “image cards” unless the reference uses a functional content panel.
- Rounded white/lavender surfaces, very soft shadows, small hearts/stars/flour marks, and bold blue pill CTAs in the thumb zone.
- Motion should amplify the illustration (gentle proofing, parallax, flour punctuation), not make the layout feel like a technical demo.

## Current gaps

| Surface | Current implementation | Phase 4.5 correction |
|---|---|---|
| Shared chrome | Small circular mark, “Bahasa” label, compact toggle | Full wordmark at left; ID/EN pill only at right; retain accessible labels |
| Landing | Copy plus a rotating picture inside a bordered card | Reference-led editorial order; one large integrated cast scene; metadata panel and CTA below |
| Questions | Strong functional cards, but no illustration and a generic progress bar | Add contextual scenario vignette, oven-rail progress, circular back/close controls, selected check medallion, edge props |
| Checkpoints | Temperature and text inside an empty centered card | Poster-like composition with progress pill, large headline, dominant dough/bakery illustration, reassurance panel, CTA |
| Main result | Character exists but is a relatively small framed square above identity | Identity first, oversized integrated character art, tagline, scroll cue, then detailed cards |
| Intro/calculating/end | Mostly typography and functional controls | Add illustration so the cute visual promise persists between the four primary reference surfaces |
| Gallery/story/404 | Already illustration-led | Retain; align chrome, cream canvas, radii, shadows, and decorative marks |

## Asset plan

### Reuse now

- `opening-image/var-1.png`: primary landing cast.
- `opening-image/var-2.png`: intro/onboarding cast.
- `opening-image/var-3.png`: calculating or late-quiz continuity art.
- `opening-image/var-4.png`: final `/end` cast.
- `Pastries-personalities/`: main result, Story, gallery, and result-detail art.
- `web-component/asset-404.png`: 404.

### Create for Phase 4.5

The reference screenshots contain baked-in UI and localized text, so they must not be cropped or bundled as runtime art. Create standalone, text-free illustrations in the same watercolor bakery language:

- 12 question vignettes, one per scenario:
  1. quiet Sunday morning;
  2. packing for a family day out;
  3. child’s daily schedule;
  4. choosing a play activity;
  5. superhero costume and rain boots at a family lunch;
  6. tidying toys;
  7. mall meltdown;
  8. collapsed block tower;
  9. sad bedtime;
  10. tall playground slide;
  11. puddles after rain;
  12. meeting new children at a party.
- 2 checkpoint illustrations: dough becoming smooth at Q6 and bread nearly baked at Q9.

Art requirements:

- no embedded text, logo, answer letters, or interface controls;
- depict the scenario without favoring either answer/pole;
- consistent recurring bakery cast, cream background, blue/lavender props, orange accents;
- safe negative space for responsive copy;
- runtime WebP target: 640–720px long edge, normally ≤60 KB;
- only the current scene art loads eagerly.

Add a bundled `scene-art.json` manifest so question/checkpoint art paths are data-controlled rather than hardcoded in scene components.

## Implementation order

### 1. Shared art-directed shell

Files: `src/app.ts`, `src/styles/scenes.css`, `src/styles/motion.css`, tokens if needed.

- Replace the circular persistent mark with the full wordmark.
- Remove the visible “Bahasa” label but preserve its ARIA name.
- Establish a warm cream scene surface while keeping the approved deep-blue contrast pair.
- Add reusable doodle/prop layers, large-art slots, reference radii, shadows, and bottom CTA treatment.
- Keep the desktop gate functional; give it cast art so the first desktop impression also feels playful.

### 2. Landing

Files: `src/scenes/landing.ts`, asset processor, scene CSS.

- Reorder to: wordmark/toggle → time pill → headline → supporting copy → integrated `var-1` cast → three-fact panel → primary CTA → trust note.
- Remove the small bordered carousel presentation.
- Keep motion by using a restrained entrance/parallax on the single cast; do not cycle four competing hero images.
- Reassign `var-2`–`var-4` to later interfaces rather than discarding them.

### 3. Question template

Files: `src/scenes/question.ts`, `scene-art.json`, validation/types, scene CSS.

- Preserve the real `<progress>` semantics but render a 12-stop oven rail around/alongside it.
- Use circular icon buttons for back and close with existing accessible labels.
- Place scenario art between the prompt/hint and answers, sized as a genuine visual beat.
- Add small neutral prop/doodle accents without embedding meaning into answer A/B.
- Preserve randomized answer order, swipe selection, FLIP, haptics, change-answer, and next.
- Selected state gains the reference-style blue/lavender glow and check medallion.

### 4. Q6/Q9 checkpoints

Files: `src/scenes/interstitial.ts`, `scene-art.json`, scene CSS.

- Use a progress pill, oversized existing checkpoint message, dominant checkpoint illustration, small reassurance surface, and full-width CTA.
- Q6 and Q9 use distinct art.
- Do not invent or hardcode new bilingual copy; any desired new reassurance sentence must first be added to the source UI-string table and both translation registries.

### 5. Main result reveal

Files: `src/scenes/result.ts`, scene CSS/motion.

- Reorder hero to: intro/name → personality code pill → oversized character image → tagline → scroll cue.
- Remove the framed avatar treatment; match the opaque cream artwork to the scene surface so it reads as one composition.
- Keep confetti, tilt, and scroll choreography but reduce tilt if it makes the watercolor art feel like a card.
- Detailed superpowers/watchout/activities remain below the fold in soft editorial panels.
- Add a localized scroll-hint key only through the authoritative UI-string/i18n workflow.

### 6. Illustration continuity pass

- Intro: use `var-2` as an onboarding cast.
- Calculating: combine the existing oven gauge with `var-3` or a small neutral baking illustration.
- Final `/end`: use `var-4` before founder note/actions.
- Preloader: add a lightweight character/oven visual without shipping the MP4.
- Gallery, Story, and 404: align shared chrome and surface styling; retain their existing imagery.

## Validation and acceptance

- Side-by-side screenshots against all four named references at 390×844.
- ID and EN both preserve hierarchy with no clipped display text.
- Every primary route has meaningful illustration: preloader/gate, landing, intro, all 12 questions, Q6/Q9 checkpoints, calculating, result, Story, gallery, end, and 404.
- No reference screenshot is bundled as runtime UI.
- Question art never reveals or favors an answer/pole.
- Current-scene image payload stays within the ≤300 KB screen budget.
- No horizontal overflow; CTA remains reachable; safe areas hold on the Samsung A55 and S25 FE.
- Reduced motion keeps static art and all controls while removing parallax/choreography.
- Existing test suite, typecheck, strict asset audit, production build, and real-browser flow all pass.
