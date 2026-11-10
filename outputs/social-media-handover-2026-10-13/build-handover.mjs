import fs from 'node:fs/promises';
import {Workbook, SpreadsheetFile} from '@oai/artifact-tool';
const dir = new URL('.', import.meta.url).pathname;
const {plan} = JSON.parse(await fs.readFile(dir+'handover-plan.json','utf8'));
const headers=['Nomor','Link desain/folder','Caption','Hashtag','Sudah diposting?','Catatan'];
const splitCaption=(s)=>{const m=s.trim().match(/\n\n((?:#\S+\s*)+)$/u);return {caption:m?s.trim().slice(0,m.index):s.trim(),tags:m?m[1].trim():''};};
const feedBase=plan.feed.map(s=>{
 const jpg=s.children.filter(f=>f.mime_type==='image/jpeg').sort((a,b)=>a.title.localeCompare(b.title));
 if(jpg.length!==s.copy.length || jpg.some((f,i)=>f.title!==String(i+1).padStart(2,'0')+'.jpg')) throw new Error('Slide order '+s.newName);
 const {caption,tags}=splitCaption(s.caption);
 const day=Number(s.folder.title.match(/_D(\d+)_/)[1]);
 const note=`Carousel, ${jpg.length} gambar. Upload 01.jpg sampai ${jpg.at(-1).title} sesuai urutan. Rencana hari ${day}.`+(s.copy[0].code==='F01'||s.copy[0].code==='Z01'?' Wording Christine perlu ditinjau Christine sebelum tayang.':'');
 return {number:s.index,label:s.newName,url:s.folder.url,caption,tags,note,source:s.folder.id};
});
const feedCards=plan.feedCards.map(c=>{
 const s=plan.feed.find(s=>s.copy[0].code==='C'+String(c.type).padStart(2,'0'));
 const {caption,tags}=splitCaption(s.caption);
 return {number:c.index,label:c.newName,url:c.folder.url,caption,tags,note:'Kartu tunggal, 1 gambar. Pilihan posting terpisah dari carousel; di luar urutan utama.',source:c.file.id};
});
const storyBase=plan.story.map(s=>{
 const jpg=s.children.filter(f=>f.mime_type==='image/jpeg').sort((a,b)=>a.title.localeCompare(b.title));
 if(jpg.length!==3 || s.copy.length!==3 || jpg.some((f,i)=>f.title!==String(i+1).padStart(2,'0')+'.jpg')) throw new Error('Story order '+s.newName);
 const caption=s.copy.map(x=>String(x.number).padStart(2,'0')+'.jpg:\n'+x.text).join('\n\n');
 const closing=s.copy.at(-1);
 const note='3 frame. Upload 01.jpg sampai 03.jpg sesuai urutan. '+(closing.linkUrl?`Frame 03: tambahkan sticker link ${closing.linkLabel} ke ${closing.linkUrl}`:'Frame 03: respons opsional; boleh pakai question sticker atau balasan biasa.')+(s.copy[0].code==='RP01'||s.copy[0].code==='RP02'?' Jika mengganti dengan cerita audiens, minta izin sebelum repost.':'');
 return {number:s.index,label:s.newName,url:s.folder.url,caption,tags:'',note,source:s.folder.id};
});
const storyCards=plan.storyCards.map(c=>{
 const s=plan.story.find(s=>s.copy[0].code==='C'+String(c.type).padStart(2,'0'));
 const closing=s.copy.at(-1);
 return {number:c.index,label:c.newName,url:c.folder.url,caption:closing.text,tags:'',note:`Kartu tunggal, 1 frame. Teks tambahan opsional. Tambahkan sticker link ${closing.linkLabel} ke ${closing.linkUrl} Pilihan di luar urutan utama.`,source:c.file.id};
});
const datasets={Feed:[...feedBase,...feedCards],Story:[...storyBase,...storyCards]};
await fs.writeFile(dir+'posting-rows.json',JSON.stringify(datasets,null,2));
for(const [format,rows] of Object.entries(datasets)){
 if(rows.some((r,i)=>r.number!==i+1||!r.caption||!r.url)) throw new Error('Incomplete '+format);
 const wb=Workbook.create(); const sh=wb.worksheets.add('Daftar Posting'); const end=rows.length+4;
 sh.getRange('A1').values=[[`Daftar Posting ${format}`]]; sh.mergeCells('A1:F1');
 sh.getRange('A2').values=[[format==='Feed'?'Klik materi, salin caption dan hashtag, lalu upload. Centang setelah tayang. Status tayang lama belum tercatat; periksa sebelum upload.':'Klik materi, upload sesuai urutan, lalu centang setelah tayang. Teks rangkaian sudah ada di gambar. Status tayang lama belum tercatat; periksa sebelum upload.']]; sh.mergeCells('A2:F2');
 sh.getRange('A4:F4').values=[headers];
 sh.getRange(`A5:F${end}`).values=rows.map(r=>[r.number,r.label,r.caption,r.tags,false,r.note]);
 // Native rich hyperlinks are applied after Google Sheets import.
 const used=sh.getRange(`A1:F${end}`); used.format.font={name:'Arial',size:11,color:'#202124'}; used.format.verticalAlignment='top'; used.format.wrapText=true;
 const widths=[65,270,520,170,135,330];
 widths.forEach((w,i)=>sh.getRangeByIndexes(0,i,end,1).format.columnWidthPx=w);
 sh.getRange('A1:F1').format.font={name:'Arial',size:15,bold:true,color:'#202124'}; sh.getRange('A1:F1').format.rowHeightPx=30;
 sh.getRange('A2:F2').format.rowHeightPx=44; sh.getRange('A2:F2').format.font={name:'Arial',size:10,color:'#5F6368'};
 sh.getRange('A3:F3').format.rowHeightPx=10;
 sh.getRange('A4:F4').format.fill='#F1F3F4'; sh.getRange('A4:F4').format.font={name:'Arial',size:11,bold:true,color:'#202124'}; sh.getRange('A4:F4').format.rowHeightPx=44;
 sh.getRange('A4:F4').format.horizontalAlignment='center'; sh.getRange('A4:F4').format.verticalAlignment='center';
 sh.getRange(`A5:A${end}`).setNumberFormat('00'); sh.getRange(`A5:A${end}`).format.horizontalAlignment='center'; sh.getRange(`E5:E${end}`).format.horizontalAlignment='center';
 sh.getRange(`B5:B${end}`).format.font={name:'Arial',size:11,color:'#1A73E8'};
 rows.forEach((r,i)=>{const texts=[String(r.number),r.label,r.caption,r.tags,'',r.note];const n=Math.max(...texts.map((t,j)=>t.split('\n').reduce((n,l)=>n+Math.max(1,Math.ceil(l.length/Math.floor(widths[j]/6.6))),0)));sh.getRangeByIndexes(i+4,0,1,6).format.rowHeightPx=Math.max(96,n*20+16);});
 sh.freezePanes.freezeRows(4); sh.showGridLines=false;
 wb.recalculate();
 const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!|#NULL!',options:{useRegex:true,maxResults:20},maxChars:1000});
 console.log(format,rows.length,'rows',errors.ndjson);
 const preview=await wb.render({sheetName:'Daftar Posting',range:'A1:F7',scale:1,format:'png'});
 await fs.writeFile(dir+format+'-preview.png',new Uint8Array(await preview.arrayBuffer()));
 const out=await SpreadsheetFile.exportXlsx(wb);await out.save(dir+`Daftar Posting ${format}.xlsx`);
 console.log('Exported',format);
}
