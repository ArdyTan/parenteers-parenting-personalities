import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const root='/home/ardy/Projects/Parenteers/Parenting Personalities/Instagram Posts/Campaign-v2-JPG';
const manifest=JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8'));
const sample=process.argv.includes('--sample');
const cards=manifest.batches.flatMap(b=>b.cards.map(c=>({...c,medium:b.medium})));
const selected=sample?cards.filter(c=>(c.medium==='feed'&&((c.code==='L0'&&[1,2].includes(c.number))||(c.code==='C01'&&[1,2,4,7].includes(c.number))||(c.code==='C04'&&c.number===1)||(c.code==='C09'&&c.number===1)||(c.code==='R02'&&[1,3].includes(c.number))||(c.code==='Z01'&&c.number===2)))||(c.medium==='story'&&c.code==='R02')):cards;
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,chromiumSandbox:true,args:['--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run','--no-default-browser-check','--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
await page.route(/^https?:\/\//,route=>route.abort());
const report=[];
await fs.mkdir(path.join(root,'_review'),{recursive:true});
try{
 await page.goto(pathToFileURL(path.join(root,'_source/template.html')).href);
 for(let ix=0;ix<selected.length;ix++){
  const c=selected[ix];await page.setViewportSize({width:1080,height:c.height});
  const audit=await page.evaluate(c=>window.renderPost(c),c);
  if(audit.violations.length||!audit.fonts||audit.visibleText!==audit.sourceText)throw Error(JSON.stringify({output:c.output,...audit}));
  const filename=sample?path.join(root,'_review',`${c.medium}-${c.code}-${String(c.number).padStart(2,'0')}.jpg`):path.join(root,c.output);
  await page.screenshot({path:filename,type:'jpeg',quality:95});
  report.push({...audit,output:c.output});
  if((ix+1)%20===0)console.log(`Rendered ${ix+1}/${selected.length}`);
 }
 const file=sample?'sample-qa.json':'render-qa.json';await fs.writeFile(path.join(root,'_review',file),JSON.stringify({rendered:report.length,network:'HTTP/HTTPS blocked',quality:95,copyParity:true,foregroundMargin:90,images:report},null,2));
 if(sample){
  const imageCards=selected.map(c=>({file:`${c.medium}-${c.code}-${String(c.number).padStart(2,'0')}.jpg`,label:`${c.medium} ${c.code}/${c.number}`}));
  await page.setViewportSize({width:1600,height:900});
  await page.setContent(`<html><meta charset="utf-8"><style>body{margin:0;padding:24px;background:#e3e6ef;color:#182799;font:18px sans-serif}main{display:grid;grid-template-columns:repeat(4,1fr);gap:22px}img{width:100%;display:block}p{margin:0 0 8px}</style><main>${await Promise.all(imageCards.map(async c=>`<article><p>${c.label}</p><img src="data:image/jpeg;base64,${(await fs.readFile(path.join(root,'_review',c.file))).toString('base64')}"></article>`)).then(a=>a.join(''))}</main></html>`);
  await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.screenshot({path:path.join(root,'_review','sample-contact.jpg'),type:'jpeg',quality:95,fullPage:true});
 }
 console.log(JSON.stringify({sample,rendered:report.length,violations:0,copyParity:true}));
}finally{await browser.close();}
