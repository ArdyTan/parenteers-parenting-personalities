import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';
const root='/home/ardy/dev/parenteers-parenting-personalities';
const dir=new URL('.',import.meta.url);
const md=await fs.readFile(`${root}/docs/marketing/instagram-threads-content-bank.md`,'utf8');
const old=JSON.parse(await fs.readFile(new URL('source-data.json',dir),'utf8'));
const types=JSON.parse(await fs.readFile(`${root}/src/data/types.json`,'utf8'));
const clean=s=>s.replace(/\*\*/g,'').replace(/^>\s?/gm,'').trim();
const sections={};
for(const m of md.matchAll(/^## (L0|C\d{2}|F01|R\d{2}|S01|Z01) — ([^\n]+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)) sections[m[1]]={title:m[2],body:m[3]};
const order=['L0','F01','R02','C01','C02','R01','C03','C04','C05','C06','R03','C07','C08','C09','S01','C10','C11','C12','R04','C13','C14','C15','C16','Z01'];
if(Object.keys(sections).length!==24) throw Error('Expected 24 content sections');
const quiz='https://quiz.parenteers.id/';
const disclaimer='Buat seru-seruan & refleksi; bukan tes klinis.';
const byCode=Object.fromEntries(types.map((t,i)=>[`C${String(i+1).padStart(2,'0')}`,t]));
const angle=c=>c==='L0'?'Penasaran kue':c==='F01'||c==='R02'||c==='Z01'?'Cerita nyata':c==='R01'?'Manfaat hasil':c==='R03'?'Obrolan pasangan':c==='R04'?'Humor keseharian':'Merasa dipahami';
const carousel=[];
const hooks={};
for(const code of order.filter(c=>!['F01','R01','R02','R03','R04','Z01'].includes(c))){
 let slides=[];
 if(code==='L0') slides=[...sections[code].body.matchAll(/^\| (\d+) \| (.+) \|$/gm)].map(m=>[Number(m[1]),clean(m[2])]);
 else slides=[...sections[code].body.matchAll(/^\*\*Slide (\d+):\*\* (.+)$/gm)].map(m=>[Number(m[1]),clean(m[2])]);
 if(code.startsWith('C')&&slides.length!==8) throw Error(`Eight slides required: ${code}`);
 hooks[code]=slides[0][1];
 for(const [number,text] of slides){
  let upgraded=text;
  if(code.startsWith('C')&&number===7) upgraded='Cari kuemu lewat 12 pertanyaan keseharian di link bio @parenteers. Di hasilnya, ada bahan refleksi dan booklet berisi ide merawat diri serta aktivitas bareng anak.';
  if(code==='L0'&&number===10) upgraded=`Ada yg terasa familiar? Cari kuemu lewat 12 pertanyaan di link bio @parenteers. Di hasilnya ada bahan refleksi dan booklet aktivitas. ${disclaimer}`;
  carousel.push([code,byCode[code]?.code||'',byCode[code]?.name.id||sections[code].title,number,upgraded,'@parenteers · quiz.parenteers.id',number===1||number===slides.length?'Parenting Bakes by Parenteers':'','Bank naskah terbaru; CTA diperbarui 6 Oktober 2026']);
 }
}
Object.assign(hooks,{F01:'Kenalan dulu, sebelum ngomongin kuenya.',R02:'Aku coba kuisnya. Ini hasil asliku.',R01:'Kopinya belum diminum. Giliranmu kapan?',R03:'Satu butuh rencana. Satu butuh ruang berubah.',R04:'Cuma keluar sebentar. Kok bolak-balik pintu?',Z01:'Sudah ketemu kuemu? Bawa satu hal ke keseharian.'});
const captions=[],threads=[];
for(const code of order){
 const body=sections[code].body;
 const cap=body.match(/\*\*Caption[^\n]*\*\*\s*\n([\s\S]*?)(?=\*\*Threads)/);
 if(!cap)throw Error(`Missing caption ${code}`);
 let text=clean(cap[1]);
 if(code.startsWith('C')){
  text=text.replace(/(?:Cari karakter[^\n]*|Cari kuemu[^\n]*|Coba (?:12 pertanyaan|kuis)[^\n]*)\s*$/,'').trim();
  text+=`\n\nCari kuemu lewat 12 pertanyaan di link bio @parenteers. Di hasilnya ada bahan refleksi dan booklet dengan ide merawat diri serta aktivitas bareng anak.\n\n${disclaimer}`;
 }
 if(code==='L0')text=`Ada yg sayangnya lewat bekal cadangan. Ada yg lewat pelukan panjang. Kalau cara parenting kamu jadi kue, kira-kira kamu yg mana?\n\nJawab 12 pertanyaan keseharian. Setelah ketemu karakter kuemu, kamu bisa membaca bahan refleksi dan booklet berisi ide merawat diri serta aktivitas bareng anak.\n\nCari kuemu lewat link bio @parenteers. Parenting Bakes by Parenteers.\n\n${disclaimer}`;
 if(code==='R01')text=`Kopinya satu. Percobaan meminumnya beberapa kali.\n\nAda banyak hal kecil yg kamu urus sebelum ingat giliranmu. Parenting Bakes mengajak kamu melihat kebiasaanmu sebagai orang tua lewat 12 pertanyaan.\n\nDi hasilnya, ada karakter kue, bahan refleksi, dan booklet dengan ide merawat diri serta aktivitas bareng anak. Ambil yg sesuai keadaanmu.\n\nCoba lewat link bio @parenteers. ${disclaimer}`;
 if(code==='Z01')text=`Setelah ketemu kuemu, pilih satu bagian yg terasa dekat. Bisa tentang apa yg sudah kamu lakukan, atau kebutuhanmu yg belakangan terlupakan.\n\nBooklet di hasil kuis berisi ide merawat diri dan aktivitas bareng anak. Pilih yg sesuai keadaanmu; kegiatan boleh dilewati.\n\nChristine Yunita (@christine.yunita), orang di balik Parenteers, mengajak kita ngobrol dari sana. Kalau belum coba, cari kuemu lewat link bio @parenteers.\n\n${disclaimer}`;
 const placeholders=[...text.matchAll(/\[[^\]]+\]/g)].map(m=>m[0]).join('; ');
 captions.push([code,code.startsWith('C')||code==='L0'||code==='S01'?'Carousel':'Reel',byCode[code]?.name.id||sections[code].title,text,'#ParentingBakes #Parenteers',placeholders,'Bank naskah terbaru; revisi manfaat hasil 6 Oktober 2026']);
 const parts=[...body.matchAll(/\*\*Threads ([12])\/2[^\n]*\*\*\s*\n([\s\S]*?)(?=\*\*Threads|\n---|$(?![\s\S]))/g)].map(m=>[Number(m[1]),clean(m[2])]);
 if(parts.length!==2)throw Error(`Missing Threads pair: ${code}`);
 for(let [number,text]of parts){
  if(number===2)text=code.startsWith('C')?`Kebiasaan ini mungkin terasa dekat dengan ${byCode[code].name.id}. Satu kejadian belum menentukan hasilmu. Cari kuemu lewat 12 pertanyaan. Di hasilnya ada refleksi dan booklet aktivitas: ${quiz}`:code==='R03'?`Coba Parenting Bakes sendiri-sendiri, lalu ngobrol dari bagian yg terasa dekat. Gak ada skor kecocokan atau fitur perbandingan otomatis. Mulai di sini: ${quiz}`:`Parenting Bakes by Parenteers: 12 pertanyaan keseharian, karakter kue, bahan refleksi, dan booklet aktivitas. Buat seru-seruan & refleksi; bukan tes klinis. Cari kuemu: ${quiz}`;
  threads.push([code,number,text,number===1?'Percakapan':'Mulai kuis',[...text.matchAll(/\[[^\]]+\]/g)].map(m=>m[0]).join('; '),'Bank naskah terbaru; CTA diperbarui 6 Oktober 2026']);
 }
}
const reels=old.Reels.slice(4).filter(r=>r[0]&&r[0]!=='R01').map(r=>r.slice(0,8));
reels.push(...[
 ['0–4 dtk','Tangan menaruh cangkir. Teks: Kopinya belum diminum.','Kopinya belum diminum. Kamu sudah ngurus berapa hal?'],
 ['4–10 dtk','Tangan menyiapkan botol, tas, lalu kembali ke cangkir.','Ada banyak hal kecil yg kamu urus sebelum ingat giliranmu.'],
 ['10–16 dtk','Screen recording 12 pertanyaan dan satu hasil nyata.','Parenting Bakes mengajak kamu kenalan lagi dengan kebiasaanmu lewat 12 pertanyaan.'],
 ['16–23 dtk','Buka booklet milik hasil nyata. Tunjukkan satu bagian merawat diri.','Di hasilnya ada bahan refleksi dan booklet dengan ide merawat diri serta aktivitas bareng anak.'],
 ['23–28 dtk','Kartu akhir: Cari kuemu. Link bio @parenteers.','Cari kuemu lewat link bio @parenteers. Buat seru-seruan & refleksi.']
].map(([time,visual,spoken])=>['R01','Kopi dan giliran orang tua','Utama',time,visual,spoken,'Screen recording asli; cek PDF terbuka di HP sebelum merekam.','Revisi 6 Oktober 2026']));
for(const r of reels){if(r[0]==='R02')r[6]=`${r[6]||''} Isi hasil dan reaksi asli Christine; bila belum tersedia, geser tayang dan jangan mengarang hasil.`.trim();if(r[0]==='Z01')r[7]='Bank naskah terbaru; pilih satu versi berdasarkan bahan nyata';}
reels.sort((a,b)=>order.indexOf(a[0])-order.indexOf(b[0]));
const feedDays=order.map((code,i)=>({code,day:Math.floor(i/4)*7+[1,3,5,7][i%4]}));
const feedMap=Object.fromEntries(feedDays.map(d=>[d.day,d.code]));
const off={
2:['WA01','Hari ini kamu butuh didengar soal apa?','Gak harus ada cerita besar. Satu hal kecil yg terasa berat juga boleh diakui.','Hari ini kamu butuh apa?','Undang 5 parents yg dikenal; gunakan angle penasaran kue.'],
4:['WA02','Setelah ngurus semua, kamu sempat cek tenagamu?','Kamu juga punya kebutuhan. Kuis ini mengajak melihat kebiasaanmu dengan ringan.','Cari kuemu','Undang 5 parents berbeda dengan angle merasa dipahami.'],
6:['WA03','Kalau cara parenting kamu jadi kue, kira-kira apa?','Ada 16 karakter, masing-masing punya kekuatan dan kebutuhan.','Cari kuemu','Undang 5 parents berbeda dengan angle humor keseharian.'],
9:['WA04','Sudah baca hasilmu? Bagian mana yg terasa dekat?','Hasilnya boleh jadi bahan obrolan. Kamu gak harus cocok dengan setiap kalimat.','Cerita kalau mau','Follow-up peserta awal sekali bila mereka setuju; undang 5 parents dengan pesan yg diperjelas.'],
11:['WA05','Di hasil kuis ada booklet. Kamu sudah sempat buka?','Ada ide merawat diri dan aktivitas bareng anak. Ambil yg sesuai keadaanmu.','Cari kuemu','Undang 5 parents berbeda dengan angle manfaat hasil; catat apakah bonus ini menarik.'],
13:['EV01','Apa yg membuat kamu ingin mencoba kuisnya?','Mungkin penasaran kuenya, mungkin ada cerita yg terasa dekat.','Bagian mana yg bikin penasaran?','Evaluasi 25 undangan, mulai/selesai menurut peserta, dan penyebab berhenti.'],
16:['CM01','Di rumahmu, siapa yg biasa siapin barang cadangan?','Cara perhatian bisa beda-beda. Satu kebiasaan belum menentukan karakter.','Cari kuemu','Minta izin satu admin komunitas yg dikenal; kirim WA06 bila disetujui.'],
18:['FB01','Ada bagian hasil yg kurang cocok?','Boleh kok. Ambil yg membantu kamu refleksi, sisanya gak perlu dipaksakan.','Bagian mana yg kurang cocok?','Catat feedback tanpa menyimpulkan tipe dari komentar.'],
20:['SH01','Kalau pasanganmu ikut coba, kira-kira sama atau beda?','Masing-masing jawab sendiri, lalu ngobrol dari satu bagian hasilnya.','Cari kuemu','Bagikan contoh undangan pasangan; belum ada fitur compare otomatis.'],
23:['PD01','Hari ini kamu bisa bikin satu hal lebih sederhana?','Kalau sudah punya booklet, pilih satu ide yg sesuai tenaga dan keadaanmu.','Cari kuemu','Tanyakan manfaat booklet kepada peserta yg bersedia; jangan mewajibkan aktivitas.'],
25:['RP01','Setelah ketemu kuemu, ada satu kalimat yg kamu ingat?','Boleh tentang kekuatanmu, boleh tentang kebutuhan yg ingin kamu jaga.','Kalimat mana yg kamu ingat?','Minta izin sebelum repost cerita asli; bila belum ada, pakai refleksi brand ini.'],
27:['EV02','Cara pulih tiap orang bisa beda. Kamu biasanya gimana?','Ada yg pengin ngobrol. Ada yg pengin sendiri sebentar.','Kamu pulihnya lewat apa?','Evaluasi minggu 3–4; pilih pesan untuk diulang, bukan tipe untuk diunggulkan.'],
30:['PD02','Booklet gak harus dibaca atau dikerjakan sekaligus.','Pilih satu bagian yg terasa berguna. Kegiatan boleh dilewati.','Cari kuemu','Demokan cara menemukan booklet pada hasil asli tanpa menampilkan data pribadi.'],
32:['CM02','Mau bikin pembuka obrolan saat ketemu parents lain?','Masing-masing coba kuis, lalu cerita satu bagian hasil yg terasa dekat.','Cari kuemu','Tawarkan sesi ringan ke komunitas bila admin mengizinkan; jangan menjanjikan acara yg belum ada.'],
34:['FB02','Setelah coba, kamu ingin mengajak siapa?','Pasangan, teman, atau gak siapa-siapa dulu. Berbagi tetap pilihan.','Apa alasanmu ingin mengajak?','Kumpulkan alasan mengajak atau enggan mengajak; tanyakan sekali, tanpa tuntutan tag.'],
37:['SH02','Cara sayang kita kadang kelihatan dari hal kecil.','Ajak satu orang dekat mencoba kalau kamu ingin ngobrol dari hasilnya.','Cari kuemu','Sediakan teks WA07 agar peserta dapat mengundang sendiri.'],
39:['RP02','Dari hasil kuismu, bagian apa yg mau kamu bawa ke minggu depan?','Satu hal kecil cukup. Gak perlu mengubah seluruh rutinitas.','Satu hal yg ingin kamu jaga?','Gunakan cerita asli dengan izin, atau pertanyaan brand ini bila belum ada cerita.'],
41:['EV03','Apa yg paling kamu ingat dari Parenting Bakes?','Kuemu, satu refleksi, atau ide di booklet?','Apa yg terasa berguna?','Evaluasi 6 minggu: pesan, kanal, penyelesaian yg benar-benar tercatat, kapasitas tim.']
};
const calendar=[],stories=[];
for(let day=1;day<=42;day++){
 const code=feedMap[day],o=off[day],week=Math.ceil(day/7),id=`D${String(day).padStart(2,'0')}`;
 const action=code==='R02'?'Rekam dan tinjau hasil asli Christine sebelum tayang.':code==='F01'?'Christine meninjau dan merekam pengantar.':code==='Z01'?'Pilih versi Z01 sesuai bahan nyata; Christine meninjau rekaman.':code?'Terbitkan feed; pakai dua Threads dan tiga panel Story terkait.':o[4];
 const goal=code?'Mulai kuis':o[3]==='Cari kuemu'?'Mulai kuis':day===13||day===27||day===41?'Belajar dari respons':'Percakapan';
 calendar.push([day,week,null,code||o[0],code?(code.startsWith('C')||code==='L0'||code==='S01'?'Carousel':'Reel'):'Story dan aktivitas tim',code?hooks[code]:o[1],goal,day<=14?'Pilot terbatas':day<=28?'Komunitas dan manfaat':'Cerita dan undangan',action,code==='R02'||code==='F01'||code==='Z01'?'Christine dan tim konten':'Tim konten / komunitas',code?'Threads + Story':day===13||day===27||day===41?'Evaluasi tanpa feed baru':'Story ringan','Draft']);
 let p1=code?hooks[code]:o[1],p2=code?(byCode[code]?`Hari ini: ${byCode[code].name.id}. Kamu mungkin mengenali sebagian ceritanya. Satu kejadian belum menentukan hasil kuis.`:code==='R02'?'Tampilkan hasil dan satu reaksi asli Christine setelah ia menyetujuinya.':code==='R01'?'Di hasil kuis ada refleksi dan booklet dengan ide merawat diri serta aktivitas bareng anak.':code==='R03'?'Masing-masing coba sendiri, lalu ngobrol dari bagian yg terasa dekat. Gak ada skor kecocokan.':'Parenting Bakes by Parenteers. 12 pertanyaan keseharian, 16 karakter kue.'):o[2];
 let p3=code?'Cari kuemu lewat 12 pertanyaan keseharian. Di hasilnya ada bahan refleksi dan booklet aktivitas.':o[3]==='Cari kuemu'?'Kalau ingin kenalan dengan kebiasaanmu, coba 12 pertanyaan Parenting Bakes.':o[3];
 stories.push([day,code||o[0],p1,p2,p3,code||o[3]==='Cari kuemu'?'Cari kuemu':'Balas kalau mau',code||o[3]==='Cari kuemu'?quiz:'',code==='R02'?'Butuh hasil dan reaksi asli Christine':day===25||day===39?'Repost opsional; izin wajib; naskah brand tersedia':'Materi brand; jawaban audiens opsional','@parenteers · quiz.parenteers.id']);
}
const strategy=[
 ['Tujuan','Kalender konten organik enam minggu.','Mulai dan selesai kuis, manfaat hasil, lalu undangan sukarela.','Setiap materi punya satu tujuan tindakan.','Klik, selesai, dan laporan peserta dipisahkan.'],
 ['Positioning','Ternyata, aku ada kuenya.','Kenalan dengan cara kamu hadir sebagai orang tua, lewat 12 pertanyaan dan karakter kue.','Menghubungkan rasa penasaran dengan refleksi diri.','Uji apakah pesan dipahami sebelum memperbesar distribusi.'],
 ['Nilai hasil','Karakter dan bahan refleksi.','Karakter, refleksi, serta booklet merawat diri dan aktivitas bareng anak.','Menjelaskan manfaat setelah orang mencoba.','Tanya kegunaan booklet, bukan hanya apakah diunduh.'],
 ['Urutan awal','Personality serial dominan sejak minggu pertama.','L0, pengantar Christine, hasil aslinya, baru C01.','Memberi konteks dan contoh penggunaan lebih awal.','R02 hanya tayang setelah hasil asli tersedia.'],
 ['Pilot','Evaluasi setelah dua minggu; undangan belum dirinci.','25 undangan yang diusulkan dalam lima kelompok kecil selama 14 hari.','Belajar alasan mulai, selesai, dan berhenti.','Sampel kecil; sinyal kualitatif, bukan bukti statistik.'],
 ['Distribusi','Feed, Story, dan Threads.','Tambahkan undangan personal, admin komunitas, dan obrolan pasangan.','Memakai hubungan nyata yang tersedia.','Izin admin dan persetujuan follow-up; tanpa kiriman massal.'],
 ['Konten harian','24 hari feed, hari kosong untuk respons.','42 agenda: 24 feed, 18 hari Story ringan dan aktivitas tim.','Memberi pegangan harian tanpa 42 desain feed baru.','Empat feed per minggu; hari non-feed boleh tanpa posting bila kapasitas terbatas.'],
 ['Carousel','Workbook lengkap lama masih lima slide per tipe.','16 tipe memakai delapan slide terbaru dan CTA manfaat hasil.','Menyatukan revisi copy dengan strategi baru.','128 slide personality; semua nama/kode cocok dengan registry.'],
 ['Reel manfaat','R01 hanya kopi yang terlupakan.','R01 menunjukkan hasil dan letak booklet setelah hook kopi.','Menghubungkan keseharian dengan tindakan dan manfaat nyata.','Rekam hasil asli dan PDF yang benar-benar terbuka.'],
 ['Berbagi','Story hasil dan identitas brand.','Teks ajakan pasangan/teman dan percakapan dari satu bagian hasil.','Memberi alasan sosial untuk mencoba tanpa tekanan.','Tidak menjanjikan fitur compare, skor pasangan, atau reward referral.'],
 ['Pengukuran','Klik belum dapat disamakan dengan selesai.','Log event dan laporan peserta terpisah; angka kosong sampai ada sumber.','Mencegah klaim konversi tanpa data.','GA4 base tag tercatat; event kuis dan receipt belum dikonfirmasi.'],
 ['Evaluasi','Ritme tetap enam minggu.','Review D13, D27, D41 untuk memperbaiki pesan dan distribusi.','Memakai respons nyata untuk langkah berikutnya.','Ulang pesan yang membawa tindakan, beri ruang setara kepada semua tipe.'],
 ['Skala berikutnya','Produksi seluruh stok editorial.','Selesaikan bahan minggu 1–2, lalu sesuaikan minggu berikutnya.','Mengendalikan beban tim sambil mempertahankan stok 16 karakter.','Budget, akses komunitas, kapasitas, dan tanggal mulai belum diisi.']
];
const community=[
 ['WA01','Parents yang dikenal','Penasaran kue','Kami bikin Parenting Bakes: 12 pertanyaan keseharian, hasilnya karakter kue. Penasaran kalau cara parenting kamu jadi kue, kamu yg mana? Kalau lagi ada ruang, boleh coba: '+quiz,'5 undangan D2','Satu kiriman personal; pilih orang yang memang relevan.'],
 ['WA02','Parents berbeda yang dikenal','Merasa dipahami','Ada banyak hal kecil yg kita urus sebagai orang tua. Parenting Bakes mengajak melihat kebiasaan itu lewat 12 pertanyaan, buat seru-seruan dan refleksi. Kalau lagi ada ruang, boleh coba: '+quiz,'5 undangan D4','Jangan menambahkan diagnosis atau janji perubahan anak.'],
 ['WA03','Parents berbeda yang dikenal','Humor keseharian','Pergi sebentar, isi tas kayak mau menginap. Ada yg begini juga? Kebiasaan sehari-hari jadi bahan kuis Parenting Bakes. Kalau penasaran karakter kuemu, coba di sini: '+quiz,'5 undangan D6','Contoh editorial; satu kebiasaan tidak menentukan tipe.'],
 ['WA04','Parents baru yang dikenal','Pesan yang diperjelas','Kami bikin kuis ringan tentang keseharian jadi orang tua. Ada 12 pertanyaan, karakter kue, dan bahan refleksi. Kalau ingin coba, ini link-nya: '+quiz,'5 undangan D9','Boleh sesuaikan pembuka dengan feedback asli D2–D6.'],
 ['WA05','Parents baru yang dikenal','Manfaat hasil','Parenting Bakes mengajak kenalan dengan kebiasaanmu lewat 12 pertanyaan. Di hasilnya ada karakter kue dan booklet berisi ide merawat diri serta aktivitas bareng anak. Kalau ingin coba: '+quiz,'5 undangan D11','Uji ketertarikan pada booklet; jangan menjanjikan semua ide cocok.'],
 ['WA06','Admin komunitas yang dikenal','Minta izin','Halo, kami dari Parenteers. Kami punya kuis ringan, Parenting Bakes, tentang keseharian jadi orang tua. Ada 12 pertanyaan dan booklet aktivitas di hasilnya. Boleh kami bagikan satu undangan singkat di grup? Ini buat seru-seruan dan refleksi, bukan tes klinis.','D16 bila ada akses','Kirim ke grup hanya setelah admin mengizinkan.'],
 ['WA07','Peserta mengajak pasangan atau teman','Obrolan setelah hasil','Aku dapat [NAMA KUE HASIL SENDIRI] di Parenting Bakes. Ada bagian yg terasa dekat sama hariku. Coba juga kalau mau, penasaran kita mirip atau beda: '+quiz,'D20 / D37','Peserta mengirim sendiri bila mau; tidak perlu mengirim hasil ke tim.'],
 ['WA08','Peserta yang setuju dihubungi kembali','Feedback','Kalau sudah sempat coba, apa yg bikin kamu mulai? Kamu sampai hasil atau berhenti di tengah? Satu bagian yg terasa dekat atau kurang cocok juga boleh diceritakan. Kalau belum sempat, gak apa-apa.','Sekali setelah undangan','Persetujuan follow-up diperlukan; jangan menekan untuk menyelesaikan.'],
 ['CM01','Komunitas / pertemuan parents','Pembuka obrolan','Kalau ada ruang di pertemuan berikutnya, kita bisa coba kuis masing-masing lalu ngobrol dari satu bagian hasil yg terasa dekat. Gak ada tipe terbaik, dan cerita pribadi boleh disimpan sendiri.','Setelah izin penyelenggara','Lokasi dan acara belum ditentukan; tanpa menjanjikan sesi yang belum ada.']
];
const pilot=[
 ['D1','Persiapan','Tim konten','Pastikan link, booklet, materi L0, dan cara mencatat feedback.','Tanggal mulai; zona waktu; kesiapan aset','Ardy memeriksa pengalaman HP dan Instagram yang masih pending.'],
 ['D2','Penasaran kue','Tim komunitas','Undang 5 parents berbeda yang dikenal dengan WA01.','Orang diundang; pesan; alasan mencoba','Nama dan cerita pribadi tidak perlu disimpan.'],
 ['D4','Merasa dipahami','Tim komunitas','Undang 5 parents berbeda dengan WA02.','Alasan mencoba; apakah sampai hasil','Kelompok bisa berbeda karakteristik; hindari klaim perbandingan kausal.'],
 ['D6','Humor keseharian','Tim komunitas','Undang 5 parents berbeda dengan WA03.','Apakah hook membuat ingin mencoba','Tidak menyimpulkan tipe dari satu cerita.'],
 ['D9','Perbaikan pesan','Tim komunitas','Tinjau feedback awal. Undang 5 parents baru dengan pesan yang diperjelas.','Apa yang diubah dan alasan perubahan','Follow-up sebelumnya hanya bila disetujui.'],
 ['D11','Manfaat hasil','Tim komunitas','Undang 5 parents baru dengan WA05.','Apakah booklet menarik; manfaat yang dicari','25 undangan total adalah rencana kerja, bukan peserta yang dijamin.'],
 ['D13','Review pilot','Ardy dan tim','Bandingkan alasan mulai, selesai, berhenti, serta beban produksi.','Sumber angka; feedback anonim; keputusan','Bukan A/B test konklusif; lanjutkan pesan yang punya sinyal tindakan.'],
 ['D14','Keputusan berikutnya','Ardy dan tim','Pilih pesan minggu 3–4, akses komunitas, dan perubahan yang diperlukan.','Pesan yang diulang; hambatan yang diperbaiki','Hentikan klaim/pesan yang membingungkan atau terasa menghakimi.'],
 ['D27','Review kedua','Ardy dan tim','Tinjau partisipasi tercatat, kegunaan booklet, dan undangan sukarela.','Kanal yang benar-benar digunakan','Jangan menggabungkan klik, laporan peserta, dan event.'],
 ['D41','Review enam minggu','Ardy dan tim','Pilih materi yang layak diulang dan kapasitas ritme berikutnya.','Bukti; keputusan; kebutuhan produksi','Iklan atau kerja sama berbayar baru dibahas bila budget dan bukti tersedia.']
];
const rules=[
 ['Nada','Percakapan sehari-hari Indonesia; yg, dr, tp, gak boleh dipakai. Jangan menghakimi atau memberi peringkat.'],
 ['Brand','Parenting Bakes by Parenteers; @parenteers; quiz.parenteers.id. Identitas terlihat pada panel yang mungkin discreenshot.'],
 ['Disclaimer',disclaimer],
 ['CTA','Satu ajakan utama. Feed menuju link bio yang sudah diarahkan ke kuis; Story link jika tersedia; Threads dan WA memakai URL awal kuis.'],
 ['Ilustrasi kejadian','Contoh adalah ilustrasi editorial, bukan pengalaman Christine kecuali ia mengonfirmasi.'],
 ['Christine','Hasil dan reaksinya asli. Placeholder R02 wajib diisi sebelum tayang. Pilih satu versi Z01 sesuai bahan nyata.'],
 ['Berbagi','Sukarela; tidak mensyaratkan follow, tag, share, atau komentar untuk memperoleh hasil dan booklet.'],
 ['Repost','Minta izin, batasi identitas, dan jangan menampilkan nama anak atau cerita sensitif. Materi brand menjadi alternatif bila belum ada kiriman.'],
 ['Pasangan','Masing-masing menjawab sendiri. Belum ada fitur compare otomatis atau skor kecocokan.'],
 ['Booklet','Berisi ide merawat diri dan aktivitas bareng anak. Pilih sesuai keadaan; kegiatan boleh dilewati. Tidak menjanjikan memperbaiki anak.'],
 ['Format produksi','Carousel 1080×1350; Reel dan Story 1080×1920 sebagai ukuran master kerja. Subtitle dan teks terbaca tanpa suara.'],
 ['Ritme','24 feed selama 6 minggu. Agenda non-feed dapat berupa membalas, meminta izin, atau evaluasi tanpa posting baru.'],
 ['Jam tayang','Tanggal mulai dan zona waktu belum disetujui. Jika memakai 20.00, perlakukan sebagai slot percobaan, bukan jam terbaik.'],
 ['Pemeriksaan HP','Pastikan link utama dan PDF terbuka. Ardy masih memegang acceptance revisi app di Instagram dan viewport pendek.'],
 ['Angka','Jangan mengisi metrik dengan perkiraan peserta atau hasil buatan. Kosong berarti belum ada data. Klik tidak sama dengan selesai.'],
 ['Privasi pilot','Catat alasan secara anonim, tanpa nama anak, nomor kontak, atau cerita sensitif. Izin diperlukan untuk follow-up dan penggunaan cerita.']
];
const sources=[
 ['Parenting-Bakes-Semua-Konten-Marketing.xlsx','30 September; wording Molten diperbarui 5 Oktober 2026','Sumber kalender dan naskah Reel lama. Versi lima slide diupgrade pada file baru.',''],
 ['instagram-threads-content-bank.md','Versi lokal 6 Oktober 2026','Sumber C01–C16 delapan slide, caption, Threads, dan aturan editorial.',''],
 ['instagram-threads-launch-plan.md','Disusun 30 September 2026','Sumber kampanye enam minggu dan prinsip distribusi; jadwal baru ada pada workbook ini.',''],
 ['parent-participation-brainstorming-brief.md','5 Oktober 2026','Dasar hipotesis partisipasi, pilot, manfaat hasil, dan undangan sukarela.',''],
 ['types.json','Registry proyek saat penyusunan','Nama dan kode 16 karakter; semua dicek saat generasi.',''],
 ['progress.md','Catatan proyek 6 Oktober 2026','GA4 base tag terpasang; event khusus dan Realtime belum dikonfirmasi. Bukan audit analytics langsung.',''],
 ['Tujuan kuis','Produk','Link awal kuis untuk semua peserta baru.',quiz],
 ['Brand','Produk','Parenteers dan Instagram @parenteers.','https://parenteers.id/'],
 ['Instagram','Akun tujuan','Handle yang digunakan dalam copy.','https://www.instagram.com/parenteers/'],
 ['Data kampanye','Belum tersedia','Workbook berisi rencana kreatif. Tidak ada audit Insights, tren platform, reach, konversi, atau hasil pilot buatan.','']
];
const wb=Workbook.create(), meta=[];
const col=n=>{let s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}return s;};
function tab(name,title,sub,headers,rows,widths){
 const s=wb.worksheets.add(name),last=col(headers.length),end=rows.length+4;
 s.showGridLines=false;s.getRange(`A1:${last}${end}`).format={font:{name:'Arial',size:11,color:'#202B39'},wrapText:true,verticalAlignment:'top'};
 s.getRange('A1').values=[[title]];s.getRange('A1').format={font:{name:'Arial',size:17,bold:true,color:'#182799'},wrapText:false,rowHeight:30};
 s.getRange('A2').values=[[sub]];s.getRange('A2').format={font:{italic:true,color:'#586477'},wrapText:false,rowHeight:25};
 s.getRange('A3').format.rowHeight=12;
 s.getRange(`A4:${last}4`).values=[headers];s.getRange(`A4:${last}4`).format={fill:'#182799',font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},rowHeight:40,verticalAlignment:'center',borders:{insideVertical:{style:'thin',color:'#FFFFFF'}}};
 if(rows.length)s.getRange(`A5:${last}${end}`).values=rows.map(r=>Array.from({length:headers.length},(_,i)=>r[i]??null));
 widths.forEach((w,i)=>{s.getRange(`${col(i+1)}1:${col(i+1)}${end}`).format.columnWidthPx=w;});
 rows.forEach((r,i)=>{
  const lines=Math.max(...r.map((v,j)=>String(v??'').split('\n').reduce((sum,line)=>sum+Math.max(1,Math.ceil(line.length/Math.max(10,(widths[j]-16)/6.1))),0)));
  s.getRange(`A${i+5}:${last}${i+5}`).format.rowHeightPx=Math.max(48,lines*18+16);
  if(i%2===1)s.getRange(`A${i+5}:${last}${i+5}`).format.fill='#F0F1F5';
  r.forEach((v,j)=>{if(/\[[A-Z][^\]]*\]/.test(String(v??'')))s.getRange(`${col(j+1)}${i+5}`).format.fill='#FFF0BF';});
 });
 if(rows.length>12)s.freezePanes.freezeRows(4);
 meta.push({name,rows:rows.length,columns:headers.length,last,end});return s;
}
const start=tab('Mulai','Strategi marketing Parenting Bakes','Parenteers · Versi 2 · 6 Oktober 2026 · Rencana 6 minggu', ['Bagian','Isi','Penggunaan'],[
 ['Fokus','Parents mulai, selesai, mendapat manfaat, dan mengajak orang terdekat bila mau.','Arah strategi; belum hasil kampanye.'],
 ['Paket','42 hari; 24 feed; 18 carousel / 143 slide; 6 Reel; 48 Threads; 42 Story.','Empat feed per minggu. Story non-feed opsional mengikuti kapasitas.'],
 ['Pilot','25 undangan yang diusulkan selama dua minggu pertama.','Belajar alasan mencoba dan berhenti; bukan target peserta terjamin.'],
 ['Tanggal mulai',null,'Isi tanggal mulai setelah diputuskan. Tanggal pada Kalender dan Catatan Hasil mengikuti sel B8.'],
 ['Zona waktu',null,'Isi zona audiens. Jam tayang dibahas terpisah; tidak ada jam terbaik yang diklaim.'],
 ['Penanggung jawab',null,'Tentukan siapa menangani konten, undangan, respons, dan evaluasi.'],
 ['Strategi','Perbandingan lama dan baru beserta alasan dan bukti yang dicari.','Mulai dari tab Strategi lalu Pilot.'],
 ['Konten harian','Kalender berisi agenda D1–D42 dan kode materi.','Copy lengkap ada pada Carousel, Caption, Reels, Threads, Story.'],
 ['Komunitas','Teks undangan personal, izin admin, ajakan pasangan, dan feedback.','Tim memilih kontak relevan; belum ada pesan yang dikirim.'],
 ['Catatan Hasil','Kolom input kosong; data event dan laporan peserta dipisahkan.','Kuning muda berarti input. Isi angka hanya dengan sumber yang tersedia.'],
 ['Bahan asli','R02 dan versi testimoni Z01 memerlukan hasil / kutipan asli.','Sel placeholder berwarna kuning. Jangan tayangkan sebelum diisi.'],
 ['Versi lama','Workbook lengkap lama diberi prefix (old).','Naskah carousel delapan slide terbaru sudah masuk pada versi ini.'],
 ['Batas','Tidak ada publikasi sosial, budget iklan, atau tracking baru dalam penyusunan.','Tanggal, kapasitas, data performa, dan acceptance perangkat masih perlu keputusan.']
],[160,560,460]);
start.getRange('B8:B10').format.fill='#FFF0BF';start.getRange('B8').setNumberFormat('yyyy-mm-dd');
tab('Strategi','Upgrade strategi marketing','Arah baru dan bukti yang dicari; hipotesis kreatif', ['Topik','Strategi sebelumnya','Strategi baru','Alasan perubahan','Cara menilai'],strategy,[150,300,390,300,350]);
const cal=tab('Kalender','Agenda 42 hari','D1 adalah hari peluncuran; tanggal otomatis setelah Mulai!B8 diisi', ['Hari ke','Minggu','Tanggal','Kode','Format','Hook / tema','Tujuan','Fase','Tindakan tim','Penanggung jawab','Pendamping','Status produksi'],calendar,[75,70,115,95,145,300,140,180,360,180,160,140]);
for(let i=0;i<42;i++)cal.getRange(`C${i+5}`).formulas=[[`=IF('Mulai'!$B$8="","",'Mulai'!$B$8+A${i+5}-1)`]];
cal.getRange('C5:C46').setNumberFormat('yyyy-mm-dd');cal.getRange('J5:L46').format.fill='#FFF0BF';cal.freezePanes.freezeColumns(4);
tab('Carousel','Naskah carousel','16 personality × 8 slide; L0 10 slide; S01 5 slide; total 143', ['Kode','Tipe','Personality / tema','Slide','Teks slide','Footer semua slide','Identitas cover / akhir','Sumber'],carousel,[85,85,210,65,530,260,230,290]);
tab('Caption','Caption Instagram','24 caption; manfaat hasil diperjelas; satu ajakan utama', ['Kode','Format','Personality / tema','Caption','Hashtag opsional','Bahan asli yang diperlukan','Sumber'],captions,[85,100,220,640,200,260,280]);
tab('Reels','Naskah Reel','6 Reel; R01 diperbarui; Z01 pilih satu versi sesuai bahan nyata', ['Kode','Judul','Versi','Waktu','Visual / teks layar','Ucapan / VO','Arahan produksi','Sumber'],reels,[80,220,170,110,380,450,350,230]);
tab('Threads','Naskah Threads','24 rangkaian; dua post per kode; link kuis pada post kedua', ['Kode','Urutan','Naskah post','Tujuan','Bahan asli yang diperlukan','Sumber'],threads,[80,75,650,160,300,300]);
tab('Story','Naskah Story harian','42 urutan tiga panel; respons opsional; link kuis tersedia pada panel ajakan', ['Hari ke','Kode','Panel 1','Panel 2','Panel 3','Ajakan','URL','Bahan / izin','Footer'],stories,[75,85,330,390,350,160,250,300,240]);
tab('Komunitas','Undangan dan percakapan','Gunakan hubungan nyata; izin admin sebelum kirim ke grup', ['Kode','Penerima','Angle / tujuan','Naskah pesan','Rencana penggunaan','Batas / izin'],community,[90,230,190,660,270,360]);
tab('Pilot','Pilot dan evaluasi','D1–D14: 25 undangan diusulkan; review lanjut D27 dan D41', ['Hari','Tahap','Penanggung jawab','Tindakan','Data / input','Catatan'],pilot,[85,190,200,420,330,400]);
const resultRows=Array.from({length:42},(_,i)=>[i+1,null,feedMap[i+1]||off[i+1][0],null,null,null,null,null,null,null,null,null,null]);
const result=tab('Catatan Hasil','Catatan hasil harian','Kosong berarti belum ada data; event dan laporan peserta tidak digabung', ['Hari ke','Tanggal','Kode','Sumber data / kanal','Klik link','Event mulai','Event selesai','Rasio event','Peserta lapor mulai','Peserta lapor selesai','Lapor berbagi','Lapor buka booklet','Feedback / keputusan'],resultRows,[75,115,100,250,100,115,115,120,150,150,125,150,500]);
for(let i=0;i<42;i++){
const r=i+5;result.getRange(`B${r}`).formulas=[[`=IF('Mulai'!$B$8="","",'Mulai'!$B$8+A${r}-1)`]];
result.getRange(`H${r}`).formulas=[[`=IF(OR(F${r}="",G${r}=""),"",IF(F${r}=0,"",G${r}/F${r}))`]];
}
result.getRange('B5:B46').setNumberFormat('yyyy-mm-dd');result.getRange('E5:G46').setNumberFormat('#,##0');result.getRange('I5:L46').setNumberFormat('#,##0');result.getRange('H5:H46').setNumberFormat('0.0%');result.getRange('D5:G46').format.fill='#FFF0BF';result.getRange('I5:M46').format.fill='#FFF0BF';
result.getRange('A48').values=[['Definisi data']];result.getRange('A48').format.font.bold=true;
result.getRange('A49:M49').values=[['Klik link: tindakan klik, bukan selesai. Event mulai/selesai: hanya diisi dari event yang benar-benar tercatat. Laporan peserta: self-report, bukan pengguna unik otomatis.',...Array(12).fill(null)]];
result.getRange('A49').format.wrapText=false;result.getRange('A49:M49').format.rowHeight=25;
result.getRange('A50:M50').values=[['Rasio event: selesai/mulai per hari, bukan cohort conversion atau proporsi parents unik. Selesai hari ini bisa berasal dari mulai sebelumnya. Isi sumber, periode, dan definisi pada kolom D.',...Array(12).fill(null)]];result.getRange('A50').format.wrapText=false;result.getRange('A50:M50').format.rowHeight=25;
meta.find(m=>m.name==='Catatan Hasil').end=50;
tab('Ketentuan','Ketentuan copy dan produksi','Aturan yang berlaku untuk seluruh materi', ['Topik','Ketentuan'],rules,[220,1000]);
tab('Sumber','Sumber dan batas informasi','Data produk dan dokumen lokal; tidak ada audit performa platform', ['Sumber','Tanggal / konteks','Digunakan untuk','URL'],sources,[420,330,650,400]);
// Check content relationships and representative formulas before delivery.
if(carousel.length!==143||captions.length!==24||threads.length!==48||stories.length!==42)throw Error('Content totals do not reconcile');
for(const [code,type]of Object.entries(byCode)){
 const rows=carousel.filter(r=>r[0]===code);if(rows.length!==8||rows.some(r=>r[1]!==type.code||r[2]!==type.name.id))throw Error(`Type coverage ${code}`);
 if(rows.some(r=>r[4].split(/\s+/).length>45))throw Error(`Slide exceeds word limit ${code}`);
}
if(!hooks.C09.includes('butuh menyendiri'))throw Error('Molten wording mismatch');
if(!threads.filter(r=>r[1]===2).every(r=>r[2].includes(quiz)))throw Error('Missing quiz links');
if(order.filter(c=>!c.startsWith('C')&&c!=='L0'&&c!=='S01').some(c=>!reels.some(r=>r[0]===c)))throw Error('Missing Reel');
// Sample values to verify date and ratio behavior; leave inputs empty in the final file.
start.getRange('B8').values=[[new Date('2026-10-12T00:00:00Z')]];
result.getRange('F5:G5').values=[[10,4]];
if(Math.abs(Number(result.getRange('H5').values[0][0])-0.4)>1e-8)throw Error('Ratio calculation mismatch');
const dateSample=cal.getRange('C5:C7').values;
if(dateSample.some(r=>!r[0]))throw Error('Date linkage mismatch');
start.getRange('B8').values=[[null]];result.getRange('F5:G5').values=[[null,null]];
if(result.getRange('H5').values[0][0]!==''||cal.getRange('C5').values[0][0]!=='')throw Error('Missing inputs must remain blank');
const scan=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:100},summary:'Formula error scan'});
await fs.writeFile(new URL('formula-scan.ndjson',dir),scan.ndjson);
await fs.writeFile(new URL('inspection.ndjson',dir),(await wb.inspect({kind:'table',range:'Mulai!A4:C17',include:'values,formulas',tableMaxRows:14,tableMaxCols:3,maxChars:8000})).ndjson);
await fs.writeFile(new URL('content.json',dir),JSON.stringify({strategy,calendar,carousel,captions,reels,threads,stories,community,pilot,rules,sources},null,2));
for(const m of meta){
 const range=`A1:${m.last}${Math.min(m.end,m.name==='Mulai'?11:8)}`;
 const preview=await wb.render({sheetName:m.name,range,scale:1,format:'png'});
 await fs.writeFile(new URL(`preview-${m.name.replace(/ /g,'-')}.png`,dir),new Uint8Array(await preview.arrayBuffer()));
 console.log(`Rendered ${m.name}`);
}
await (await SpreadsheetFile.exportXlsx(wb)).save(new URL('Parenting-Bakes-Strategi-dan-Konten-Harian-v2.xlsx',dir).pathname);
await fs.writeFile(new URL('validation.json',dir),JSON.stringify({sheets:meta,feed:24,days:42,personalitySlides:128,carouselSlides:143,captions:24,threads:48,storySequences:42,reelCodes:6,wordLimit:45,formulaSample:0.4,inputsCleared:true,dateSample,scan:scan.ndjson,font:'Arial; local render fallback Liberation Sans'},null,2));
console.log(JSON.stringify({output:new URL('Parenting-Bakes-Strategi-dan-Konten-Harian-v2.xlsx',dir).pathname,sheets:meta.length,carouselSlides:143,days:42,scan:scan.ndjson}));
