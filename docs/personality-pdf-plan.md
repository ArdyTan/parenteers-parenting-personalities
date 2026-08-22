# Personality PDF booklet — plan

**Status:** specified 2026-08-22, not yet built. This document is authoritative for the per-type
downloadable PDF: its research basis, page structure, content model, activity libraries, image
prompt set, generation pipeline and QA contract. `plan.md` §13 carries the phase row; `progress.md`
carries current status.

**What it is:** a 16-page A4 illustrated booklet, one per personality per language (32 files), built
from the existing `types.json` content plus two new activity registries, downloadable from the
Result. It is the first surface in this project that leaves the phone — it is meant to be kept,
re-read and printed.

---

## 1. Decisions locked (2026-08-22 session with Ardy)

| Decision | Choice |
|---|---|
| Depth | Full profile **plus** 5 parent-recovery activities and 5 child activities (ages 0–5) |
| Child-activity source | **Written fresh, grounded in Montessori and play-therapy method** (not curated from the 30 Resep Sensory Play booklet) |
| Languages | Separate ID and EN files — `public/pdf/{lang}/{slug}.pdf`, 32 files |
| Art budget | **Per-activity illustration** — 45 activity tiles + 9 page-furniture bands = **54 new pieces** |
| Art pipeline | Claude writes the prompt set; **Ardy generates with `gpt-image-2`**. Handover: `docs/personality-pdf-art-brief.md` |
| Weight | ~1 MB per PDF, print quality (1240px, q78, ≈150 DPI at A4) — ≈30 MB total |
| Button placement | Its own Result section only. A dock link shipped on 2026-08-22 and was **removed the same day** at Ardy's direction — the dock stays one primary action |
| In-app browser | Plain `href` to the real `.pdf`, `target="_blank"`, **no** `download` attribute, toast fallback offering copy-link |

Decisions this closes elsewhere: page 16 finally re-homes `footer.made_by`, `footer.copyright`,
`footer.disclaimer` and the "Follow @parenteers" CTA, all orphaned when `/end` was removed on
2026-08-02. It also gives the parked `docs/future-sensory-play-result-extension.md` concept a home
that cannot lengthen the Result scroll — the objection that parked it.

---

## 2. Research foundation

The child section is not invented play. Every activity carries a `method` tag pointing at one of
four evidence bases, and the booklet says so in plain language without overclaiming (the
copy-honesty invariant applies here exactly as it does on the Result).

### 2.1 Filial therapy / CPRT — "Special Play Time"
Bratton, Landreth & Bennett's parent handout for Child-Parent Relationship Therapy, the
evidence-based 10-session filial model, is the spine of the 3y+ activities. Its rules, near-verbatim:

- A weekly 1-on-1 playtime, **20–30 minutes**, at a consistent time and place, chosen for when the
  parent is calm and the child is neither tired nor hungry.
- **The child leads; the parent follows.** "This is not a time to teach or ask questions or provide
  your opinion." Teaching puts the parent in charge and removes the child's sense of control.
- Simple non-mechanical toys — art materials, a baby doll, animals, cars, blocks, a play phone.
- **Describe what you see** ("You're giving the baby a bottle").
- **Reflect thoughts and feelings** ("That surprised you", "You don't like how that turned out").
- **Encourage ability and effort, not correctness** ("You kept trying until you got it").
- Give a **5-minute and 1-minute warning** before the end.

CPRT's stated guideline range is children 3–9, which is why it anchors the 3–4 and 4–5 bands and
does not appear below 3.

### 2.2 Serve and return — the 0–3 spine
Harvard's Center on the Developing Child (with the FIND program) gives five steps that work from
birth, and they are what the 0–12mo and 1–2y activities actually teach:

1. **Notice the serve and share the child's focus of attention.**
2. **Return the serve by supporting and encouraging.**
3. **Give it a name.**
4. **Take turns… and wait.** — "Waiting is crucial. Children need time to form their responses."
5. **Practice endings and beginnings.** — the child signals when they are done.

### 2.3 Montessori
- **Sensitive periods** in the first plane (0–6): language (0–6), movement (0–4), order (≈18mo–3y),
  sensorial refinement (0–5), social behaviour (≈2.5–5). Activities are placed in the age band whose
  sensitive period they serve.
- **Prepared environment** — the adult prepares, then steps back. Child-sized, real tools, one
  activity at a time, everything reachable.
- **Control of error** — the activity itself shows the child what went wrong (spilled water is
  visible), so the parent does not have to correct. This is what makes the practical-life activities
  work in a booklet: the parent has nothing to grade.
- **Practical life** — pouring, transferring, washing, sorting, contributing to real household work.
- **Freedom within limits** and **follow the child** — the same posture CPRT teaches, arrived at from
  a different tradition. That convergence is the booklet's editorial through-line.
- **Treasure basket / heuristic play** (Goldschmied, ≈6–12 months) — a basket of real, non-plastic
  household objects, adult present but not directing.

### 2.4 Why play at all
AAP clinical report *The Power of Play* (Yogman, Garner, Hutchinson, Hirsh-Pasek & Golinkoff,
*Pediatrics*, 2018): developmentally appropriate play with caregivers builds executive function,
self-regulation and social-emotional skill, and buffers toxic stress. One sentence of this belongs on
page 11 — as reassurance that the small thing is the intervention, never as a performance target.

### 2.5 Safety baseline
CPSC 16 CFR §1501.4 small-parts cylinder — **2.25 in long × 1.25 in wide**. Anything that fits inside
it is a choking hazard for under-3s; the household proxy is a toilet-paper tube. Every 0–3 activity
that involves loose objects carries this test in its `safety` line, in the parent's own words.

**Sources:**
[Special Parent-Child Play Times (Bratton, Landreth & Bennett, A4PT)](https://cdn.ymaws.com/www.a4pt.org/resource/resmgr/telehealth/4_-_Special_Parent-Child_Pla.pdf) ·
[CPRT, Center for Play Therapy (UNT)](https://cpt.unt.edu/about-play-therapy/child-parent-relationship-therapy) ·
[CPRT on the California Evidence-Based Clearinghouse](https://www.cebc4cw.org/program/child-parent-relationship-therapy-cprt/) ·
[5 Steps for Brain-Building Serve and Return (Harvard CDC)](https://developingchild.harvard.edu/resources/briefs/5-steps-for-brain-building-serve-and-return/) ·
[Planes of Development and Sensitive Periods (American Montessori Society)](https://amshq.org/blog/montessori-education/2024-09-18-planes-of-development-and-sensitive-periods-part-1/) ·
[Treasure Baskets & Heuristic Play (Montessori Foundation)](https://www.montessori.org/treasure-baskets-heuristic-play/) ·
[The Power of Play (AAP, Pediatrics 2018)](https://publications.aap.org/pediatrics/article/142/3/e20182058/38649/The-Power-of-Play-A-Pediatric-Role-in-Enhancing) ·
[16 CFR Part 1501 small parts (eCFR)](https://www.ecfr.gov/current/title-16/chapter-II/subchapter-C/part-1501) ·
[Axline's eight principles (CCPT)](https://en.wikipedia.org/wiki/Virginia_Axline)

---

## 3. Page structure — 16 pages, A4 portrait (210×297mm)

Every page carries at most one image. `f{n}` refers to the furniture pieces in
`docs/personality-pdf-art-brief.md`.

| # | Page | Content source | Image |
|---|---|---|---|
| 1 | Cover | `name`, `code`, `tagline`, wordmark | character WebP *(exists)* |
| 2 | Kode kamu | 4 dimensions, the reader's four letters lit, one line each | `f1` |
| 3 | Cerita sehari-hari (1) | `parentStory.title` + paragraphs 1–2 | story WebP *(exists)* |
| 4 | Cerita sehari-hari (2) | paragraphs 3–4 | `f2` |
| 5 | Yang sering terjadi · Lepaskan rasa bersalah | `parentSupport.realLife`, `.guiltRelease` | `f3` |
| 6 | Superpower · Watch-out · Sepupu pop-culture | `superpowers[3]`, `watchout`, `popCousin` | `f4` |
| 7 | Coba minggu ini | `tryThisWeek[3]` **plus 4 from `weekly-extras.json`** — 7 checkboxes | `f5` |
| 8 | **Untuk kamu dulu** — the argument | `pdf.care_story_1..3`: why the parent comes first, what the next five pages are not | `f6` |
| 9 | **Untuk kamu dulu** — the personal read | four `pdf.drain_{letter}` lines from the code, `careForYou`, `pdf.care_howto`, permission line | — |
| 10–11 | **5 cara pulih untuk kamu** | `parent-care.json` × 5 (§6), 3 then 2 | 5 × activity tile |
| 12 | **Lalu, untuk anakmu** — opener | `parentSupport.forYourChild` + how to use this section | `f7` |
| 13–15 | **5 aktivitas bareng anak (0–5 th)** | `child-activities.json` × 5 (§7), 2 / 2 / 1 | 5 × activity tile + `f8` |
| 16 | Simpan & lanjutkan | QR to the quiz, parenteers.id CTA, `footer.made_by` / `.copyright` / `.disclaimer` | `f9` |

Parent-care pages run 3 / 2; child-activity pages run 2 / 2 / 1. A play card carries steps,
materials, a safety line and a method tag, and three of those measurably overflow A4 on every type —
the generator asserts this per page rather than trusting the layout. Each activity block is: image,
title, age band or time cost, one-line *why this one is for you*, 2–3 steps, materials, safety line
where one applies.

**Non-negotiable framing.** The child section opens with permission, not instruction. Page 15 closes
on *"Gak main hari ini? Kamu tetap cukup."* and page 9 closes on its parent-side twin, *"Gak sempat
minggu ini? Kamu tetap cukup."* No activity may imply that doing it makes someone a better parent,
and no page counts, scores or streaks anything.

## 4. Content model

Two new registries, following the `products.json` / `scene-art.json` precedent — content never lives
in the template.

```
src/data/
  parent-care.json        # 25 records: 1 universal + 24 pole-keyed
  child-activities.json   # 20 records: 4 per age band × 5 bands
  weekly-extras.json      # 16 records: 2 per pole, one-line checklist actions
```

`weekly-extras.json` exists because `types.json tryThisWeek` is validated at exactly three actions
and drives the Result page too. Rather than renegotiate that contract and author 96 new per-type
strings, the booklet's page 7 leads with those three and adds four more selected by dimension letter,
each keyed to that pole's watch-out from `parenting-personality-research.md` §3. Seven checkboxes is
a week; three was a sparse page.

```json
{ "id": "wx-p-1", "pole": "P", "action": { "id": "…", "en": "…" } }
```

### 4.1 `parent-care.json`

```json
{
  "id": "p-brain-dump",
  "pole": "P",                       // one of P F C G T D E N, or "*" for the universal
  "minutes": 5,
  "title":   { "id": "…", "en": "…" },
  "why":     { "id": "…", "en": "…" },   // one line, names the exertion this pole carries
  "how":     { "id": "…", "en": "…" },   // one or two sentences, imperative, no numbered steps
  "image":   "/pdf-art/care/p-brain-dump.webp",
  "imageAlt":{ "id": "…", "en": "…" }
}
```

### 4.2 `child-activities.json`

```json
{
  "id": "treasure-basket",
  "band": "0-12m",                   // 0-12m | 1-2y | 2-3y | 3-4y | 4-5y
  "poleAffinity": "N",               // the pole this variant is tuned for
  "method": "montessori-heuristic",  // see the method registry below
  "minutes": 15,
  "title":     { "id": "…", "en": "…" },
  "why":       { "id": "…", "en": "…" },   // what it builds, one line, no milestones language
  "steps":     { "id": ["…","…","…"], "en": ["…","…","…"] },  // 2–3 steps
  "materials": { "id": "…", "en": "…" },   // household only
  "safety":    { "id": "…", "en": "…" },   // empty string only where genuinely nothing applies
  "image":     "/pdf-art/play/treasure-basket.webp",
  "imageAlt":  { "id": "…", "en": "…" }
}
```

**Method registry** (`method` values): `serve-return`, `cprt-special-play`, `cprt-reflect`,
`montessori-practical-life`, `montessori-sensorial`, `montessori-movement`, `montessori-order`,
`montessori-heuristic`.

### 4.3 Selection — deterministic default, editorial override

Same convention as `activityTags` ("deterministic default; editorial override in types.json").

**Parent care, 5 per type:** the universal record first, then one record per dimension, matched to
the type's letter for that dimension. Where a pole has three variants, the default index is
`(position of the type in the registry) % 3`, so two types sharing a pole do not get the same five.

**Child activities, 5 per type:** one per age band, so every reader finds their child. Each band is
assigned a dimension, and the four options in that band are two poles × two variants:

| Band | Dimension that picks | Options |
|---|---|---|
| 0–12m | D4 adventure (E/N) | 2 E-leaning, 2 N-leaning |
| 1–2y | D1 structure (P/F) | 2 P-leaning, 2 F-leaning |
| 2–3y | D2 guidance (C/G) | 2 C-leaning, 2 G-leaning |
| 3–4y | D3 emotion (T/D) | 2 T-leaning, 2 D-leaning |

The adventure axis picks twice, at the two ends of the range, because E/N is the split that most
changes what a 0–1 activity and a 4–5 activity should feel like. Every dimension still selects at
least once.

| 4–5y | D4 adventure (E/N) again | 2 E-leaning, 2 N-leaning |

Override in `types.json`:

```json
"pdfSelection": {
  "parentCare": ["care-hot-drink", "p-brain-dump", "c-hand-the-wheel", "t-ten-quiet", "e-old-route"],
  "childPlay":  ["treasure-basket", "tape-line", "pouring-jug", "special-play-time", "turn-story"]
}
```

### 4.4 Validation invariants (add to `data-spec.md` §7 and the test suite)

- `parent-care.json`: exactly 25 records · unique ids · exactly one `pole: "*"` · exactly 3 records
  per each of the 8 poles · `minutes` ∈ {2, 5, 10, 15} · all localized fields non-empty in both
  languages · every `image` exists on disk.
- `child-activities.json`: exactly 20 records · unique ids · exactly 4 per band · within each band
  exactly 2 per pole of that band's dimension · `method` ∈ the method registry · `steps` length 2–3
  in both languages · `safety` non-empty for every record whose materials include loose objects,
  water, heat or cords · every `image` exists.
- `types.json`: `pdfSelection`, when present, resolves to 5 existing `parent-care` ids (one `*` plus
  one per dimension) and 5 existing `child-activities` ids (one per band).
- The deterministic default must produce a valid selection for all 16 types with no override.

---

## 5. How to read the two libraries below

Titles are given in both languages because they are the reader-facing hook. The `why` / `how` /
`steps` lines below are **English editorial specs, not final copy** — final ID and EN wording is
authored directly into the JSON in build step 1 (§11) and reviewed there, in the conversational ID
register the rest of the product uses (`yg`, `utk`, `dr`, `gak`, `sm` — never formalized).

---

## 6. `parent-care.json` — 25 records

The recovery is always the **inverse of the pole's exertion**: what a type spends itself on is what
it needs released. No record asks the parent to do anything for the child.

### Universal — every type gets this one first

| id | min | Judul (ID) | Title (EN) | Spec |
|---|---|---|---|---|
| `care-hot-drink` | 5 | Minuman yg masih panas | One drink while it's still hot | Sit down. Drink the whole thing at its actual temperature, doing nothing else. Almost nobody in this quiz has done it this week. |

### P — Planner (exertion: anticipating, holding the whole schedule in your head)

| id | min | Judul (ID) | Title (EN) | Spec |
|---|---|---|---|---|
| `p-brain-dump` | 5 | Tumpahkan isi kepala | Empty your head onto paper | Write every open loop on one sheet — no order, no priorities. Your head is holding them because it doesn't trust anything else to. Paper is enough. |
| `p-one-unplanned` | 2 | Satu hal yg gak direncanakan | One unplanned thing | Do one small thing today that was on no list. A different route, an unscheduled snack. Proof to yourself that an unplanned moment is survivable. |
| `p-empty-hour` | 15 | Blok kosong di kalender | An empty block on the calendar | Put a block in the calendar with nothing in it. Defend it like a meeting. The point is that it stays empty. |

### F — Flow (exertion: improvising every hour, deciding without a rail)

| id | min | Judul (ID) | Title (EN) | Spec |
|---|---|---|---|---|
| `f-one-anchor` | 2 | Satu jangkar utk besok | One anchor for tomorrow | Pick one thing that will happen at the same time tomorrow — same breakfast, same song, same walk. One fixed point is not a schedule; it is one less decision. |
| `f-decide-once` | 10 | Putuskan sekali utk seminggu | Decide once, for the week | Choose this week's dinners, or outfits, or bath nights, in one sitting. You are not becoming a Planner. You are refunding yourself twenty small decisions. |
| `f-recovery-basket` | 15 | Keranjang pemulihan | The basket that finds itself | One basket, one place: your book, your charger, your hand cream, a snack that is yours. Recovery shouldn't require a search party. |

### C — Captain (exertion: steering, deciding for everyone, being the one who knows)

| id | min | Judul (ID) | Title (EN) | Spec |
|---|---|---|---|---|
| `c-hand-the-wheel` | 10 | Serahkan kemudi 10 menit | Hand over the wheel for ten minutes | Let someone else decide something real and small — the meal, the route, the bedtime story order — and do not improve their decision afterwards. |
| `c-say-dont-know` | 2 | Bilang "belum tahu" | Say "I don't know yet" out loud | Once today, answer a question with "I don't know yet" instead of producing an answer on the spot. Notice that nothing collapses. |
| `c-not-my-job` | 5 | Daftar bukan tugasku | The not-mine list | Write three things you are carrying that are genuinely not yours to fix today. Read them once. Leave the paper somewhere you'll see it. |

### G — Gardener (exertion: waiting, holding back, absorbing everyone's pace)

| id | min | Judul (ID) | Title (EN) | Spec |
|---|---|---|---|---|
| `g-one-for-you` | 2 | Satu keputusan murni utk kamu | One decision that is only yours | Decide one thing today with nobody consulted and no compromise — the song, the drink, the window open or closed. Small, and entirely yours. |
| `g-practice-limit` | 5 | Latih satu kalimat batas | Rehearse one limit sentence | Say one clear limit out loud, alone, until it sounds normal in your own voice: "Not today." "I need ten minutes." Following the child still needs a floor under it. |
| `g-tend-something` | 15 | Rawat satu hal yg tumbuh | Tend something that isn't your child | Water the plants, prune something, feed the sourdough. Fifteen minutes of care that reports to nobody and thanks you by growing. |

### T — Talker (exertion: processing everyone's feelings, all day, out loud)

| id | min | Judul (ID) | Title (EN) | Spec |
|---|---|---|---|---|
| `t-ten-quiet` | 10 | Sepuluh menit tanpa suara | Ten minutes with no voices | No podcast, no music with words, no conversation. Your ears have been on shift since morning. |
| `t-write-dont-say` | 5 | Tulis, gak usah diucapkan | Write it, don't say it | Write one sentence nobody will read, and don't process it with anyone. Not everything you feel needs to become a conversation. |
| `t-long-exhale` | 2 | Buang napas lebih panjang | Six long exhales | Six breaths where the out-breath is longer than the in-breath. Slower than feels natural. That's it. |

### D — Doer (exertion: fixing, solving, moving, never sitting)

| id | min | Judul (ID) | Title (EN) | Spec |
|---|---|---|---|---|
| `d-sit-no-task` | 5 | Duduk tanpa tugas | Sit with no task | Sit down with nothing in your hands. Not a phone, not folding, not planning. Five minutes of no output at all. |
| `d-leave-one-undone` | 2 | Tinggalkan satu hal gak selesai | Leave one thing undone | Pick one thing tonight and deliberately leave it — the dishes, the toy basket, the reply. Go to bed with it undone on purpose. |
| `d-move-for-nothing` | 15 | Gerak yg gak menghasilkan apa-apa | Move for no output | Stretch, walk, dance in the kitchen. Movement that isn't carrying, tidying, or getting anywhere. |

### E — Explorer (exertion: driving the novelty, being everyone's energy)

| id | min | Judul (ID) | Title (EN) | Spec |
|---|---|---|---|---|
| `e-old-route` | 5 | Rute lama, sengaja | The boring route, on purpose | Take the familiar way. Order the usual. Repetition is not failure of imagination; it's the rest your imagination is asking for. |
| `e-sit-still-outside` | 10 | Diam di satu titik | Sit still in one spot | Outside, one place, no walking anywhere. Find five things you can see without moving. |
| `e-twenty-earlier` | 2 | Tidur 20 menit lebih cepat | Twenty minutes earlier | Set one alarm tonight — not to wake up, to stop. The next adventure is better funded by sleep than by will. |

### N — Nester (exertion: vigilance, keeping everyone safe, the worry that never clocks out)

| id | min | Judul (ID) | Title (EN) | Spec |
|---|---|---|---|---|
| `n-one-step-out` | 10 | Satu langkah keluar | One step outside, alone | Ten minutes outside the door by yourself, phone in your pocket. The house holds without you watching it. |
| `n-final-check` | 2 | Cek terakhir, lalu "cukup" | One last check, then say "enough" | Do the check once. Then say the word out loud. The ritual closes the loop the worry keeps reopening. |
| `n-warm-five` | 5 | Lima menit hangat | Five warm minutes | Warm shower, warm blanket, warm mug — five minutes of heat on your skin with nothing else happening. Comfort is allowed to point at you. |

---

## 7. `child-activities.json` — 20 records

One per age band per reader. Household materials only. Every record is written so the parent has
**nothing to grade** — Montessori's control of error and CPRT's "no teaching, no questions" arrive at
the same place, and that is the section's whole posture.

### Band 0–12 months — picked by D4 (E / N)

**`tummy-reach`** · E · `montessori-movement` · 10 min · **Sedikit di luar jangkauan** / *Just out of reach*
Place one interesting object slightly beyond where your baby can reach, then sit back and let them work for it.
*Steps:* lay them on a firm flat surface · put the object a hand's width past their fingers · say nothing and wait, even when it takes a while.
*Materials:* one object with texture or a soft sound. *Safety:* firm surface, never a bed or sofa edge; the object must not pass through a toilet-paper tube.

**`texture-tour`** · E · `serve-return` · 10 min · **Tur tekstur keliling rumah** / *The texture tour*
Carry your baby around the house and let them touch five different surfaces, naming each one.
*Steps:* pick five safe textures — a curtain, a cool window, a wooden spoon, a leaf, a towel · let their hand land first, then name it · wait for their sound or look before moving on.
*Materials:* your house. *Safety:* skip anything hot, sharp, electrical, or small enough to fit in a toilet-paper tube.

**`treasure-basket`** · N · `montessori-heuristic` · 15 min · **Keranjang harta** / *Treasure basket*
A low basket of real household objects. Your baby chooses; you stay close and do nothing.
*Steps:* fill a shallow basket with 5–6 real objects of different materials — wood, metal, fabric, natural · sit beside them and let them lead entirely · resist handing, demonstrating, or naming unless they look up at you.
*Materials:* wooden spoon, metal whisk, fabric scrap, small brush, pine cone, silicone cup. *Safety:* every object must be too big to pass through a toilet-paper tube, unbreakable, with no coating that can flake, and nothing with a cord or handle long enough to loop.

**`peekaboo-scarf`** · N · `serve-return` · 5 min · **Cilukba selendang** / *Peekaboo, with a scarf*
The oldest serve-and-return game there is, played at your baby's pace instead of yours.
*Steps:* drape a light scarf over your own face, not theirs · wait for their sound or reach before you reveal · stop the moment they look away — that's them saying done.
*Materials:* one light, breathable scarf. *Safety:* the scarf goes over you; never leave fabric on or near a baby's face.

### Band 1–2 years — picked by D1 (P / F)

**`post-the-lids`** · P · `montessori-order` · 10 min · **Masukkan, keluarkan, ulangi** / *In, out, again*
A container and a handful of large objects to post into it, repeated as many times as they want.
*Steps:* cut one hand-sized hole in a box lid, or use a wide-mouth jar · show it once, slowly, then hand it over · let them repeat it far past the point where you're bored.
*Materials:* a box or wide jar, plus large objects — jar lids, big blocks, wooden rings. *Safety:* every object larger than a toilet-paper tube; no cut edges on the hole.

**`sponge-transfer`** · P · `montessori-practical-life` · 10 min · **Pindah air pakai spons** / *Move the water with a sponge*
Two bowls, one sponge, water travelling from left to right. The spill is part of it.
*Steps:* set two shallow bowls on a towel, one with a little water · show the squeeze once · put a small cloth beside them, and let them mop it themselves.
*Materials:* two shallow bowls, one small sponge, a towel, a cloth. *Safety:* a very small amount of water, always within arm's reach — a toddler can drown in a few centimetres.

**`tape-line`** · F · `montessori-movement` · 10 min · **Jalan di garis lakban** / *Walk the tape line*
A line of masking tape on the floor becomes a balance beam, a road, or nothing at all.
*Steps:* run a straight or curved line of tape along the floor · walk it once yourself, then stop directing · whatever they turn it into is the activity.
*Materials:* masking or washi tape. *Safety:* clear the run of hard corners; bare feet or grippy socks.

**`laundry-hand-off`** · F · `montessori-practical-life` · 10 min · **Bantu masukin cucian** / *Hand me the laundry*
Real work, done together, with no standard to meet.
*Steps:* sit by the basket and hand them one item at a time · let them put it in the machine or the pile · thank them for the work, not for doing it right.
*Materials:* the laundry you already have. *Safety:* machine door closed and off when unattended; keep detergent capsules completely out of the room.

### Band 2–3 years — picked by D2 (C / G)

**`pouring-jug`** · C · `montessori-practical-life` · 10 min · **Menuang dr teko kecil** / *Pour from a small jug*
The classic Montessori presentation: show once, then hand over control completely.
*Steps:* half-fill a small jug and set two cups on a tray · pour once, slowly, without narrating · put the cloth where they can reach it and say nothing about spills.
*Materials:* a small jug they can hold one-handed, two cups, a tray, a cloth. *Safety:* room-temperature water only; ceramic is fine if you're comfortable with it breaking.

**`wash-one-cup`** · C · `montessori-practical-life` · 15 min · **Cuci satu gelas** / *Wash one cup*
One cup, one sponge, one bowl of water. A whole task with a visible beginning and end.
*Steps:* set a low station — bowl, sponge, towel · demonstrate the sequence once · leave them to it, including the parts they do badly.
*Materials:* a bowl of warm water, a small sponge, one unbreakable cup, a towel. *Safety:* warm not hot; no soap that stings eyes; stool must be stable.

**`sort-your-way`** · G · `montessori-sensorial` · 10 min · **Sortir sesukamu** / *Sort it your way*
You supply the objects. They supply the rule — and their rule is the point.
*Steps:* tip out 10–15 mixed household objects and two empty bowls · say "you can sort these however you like" and then stay quiet · if they sort by something you'd never have chosen, that's the successful version.
*Materials:* buttons too big to swallow, bottle caps, spoons, blocks, socks. *Safety:* nothing that fits through a toilet-paper tube if a younger sibling is in the room.

**`calm-basket-together`** · G · `cprt-reflect` · 15 min · **Bikin kotak tenang bareng** / *Build the calm basket together*
Assemble the box for hard moments while nobody is having one, and let the child choose what goes in.
*Steps:* offer a basket and ask what helps when they feel big feelings · put in whatever they say, even if it seems useless to you · name the feelings as they come up, without fixing them.
*Materials:* a basket, plus their choices — a soft toy, a picture, a squeeze ball, a blanket. *Safety:* nothing that can be tied, wrapped, or pulled over the head.

### Band 3–4 years — picked by D3 (T / D)

**`special-play-time`** · T · `cprt-special-play` · 20 min · **Waktu main spesial** / *Special play time*
The flagship. This is filial therapy's weekly playtime, run by you, at home, exactly as parents are trained to run it.
*Steps:* 20 minutes, one child, a consistent time and place, phone in another room · they choose everything; you follow and join only when invited — no teaching, no questions, no suggestions · describe what you see ("You're giving the baby a bottle"), reflect what they feel ("That surprised you"), and praise the effort, never the result ("You kept trying until you got it") · give a five-minute and a one-minute warning before you stop.
*Materials:* simple non-mechanical things — paper and crayons, a doll, animals, cars, blocks. *Safety:* none beyond the toys themselves. *Note:* if you do only one activity in this booklet, this is the one with the strongest evidence behind it.

**`draw-and-reflect`** · T · `cprt-reflect` · 15 min · **Gambar aja, aku yg nemenin** / *Draw anything, I'll just be here*
They draw. You narrate what you see and never ask what it is.
*Steps:* paper and crayons, both of you at the table · describe colours, movements, choices — "you used a lot of blue there" · never ask "what is it?" and never correct a colour or a shape.
*Materials:* paper, crayons. *Safety:* none.

**`pretend-kitchen`** · D · `cprt-special-play` · 15 min · **Masak-masakan, kamu jd tamu** / *You're the customer*
For parents who show love by doing: here, the doing is theirs and you're the one being served.
*Steps:* they cook, you order and eat · accept whatever arrives, including the inedible parts of the game · add one feeling word somewhere: "you look proud of that one."
*Materials:* pots, spoons, cups, whatever is already in the toy box. *Safety:* nothing from the real stove.

**`wash-the-toys`** · D · `montessori-practical-life` · 15 min · **Mandiin mainan** / *Give the toys a bath*
A real job with real water — comfort through action, which is exactly how Doer parents love.
*Steps:* a basin of warm water, a brush, a towel · they wash, you wash beside them without supervising the quality · when they say a toy is clean, it's clean.
*Materials:* basin, warm water, soft brush, towel, washable toys. *Safety:* shallow water, never unattended; no electronic toys.

### Band 4–5 years — picked by D4 (E / N) again

**`treasure-map`** · E · `montessori-order` · 15 min · **Peta harta di rumah** / *A treasure map of our house*
Drawing a map, then following it, is symbolic thinking with legs.
*Steps:* they draw a map of a room, however inaccurate · hide something small together and mark it · follow their map, not your knowledge of the house.
*Materials:* paper, crayons, one small object to hide. *Safety:* agree which rooms are in play.

**`obstacle-course`** · E · `montessori-movement` · 15 min · **Rintangan dr bantal** / *The cushion course*
Cushions, tape and chairs become a route they design and you attempt.
*Steps:* they design it and set the rules · you go first and follow their rules exactly · let them change the rules mid-course, because they will.
*Materials:* cushions, tape, chairs, a blanket. *Safety:* nothing to climb higher than their own hip; clear the corners of hard furniture.

**`turn-story`** · N · `cprt-reflect` · 10 min · **Cerita gantian satu kalimat** / *One sentence each*
A quiet bedtime story you build together, one sentence at a time.
*Steps:* you start with one sentence, they add the next · accept every turn they take, including the ones that break your plot · when they end it, it's ended.
*Materials:* none. *Safety:* none.

**`one-real-step`** · N · `montessori-practical-life` · 15 min · **Satu langkah masak beneran** / *One real step in the cooking*
Not pretend cooking. One genuine step of the real meal, done by them.
*Steps:* choose one safe step — tearing lettuce, peeling a banana, spreading butter, stirring off the heat · give them the real tool, child-sized if you have one · serve the meal and say who made that part.
*Materials:* whatever you're already cooking. *Safety:* nothing at the stove, nothing sharp, nothing hot; hands washed; adult stays in the kitchen.

---

## 8. Safety review — required before any activity ships

Inherited from `docs/future-sensory-play-result-extension.md`, which parked the activity idea in the
first place, plus the CPSC baseline in §2.5. Every record must clear all of these:

1. **Choking.** Any loose object offered to an under-3 must not pass through a toilet-paper tube
   (CPSC small-parts cylinder, 2.25 × 1.25 in). Stated in the parent's own words, never as a citation.
2. **Water.** Any water activity says shallow and never unattended. A toddler can drown in a few
   centimetres, and the booklet says so once, plainly, without lecturing.
3. **Strangulation.** No cords, ribbons, long handles or fabric left on or near a baby's face. The
   peekaboo scarf goes over the *parent*.
4. **Heat, blades, stove.** Excluded from every 0–5 record. `one-real-step` explicitly names what is
   off-limits rather than trusting judgment.
5. **Allergy and mouthing.** Food-based sensory play is deliberately absent from the launch set.
6. **No performance framing.** No streaks, no counting, no "do this and your child will…", no
   milestone claims. `why` says what the activity builds, in one non-diagnostic line.
7. **Skip permission is mandatory.** Page 13 closes with *"Gak main hari ini? Kamu tetap cukup."*
8. **Both languages reviewed independently**, not translated and waved through.

---

## 9. Illustration

**Authoritative file: `docs/personality-pdf-art-brief.md`** — the copy-paste handover for
generating all **54 pieces** (25 parent-care tiles, 20 child-activity tiles, 9 page-furniture
bands) with `gpt-image-2`. It carries the style block, the reference-image anchoring, the hard
rules, the model-legal sizes and every prompt keyed to its record id.

Kept here only because it constrains the layout rather than the art:

- **No characters and no people in any shared frame.** The 16 pastry characters differ per type and
  this art is shared across all 32 booklets, so a character in a shared frame costs 16×. Character
  art appears only on pages 1 and 3, where the existing per-type WebPs already live. Object-led
  still life is also the honest visual language for a Montessori "prepared environment", so the
  constraint and the method agree.
- **Filenames are record ids.** `care/{id}.png`, `play/{id}.png`, `furniture/f{n}.png`, delivered
  into `images/pdf-art/`, derived into `public/pdf-art/`, then written into each record's `image`
  field. The frames are already sized and positioned, so art drops in with no template change.

## 10. Generation pipeline

Prerendered at authoring time, committed, served as static files. **No runtime PDF library** — a
client-side generator would add 100–300 KB to a 106 KB bundle and break the §10 budget for a button
most readers never press.

```bash
npm run assets:pdf-art   # images/pdf-art/**/*.png -> public/pdf-art/**/*.webp (sharp, 1240px)
npm run assets:pdf       # 32 booklets -> public/pdf/{lang}/{slug}.pdf
```

`assets:pdf` drives headless Chrome over CDP — the same mechanism as `qa-phase55.mjs` and
`perf-probe.mjs` — loading `scripts/pdf/booklet.html?slug=…&lang=…`, waiting on `document.fonts.ready`
and every `<img>` decode, then calling `Page.printToPDF` with A4, `printBackground: true`, zero
margins and CSS-controlled bleed. The template imports the real `tokens.css` and the real font files,
so the booklet is the site rather than a generated report.

**Kept out of `npm run build`.** Cloudflare Workers Builds must never need a browser. These are
derivatives committed to the repo, exactly like `public/motion/preloader.mp4` and the character WebPs.

**Byte stability.** `printToPDF` stamps `/CreationDate` and a document `/ID`, so identical content
produces different bytes on every run and all 32 files would re-commit each time. The script
normalizes both to fixed values after generation, so a rebuild with unchanged content produces an
empty diff. Without this, the PDF step makes the repo unreadable.

**Audit.** `npm run assets:audit` gains a PDF section: 32 files present, exactly 16 pages each,
≤1.2 MB each, fonts embedded (not substituted), and text extractable rather than rasterized.

---

## 11. Delivery on the Result

One entry point: **its own section**, placed after `result__weekly-section` and before
`result__other-types` — where a reader who has finished the support layer already is.

A second entry point in the docked share bar was built and then removed on 2026-08-22 at Ardy's
direction. The dock carries exactly one action, the save that feeds the Instagram Story; a booklet
link beside it competed for the thumb zone without earning it.

Markup is deliberately dumb:

```html
<a class="result__pdf-link" href="/pdf/id/pcte.pdf" target="_blank" rel="noopener">…</a>
```

No `download` attribute and no `blob:` URL. In the Instagram in-app browser both of those commonly
do nothing at all, whereas a real URL can be handed to a viewer or to "Open in Chrome/Safari". The
existing hard invariant — the endgame cannot depend on downloads or Web Share — is respected because
nothing about the share path changes.

**Fallback.** A failed navigation in a WebView is not reliably detectable. The heuristic: on click,
start a 1500 ms timer; if the document never loses visibility or focus in that window, show the
existing toast offering copy-link, reusing the `share.ts` toast chain and `result.copy_link`.

**New i18n keys** (both languages, drafted by Claude, reviewed by Ardy):
`result.pdf_title`, `result.pdf_body`, `result.pdf_cta`, `error.pdf_failed`,
plus the booklet's own labels: `pdf.cover_eyebrow`, `pdf.code_page_title`, `pdf.care_title`,
`pdf.care_intro`, `pdf.play_title`, `pdf.play_intro`, `pdf.age_label`, `pdf.time_label`,
`pdf.materials_label`, `pdf.safety_label`, `pdf.method_label`, `pdf.skip_permission`,
`pdf.qr_hint`, `pdf.closing_cta`. 23 new strings per language as built.

---

## 12. Weight budget

| Item | Budget |
|---|---|
| Per PDF | ≤1.0 MB target, 1.2 MB hard ceiling (audit fails above it) |
| Embedded images | 1240px wide, q78 — ≈150 DPI at A4 width, prints cleanly |
| All 32 files | ≈30 MB, committed |
| `public/pdf-art/` derivatives | ≈4 MB |
| Runtime JS added | **0 bytes** — the link is markup |

The deployed asset bundle roughly triples (currently 179 assets / 17 MB). Acceptable per the locked
decision; the repo already tracks 190 MB under `images/`.

---

## 13. QA contract

Extends `npm run qa:phase55` and adds `npm run qa:pdf`.

**`qa:phase55` additions** — Result surface:
- The PDF section exists, is a sibling between the weekly section and other-types, and carries the
  section image plus a working link.
- `href` resolves to `/pdf/{lang}/{slug}.pdf` for the current language and type; the language toggle
  swaps it.
- The link has `target="_blank"`, `rel="noopener"` and **no** `download` attribute.
- The docked bar contains `result.save_image` and nothing else.
- Zero horizontal overflow at 390×844 **and** 390×720; reduced-motion parity.

**`qa:pdf`** — the artifacts themselves:
- All 32 files exist and are ≤1.2 MB.
- Exactly 16 pages each.
- Text is extractable, and the extracted text contains the type's `name`, its `code`, all three
  `superpowers`, the five parent-care titles and the five child-activity titles **in the file's own
  language** — which catches a language-crossed build.
- Every embedded font is embedded, not substituted.
- Both permission lines are present: the parent's on page 9, the child's on page 15, in all 32.

---

## 14. Build steps

| Step | Work | Gate |
|---|---|---|
| 8.1 | ✅ **done 2026-08-22** — `parent-care.json`, `child-activities.json` and `weekly-extras.json` authored bilingually with the deterministic selection rule and the `pdfSelection` override hook | 168 tests green; `data-spec.md` update still outstanding |
| 8.2 | ✅ **done 2026-08-22** — `scripts/generate-pdf-booklets.mjs` + byte normalization + per-page overflow assertion, running on empty image frames | 32 files generate at 15 pages, ≤585 KB, no page clips |
| 8.3 | **Next, and on Ardy:** generate the 54 illustrations per `docs/personality-pdf-art-brief.md` → write the `assets:pdf-art` derivative step → audit entries | `assets:audit` 0 issues |
| 8.4 | ✅ **done 2026-08-22** — Result section, 39 i18n strings, toast fallback. The dock link was built and removed the same day at Ardy's direction | Verified headless at 390×844; `qa:phase55` assertions still outstanding |
| 8.5 | Deploy; verify in the Instagram in-app browser on the Samsung, plus one iOS check | Real-device sign-off recorded in `progress.md` |

Steps 8.1, 8.2 and 8.4 shipped on 2026-08-22 against empty image frames. 8.3 (art) and 8.5 (real-device check) remain, plus two carried-over debts: `data-spec.md` has no section for the three new registries, and `qa:phase55` has no assertions for the Result section.

---

## 15. Open questions for Ardy

1. **QR target on page 15** — the quiz root (the booklet recruits new players) or the reader's own
   `/r/{slug}`? Default: the quiz root. The QR itself is not drawn yet — page 15 reserves its tile.
2. **Closing CTA** — `parenteers.id` generally, or the *Panduan stimulasi 0–5* product specifically?
   Five free activities against a paid 200+ guide is a lead magnet, and the page should say which.
3. **Selection overrides** — is the deterministic default acceptable for launch, or do you want to
   hand-pick the five per type in `types.json`? Default: deterministic, override later.
4. **Launch languages** — both at once, or ship ID and add EN after the copy review?
5. Carried over and still open: `config.links.instagram` resolves to `@parenteers` while the artwork
   says `parenteers.id`. Page 15 needs the same answer the share card is waiting on.
