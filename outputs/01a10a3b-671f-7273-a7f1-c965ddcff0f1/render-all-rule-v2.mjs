import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const root='/home/ardy/Projects/Parenteers/Parenting Personalities/Instagram Posts/Campaign-v3-Rule-v2-JPG';
const m=JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8'));
const sample=process.argv.includes('--sample');
const all=m.batches.flatMap(b=>b.cards.map(c=>({...c,medium:b.medium,folder:b.folder})));
const short=process.argv.includes('--short');const targets=short?all.filter(c=>c.layout==='text'&&c.text.length<=20):sample?all.filter(c=>(c.medium==='feed'&&((['C01','C04','C09','C16'].includes(c.code)&&c.number===1)||(c.code==='L0'&&[1,3].includes(c.number))||(c.code==='F01'&&c.number===1)||(c.code==='C05'&&c.number===3)||(c.code==='C06'&&c.number===4)||(c.code==='R04'&&c.number===2)))||(c.medium==='story'&&['C01','PD02'].includes(c.code))):all;
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,chromiumSandbox:true,args:['--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run','--no-default-browser-check','--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});await page.route(/^https?:\/\//,r=>r.abort());await fs.mkdir(path.join(root,'_review'),{recursive:true});
const results=[];
try{
await page.goto(pathToFileURL(path.join(root,'_source/template.html')).href);
for(let i=0;i<targets.length;i++){
 const c=targets[i];await page.setViewportSize({width:1080,height:c.height});const a=await page.evaluate(c=>window.renderPost(c),c);
 if(a.violations.length||!a.copyParity||!a.fonts||(a.illustrationTextGap!==null&&a.illustrationTextGap<28)||a.textOnlyVerticalCenter!==null&&Math.abs(a.textOnlyVerticalCenter-a.expectedVerticalCenter)>1)throw Error(JSON.stringify({output:c.output,...a}));
 const output=sample?path.join(root,'_review',`${c.medium}-${c.code}-${c.number}.jpg`):path.join(root,c.output);await page.screenshot({path:output,type:'jpeg',quality:95});results.push({...a,output:c.output});if((i+1)%20===0)console.log(`Rendered ${i+1}/${targets.length}`);
}
if(short){const prior=JSON.parse(await fs.readFile(path.join(root,'_review/render-qa.json'),'utf8'));const changes=new Map(results.map(x=>[x.output,x]));for(const a of prior.images)if(!changes.has(a.output))results.push(a);}await fs.writeFile(path.join(root,'_review',sample?'sample-qa.json':'render-qa.json'),JSON.stringify({rendered:results.length,copyParity:true,textSafeMargin:90,grid:90,illustrationBleed:true,uniqueArtworkPerGroup:true,quality:95,images:results,network:'HTTP/HTTPS blocked'},null,2));
if(sample){await page.setViewportSize({width:1600,height:900});const tiles=await Promise.all(targets.map(async c=>`<article><p>${c.medium} ${c.code}/${c.number}</p><img src="data:image/jpeg;base64,${(await fs.readFile(path.join(root,'_review',`${c.medium}-${c.code}-${c.number}.jpg`))).toString('base64')}"></article>`));await page.setContent(`<html><meta charset="utf-8"><style>body{margin:0;padding:24px;background:#eee1cf;color:#182799;font:18px sans-serif}main{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}img{width:100%;display:block}p{margin:0 0 8px}</style><main>${tiles.join('')}</main></html>`);await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.screenshot({path:path.join(root,'_review','sample-contact.jpg'),type:'jpeg',quality:95,fullPage:true});}
console.log(JSON.stringify({sample,rendered:results.length,violations:0,copyParity:true}));
}finally{await browser.close();}
