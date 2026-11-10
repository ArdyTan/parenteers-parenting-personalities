import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const root=path.dirname(new URL(import.meta.url).pathname);
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true,chromiumSandbox:true,args:['--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run','--no-default-browser-check','--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:1080,height:1350},deviceScaleFactor:1});
await page.route(/^https?:\/\//,route=>route.abort());
const report=[];
try{
 const files=['vector/01-coffee','vector/02-bag','vector/03-quiz','gpt-image/01-coffee','gpt-image/02-bag','gpt-image/03-quiz','design-system/design-system','design-system/grid-example'];
 for(const f of files){
  const svg=await fs.readFile(path.join(root,f+'.svg'),'utf8');
  await page.setContent(`<html><head><meta charset="utf-8"><style>html,body{margin:0;width:1080px;height:1350px;overflow:hidden}svg{display:block}</style></head><body>${svg}</body></html>`);
  await page.evaluate(async()=>{await document.fonts.ready;await document.fonts.load('98px Fraunces');await document.fonts.load('30px Jakarta');await Promise.all([...document.querySelectorAll('image')].map(el=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve();i.onerror=()=>reject(Error('Image failed'));i.src=el.getAttribute('href');})));});
  const audit=await page.evaluate(()=>({width:document.querySelector('svg').width.baseVal.value,height:document.querySelector('svg').height.baseVal.value,fonts:document.fonts.check('98px Fraunces')&&document.fonts.check('30px Jakarta'),violations:[...document.querySelectorAll('[data-audit]')].flatMap(el=>{const b=el.getBoundingClientRect();return b.left<89.5||b.top<89.5||b.right>990.5||b.bottom>1260.5?[{type:el.dataset.audit,text:el.textContent,bounds:{left:b.left,top:b.top,right:b.right,bottom:b.bottom}}]:[];})}));
  if(audit.violations.length||!audit.fonts||audit.width!==1080||audit.height!==1350)throw Error(JSON.stringify({file:f,...audit}));
  await page.screenshot({path:path.join(root,f+'.png')});report.push({file:f,...audit});
 }
 // A compact comparison sheet made from the finished PNGs, with no resampling of source deliverables.
 await page.setViewportSize({width:1380,height:970});
 const imgs=await Promise.all(files.slice(0,6).map(async(f)=>({file:f,data:(await fs.readFile(path.join(root,f+'.png'))).toString('base64')})));
 const tiles=[imgs[0],imgs[1],imgs[2],imgs[3],imgs[4],imgs[5]];
 await page.setContent(`<html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#e4e6ef;color:#182799;font:18px sans-serif;padding:24px}h1{font-size:22px;font-weight:500;margin:0 0 12px}.row{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:20px}img{width:100%;display:block}.tile{width:100%}p{margin:0 0 8px;font-size:15px}</style><body><h1>Parenteers · SVG tanpa generation</h1><div class="row">${tiles.slice(0,3).map(i=>`<div class="tile"><img src="data:image/png;base64,${i.data}"></div>`).join('')}</div><h1>Parenteers · GPT Image + layout lokal</h1><div class="row">${tiles.slice(3).map(i=>`<div class="tile"><img src="data:image/png;base64,${i.data}"></div>`).join('')}</div></body></html>`);
 await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
 await page.screenshot({path:path.join(root,'comparison.png'),fullPage:true});
 const gallery=[];
 for(const width of [1280,390]){
  await page.setViewportSize({width,height:900});await page.goto(pathToFileURL(path.join(root,'index.html')).href);await page.evaluate(()=>document.fonts.ready);
  await page.locator('#grid').click();
  const check=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,posts:document.querySelectorAll('.art').length,guides:document.querySelectorAll('.art #grid-guides').length}));
  if(check.overflow||check.posts!==6||check.guides!==6)throw Error(JSON.stringify(check));gallery.push(check);
 }
 await fs.writeFile(path.join(root,'qa-report.json'),JSON.stringify({generated:new Date().toISOString(),network:'HTTP/HTTPS blocked in renderer',postSafeMargins:90,files:report,gallery},null,2));
 console.log(JSON.stringify({rendered:files.length,violations:0,fonts:true,gallery}));
}finally{await browser.close();}
