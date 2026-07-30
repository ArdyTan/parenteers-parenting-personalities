# Quiz Web App — AI Image Generation Prompts
**Project:** Parenteers Parenting Bakes Quiz (working title)
**File 3 of 3** · Companions: `quiz-01-flow-dialogue.md` · `quiz-02-ui-strings.md`
**Status:** v1.0 — concept prompt + 16 character prompts + supporting assets

---

## 1. Art Direction Concept

**Goal:** 16 bake characters that read as one family — same world, same lighting, same cuteness level — so any two look right side by side on an IG story.

**Style pillars:**
- Soft, rounded, plush shapes — everything looks huggable
- Warm bakery palette on a cream background (suggested hexes below; align with Parenteers design direction before final render)
- Subtle kawaii face: simple dot eyes + tiny smile — expressive but classy, never clipart-childish
- Flat illustration with soft airbrushed shading, consistent thin outline (or no outline — pick once, keep for all 16)
- Sticker-style: character centered, generous negative space, no background scene
- Zero text inside the image (all text lives in the UI/card layer)

**Suggested palette (pending design-direction alignment):**
- Cream background `#FFF6EC` · Warm brown `#8B5E3C` · Butter yellow `#F4D58D` · Blush `#F6C6B8` · Sage `#BBC9A8` · Cocoa accent `#5C4033`

**Face toggle:** prompts below include the face. For an elegant faceless variant, delete the phrase "subtle happy kawaii face with simple dot eyes and a tiny smile" from the master prompt.

**IP note:** all characters are original food mascots — no references to existing brand characters, no artist names in prompts.

---

## 2. Master Style Prompt (the {STYLE} block)

Paste this at the END of every character prompt:

```
cute plush mascot character illustration, soft rounded shapes, subtle happy kawaii face with simple dot eyes and a tiny smile, flat illustration with soft airbrushed shading, warm pastel bakery palette with warm browns and butter yellow, isolated on a plain warm cream background, centered composition, generous negative space, sticker style, consistent character design system, soft even lighting, no text, no watermark, high resolution
```

**Negative prompt (for tools that support it):**
```
text, letters, watermark, logo, photorealistic, 3D render, human, hands, realistic food photography, cluttered background, harsh shadows, gradient background
```

**Consistency workflow (important):**
1. Generate character #1 (Croquembouche) first. Iterate until the style is approved.
2. Use that approved image as the **style/character reference** for the remaining 15 (Midjourney `--sref`, or image-reference / img2img at low strength in other tools). Keep the same seed where the tool allows.
3. Batch in one session, same settings, to minimize drift.
4. Generate at 1:1 first (master asset), then adapt for story format (see §5).

**Fully expanded example (Type 1), so the final form is clear:**
```
a tall croquembouche tower of small round cream puffs stacked into a cone, glossy golden caramel threads spun around it, one tiny paper party flag on top, proud confident smile, tiny sparkles floating nearby, cute plush mascot character illustration, soft rounded shapes, subtle happy kawaii face with simple dot eyes and a tiny smile, flat illustration with soft airbrushed shading, warm pastel bakery palette with warm browns and butter yellow, isolated on a plain warm cream background, centered composition, generous negative space, sticker style, consistent character design system, soft even lighting, no text, no watermark, high resolution
```

---

## 3. The 16 Character Prompts

Format: `{character-specific description}` + `{STYLE}`. Each specific line encodes the type's personality through pose and props.

**1 · PCTE — The Croquembouche** (grand, celebratory, brave)
```
a tall croquembouche tower of small round cream puffs stacked into a cone, glossy golden caramel threads spun around it, one tiny paper party flag on top, proud confident smile, tiny sparkles floating nearby, {STYLE}
```

**2 · PCTN — The Lapis Legit** (patient, layered, warm tradition)
```
a neat upright slice of Indonesian lapis legit cake showing many thin golden-brown layers, a soft curl of steam rising, serene content smile, one small star anise resting beside it, {STYLE}
```

**3 · PCDE — The Baguette** (decisive, practical, travel-ready)
```
a crisp golden French baguette with diagonal scores, leaning slightly forward as if mid-stride, a tiny rolled paper map tucked at its side, determined friendly smile, {STYLE}
```

**4 · PCDN — The Milk Bread** (soft structure, cozy caretaker)
```
a fluffy square milk bread loaf with three soft rounded top bumps, pillowy texture, holding a tiny folded pastel blanket, gentle sleepy smile with blush cheeks, {STYLE}
```

**5 · PGTE — The Cronut** (playful experimenter, remix energy)
```
a cronut pastry with visible flaky croissant layers in a round donut shape, pastel pink glaze dripping playfully on one side, a few minimal colorful sprinkles, wide curious excited eyes and an open happy smile, {STYLE}
```

**6 · PGTN — The Pandan Chiffon** (light, gentle, attuned)
```
a tall airy ring-shaped pandan chiffon cake in soft sage green, floating slightly above the ground with tiny gentle motion lines, one pandan leaf resting beside it, calm dreamy smile with closed relaxed eyes, {STYLE}
```

**7 · PGDE — The Pretzel** (hands-on, playful, mess-friendly)
```
a golden twisted pretzel sprinkled with coarse salt, caught mid-hop with small motion lines and two tiny water splash droplets like puddle jumping, big playful grin, {STYLE}
```

**8 · PGDN — The Muffin** (reliable frame, child picks the mix-ins)
```
a classic domed muffin in a fluted paper liner, three tiny bowls arranged in front of it holding blueberries, chocolate chips, and banana slices, relaxed easygoing smile, {STYLE}
```

**9 · FCTE — The Molten Lava Cake** (spontaneous, deep feelings)
```
a round molten chocolate lava cake with glossy chocolate flowing from its center, one tiny heart-shaped molten drip, a small warm spark symbol floating above, bold warm smile, {STYLE}
```

**10 · FCTN — The Cinnamon Roll** (slow mornings, hug-first)
```
a swirled cinnamon roll with soft white icing drizzle, a heart-shaped wisp of steam rising from its top, a tiny mug beside it, cozy content sleepy smile, {STYLE}
```

**11 · FCDE — The Bagel** (resilient, no-fuss, action-first)
```
a golden sesame bagel wearing a tiny rolled fabric sweatband, standing in a steady grounded pose, easy confident grin with one winking eye, {STYLE}
```

**12 · FCDN — The Banana Bread** (improvised comfort, homey)
```
a rustic banana bread loaf with one cut slice showing banana pieces inside, a single banana leaning against it, a small checkered cloth underneath, warm homey smile, {STYLE}
```

**13 · FGTE — The Pavlova** (celebration, sparkle-follower)
```
a cloud-like pavlova meringue with crisp swirled edges, topped with colorful fruit pieces like confetti in kiwi green, strawberry red and passionfruit yellow, tiny confetti dots floating around, joyful open-mouth smile, {STYLE}
```

**14 · FGTN — The Tiramisu** (deep listener, gentle pace)
```
a tiramisu in a small glass cup with visible soft cream and coffee-soaked layers, dusted cocoa on top, leaning gently to one side as if listening, a tiny espresso cup beside it, kind gentle smile with softly closed eyes, {STYLE}
```

**15 · FGDE — The Focaccia** (relaxed, outdoorsy, learn-by-doing)
```
a rustic rectangular focaccia slab with fingertip dimples, small rosemary sprigs and cherry tomato halves pressed on top, a light olive oil sheen, lying back in a relaxed lounging angle, laid-back happy smile, {STYLE}
```

**16 · FGDN — The Bolu Kukus** (quiet trust, blooms on its own)
```
an Indonesian bolu kukus steamed cupcake with its signature blooming four-petal split top in soft pink and pandan green, sitting in a simple paper cup, tiny steam curls rising, a few small flower petals nearby, gentle proud smile, {STYLE}
```

---

## 4. Supporting Asset Prompts

**Landing hero — bakery lineup**
Recommended approach: do NOT generate a group scene (multi-character generations drift off-model). Instead, compose the hero in Canva/Figma from the 16 individual PNGs (background-removed). If a generated hero is still wanted:
```
a cozy flat-lay arrangement of assorted cute pastries and breads on a warm cream surface, seen from above, soft plush mascot style, no faces, evenly spaced, {STYLE}
```

**Loading page illustration**
```
a pastel mixing bowl with a wooden spoon stirring soft dough, a small puff of flour floating above, two tiny sparkles, {STYLE}
```

**Share-card background texture**
```
a very subtle seamless pattern of tiny minimalist bread, pastry and cake outlines, extremely low contrast tone-on-tone on warm cream, delicate and airy, no faces, {STYLE}
```

**404 / error illustration**
```
a single cookie with one playful bite taken out of it, a few crumbs beside it, sheepish tiny smile, {STYLE}
```

**OG / social preview base**
Compose in Canva: cream background + 3 hero characters (Croquembouche, Cinnamon Roll, Bolu Kukus) + title text layer. No dedicated generation needed.

---

## 5. Technical Specs & File Conventions

- **Master render:** 2048×2048, 1:1, plain cream background. All other crops derive from this.
- **Result card (feed/share):** 1080×1350 (4:5). **IG Story:** 1080×1920 (9:16) — character sits in the upper 60%, text layer below (built in the app/Canva, not generated).
- **Background removal:** request "isolated on a plain warm cream background," then remove background for transparent PNGs used in UI.
- **File naming:** `{code}-{bake}.png` → `pcte-croquembouche.png`, `fgdn-bolu-kukus.png` … plus `asset-loading.png`, `asset-404.png`, `asset-pattern.png`.
- **Aspect-ratio parameters:** Midjourney `--ar 1:1` (add `--sref {approved-image-url}` from step 2 of the consistency workflow); other tools: set 1:1 in settings and reuse the approved image as reference.
- **Alt-text pattern (a11y, both languages in File 2):** "Cute illustration of {bake}, the {Type Name} parenting-type mascot."

## 6. QA Checklist Before Approving the Set
1. Line weight, face size, and shading style identical across all 16
2. Every character reads clearly at 200px wide (story-sticker size)
3. Palette stays within the approved swatches — no rogue neons
4. Indonesian bakes (lapis legit, pandan chiffon, bolu kukus) are recognizable to the local audience
5. No text, no watermarks, no accidental brand lookalikes
6. Side-by-side test: place any 4 characters in a row — do they look like one family?
