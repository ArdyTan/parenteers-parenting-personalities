import fs from 'node:fs/promises';
import path from 'node:path';
const target='/home/ardy/Projects/Parenteers/Parenting Personalities/Instagram Posts/Campaign-v2-JPG';
const repo='/home/ardy/dev/parenteers-parenting-personalities';
const d=JSON.parse(await fs.readFile(path.join(target,'_source/workbook-content.json'),'utf8'));
const rows=n=>d[n].slice(4).filter(r=>r[0]!==null&&r[0]!==undefined);
const types=JSON.parse(await fs.readFile(path.join(repo,'src/data/types.json'),'utf8'));
const typeByCode=Object.fromEntries(types.map(t=>[t.code,t]));
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,58);
const pad=n=>String(n).padStart(2,'0');
const calendar=rows('Kalender'),feedDays=calendar.filter(r=>r[4]==='Carousel'||r[4]==='Reel');
const capMap=Object.fromEntries(rows('Caption').map(r=>[r[0],r]));
const batches=[],skips=[];
// Only this post is rewritten: explicitly authorized by Ardy in this session.
const demo=[
 'Cari kuemu lewat 12 pertanyaan keseharian.',
 'Pilih jawaban yg paling dekat dengan kebiasaanmu. Satu cerita gak perlu merangkum seluruh dirimu.',
 'Setelah selesai, kamu akan bertemu satu dari 16 karakter kue. Masing-masing punya kekuatan dan kebutuhan yg perlu dijaga.',
 'Di hasilnya, ada bahan refleksi dan booklet dengan ide merawat diri serta aktivitas bareng anak. Pilih yg sesuai keadaanmu.',
 'Penasaran kuemu apa? Coba lewat link bio @parenteers. Buat seru-seruan & refleksi; bukan tes klinis.'
];
const demoCaption='Parenting Bakes mengajak kamu kenalan dengan kebiasaanmu lewat 12 pertanyaan keseharian. Pilih jawaban yg terasa paling dekat, lalu temui karakter kuemu.\n\nDi hasilnya ada bahan refleksi dan booklet dengan ide merawat diri serta aktivitas bareng anak. Ambil yg sesuai keadaanmu.\n\nCari kuemu lewat link bio @parenteers. Buat seru-seruan & refleksi; bukan tes klinis.';
function reelText(r){
 if(r[5])return String(r[5]).replace(/^“|”$/g,'');
 const text=String(r[4]||'');
 const quote=text.match(/“([\s\S]*?)”/);return quote?quote[1]:text;
}
function motif(code){
 const map={L0:'booklet',F01:'speech',R01:'coffee',R02:'booklet',R03:'calendar',R04:'bag',Z01:'booklet',S01:'coffee',C01:'calendar',C02:'clock',C03:'bag',C04:'bag',C05:'books',C06:'speech',C07:'blocks',C08:'coffee',C09:'sun',C10:'moon',C11:'calendar',C12:'house',C13:'blocks',C14:'speech',C15:'plant',C16:'shoe'};
 return map[code]||'booklet';
}
function slide(text,code,num,total,extra={}){
 if(/\[[A-Z][^\]]+\]/.test(text))throw Error(`Placeholder in output: ${code}/${num}`);
 return {text,code,number:num,total,kind:num===1?'cover':num===total?'closing':'narrative',motif:motif(code),height:1350,width:1080,...extra};
}
for(let ix=0;ix<feedDays.length;ix++){
 const r=feedDays[ix],day=r[0],code=r[3],sourceRows=[];let cards,notes=[];
 if(r[4]==='Carousel'){
  const c=rows('Carousel').filter(x=>x[0]===code).sort((a,b)=>a[3]-b[3]);
  cards=c.map((x,i)=>{
   const t=typeByCode[x[1]],extra={source:{sheet:'Carousel',row:rows('Carousel').indexOf(x)+5,column:'E'},typeCode:x[1]||'',typeName:t?.name.id||'',typeImage:t?path.basename(t.image):null};
   if(t&&i===3)extra.kind='profile';
   if(code==='L0'&&i>0&&i<9){extra.kind='pair';extra.pairImages=types.slice((i-1)*2,i*2).map(t=>path.basename(t.image));}
   return slide(String(x[4]),code,i+1,c.length,extra);
  });
 }else{
  let texts;
  if(code==='R02'){texts=demo;notes.push('R02 diubah dengan izin Ardy menjadi demo kuis dari akun Parenteers; tidak memuat hasil atau reaksi Christine.');}
  else if(code==='Z01'){
   const row=rows('Reels').find(x=>x[0]==='Z01'&&x[2]==='Tanpa kiriman audiens');
   const original=reelText(row);
   texts=['Aku Christine, di balik Parenteers.','Setelah coba Parenting Bakes, ada satu pertanyaan yg bisa kamu bawa: dari hasil ini, bagian mana yg terasa dekat dengan hariku?','Gak harus semuanya cocok.','Kalau kamu belum coba, cari kuemu lewat link bio @parenteers. Kita mulai dari kebiasaan kecil dulu.'];
   if(texts.join(' ')!==original)throw Error('Z01 transcription mismatch');
   sourceRows.push(rows('Reels').indexOf(row)+5);
   skips.push({code,reason:'Memilih versi tanpa kiriman audiens yang sudah tersedia; alternatif komentar nyata + izin tidak digabung.',unusedRows:rows('Reels').filter(x=>x[0]==='Z01'&&x[2]!=='Tanpa kiriman audiens')});
   notes.push('Z01 memakai versi tanpa kiriman audiens di workbook. Empat kalimat/rangkaian dipisahkan menjadi empat slide, tanpa menambah cerita.');
  }else{
   const rs=rows('Reels').filter(x=>x[0]===code&&x[2]==='Utama');texts=rs.map(reelText);sourceRows.push(...rs.map(x=>rows('Reels').indexOf(x)+5));
  }
  cards=texts.map((t,i)=>slide(t,code,i+1,texts.length,{source:code==='R02'?{authorization:'Ardy approved brand demo substitution'}:{sheet:'Reels',rows:sourceRows},speaker:code==='F01'||code==='Z01'?'Christine Yunita':code==='R03'?'Ilustrasi keseharian':''}));
  notes.push('Naskah Reel diadaptasi menjadi carousel JPG statis; paket ini tidak berisi video.');
 }
 const title=code==='R02'?'Demo-kuis-Parenteers':capMap[code][2];
 const folder=`Feed/${pad(ix+1)}_D${pad(day)}_${code}_${slug(title)}`;
 const caption=code==='R02'?demoCaption:String(capMap[code][3]);
 const threads=rows('Threads').filter(x=>x[0]===code).map(x=>({order:x[1],text:code==='R02'&&x[1]===1?'Parenting Bakes: 12 pertanyaan tentang keseharian jadi orang tua. Pilih jawaban yg terasa dekat, lalu temui karakter kuemu. Ada refleksi dan booklet di hasilnya.':x[2]}));
 const batch={folder,code,day,medium:'feed',originalFormat:r[4],title,cards,caption,hashtags:capMap[code][4],threads,notes};batches.push(batch);
}
for(const r of rows('Story')){
 const day=r[0],code=r[1];let texts=r.slice(2,5).map(String),notes=[];
 if(code==='R02'){texts=['Cari kuemu lewat 12 pertanyaan keseharian.','Pilih jawaban yg terasa paling dekat, lalu temui salah satu dari 16 karakter kue.','Cari kuemu lewat 12 pertanyaan keseharian. Di hasilnya ada bahan refleksi dan booklet aktivitas.'];notes.push('Pendamping R02 diperbarui sesuai izin substitusi demo brand.');}
 const cards=texts.map((t,i)=>slide(t,code,i+1,3,{height:1920,kind:i===0?'cover':i===2?'closing':'narrative',source:{sheet:'Story',row:rows('Story').indexOf(r)+5,column:['C','D','E'][i]},linkLabel:i===2?r[5]:null,linkUrl:i===2?r[6]:null}));
 notes.push(r[6]?`Tambahkan tautan ${r[6]} secara manual pada Story bila fitur tersedia. Tautan tidak interaktif di JPG.`:'Panel ajakan dapat disertai question sticker atau balasan biasa; tidak ada komponen interaktif di JPG.');
 if(r[7])notes.push(r[7]);
 batches.push({folder:`Stories/D${pad(day)}_${code}`,code,day,medium:'story',title:`Story hari ${day}`,cards,notes,linkUrl:r[6]||''});
}
const carouselCount=batches.filter(b=>b.originalFormat==='Carousel').reduce((s,b)=>s+b.cards.length,0);
if(carouselCount!==143||batches.filter(b=>b.medium==='feed').length!==24||batches.filter(b=>b.medium==='story').length!==42)throw Error('Workbook coverage mismatch');
for(const b of batches){
 const folder=path.join(target,b.folder);await fs.mkdir(folder,{recursive:true});
 b.cards.forEach((c,i)=>c.output=`${b.folder}/${pad(i+1)}.jpg`);
 await fs.writeFile(path.join(folder,'copy.json'),JSON.stringify(b.cards,null,2));
 if(b.caption)await fs.writeFile(path.join(folder,'caption.txt'),b.caption+'\n\n'+(b.hashtags||'')+'\n');
 if(b.threads)await fs.writeFile(path.join(folder,'threads.txt'),b.threads.map(t=>`${t.order}/2\n${t.text}`).join('\n\n'));
 await fs.writeFile(path.join(folder,'posting-notes.txt'),[`Kode: ${b.code}`,`Hari kalender: ${b.day}`,`Jumlah JPG: ${b.cards.length}`,`Urutan: ${b.cards.map((c,i)=>pad(i+1)+'.jpg').join(', ')}`,`Ukuran: ${b.cards[0].width} x ${b.cards[0].height}`,`Margin foreground: 90 px`,...b.notes].join('\n')+'\n');
}
const sourceSvg=await fs.readFile('/home/ardy/Projects/Parenteers/Parenting Personalities/Instagram Posts/vector/01-coffee.svg','utf8');
const sourceBag=await fs.readFile('/home/ardy/Projects/Parenteers/Parenting Personalities/Instagram Posts/vector/02-bag.svg','utf8');
const sourceBook=await fs.readFile('/home/ardy/Projects/Parenteers/Parenting Personalities/Instagram Posts/vector/03-quiz.svg','utf8');
const extract=(s,id)=>s.match(new RegExp(`<g id="${id}"[^>]*>[\\s\\S]*?<\\/svg>`))?.[0].replace(/<\/svg>$/,'');
// Reuse actual illustration groups from the proven local masters, not flattened screenshots.
const artFrom=s=>{const begin=s.indexOf('<g id="illustration"');const end=s.indexOf('</g><g id="body"',begin);const part=s.slice(begin,end+4);const inner=part.match(/<svg[^>]+>([\s\S]*)<\/svg>/);if(!inner)throw Error('Illustration group missing');return inner[1];};
const p=(d,c='ink')=>`<path d="${d}" class="${c}"/>`;
const hatch=(x,y,w,h)=>Array.from({length:Math.ceil(w/16)},(_,i)=>p(`M${x+i*16} ${y+h} l16 -${Math.min(32,h)}`,'hair')).join('');
const motifs={coffee:artFrom(sourceSvg),bag:artFrom(sourceBag),booklet:artFrom(sourceBook)};
motifs.calendar=`<g transform="translate(125 55)"><rect x="60" y="70" width="510" height="340" rx="10" class="paper ink"/><path d="M60 155 H570" class="ink"/><path d="M60 70 H570 V155 H60 Z" class="accent"/>${p('M155 48 V93 M477 48 V93')}<g class="hair">${[200,260,320].map(y=>p(`M85 ${y} H545`,'hair')).join('')}${[165,265,365,465].map(x=>p(`M${x} 176 V387`,'hair')).join('')}</g>${p('M297 223 l25 20 l50 -55')}${hatch(85,339,94,48)}${p('M490 41 Q463 -2 504 -14 Q517 -52 555 -20 Q612 -43 627 0 Q685 -7 678 38 Z','paper ink')}${p('M528 63 l-14 34 M570 61 l-14 34 M612 60 l-14 34','hair')}</g>`;
motifs.clock=`<g transform="translate(135 45)"><circle cx="305" cy="220" r="173" class="paper ink"/><circle cx="305" cy="220" r="146" class="hair"/>${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return p(`M${305+126*Math.sin(a)} ${220-126*Math.cos(a)} L${305+138*Math.sin(a)} ${220-138*Math.cos(a)}`,'hair');}).join('')}${p('M305 220 V113 M305 220 L403 250')}<circle cx="305" cy="220" r="8" class="accent"/>${hatch(177,312,95,40)}${p('M140 40 Q156 18 205 28 M442 27 Q485 16 498 43')}${p('M170 415 Q333 435 480 418','hair')}</g>`;
motifs.speech=`<g transform="translate(92 34)">${p('M89 64 Q311 15 475 83 L471 254 Q383 287 226 263 L154 317 L171 253 Q123 245 87 216 Z','paper ink')}${p('M191 97 Q146 109 153 140 Q177 160 211 129 V180 M283 86 Q242 109 263 141 Q288 155 303 127 V172','ink')}${p('M335 286 Q467 238 617 279 L639 403 Q576 439 478 428 L414 479 L420 421 L337 392 Z','paper ink')}<path d="M457 328 C436 295 411 328 452 361 C494 322 473 298 457 328" class="accent"/>${hatch(361,341,65,42)}${p('M100 375 Q150 399 226 378 M509 145 Q563 101 639 125','hair')}</g>`;
motifs.blocks=`<g transform="translate(135 42)">${p('M87 285 L206 230 L314 283 L197 337 Z','paper ink')}${p('M87 285 V395 L197 452 L314 394 V283 M197 337 V452')}${p('M329 172 L424 128 L526 174 L427 220 Z','accent')}${p('M329 172 V278 L427 325 L526 278 V174 M427 220 V325')}${p('M327 326 L431 282 L545 331 L436 383 Z','paper ink')}${p('M327 326 V436 L436 481 L545 432 V331 M436 383 V481')}${hatch(109,337,76,42)}${hatch(450,387,73,39)}${p('M191 196 Q212 115 285 87 M563 242 Q611 267 627 313','hair')}</g>`;
motifs.books=`<g transform="translate(148 24)">${p('M83 216 L382 83 L567 163 L260 295 Z','accent')}${p('M83 216 V250 L260 334 L567 195 V163 M260 295 V334')}${p('M102 281 L253 350 L554 218 V294 L255 422 L102 351 Z','paper ink')}${p('M120 307 L252 370 L531 248 M128 329 L253 391 L530 269','hair')}${p('M123 403 L253 455 L551 329 M112 432 L254 489 L541 364','ink')}${hatch(128,297,95,34)}</g>`;
motifs.plant=`<g transform="translate(160 23)">${p('M222 339 C272 242 296 151 313 82')}${p('M282 210 Q191 221 158 131 Q244 130 282 210','paper ink')}${p('M291 169 Q365 172 409 90 Q324 85 291 169','paper ink')}${p('M248 272 Q149 284 123 211 Q224 200 248 272','paper ink')}${p('M266 240 Q353 271 400 195 Q313 175 266 240','paper ink')}${p('M149 335 H397 L362 474 H184 Z','accent')}${p('M180 356 H367 M195 376 L211 450 M343 376 L329 450','hair')}${p('M70 486 Q276 502 479 483','hair')}</g>`;
motifs.shoe=`<g transform="translate(130 27)">${p('M97 337 Q102 256 207 230 L270 151 Q296 133 331 146 L358 248 Q488 261 546 297 Q572 321 552 364 Q404 426 150 395 Z','paper ink')}${p('M99 361 Q333 424 553 338 M184 280 L300 221 M209 303 L320 248 M235 324 L341 274')}${p('M275 168 L331 179 L345 227 L298 211 Z','accent')}${hatch(136,348,70,31)}${p('M363 75 Q414 100 428 160 M348 101 Q390 116 392 157','hair')}</g>`;
motifs.house=`<g transform="translate(156 22)">${p('M63 227 L287 62 L527 231','ink')}${p('M89 227 V448 H495 V231 L287 86 Z','paper ink')}${p('M251 324 H327 V448 H251 Z','accent')}<rect x="141" y="246" width="63" height="64" class="paper ink"/><rect x="367" y="246" width="63" height="64" class="paper ink"/>${p('M171 246 V310 M141 278 H204 M397 246 V310 M367 278 H430','hair')}${hatch(102,367,110,62)}${p('M55 471 Q283 490 538 471','hair')}</g>`;
motifs.sun=`<g transform="translate(140 34)"><circle cx="310" cy="220" r="120" class="paper ink"/>${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return p(`M${310+149*Math.sin(a)} ${220-149*Math.cos(a)} L${310+182*Math.sin(a)} ${220-182*Math.cos(a)}`,'ink');}).join('')}<path d="M254 292 Q314 317 366 287" class="hair"/>${hatch(217,232,88,53)}${p('M109 445 Q290 416 531 442 M69 465 Q324 447 572 465','hair')}<circle cx="310" cy="220" r="24" class="accent"/></g>`;
motifs.moon=`<g transform="translate(178 20)">${p('M370 63 C145 10 74 319 283 402 C351 432 432 413 480 362 C279 383 205 158 370 63','paper ink')}${hatch(174,273,54,68)}${p('M451 99 l12 28 l31 2 l-23 22 l6 29 l-27 -16 l-26 17 l5 -31 l-23 -19 l31 -4 Z','accent')}${p('M498 235 l6 16 l18 1 l-13 11 l4 17 l-15 -8 l-14 9 l3 -17 l-13 -12 l18 -1 Z','paper ink')}${p('M83 468 Q270 483 486 464','hair')}</g>`;
const artCss=`<style>.ink{fill:none;stroke:#182799;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.hair{fill:none;stroke:#182799;stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round}.paper,.fill{fill:#F0F1F5}.accent{fill:#E86811;stroke:#182799;stroke-width:3;stroke-linejoin:round}</style>`;
for(const [name,body]of Object.entries(motifs))await fs.writeFile(path.join(target,'_assets',`motif-${name}.svg`),`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="540" viewBox="0 0 900 540">${artCss}${body}</svg>`);
const manifest={sourceWorkbook:'Parenting-Bakes-Strategi-dan-Konten-Harian-v2.xlsx',sourcePath:'outputs/01a10a3b-671f-7273-a7f1-c965ddcff0f1/Parenting-Bakes-Strategi-dan-Konten-Harian-v2.xlsx',sourceSheets:13,adaptations:{R02:'Authorized brand demo; no Christine result/reaction',reels:'Static JPG carousel adaptations',Z01:'Existing no-audience-submission version; unused alternative retained in source'},batches,unusedAlternatives:skips,counts:{feedFolders:24,storyFolders:42,carouselSlides:143,reelAdaptationSlides:batches.filter(b=>b.originalFormat==='Reel').reduce((s,b)=>s+b.cards.length,0),storyPanels:126}};
await fs.writeFile(path.join(target,'manifest.json'),JSON.stringify(manifest,null,2));
await fs.writeFile(path.join(target,'_source','effective-content.json'),JSON.stringify(manifest,null,2));
const html=`<!doctype html><html lang="id"><head><meta charset="utf-8"><style>
@font-face{font-family:Fraunces;src:url('../_assets/fraunces-latin-variable.woff2');font-weight:100 900}@font-face{font-family:Jakarta;src:url('../_assets/plus-jakarta-sans-latin-variable.woff2');font-weight:200 800}*{box-sizing:border-box}html,body{margin:0;background:#F0F1F5}#post{width:1080px;position:relative;overflow:hidden;color:#182799;background:#F0F1F5}.meta{position:absolute;left:90px;right:90px;top:90px;display:flex;justify-content:space-between;font:600 21px/30px Jakarta;letter-spacing:1.5px}.type{position:absolute;left:90px;top:135px;font:400 22px/30px Jakarta}.main{position:absolute;left:90px;right:90px;top:195px;text-align:center}.lead{font:500 58px/1.15 Fraunces;letter-spacing:-1.5px;margin:0;white-space:pre-wrap}.rest{font:400 41px/1.4 Jakarta;margin:24px 0 0;white-space:pre-wrap}.cover .lead{font-size:92px;line-height:1.05;letter-spacing:-2.8px}.closing .lead{font-size:74px;line-height:1.12}.profile .lead{font-size:56px}.pair .lead{font-size:50px;line-height:1.18}.illustration{position:absolute;left:90px;width:900px;text-align:center;display:flex;align-items:center;justify-content:center;gap:40px}.illustration img.motif{width:900px;max-height:100%;object-fit:contain}.character{object-fit:contain;width:auto;max-width:400px;height:100%;max-height:400px;border-radius:50%;mix-blend-mode:multiply}.pair .character{max-width:380px;max-height:380px}.footer{position:absolute;left:90px;right:90px;display:flex;align-items:flex-end;justify-content:space-between}.footer img{width:240px;height:auto}.footer span{font:400 21px/28px Jakarta}.speaker{position:absolute;left:90px;right:90px;text-align:center;font:400 22px/30px Jakarta}.link{position:absolute;left:90px;right:90px;text-align:center;font:600 27px/38px Jakarta;color:#182799}.post-story .cover .lead{font-size:100px}.post-story .lead{font-size:76px}.post-story .rest{font-size:48px;line-height:1.4}.post-story .character{max-width:520px;max-height:520px}
</style></head><body><article id="post"><div class="meta" data-safe><span id="series"></span><span id="position"></span></div><div class="type" id="type" data-safe></div><div class="main" id="main" data-safe><h1 class="lead" id="lead"></h1><p class="rest" id="rest"></p></div><div class="illustration" id="art" data-safe></div><div class="speaker" id="speaker" data-safe></div><div class="link" id="link" data-safe></div><div class="footer" id="footer" data-safe><img src="../_assets/parenteers-wordmark-blue.png"><span>@parenteers · quiz.parenteers.id</span></div></article><script>
window.renderPost=async function(c){const q=s=>document.querySelector(s),post=q('#post');post.className=c.kind+(c.height===1920?' post-story':'');post.style.height=c.height+'px';document.body.style.height=c.height+'px';q('#series').textContent=c.typeName?'PARENTING BAKES':'KESEHARIAN PARENTS';q('#position').textContent=String(c.number).padStart(2,'0')+' / '+String(c.total).padStart(2,'0');q('#type').textContent=c.typeName||'';q('#footer').style.bottom='104px';q('#lead').style.cssText='';q('#rest').style.cssText='';
let a=c.text,b='';if(c.kind==='narrative'||c.kind==='profile'||(c.kind==='cover'&&c.text.length>130)){const m=c.text.match(/^(.+?[.!?])(?:\\s+)([\\s\\S]+)$/);if(m&&m[1].length<115){a=m[1];b=m[2];}}
q('#lead').textContent=a;q('#rest').textContent=b;q('#rest').style.display=b?'':'none';q('#speaker').textContent=c.speaker||'';q('#speaker').style.top=(c.height-245)+'px';q('#link').textContent=c.linkLabel||'';q('#link').style.top=(c.height-245)+'px';
const art=q('#art');art.innerHTML='';const files=c.pairImages||(c.kind==='profile'&&c.typeImage?[c.typeImage]:['motif-'+c.motif+'.svg']);for(const f of files){const i=new Image();i.src='../_assets/'+f;i.className=f.startsWith('motif-')?'motif':'character';i.alt='';art.append(i);}
await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));
const limit=c.height===1920?820:670;const main=q('#main');let font=parseFloat(getComputedStyle(q('#lead')).fontSize);while(main.getBoundingClientRect().bottom>limit&&font>48){font-=2;q('#lead').style.fontSize=font+'px';if(b)q('#rest').style.fontSize=Math.max(36,parseFloat(getComputedStyle(q('#rest')).fontSize)-1)+'px';}
const top=Math.max(c.height===1920?860:620,main.getBoundingClientRect().bottom+44);const available=(c.height-290)-top;if(available<190)throw Error('No illustration space '+c.code+'/'+c.number);art.style.top=top+'px';art.style.height=Math.min(available,c.height===1920?690:460)+'px';
const foreground=[...post.querySelectorAll('[data-safe]')].filter(e=>e.textContent||e.querySelector('img'));const violations=foreground.flatMap(e=>{const r=e.getBoundingClientRect();return r.left<89.5||r.top<89.5||r.right>990.5||r.bottom>c.height-89.5||e.scrollWidth>e.clientWidth+2||(getComputedStyle(e).overflow==='hidden'&&e.scrollHeight>e.clientHeight+2)?[{id:e.id,box:{left:r.left,top:r.top,right:r.right,bottom:r.bottom},scroll:[e.scrollWidth,e.scrollHeight]}]:[];});
return {code:c.code,number:c.number,width:1080,height:c.height,mainBottom:main.getBoundingClientRect().bottom,leadSize:font,restSize:b?parseFloat(getComputedStyle(q('#rest')).fontSize):null,violations,fonts:document.fonts.check('58px Fraunces')&&document.fonts.check('41px Jakarta'),visibleText:a+(b?' '+b:''),sourceText:c.text};};
</script></body></html>`;
await fs.writeFile(path.join(target,'_source','template.html'),html);
console.log(JSON.stringify({destination:target,counts:manifest.counts,total:batches.reduce((s,b)=>s+b.cards.length,0)}));
