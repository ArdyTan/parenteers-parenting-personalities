# Quiz Web App — UI Strings (EN · ID)
**Project:** Parenteers Parenting Bakes Quiz (working title)
**File 2 of 3** · Companions: `quiz-01-flow-dialogue.md` (page content) · `images/old images/quiz-03-image-prompts.md` (archived illustration prompts) · `images/README.md` (delivered asset inventory/order)
**Status:** v1.0 — i18n-ready string table

**Dev notes:**
- Keys are stable identifiers, ready to convert to JSON (`en.json` / `id.json`).
- Default locale: **id**. Toggle persists (localStorage-equivalent per stack; in-memory if artifact preview).
- `{n}`, `{total}`, `{type}`, `{emoji}`, `{link}`, `{year}`, `{lang}` are interpolation variables.
- Page-specific content (scenarios, result copy, end-page body) lives in File 1 — do not duplicate here.

## Global & Navigation

| Key | EN | ID |
|---|---|---|
| `nav.lang_toggle_label` | Language | Bahasa |
| `nav.lang_en` | EN | EN |
| `nav.lang_id` | ID | ID |
| `nav.back` | Back | Kembali |
| `nav.next` | Next | Lanjut |
| `nav.continue` | Continue | Lanjutkan |
| `nav.close` | Close | Tutup |
| `nav.home` | Home | Beranda |
| `nav.sound_label` | Sound | Suara |

## Landing

| Key | EN | ID |
|---|---|---|
| `landing.cta_start` | Start the Quiz | Mulai Quiz |
| `landing.meta_time` | 3 minutes | 3 menit |
| `landing.meta_questions` | 12 questions | 12 pertanyaan |
| `landing.meta_share` | IG-story-ready result | Hasil siap di-share ke IG Story |
| `landing.by_brand` | by Parenteers | by Parenteers |

## Intro

| Key | EN | ID |
|---|---|---|
| `intro.cta_begin` | Let's bake | Gas, mulai! |
| `intro.disclaimer_short` | For fun & reflection — not a clinical assessment. | Buat seru-seruan & refleksi — bukan penilaian klinis. |

## Quiz Screens

| Key | EN | ID |
|---|---|---|
| `quiz.progress` | Question {n} of {total} | Pertanyaan {n} dr {total} |
| `quiz.select_hint` | Tap the answer that feels most like you | Pilih jawaban yg paling "kamu banget" |
| `quiz.answer_a_label` | A | A |
| `quiz.answer_b_label` | B | B |
| `quiz.change_answer` | Change answer | Ubah jawaban |
| `quiz.exit_confirm_title` | Leave the quiz? | Keluar dr quiz? |
| `quiz.exit_confirm_body` | Your answers won't be saved. | Jawaban kamu gak akan tersimpan. |
| `quiz.exit_confirm_stay` | Keep going | Lanjut aja |
| `quiz.exit_confirm_leave` | Leave | Keluar |

## Loading / Calculating

| Key | EN | ID |
|---|---|---|
| `loading.title` | Baking your result… | Lagi manggang hasil kamu… |
| `loading.a11y` | Calculating your result | Menghitung hasil kamu |

## Result Page

| Key | EN | ID |
|---|---|---|
| `result.intro_label` | You are… | Kamu adalah… |
| `result.story_label` | An everyday story | Cerita sehari-hari |
| `result.summary_label` | What to remember | Yang perlu kamu ingat |
| `result.real_life_label` | What often happens | Yang sering terjadi |
| `result.guilt_release_label` | Release the guilt | Lepaskan rasa bersalah |
| `result.care_for_you_label` | For you first | Untuk kamu dulu |
| `result.for_child_label` | Then, for your child | Lalu, untuk anakmu |
| `result.try_this_week_label` | Try this week | Coba minggu ini |
| `result.superpowers_label` | Your superpowers | Superpower kamu |
| `result.watchout_label` | Watch-out, with love | Watch-out, with love |
| `result.popcousin_label` | Your pop-culture cousin | Sepupu pop-culture kamu |
| `result.other_types_label` | Meet the other bakes | Kenalan sm bake lainnya |
| `result.share_ig` | Share to IG Story | Share ke IG Story |
| `result.save_image` | Save result card | Simpan kartu hasil |
| `result.copy_link` | Copy link | Salin link |
| `result.copied` | Link copied! | Link tersalin! |
| `result.see_all` | See all 16 types | Lihat semua 16 tipe |
| `result.retake` | Retake the quiz | Ulangi quiz |
| `result.activities_cta` | Explore Parenteers activities | Intip aktivitas Parenteers |
| `result.your_code` | Your code | Kode kamu |
| `result.scroll_hint` | Scroll to continue | Scroll untuk lanjut |

## Gallery

| Key | EN | ID |
|---|---|---|
| `gallery.title` | The whole bakery 🧺 | Satu toko roti lengkap 🧺 |
| `gallery.your_type_badge` | Your type | Tipe kamu |
| `gallery.send_quiz` | Send the quiz to someone | Kirim quiz ke seseorang |
| `gallery.back_to_result` | Back to my result | Balik ke hasilku |

## End Page — retired

The `/end` page was removed on 2026-08-02; the journey now ends on the result.
Its four CTA strings are no longer shipped, and the closing dialogue itself
remains on record in `quiz-01-flow-dialogue.md` §PAGE 18.

## Desktop Gate

The QR gate a desktop visitor sees instead of the quiz. It has no page in
`quiz-01-flow-dialogue.md`, so unlike every other row in this file these four were written
for the layout rather than transcribed. **All four are placeholders awaiting a copy pass.**

| Key | EN | ID |
|---|---|---|
| `gate.scan_title` | Scan to start on your phone | Scan buat mulai di HP |
| `gate.scan_hint` | Open your phone camera and point it here. | Buka kamera HP kamu, arahin ke kode ini. |
| `gate.reason` | This quiz is built for phone screens, so the result card fits an IG Story. | Quiz ini dibuat buat layar HP, biar kartu hasilnya pas dipajang di IG Story. |
| `gate.continue_anyway` | Continue on this screen | Lanjut di layar ini aja |

The gate also reuses `landing.eyebrow`, `landing.h1`, `landing.subtitle`, `landing.meta_time`,
`landing.meta_questions` and `landing.meta_share` verbatim.

## Share Sheet

| Key | EN | ID |
|---|---|---|
| `share.title` | Share your bake | Share kue kamu |
| `share.caption_template` | I'm {type} {emoji} — my parenting style as a bake. What's yours? {link} | Aku {type} {emoji} — gaya parenting-ku versi kue. Kamu tim apa? {link} |
| `share.whatsapp` | WhatsApp | WhatsApp |
| `share.instagram` | Instagram | Instagram |
| `share.other` | More options | Opsi lain |
| `share.card_cta` | Want yours too? Head to | Mau juga? Langsung aja ke |

The ID line of `share.card_cta` is transcribed from `images/Result Card.jpg`, which is the
result card's visual source. That artwork has no English counterpart, so the EN column is a
working placeholder awaiting a copy pass. It is drawn on the shareable card only, directly
above `quiz.parenteers.id`.

## Footer & Legal

| Key | EN | ID |
|---|---|---|
| `footer.disclaimer` | For fun & reflection — not a clinical assessment or diagnostic tool. | Buat seru-seruan & refleksi — bukan penilaian klinis maupun alat diagnosis. |
| `footer.made_by` | Made with ❤️ (and cold coffee) by Parenteers | Dibuat dgn ❤️ (dan kopi yg keburu dingin) oleh Parenteers |
| `footer.copyright` | © Parenteers {year} | © Parenteers {year} |
| `footer.privacy` | Privacy | Privasi |

## Errors & Edge States

| Key | EN | ID |
|---|---|---|
| `error.generic` | Oops, something got burnt. Please try again. | Ups, ada yg gosong. Coba lagi ya. |
| `error.offline` | You're offline. Your dough is safe — reconnect to continue. | Kamu lagi offline. Adonanmu aman — sambungkan lagi utk lanjut. |
| `error.save_failed` | Couldn't save the image. Try screenshotting instead. | Gambar gagal tersimpan. Coba screenshot aja dulu. |
| `error.retry` | Try again | Coba lagi |
| `error.notfound_title` | This page got eaten 🍪 | Halaman ini keburu dimakan 🍪 |
| `error.notfound_cta` | Back to the bakery | Balik ke toko roti |

## Meta / SEO / Social Preview

| Key | EN | ID |
|---|---|---|
| `meta.title` | Which Bake Is Your Parenting Style? — Parenteers Quiz | Gaya Parenting Kamu, Roti atau Kue Apa? — Quiz Parenteers |
| `meta.description` | 16 parenting personalities, from lapis legit to lava cake. 12 questions, 3 minutes, zero judgment. | 16 kepribadian parenting, dr lapis legit sampai lava cake. 12 pertanyaan, 3 menit, tanpa penghakiman. |
| `meta.og_title` | I found my parenting bake 🍞 What's yours? | Aku udah nemu "kue parenting"-ku 🍞 Kamu tim apa? |
| `meta.og_description` | Take the 3-minute Parenteers quiz. | Ikutan quiz 3 menit dr Parenteers. |

## Accessibility (a11y)

| Key | EN | ID |
|---|---|---|
| `a11y.progressbar` | Quiz progress: question {n} of {total} | Progres quiz: pertanyaan {n} dr {total} |
| `a11y.type_illustration_alt` | Cute illustration of {type}, a parenting-style bake character | Ilustrasi lucu {type}, karakter kue gaya parenting |
| `a11y.lang_switch` | Switch language to {lang} | Ganti bahasa ke {lang} |
| `a11y.loading` | Loading, please wait | Memuat, mohon tunggu |
| `a11y.sound_on` | Turn sound on | Nyalakan suara |
| `a11y.sound_off` | Turn sound off | Matikan suara |

---

## Localization QA notes
1. ID strings intentionally use conversational register (yg, dr, tp, gak) — matches @parenteers/@christine.yunita voice. Do not "formalize" during dev.
2. `Watch-out, with love` stays in English in the ID interface on purpose (brandable label, familiar to the IG audience). If a full-ID variant is preferred later: `Catatan sayang`.
3. Keep emoji inside strings — they are part of the copy, not decoration.
4. EN uses simple sentence structures by design (accessible to Indonesian readers using the EN toggle).
5. Interpolation variables must never be translated or reordered without updating the template logic.
