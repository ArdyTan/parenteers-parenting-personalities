# Quiz Web App — Page-by-Page Dialogue (EN · ID)
**Project:** Parenteers Parenting Bakes Quiz (working title)
**File 1 of 3** · Companions: `quiz-02-ui-strings.md` (buttons/labels/i18n) · `images/old images/quiz-03-image-prompts.md` (archived illustration prompts) · `images/README.md` (delivered asset inventory/order)
**Status:** v1.0 draft copy — ready for review, then handoff to build

**Working title used in copy:** EN "Parenting Bakes" · ID "Parenting Kamu, Tim Roti Apa?" — final naming is an open decision.

**Dev notes (apply globally):**
- Language toggle EN/ID on every page; default **ID**, persists across pages. All reusable UI strings (buttons, labels, errors) live in File 2 — this file contains page content only.
- Quiz logic: 12 questions, 3 per dimension. Answer A/B positions must be **randomized per render** (pole letter is attached to the answer, not the position).
- Scoring: majority letter per dimension → 4-letter code → result key (lowercase, e.g. `pcte`). 3 questions per dimension = no ties possible.
- Dimensions & poles: D1 Structure **P**lanner/**F**low · D2 Guidance **C**aptain/**G**ardener · D3 Emotion **T**alker/**D**oer · D4 Adventure **E**xplorer/**N**ester.

---

## PAGE 1 — Landing / Hero

**EN**
- H1: **Bread or Cake: What's Your Parenting Style?**
- Subtitle: 16 parenting personalities, from lapis legit to lava cake. No judgment — just warm hugs and a little laugh.
- Meta line: ⏱ 3 minutes · 12 questions · IG-story-ready result
- CTA button: **Start the Quiz**
- Trust line (small): Built on 4 research-backed parenting dimensions · by Parenteers

**ID**
- H1: **Gaya Parenting Kamu, Roti atau Kue Apa?**
- Subtitle: 16 kepribadian parenting, dr lapis legit sampai lava cake. No judgement — cuma pelukan hangat & sedikit tawa.
- Meta line: ⏱ 3 menit · 12 pertanyaan · hasil siap di-share ke IG Story
- CTA button: **Mulai Quiz**
- Trust line (small): Dibuat berdasarkan 4 dimensi parenting yg diteliti secara ilmiah · by Parenteers

---

## PAGE 2 — Intro / "Before we start"

**EN**
- H2: **Before we preheat the oven 🔥**
- Point 1: There are no wrong answers — only your style.
- Point 2: Every type in this quiz is a loving parent. We're just different recipes.
- Point 3: Answer with what you *actually* do on a normal day — not your ideal-self answer. (We see you. No judgment.)
- CTA button: **Let's bake**
- Footnote (small): For fun & reflection — not a clinical assessment.

**ID**
- H2: **Sebelum ovennya panas 🔥**
- Point 1: Gak ada jawaban salah — yg ada cuma gaya kamu.
- Point 2: Semua tipe di quiz ini = orang tua yg sayang anaknya. Kita cuma beda adonan.
- Point 3: Jawab sesuai kenyataan sehari-hari ya, bukan versi ideal. (Tenang, gak ada yg nilai.)
- CTA button: **Gas, mulai!**
- Footnote (small): Buat seru-seruan & refleksi — bukan penilaian klinis.

---

## PAGES 3–14 — The 12 Questions

Copy revised 2026-09-28 for a single-action choice: short situation + two concrete responses. Pick what is closest to everyday behavior; Q7–9 ask for the first response because both may happen. IDs, dimensions and poles are preserved. `src/data/questions.json` is the runtime authority.

Planned interaction: swipe the scenario card toward either visible answer, or tap that answer, to save and advance. Direction is assigned after shuffling; the order below is editorial, not a fixed left/right mapping. Full development contract: `docs/question-swipe-plan.md`. Current runtime still requires Next until that feature is implemented.

### Q1 · Structure

**EN** — Scenario: *A free Sunday morning. You usually…*
- (P): Have activity ideas ready from last night ✨
- (F): See how the morning feels, then decide 🍃

**ID** — Skenario: *Minggu pagi yg kosong. Kamu biasanya…*
- (P): Udah siapin ide aktivitas dr semalam ✨
- (F): Lihat mood pagi ini, baru tentuin 🍃

### Q2 · Structure

**EN** — Scenario: *A family day out. How do you pack?*
- (P): Use a checklist, with spares packed too
- (F): Pack the essentials, figure out the rest as we go

**ID** — Skenario: *Mau pergi seharian. Gaya packing kamu…*
- (P): Pakai checklist, termasuk barang cadangan
- (F): Bawa yg penting, sisanya sambil jalan

### Q3 · Structure

**EN** — Scenario: *Sleep, meals, play. Your child's daily rhythm…*
- (P): Roughly the same times each day
- (F): Follows my child's rhythm; each day can differ

**ID** — Skenario: *Tidur, makan, main. Ritme harian si kecil…*
- (P): Jamnya kurang lebih sama tiap hari
- (F): Ngikutin ritme anak, tiap hari bisa beda

### Q4 · Guidance

**EN** — Scenario: *Playtime! Who picks the activity?*
- (C): I choose and set up the activity
- (G): I set out options; my child chooses

**ID** — Skenario: *Waktunya main. Siapa yg pilih aktivitas?*
- (C): Aku pilih & siapin aktivitasnya
- (G): Aku siapin pilihan, anak yg tentuin

### Q5 · Guidance

**EN** — Scenario: *Your child picks a superhero costume + boots for a family event. You…*
- (C): Choose an outfit that suits the event
- (G): Let them wear their choice 😎

**ID** — Skenario: *Ke acara keluarga, anak pilih kostum superhero + boots. Kamu…*
- (C): Pilihkan baju yg cocok utk acaranya
- (G): Biarin dia pakai pilihannya 😎

### Q6 · Guidance

**EN** — Scenario: *Playtime's over. How do you approach cleanup?*
- (C): Set a clear rule: after play, toys go back
- (G): Make cleanup inviting so they start on their own

**ID** — Skenario: *Selesai main. Cara kamu ngajak beres-beres…*
- (C): Pakai aturan: selesai main, beresin dulu
- (G): Bikin beres-beres menarik, biar dia mulai sendiri

> Historical checkpoint copy remains in i18n. It is not currently rendered by the question scene; the swipe release introduces no extra checkpoint action.

### Q7 · Emotion

**EN** — Scenario: *A mall meltdown. Your usual first move…*
- (T): Crouch down: “You’re really upset, huh…”
- (D): Give a hug and move somewhere calmer

**ID** — Skenario: *Anak tantrum di mal. Kamu biasanya mulai dr…*
- (T): Jongkok, bilang: “Kamu kesel ya…”
- (D): Peluk, ajak ke tempat yg lebih tenang

### Q8 · Emotion

**EN** — Scenario: *The block tower falls. Tears follow. Your first move…*
- (T): “That’s frustrating…” Hear their feelings first
- (D): “Let’s rebuild.” Help put it back together

**ID** — Skenario: *Menara balok roboh, anak nangis. Respons awalmu…*
- (T): “Sebel ya…” Dengerin perasaannya dulu
- (D): “Yuk bangun lagi.” Bantu susun bareng

### Q9 · Emotion

**EN** — Scenario: *Your child seems sad at bedtime. You start with…*
- (T): Ask gently and listen to their story
- (D): A long cuddle and their favorite blanket

**ID** — Skenario: *Mau tidur, anak kelihatan sedih. Kamu mulai dr…*
- (T): Tanya pelan-pelan, dengerin ceritanya
- (D): Peluk lama, ambilin selimut favorit

> Historical checkpoint copy remains in i18n. It is not currently rendered by the question scene; the swipe release introduces no extra checkpoint action.

### Q10 · Adventure

**EN** — Scenario: *Your child eyes the tall slide. You…*
- (E): “Want to try?” I stay close to help
- (N): Suggest the lower slide first

**ID** — Skenario: *Anak tertarik perosotan tinggi. Kamu…*
- (E): “Coba yuk.” Aku jagain dr dekat
- (N): Ajak ke yg lebih rendah dulu

### Q11 · Adventure

**EN** — Scenario: *Puddles after the rain. You choose…*
- (E): A little splash; clothes can be washed 😄
- (N): Take the dry path and stay comfy

**ID** — Skenario: *Ada genangan habis hujan. Kamu pilih…*
- (E): Main air sebentar, baju bisa dicuci 😄
- (N): Cari jalan kering, tetap nyaman

### Q12 · Adventure

**EN** — Scenario: *Meeting new kids. You usually…*
- (E): Encourage a hello while staying close
- (N): Let them stay close until they feel ready

**ID** — Skenario: *Ketemu anak-anak baru. Kamu biasanya…*
- (E): Ajak kenalan, aku temenin dr dekat
- (N): Biarin nempel dulu sampai dia siap

---

## PAGE 15 — Calculating / Loading

Rotating lines, ~2.5s each, in order. Show a baking illustration (see File 3).

| # | EN | ID |
|---|---|---|
| 1 | Preheating the oven… 180°C | Manasin oven… 180°C |
| 2 | Mixing your answers… | Ngaduk jawaban kamu… |
| 3 | Waiting for the dough to rise… (as fast as a toddler putting on shoes) | Nunggu adonan mengembang… (secepat balita pakai sepatu sendiri) |
| 4 | Almost golden brown… | Bentar lagi golden brown… |

---

## PAGE 16 — Result Page (template)

**Layout order:** type illustration → intro label ("You are…" / "Kamu adalah…") → **Type Name** + code chip (e.g. `P·C·T·E`) → tagline → **Superpowers** (3 lines) → **Watch-out, with love** (1 line + tip) → **Pop-culture cousin** → result disclaimer → soft-sell card → share buttons → **Continue / Lanjutkan** (to Page 18) → links (See all 16 · Retake).

**Result disclaimer (reuse `footer.disclaimer`):** *For fun & reflection — not a clinical assessment or diagnostic tool.* / *Buat seru-seruan & refleksi — bukan penilaian klinis maupun alat diagnosis.*

**Soft-sell card (same on all results; only the activity tags change per code):**
- EN: *Play ideas that match your style — screen-free activities for ages 0–5, made by a Certified Montessori & Play Therapy Practitioner (and a fellow tired parent).* → button: **Explore Parenteers activities**
- ID: *Ide main yg cocok sm gaya kamu — aktivitas tanpa layar utk usia 0–5, dibuat oleh Certified Montessori & Play Therapy Practitioner (yg juga sesama orang tua lelah).* → button: **Intip aktivitas Parenteers**

**Activity-tag mapping (dev note):** default deterministically to D2+D3 — the second and third letters of the result code (e.g. `PCTE` → C + T). An explicit `types.json` editorial override may replace that pair. Tag meanings: P structured printables · F no-prep play · C guided step-by-step · G open-ended invitations · T Big Feelings sheets · D hands-on sensory · E gross-motor/outdoor · N calm & cozy play.

**Share caption template:**
- EN: *I'm {type} {emoji} — my parenting style as a treat. What's yours? {link}*
- ID: *Aku {type} {emoji} — gaya parenting-ku versi kue. Kamu tim apa? {link}*

---

## THE 16 RESULT COPIES

### 1 · PCTE — The Croquembouche 🍮
**EN** — Tagline: *Grand plans, big feelings, bigger adventures.*
- You turn ordinary weekends into events
- You can talk your kid through anything
- Fearless cheerleader: "Try it — I've got you"
- Watch-out, with love: Sometimes you over-engineer the fun. Plot twist: the cardboard box always wins. 📦

**ID** — Tagline: *Rencana besar, perasaan besar, petualangan lebih besar lagi.*
- Weekend biasa bisa kamu sulap jadi event
- Jago nemenin anak ngobrolin perasaan apa pun
- Cheerleader paling berani: "Coba aja, ada aku di sini"
- Watch-out, with love: Kadang serunya kamu terlalu dipersiapkan. Padahal… kardus bekas selalu menang. 📦

### 2 · PCTN — The Lapis Legit 🍰
**EN** — Tagline: *A thousand thin layers of patience, baked with love.*
- Your routines are legendary — your kid always knows what's next
- Heart-to-heart talks are your home turf
- Home feels like the safest place on earth
- Watch-out: Perfectionism sneaks in sometimes. Layer 27 is allowed to be "good enough." 😌

**ID** — Tagline: *Seribu lapis kesabaran, dipanggang dgn cinta.*
- Rutinitas kamu legendaris — anak selalu tau apa yg akan terjadi
- Ngobrol dr hati ke hati itu zona nyaman kamu
- Rumah terasa kayak tempat paling aman sedunia
- Watch-out: Kadang perfeksionisnya muncul. Lapisan ke-27 boleh kok "cukup bagus aja." 😌

### 3 · PCDE — The Baguette 🥖
**EN** — Tagline: *Crisp outside, simple goodness inside, ready to go anywhere.*
- Decisive — your kid always knows the plan
- Adventure logistics? Handled. Snacks? Packed.
- Calm and practical, even on the move
- Watch-out: You fix things fast — sometimes feelings just want to be heard first. One "how did that feel?" goes a long way. 💬

**ID** — Tagline: *Renyah di luar, sederhana & baik di dalam, siap dibawa ke mana aja.*
- Tegas — anak selalu tau rencananya apa
- Logistik petualangan? Beres. Bekal? Aman.
- Tenang & praktis, bahkan di perjalanan
- Watch-out: Kamu cepat banget nyelesain masalah — tp kadang perasaan cuma mau didengar dulu. Satu "gimana rasanya?" itu berarti banget. 💬

### 4 · PCDN — The Milk Bread 🍞
**EN** — Tagline: *Precisely soft — structure in service of comfort.*
- Unshakeable routines that feel like a hug
- Practical-care level: backup socks for the backup socks
- The calm in every chaos
- Watch-out: Protective can quietly become hovering. It's okay to let them wobble — you're still right there. 🧦

**ID** — Tagline: *Lembut yg terencana — struktur demi kenyamanan.*
- Rutinitas kamu stabil, rasanya kayak pelukan
- Level perhatian praktis: kaos kaki cadangan pun ada cadangannya
- Paling tenang di tengah chaos
- Watch-out: Protektif bisa pelan-pelan jadi hovering. Gakpapa biarin dia goyah dikit — kamu tetap ada di situ kok. 🧦

### 5 · PGTE — The Cronut 🍩
**EN** — Tagline: *Knows the rules well enough to remix them.*
- You go all-in on your kid's current obsession
- Feelings get named in this house
- You make learning feel like invention
- Watch-out: So many experiments, so little follow-through. Finish one recipe before starting three. 🍩

**ID** — Tagline: *Paham aturannya, makanya berani nge-remix.*
- Kalau anak lagi obsess sesuatu, kamu ikut all-in
- Perasaan selalu dapet nama di rumah ini
- Belajar jadi terasa kayak eksperimen seru
- Watch-out: Eksperimennya banyak, yg selesai… hmm. Selesaikan satu dulu sebelum mulai tiga. 🍩

### 6 · PGTN — The Pandan Chiffon 🍃
**EN** — Tagline: *Light structure that rises with your child.*
- You read your kid's cues like a pro
- Soft landings for every big feeling
- Unhurried presence — no rush, just here
- Watch-out: Gentle can drift into no-limits. Kids need edges too — soft ones still count. 🌿

**ID** — Tagline: *Struktur ringan yg ikut mengembang bareng anak.*
- Kamu jago banget baca sinyal anak
- Semua perasaan besar dapet pendaratan empuk
- Hadir tanpa buru-buru — gak ke mana-mana
- Watch-out: Lembut bisa kebablasan jadi tanpa batas. Anak juga butuh pagar — yg empuk pun tetap pagar. 🌿

### 7 · PGDE — The Pretzel 🥨
**EN** — Tagline: *Rules that twist into games.*
- Chores become missions in your house
- Learning happens hands-on, knee-deep, mid-puddle
- Mess doesn't scare you one bit
- Watch-out: Action-first can skip the debrief. Name the feeling after the fun — it seals the lesson. 🥨

**ID** — Tagline: *Aturan yg bisa dipelintir jadi permainan.*
- Beres-beres di rumah kamu = misi seru
- Belajarnya langsung praktik: tangan kotor, kaki nyebur
- Berantakan? Gak takut sama sekali
- Watch-out: Karena serunya gerak terus, evaluasinya suka kelewat. Sebutin perasaannya setelah main — biar nempel. 🥨

### 8 · PGDN — The Muffin 🧁
**EN** — Tagline: *A simple, reliable frame — your kid picks the mix-ins.*
- Low-drama consistency, every single day
- Quietly empowering — "you choose" is your catchphrase
- Comfort your kid can count on
- Watch-out: "Easygoing" can hide your own needs. Muffins need care too — that's you. 🧁

**ID** — Tagline: *Wadah yg sederhana & andal — isiannya anak yg pilih.*
- Konsisten tanpa drama, tiap hari
- Diam-diam memberdayakan — "kamu pilih aja" itu jargon kamu
- Kenyamanan yg selalu bisa diandalkan anak
- Watch-out: "Santai aja" kadang nutupin kebutuhan kamu sendiri. Muffin juga perlu dirawat — itu kamu. 🧁

### 9 · FCTE — The Molten Lava Cake 🍫
**EN** — Tagline: *Spontaneous outside, molten feelings at the center.*
- Best no-plan adventure maker in the game
- Big emotional honesty — your kid feels truly seen
- You bring the spark to ordinary days
- Watch-out: Intensity spikes happen. One tiny anchor routine helps on the soft days. 🍫

**ID** — Tagline: *Spontan di luar, perasaan meleleh di tengah.*
- Petualangan tanpa rencana? Kamu jagonya
- Jujur soal perasaan — anak merasa benar-benar dilihat
- Hari biasa pun kamu kasih percikan seru
- Watch-out: Kadang intensitasnya naik-turun. Satu rutinitas kecil bisa jadi jangkar di hari yg berat. 🍫

### 10 · FCTN — The Cinnamon Roll 🍯
**EN** — Tagline: *Unhurried swirls of warmth — leads with a hug.*
- World-class comforter
- Slow mornings are your masterpiece
- Feelings get talked through over breakfast
- Watch-out: Comfort-first can dodge the hard limits. Warm AND firm can share one oven. 🍯

**ID** — Tagline: *Gulungan kehangatan yg gak buru-buru — pelukan dulu, baru mikir.*
- Ahli menenangkan kelas dunia
- Pagi yg pelan-pelan itu karya kamu
- Perasaan dibahas sambil sarapan
- Watch-out: Karena nyaman duluan, batasan tegas suka dihindari. Hangat DAN tegas bisa kok satu oven. 🍯

### 11 · FCDE — The Bagel 🥯
**EN** — Tagline: *Boiled and baked — resilient, no-fuss, up for anything.*
- Unflappable in tantrum weather
- Practical problem-solver on the fly
- Adventure without the itinerary
- Watch-out: "Shake it off" can accidentally dismiss. One feeling word before the fix works wonders. 🥯

**ID** — Tagline: *Direbus lalu dipanggang — tangguh, gak ribet, siap apa aja.*
- Badai tantrum? Kamu tetap kalem
- Problem-solver praktis di segala situasi
- Petualangan tanpa itinerary itu gaya kamu
- Watch-out: "Udah gakpapa, yuk lanjut" bisa gak sengaja nge-skip perasaan. Satu kata perasaan sebelum solusi itu ajaib. 🥯

### 12 · FCDN — The Banana Bread 🍌
**EN** — Tagline: *Magic from whatever's on hand — steady, warm, zero waste.*
- You improvise comfort anywhere
- Consistent without being rigid
- The calm in every storm
- Watch-out: Comfort loops can shrink the world. One new little thing a week keeps it fresh. 🍌

**ID** — Tagline: *Sulap dr bahan seadanya — stabil, hangat, gak ada yg kebuang.*
- Bisa menciptakan rasa nyaman di mana aja
- Konsisten tp gak kaku
- Sumber ketenangan di tengah badai
- Watch-out: Zona nyaman bisa bikin dunia makin kecil. Satu hal baru kecil tiap minggu biar tetap segar. 🍌

### 13 · FGTE — The Pavlova ✨
**EN** — Tagline: *Celebration energy — you follow your kid's sparkle.*
- Yes-day generosity
- Feelings are expressed loud and proud here
- You make childhood feel like magic
- Watch-out: All sparkle needs a base. One predictable ritual keeps the magic grounded. ✨

**ID** — Tagline: *Energi perayaan — kamu ngikutin binar mata anak.*
- Dermawan sm kata "iya, boleh!"
- Di rumah ini perasaan bebas diekspresikan
- Masa kecil anak kamu bikin terasa magis
- Watch-out: Semua kilau butuh alas. Satu ritual yg pasti bikin magisnya tetap membumi. ✨

### 14 · FGTN — The Tiramisu ☕
**EN** — Tagline: *Soft layers, pick-me-up empathy, your kid's own pace.*
- Deep listener — every mood has a safe harbor
- Patience of a saint (a tired saint, but still)
- Zero pressure, full presence
- Watch-out: You absorb everyone's feelings. Schedule your own espresso break — literally. ☕

**ID** — Tagline: *Lapisan lembut, empati yg menenangkan, ikut ritme anak.*
- Pendengar sejati — semua mood anak punya pelabuhan aman
- Kesabarannya level dewa (dewa yg ngantuk, tp tetap)
- Tanpa tekanan, hadir sepenuhnya
- Watch-out: Kamu nyerap perasaan semua orang. Jadwalkan espresso break buat diri sendiri — beneran. ☕

### 15 · FGDE — The Focaccia 🫒
**EN** — Tagline: *A forgiving dough — dimples, olive oil, learning by doing.*
- Mess is your co-parent
- Nature is your favorite classroom
- You raise bounce-back kids by example
- Watch-out: Loose structure can become no structure. Three real house rules, max — but real. 🫒

**ID** — Tagline: *Adonan yg pemaaf — belajar lewat praktik & main kotor.*
- Berantakan itu partner parenting kamu
- Alam = ruang kelas favorit
- Anak belajar bangkit dr contoh kamu langsung
- Watch-out: Longgar bisa kebablasan jadi tanpa struktur. Tiga aturan rumah aja cukup — tp beneran dijalanin. 🫒

### 16 · FGDN — The Bolu Kukus 🌸
**EN** — Tagline: *Steams quietly, then blooms on its own — trust, in full effect.*
- Master of letting kids figure it out
- Judgment-free home base
- Low-pressure joy, every day
- Watch-out: Hands-off can read as far-away. Narrate your presence: "I'm right here." 🌸

**ID** — Tagline: *Dikukus pelan-pelan, lalu mekar sendiri — kepercayaan penuh.*
- Jagonya kasih ruang anak nemuin caranya sendiri
- Home base tanpa penghakiman
- Bahagia tanpa tekanan, tiap hari
- Watch-out: Terlalu hands-off bisa terasa jauh. Suarakan kehadiranmu: "Aku di sini ya." 🌸

---

## PAGE 17 — All 16 Types Gallery (optional but recommended)

**EN**
- H2: **The whole bakery 🧺**
- Intro: Tap any treat to peek at its personality. Which one is your partner? Send them the quiz and find out.
- CTA under grid: **Send the quiz to someone**

**ID**
- H2: **Satu toko roti lengkap 🧺**
- Intro: Tap kue mana pun buat ngintip kepribadiannya. Pasangan kamu tim apa? Kirim quiz-nya, buktiin.
- CTA under grid: **Kirim quiz ke seseorang**

---

## PAGE 18 — End Page (closing dialogue) — NOT SHIPPED

Removed from the build on 2026-08-02: the journey now ends on the result page,
so nothing routes here. The copy is kept on record in case the closing beat is
ever wanted somewhere else.

**EN**
- H2: **Every bake rises differently 🍞**
- Body: Planner or go-with-the-flow, talker or doer — the main ingredient was never in question: **you love your kid.** That's the whole recipe.
- [OPTIONAL founder note]: *Psst — real talk from Christine: I made this quiz between school runs and deadline panic. If it made you smile, share it with a parent friend who could use one today.* 🤍
- CTA 1 (primary): **Explore activities for your style**
- CTA 2: **Follow @parenteers**
- CTA 3: **Share with a parent friend**
- CTA 4 (text link): Retake the quiz
- Footer line 1: For fun & reflection — not a clinical assessment or diagnostic tool.
- Footer line 2: Made with ❤️ (and cold coffee) by Parenteers · © Parenteers {year}

**ID**
- H2: **Setiap adonan mengembang dgn caranya sendiri 🍞**
- Body: Mau kamu tim planner atau tim spontan, tim ngobrol atau tim gercep — bahan utamanya gak pernah diragukan: **kamu sayang anakmu.** Itu inti resepnya.
- [OPTIONAL founder note]: *Psst — jujur dr Christine: quiz ini dibuat di sela antar-jemput & kejar deadline. Kalau bikin kamu senyum, share ke teman sesama orang tua yg lagi butuh senyum hari ini.* 🤍
- CTA 1 (primary): **Intip aktivitas yg cocok buat gaya kamu**
- CTA 2: **Follow @parenteers**
- CTA 3: **Share ke teman sesama orang tua**
- CTA 4 (text link): Ulangi quiz
- Footer line 1: Buat seru-seruan & refleksi — bukan penilaian klinis maupun alat diagnosis.
- Footer line 2: Dibuat dgn ❤️ (dan kopi yg keburu dingin) oleh Parenteers · © Parenteers {year}

---

## Copy rules applied throughout (QA checklist)
1. Warmth is never scored — no result implies loving less.
2. One watch-out per type, superpower-shadow framing, always with a doable tip.
3. Humor targets the parent experience (cold coffee, cardboard boxes), never the child.
4. Equal compliment density across all 16 types.
5. No overpromising language; credentials appear naturally mid-flow, never as openers.
6. ID voice: conversational, natural abbreviations (yg, dr, tp, gak), short rhythmic sentences. EN voice: simple structures, accessible to Indonesian readers.
