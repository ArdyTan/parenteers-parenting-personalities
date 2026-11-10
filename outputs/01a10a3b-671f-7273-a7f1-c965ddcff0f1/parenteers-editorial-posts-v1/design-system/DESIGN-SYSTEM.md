# Parenteers — Design System Post Editorial

Versi 1.0 · 6 Oktober 2026 · Contoh untuk review kreatif.

## Arah visual

Headline serif besar, ilustrasi tinta biru dengan cross-hatching, sedikit aksen
orange, dan ruang kosong yang lega. Mengambil prinsip komposisi dari dua referensi
yang diberikan Ardy, lalu menerapkannya pada keseharian parents. Gambar surfer,
logo, copy, dan identitas referensi tidak dipakai dalam contoh.

## Frame dan grid

| Token | Nilai |
|---|---|
| Frame | 1080 × 1350 px |
| Grid | 90 × 90 px, 12 kolom × 15 baris |
| Margin aman | 90 px di kiri, kanan, atas, bawah |
| Area konten | x 90–990, y 90–1260; 900 × 1170 px |
| Metadata | x 90, y 90; lebar 900, tinggi 90 |
| Headline | x 90, y 180; lebar 900, tinggi 270 |
| Ilustrasi | x 90, y 450; lebar 900, tinggi 540 |
| Body / ajakan | x 90, y 1035; lebar 900, tinggi 135 |
| Footer | x 90, y 1208; lebar 900, tinggi 52 |

Grid mengatur frame, batas, dan proporsi komponen. Baseline teks dan detail gambar
boleh memakai optical adjustment di dalam komponen. Garis grid dan bingkai orange
pada `grid-example` adalah panduan kerja, bukan bagian PNG produksi.

Semua foreground, termasuk logo dan footer, harus berada dalam area aman.
Background boleh memenuhi frame. Pada carousel, posisi metadata, headline, body,
dan footer dipertahankan; hanya isi serta ilustrasinya berganti.

## Warna

| Role | Nilai | Penggunaan |
|---|---|---|
| Blue | #182799 | Headline, body, garis ilustrasi, logo |
| Orange | #E86811 | Satu baris penekanan atau detail utama ilustrasi |
| Canvas | #F0F1F5 | Latar post dan ruang kosong |
| Bright Blue | #3073E9 | Token brand tambahan; tidak diperlukan pada contoh ini |

Warna berasal dari registry brand proyek. Hindari menambah warna karakter lain
pada seri ini tanpa kebutuhan konten. Teks kecil memakai deep blue; orange untuk
aksen yang cukup besar. Raster GPT Image mengikuti palet lewat prompt; variasi
warna piksel pada hatching tidak menjadi nilai token baru.

## Tipografi

| Style | Font | Weight | Size / line height | Tracking |
|---|---|---:|---|---|
| Display | Fraunces | 500 | 98 / 94 px | −3 px |
| Body | Plus Jakarta Sans | 400 | 30 / 42 px | 0 |
| Metadata | Plus Jakarta Sans | 600 | 22 px | 2 px |
| Ajakan | Plus Jakarta Sans | 400 | 25 px | 0 |
| Footer | Plus Jakarta Sans | 400 | 22 px | 0 |
| Disclaimer | Plus Jakarta Sans | 400 | 19 px | 0 |

Fraunces dan Plus Jakarta Sans adalah pasangan font implementasi proyek, bukan
spesifikasi typography resmi dari paket brand. File dan lisensi OFL disertakan
untuk master lokal. Wordmark selalu memakai asset resmi, tidak diketik ulang.

Headline dua atau tiga baris; pendek dan berbicara tentang satu situasi.
Body maksimal dua baris pada contoh. Ajakan dan disclaimer tambahan hanya pada
slide kuis. Jika copy lebih panjang, ubah pemenggalan atau gunakan slide lanjutan,
bukan mengecilkan semua tipe secara otomatis.

## Komponen

- Metadata: nama seri kiri, posisi carousel kanan. Nomor mengacu ke urutan 01–03.
- Headline: serif terpusat, biru. Satu baris orange boleh menjadi penekanan.
- Ilustrasi: satu subjek/metafora utama. Kontur biru, hatching, orange pada detail.
- Body: kalimat keseharian atau bahan refleksi, bukan penilaian orang tua.
- Ajakan: satu tindakan yang jelas. Contoh kuis memakai link bio @parenteers.
- Footer: wordmark resmi kiri, @parenteers kanan, seluruhnya dalam margin aman.

## Dua metode produksi

### SVG tanpa image generation

Kontur, hatching, objek, dan layout dibuat lewat kode SVG. Grup utama bernama
`metadata`, `headline`, `illustration`, `body`, `cta`, dan `brand-footer`.
Ilustrasi menjadi path dan bentuk vector yang bisa disunting. Logo resmi tetap
berupa image yang terpisah. Tidak ada image generation pada ilustrasi versi ini.

### GPT Image dengan layout lokal

Tiga ilustrasi dibuat melalui tool built-in `image_gen`, disimpan sebagai PNG
dengan alpha, lalu ditempatkan pada komponen ilustrasi. Tipografi, metadata,
headline, logo, body, dan ajakan tetap berada pada layer SVG terpisah. Raster
ilustrasi tidak berubah menjadi path editable secara otomatis.

Pastry pada gambar booklet adalah ilustrasi umum untuk konsep marketing,
bukan pengganti atau rekonstruksi 16 karakter resmi Parenting Bakes.

## Menggunakan di Figma

1. Import atau drag SVG dari folder `vector/` atau `gpt-image/` ke Figma.
2. Frame SVG sudah 1080 × 1350. Periksa ukuran setelah import.
3. Atur layout grid Square dengan Size 90; gunakan margin 90 sesuai tokens.
4. Cocokkan font dengan Fraunces dan Plus Jakarta Sans pada lingkungan Figma.
   Penanganan SVG text/font dapat berbeda menurut importer. Jika text diubah
   menjadi path atau font embedded diabaikan, gunakan `copy.json` untuk membuat
   text layer native dengan nilai style di atas.
5. Pada versi GPT, tempatkan kembali PNG `assets/gpt-*.png` bila image embedded
   tidak dibaca importer. Konten PNG dan logo sudah tersedia sebagai asset terpisah.

Import native Figma belum diuji pada sesi ini. PNG adalah hasil render Chrome
dengan font proyek yang berhasil dimuat; SVG dan HTML adalah master lokal.

## Konten dan penggunaan

Tiga contoh: kopi yang belum diminum, tas barang cadangan, dan ajakan mencari kue.
Post dapat berdiri sendiri dengan captionnya, atau menjadi rangkaian carousel
dari pengenalan keseharian menuju kuis. Ini bukan revisi final carousel C01–C16
yang tetap memakai delapan slide per personality.

`captions.md` berisi caption dan alt text. Disclaimer: “Buat seru-seruan & refleksi;
bukan tes klinis.” Arah CTA tetap ke halaman awal kuis. Untuk produksi, pastikan
link bio benar-benar menuju quiz.parenteers.id sebelum menggunakan wording itu.

## Pemeriksaan

- Enam PNG post 1080 × 1350.
- Semua elemen foreground post berada dalam batas x 90–990 dan y 90–1260.
- Font proyek berhasil dimuat pada render lokal.
- Preview lokal memuat enam post dan toggle grid pada lebar 1280 dan 390.
- Grid overlay tidak dimasukkan dalam PNG post produksi.
- Review kreatif Ardy, keterbacaan setelah kompresi Instagram, dan import native
  Figma masih perlu dilakukan. Tidak ada posting, upload Drive, atau publish Figma.

Sumber: dua referensi visual Ardy; `src/core/brand.ts`; `docs/design-tokens.md`;
bank konten dan strategi marketing v2 proyek. Prompts generasi disertakan pada
`image-prompts.json` di root paket.
