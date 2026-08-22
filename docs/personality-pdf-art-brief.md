# PDF booklet art brief — handover for GPT Image 2

**Status:** ready to generate, 2026-08-22. This is the copy-paste handover for the **54 illustrations**
the personality booklet reserves. Every slot currently prints as a dashed frame reading *"Ilustrasi
menyusul"*, so the booklet ships and improves rather than waiting on art.

Structure, page order and the data contract live in `docs/personality-pdf-plan.md`. This file is only
about making the pictures.

---

## 1. What is being generated

| Group | Count | Filename pattern | Appears |
|---|---|---|---|
| Parent-care activities | 25 | `care/{id}.png` | Booklet pages 10–11, one per activity |
| Child activities | 20 | `play/{id}.png` | Booklet pages 13–15, one per activity |
| Page furniture | 9 | `furniture/f{n}.png` | Booklet pages 2, 4, 5, 6, 7, 8, 12, 15, 16 |

The `{id}` values are the record ids in `src/data/parent-care.json` and
`src/data/child-activities.json` — they must match exactly, because the booklet looks them up by id.

Two images per type already exist and are **not** part of this job: the character WebP on the cover
and the story WebP on page 3.

---

## 2. The model

`gpt-image-2`, OpenAI, released 2026-04-21. What matters here:

- Standard sizes are **1024×1024, 1536×1024, 1024×1536**; larger custom sizes go to 4096×4096.
- **Width and height must each be divisible by 16**, and the aspect ratio must sit between 1:3 and 3:1.
- Up to **10 images per request** — batch a whole group in one call.
- Up to **16 reference images per call**, which is how the style gets anchored (§3).

Sizes below are chosen to be legal on the first try. Do not "improve" them to round numbers like
1200×600; 600 is not divisible by 16 and the request fails.

---

## 3. Anchor the style with reference images

Do not describe the style from scratch and hope. Attach these two files as reference images on
**every** call:

```
public/story-illustrations/pcte-story.webp     ← scene handling, light, palette, paper grain
public/characters/pcte-croquembouche.webp      ← rendering of objects, edge quality, cream ground
```

Then say, in the prompt: *"Match the illustration style, palette, light and paper texture of the
reference images. Do not copy their subjects or characters."*

If the first batch drifts, add one approved output from that batch as a third reference and rerun —
consistency across 54 pieces matters more than any single image being perfect.

---

## 4. The style block — paste this into every prompt

> Soft watercolour and gouache children's-book illustration on a warm cream ground (#F7EEE0). No
> hard outlines. Visible gentle paper grain. Soft ochre and honey light with dusty-blue and
> terracotta accents. A cozy Indonesian home, rendered warm and slightly wobbly rather than
> photo-real. Calm, unhurried composition with generous negative space. Match the illustration
> style, palette, light and paper texture of the reference images; do not copy their subjects.

---

## 5. Hard rules

1. **No people.** No hands, no arms, no faces, no silhouettes.
2. **No characters.** No pastries with faces, no animals acting as people. The 16 pastry characters
   differ per personality and this art is shared across all 32 booklets — a character in a shared
   frame would cost 16× and would contradict the reader's own type.
3. **No text, letters, numbers, logos or signage** anywhere in the image, including on packaging,
   calendars, book spines or labels. Written detail is the most common failure mode of this model —
   check every output for it.
4. **Objects and rooms only.** This is the honest visual language for a Montessori "prepared
   environment" anyway, so the constraint and the method agree.
5. **Centre the subject.** Print frames crop from the centre (see §6), so keep the meaningful part
   inside the middle horizontal band and leave the edges quiet.
6. **Nothing unsafe on camera.** No open flame, no knives, no water deeper than a shallow bowl, no
   cords near where a child would be. The booklet's safety lines and its pictures must not disagree.

---

## 6. Sizes

| Frame | Where | Generate at | Printed as | Note |
|---|---|---|---|---|
| Wide band | Furniture on pages 4, 5, 8, 12, 15, 16 | **1536×1024** (3:2) | ~174mm wide, 56–116mm tall | Crops from the centre; keep the top and bottom eighths quiet |
| Slim band | Furniture on pages 2, 6, 7 | **1536×768** (2:1) | ~174mm wide, 34–87mm tall | Same centre crop, tighter |
| Activity tile | All 45 activity images | **1024×768** (4:3) | 34×26mm | Small in print — one clear subject, no fine detail |

Activity tiles print at roughly the size of a postage stamp. Compose them as a single object or a
tight still life, never a full room.

---

## 6b. What to actually say — paste these

Three messages. **A** once per session, **B** once per batch, **C** only when something drifts.

### A — Session opener (attach the two reference images from §3)

```
I'm generating illustrations for a printed parenting booklet. I'll send them to you in
batches; keep the style identical across every single one.

The two attached images are the style reference. Match their illustration style, palette,
light and paper texture exactly. Do not copy their subjects or their characters.

Style, for every image in this job:
Soft watercolour and gouache children's-book illustration on a warm cream ground (#F7EEE0).
No hard outlines. Visible gentle paper grain. Soft ochre and honey light with dusty-blue and
terracotta accents. A cozy Indonesian home, rendered warm and slightly wobbly rather than
photo-real. Calm, unhurried composition with generous negative space.

Hard rules, for every image in this job:
1. No people — no hands, arms, faces or silhouettes.
2. No characters — no animals or objects with faces.
3. No text, letters, numbers, logos or signage anywhere, including on calendars, book
   spines, packaging and labels.
4. Objects and rooms only.
5. Keep the subject centred with quiet edges; these get cropped to a band in print.
6. Nothing unsafe on camera: no open flame, no blades, no deep water, no loose cords.

Confirm you've got it and I'll send the first batch.
```

### B — Batch request (repeat per batch; 10 images max per request)

```
Batch [n]. Same style and same rules as before. Generate these at [SIZE], one image each:

1. [filename] — [subject]
2. [filename] — [subject]
...
```

Worked example, using the first five rows of §7.1:

```
Batch 1. Same style and same rules as before. Generate these at 1024x768, one image each:

1. care-hot-drink — A full mug on a sunlit kitchen table, steam curling upward, a folded
   cloth beside it. Nothing else in progress.
2. p-brain-dump — An open notebook covered in loose illegible handwriting marks, a pen laid
   across it, warm lamp light from the left.
3. p-one-unplanned — House keys and one pair of sandals turned at an unexpected angle by an
   open door, an unplanned side path visible beyond.
4. p-empty-hour — A paper wall calendar dense with soft abstract marks, one single block
   left clean and cream and empty.
5. f-one-anchor — One mug and spoon set out alone on an otherwise clear counter for
   tomorrow, pale dawn light.
```

**Suggested batching:** the 25 parent-care tiles and the 20 child tiles all render at
`1024x768`, so they batch cleanly in groups of ten. The furniture splits by size — `f1`, `f4`
and `f5` at `1536x768`; `f2`, `f3`, `f6`, `f7`, `f8`, `f9` at `1536x1024` — so keep those as
two separate batches. Six batches total.

### C — Correction (when one drifts)

```
Regenerate [filename] only. Same style and rules. It [went wrong how — e.g. "has writing on
the calendar", "shows a hand", "reads too dark and saturated"]. Keep everything else about it.
```

If a whole batch drifts, attach one approved image from that batch as a **third** reference and
resend — consistency across 54 pieces matters more than any single image being perfect.

---

## 7. The 54 prompts

Each line is: **filename** · size · subject. Prepend the §4 style block and append the §5 rules.

### 7.1 Parent-care tiles — 1024×768, `care/`

| File | Subject |
|---|---|
| `care-hot-drink.png` | A full mug on a sunlit kitchen table, steam curling upward, a folded cloth beside it. Nothing else in progress. |
| `p-brain-dump.png` | An open notebook covered in loose illegible handwriting marks, a pen laid across it, warm lamp light from the left. |
| `p-one-unplanned.png` | House keys and one pair of sandals turned at an unexpected angle by an open door, an unplanned side path visible beyond. |
| `p-empty-hour.png` | A paper wall calendar dense with soft abstract marks, one single block left clean and cream and empty. |
| `f-one-anchor.png` | One mug and spoon set out alone on an otherwise clear counter for tomorrow, pale dawn light. |
| `f-decide-once.png` | Seven small paper notes pegged in a neat row on a string, each carrying a simple food doodle. |
| `f-recovery-basket.png` | A woven basket on a low table holding a book, hand cream, a charger cable and a wrapped snack. |
| `c-hand-the-wheel.png` | A dining table with one empty chair pulled out at the head and a second plate already set at it. |
| `c-say-dont-know.png` | A half-written list on a table with its final line deliberately blank, pen capped and set down. |
| `c-not-my-job.png` | Three small paper slips on a windowsill under a smooth stone, their edges lifting in a breeze. |
| `g-one-for-you.png` | One favourite mug pulled forward from a shelf of identical others, caught in a shaft of light. |
| `g-practice-limit.png` | A doorway with a soft curtain half-drawn, warm light on one side and cool shade on the other. |
| `g-tend-something.png` | A watering can tipping into a potted plant on a windowsill, droplets catching the light. |
| `t-ten-quiet.png` | Headphones resting unplugged beside a phone lying face-down, still evening light. |
| `t-write-dont-say.png` | A folded sheet of paper and an unsealed envelope beside a low candle, nothing addressed. |
| `t-long-exhale.png` | An open window with a light curtain lifting outward in six soft ripples. |
| `d-sit-no-task.png` | An armchair with the cushion still dented and a closed book on the arm, nothing in progress. |
| `d-leave-one-undone.png` | One plate alone in the sink, the kitchen light off, moonlight through the window instead. |
| `d-move-for-nothing.png` | Slippers kicked apart mid-kitchen floor, a rug slightly rucked, an old radio switched on. |
| `e-old-route.png` | A familiar street corner seen from a doorway at dusk — the same warung, the same tree. |
| `e-sit-still-outside.png` | A low terrace step with a cup on it, potted plants, and a long open view; nothing moving. |
| `e-twenty-earlier.png` | A bedside table with the lamp turned low, a small clock and a book set down early. |
| `n-one-step-out.png` | A front door ajar with warm afternoon light beyond it and one pair of sandals outside. |
| `n-final-check.png` | A night hallway with one lamp still on and a bedroom door gently closed, everything at rest. |
| `n-warm-five.png` | A folded warm towel on warm tiles, steam drifting in from just out of frame. |

### 7.2 Child-activity tiles — 1024×768, `play/`

| File | Subject |
|---|---|
| `tummy-reach.png` | A soft wooden rattle resting on a firm play mat just beyond the rumpled edge of a blanket. |
| `texture-tour.png` | Five household textures as a row of small vignettes: curtain, window pane, wooden spoon, leaf, towel. |
| `treasure-basket.png` | A shallow woven basket on a rug holding a wooden spoon, a whisk, a fabric scrap, a brush, a pine cone and a silicone cup. |
| `peekaboo-scarf.png` | A light scarf caught mid-air, half-lifted above a cushion, soft window light behind it. |
| `post-the-lids.png` | A cardboard box with one round hole cut in its lid, jar lids and wooden rings scattered beside it. |
| `sponge-transfer.png` | Two shallow bowls on a folded towel, one sponge dripping in the gap between them. |
| `tape-line.png` | A masking-tape line curving across a wooden floor, a small pair of socks at its start. |
| `laundry-hand-off.png` | A laundry basket half-loaded with folded clothes, one small sock on the floor beside it. |
| `pouring-jug.png` | A small jug mid-pour over two cups on a wooden tray, a folded cloth waiting at the edge. |
| `wash-one-cup.png` | A low washing station: a bowl of water, a small sponge, one cup, a folded towel and a wooden stool. |
| `sort-your-way.png` | Large buttons, bottle caps, spoons and blocks spread on a floor between two empty bowls, grouped by no obvious rule. |
| `calm-basket-together.png` | A basket holding a soft toy, a child's crayon drawing, a squeeze ball and a folded blanket. |
| `special-play-time.png` | A simple room corner set with paper, crayons, a doll, blocks and cars; a small clock nearby; a phone left face-down outside the doorway. |
| `draw-and-reflect.png` | A child's crayon drawing in progress with crayons scattered around it, no adult marks anywhere on the page. |
| `pretend-kitchen.png` | Toy pots, cups and spoons arranged as a tiny restaurant table setting. |
| `wash-the-toys.png` | A basin of soapy water with washable toys and a soft brush, a towel spread beside it. |
| `treasure-map.png` | A child's crayon map of a house marked with an X, one small object waiting beside it. |
| `obstacle-course.png` | Cushions, a chair, tape and a blanket arranged as a route across a living-room floor. |
| `turn-story.png` | A bedside lamp, two pillows and an open book whose pages are blank. |
| `one-real-step.png` | A child-sized wooden spoon and a bowl on a low kitchen counter, torn lettuce beside them. |

### 7.3 Page furniture — `furniture/`

| File | Page | Size | Subject |
|---|---|---|---|
| `f1.png` | 2 — your four letters | 1536×768 | Four soft watercolour ribbons in warm ochre, terracotta, dusty blue and honey, overlapping gently. Fully abstract. |
| `f2.png` | 4 — the story continues | 1536×1024 | A quiet corner of a family home with rain on the window and one lamp on. Nobody there. |
| `f3.png` | 5 — what really happens | 1536×1024 | A kitchen at the end of a long day: everything slightly out of place, forgiving warm light. |
| `f4.png` | 6 — superpowers | 1536×768 | A soft sunburst of warm rays behind a still life of everyday parenting objects — a bag, a cup, a small shoe. |
| `f5.png` | 7 — try this week | 1536×768 | A small blank paper list pegged to a fridge door with three empty hand-drawn boxes. No writing. |
| `f6.png` | 8 — you first | 1536×1024 | An empty chair by a window with clean morning light falling across the seat. |
| `f7.png` | 12 — for your child | 1536×1024 | A low shelf with a few toys spaced neatly and generously — a prepared environment, waiting. |
| `f8.png` | 15 — end of the activities | 1536×1024 | A room at rest after play: cushions back on the sofa, one toy left out on purpose, late soft light. |
| `f9.png` | 16 — closing | 1536×1024 | A bakery-warm still life: a folded booklet, a mug, and a doorway of light beyond. |

---

## 8. Where the files go

```
images/pdf-art/care/{id}.png          ← the delivered source, committed
images/pdf-art/play/{id}.png
images/pdf-art/furniture/f{n}.png
```

Then two steps, in order:

1. A derivative pass resizes to 1240px wide WebP into `public/pdf-art/**` — the same source →
   derivative boundary every other asset in this project uses. The script for this is **not written
   yet**; it is the first task once art lands.
2. Set the `image` field on each record in `parent-care.json` / `child-activities.json` from `""` to
   its `/pdf-art/...` path, and point the furniture frames at theirs. `npm run assets:pdf` then picks
   them up with no template change — the frames are already sized and positioned.

Do not skip straight to `public/`. The source PNG is what gets re-derived if the print size ever
changes.

---

## 9. QC before accepting a batch

- [ ] No people, hands, faces or characters in any frame.
- [ ] **No text, numbers or logos** — check calendars, book spines, packaging and labels especially.
- [ ] Cream ground reads as the same family as `public/story-illustrations/pcte-story.webp`.
- [ ] Subject sits in the centre band; edges are quiet enough to crop.
- [ ] Activity tiles still read at 34mm wide — squint at them at that size before accepting.
- [ ] Nothing depicted contradicts a safety line: no deep water, flame, blades or loose cords.
- [ ] Filenames match record ids exactly, including hyphens.
