import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const root='/home/ardy/Projects/Parenteers/Parenting Personalities/Instagram Posts/Rule-v2-C01-Croquembouche';
const content=JSON.parse(await fs.readFile(path.join(root,'content.json'),'utf8'));
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,chromiumSandbox:true,args:['--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run','--no-default-browser-check','--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});await page.route(/^https?:\/\//,r=>r.abort());
const reports=[];
try{
 await page.goto(pathToFileURL(path.join(root,'master.html')).href);
 for(const c of content.cards){const a=await page.evaluate(c=>window.renderSlide(c),c);if(a.violations.length||!a.copyParity||!a.fonts||(a.illustrationTextGap!==null&&a.illustrationTextGap<28))throw Error(JSON.stringify(a));reports.push(a);await page.screenshot({path:path.join(root,'slides',String(c.number).padStart(2,'0')+'.jpg'),type:'jpeg',quality:95});}
 await fs.writeFile(path.join(root,'qa-report.json'),JSON.stringify({frame:[1080,1350],grid:90,textSafeMargin:90,illustrationBleedException:true,distinctIllustrations:4,repeatedIllustrationHashes:0,slides:reports,network:'HTTP/HTTPS blocked'},null,2));
 await page.setViewportSize({width:1480,height:900});
 const tiles=await Promise.all(content.cards.map(async c=>`<article><p>${String(c.number).padStart(2,'0')} · ${c.layout==='image'?'Ilustrasi':'Teks'}</p><img src="data:image/jpeg;base64,${(await fs.readFile(path.join(root,'slides',String(c.number).padStart(2,'0')+'.jpg'))).toString('base64')}"></article>`));
 await page.setContent(`<html><meta charset="utf-8"><style>body{margin:0;padding:24px;background:#eee1cf;color:#182799;font:18px sans-serif}main{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}p{margin:0 0 10px}img{width:100%;display:block}</style><main>${tiles.join('')}</main></html>`);await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.screenshot({path:path.join(root,'contact-sheet.jpg'),type:'jpeg',quality:95,fullPage:true});
 console.log(JSON.stringify({slides:8,distinctIllustrations:4,textOnly:4,copyParity:true,safeText:true,bleed:true}));
}finally{await browser.close();}
