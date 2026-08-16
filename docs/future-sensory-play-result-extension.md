# Future concept: sensory play after the Result story

**Status:** Parked for future product development. This concept is not part of the current runtime,
JSON database, asset pipeline, or QA contract.

## Decision record

On 2026-08-16, Ardy decided that the idea is promising but not yet appropriate for the current
product stage. Ardy and his wife will continue developing the core product first. The experiment was
removed from production code and retained here so it can be reconsidered without carrying inactive
implementation debt.

## Product intent

The extension should bridge a parent's personality story into one small shared activity. It must
feel like an optional invitation, never homework, a parenting score, or a 30 day challenge.

The parent remains the emotional starting point:

1. Let the full daily-life story be read first.
2. Summarize the parent-first takeaways and small weekly actions.
3. Only then offer one activity when the parent has enough time and energy.
4. Close with explicit permission to skip it without guilt.

Suggested closing line:

> Gak main hari ini? Kamu tetap cukup.

## First candidate

**Activity:** Bayangan & Senter  
**Source:** `D:\#Projects\Parenteers\LP Assets\30 Resep Sensory Play\31.jpg`  
**Booklet page:** 30  
**Suggested age:** 18 to 24 months  
**Materials:** one flashlight, one toy, and an empty wall  
**Safety:** never point the flashlight into the child's eyes

This candidate works well because preparation is light, cleanup is almost zero, and the activity
creates a natural parent-child conversation. It also has a clear visual identity, a parent and child
making a dinosaur shadow in a darker room.

## Suggested presentation

Place one full-width section after `parentSupport` and before the legacy personality details. Treat
it as a quiet night pocket, using the brand blue as the background, cream text, warm metadata pills,
and one 16:9 illustration. Do not turn it into a carousel or a second product shelf.

Suggested content order:

1. Gentle invitation, for example, "Kalau hari ini masih ada sedikit ruang."
2. Framing, "Satu permainan kecil, bukan tantangan 30 hari."
3. Permission-based introduction.
4. Illustration.
5. Age and effort metadata.
6. Activity title and one short instruction.
7. Materials and safety line.
8. One CTA to the relevant Parenteers product or activity page.
9. Closing permission to skip.

## Proposed future data contract

If this returns, keep all visible copy in a bundled bilingual JSON record rather than hardcoding it
in the Result scene. Useful fields:

```json
{
  "id": "shadows-flashlight",
  "sourcePage": 30,
  "image": "/sensory-play/bayangan-senter.webp",
  "imageAlt": { "id": "...", "en": "..." },
  "sectionLabel": { "id": "...", "en": "..." },
  "sectionTitle": { "id": "...", "en": "..." },
  "sectionBody": { "id": "...", "en": "..." },
  "age": { "id": "...", "en": "..." },
  "effort": { "id": "...", "en": "..." },
  "title": { "id": "Bayangan & Senter", "en": "Shadows & Flashlight" },
  "description": { "id": "...", "en": "..." },
  "materials": { "id": "...", "en": "..." },
  "safety": { "id": "...", "en": "..." },
  "cta": { "id": "...", "en": "..." },
  "permission": { "id": "Gak main hari ini? Kamu tetap cukup.", "en": "..." }
}
```

## Guardrails before reactivation

- Review activity age, setup, supervision, choking, lighting, allergy, and material risks.
- Decide whether the recommendation is universal, age-filtered, or personality-specific.
- Do not imply that completing an activity makes someone a better parent.
- Do not import all 30 booklet pages automatically. Curate each activity editorially.
- Keep the activity optional and subordinate to the parent-first narrative.
- Confirm the CTA destination and the business role of the activity.
- Validate Indonesian and English copy independently.
- Recheck the full Result length on a physical Samsung device and in the Instagram in-app browser.

## Future acceptance criteria

- The extension is approved by both product owners.
- One activity has completed editorial and safety review.
- Runtime image is an intentional optimized derivative, with readable native HTML around it.
- The save/share dock remains available after the first scroll, and bottom spacing keeps final lines reachable.
- Normal and reduced-motion QA pass at 390x844.
- The activity can be skipped without breaking the Result flow or creating guilt.
