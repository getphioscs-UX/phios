import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.REPORT_BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const receipts=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file:///'+process.cwd().replace(/\\/g,'/')+'/tools/review/AST-VFR-R1-TL-PUBLICATION-REVIEW.html');await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(async()=>{await Promise.all([...document.querySelectorAll('.page')].map(p=>new Promise(resolve=>{const im=new Image();im.onload=()=>resolve();im.onerror=()=>resolve();im.src=p.style.backgroundImage.slice(5,-2);})))});
 for(const [width,media] of [[1280,'screen'],[390,'screen'],[794,'print']]){
  await page.setViewportSize({width,height:1000});await page.emulateMedia({media});
  await page.evaluate(()=>{fit();scrollTo(0,0)});
  if(media==='print')await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
  const metrics=await page.evaluate(()=>{
   const problems=[];
   for(const p of document.querySelectorAll('.page')){const box=p.getBoundingClientRect(),footer=p.querySelector('footer')?.getBoundingClientRect();for(const b of p.querySelectorAll('.reading,.diagram,.cover,.place')){const r=b.getBoundingClientRect();if(r.bottom>(footer?.top||box.bottom-15)||r.right>box.right+1||r.left<box.left-1||b.scrollWidth>b.clientWidth+1)problems.push({page:p.dataset.page,type:b.className,bottom:r.bottom,limit:footer?.top||box.bottom});}}
   return {problems,horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2,pageCount:document.querySelectorAll('.page').length};
  });receipts.push({width,media,...metrics});
  if(media==='screen'&&width===1280){await page.addStyleTag({content:'.toolbar{visibility:hidden}'});for(const n of [1,6,7,8,9,10,12,13,14,15,16,17,22,23,24,25,26,30,33,35,39,40,44,48,49,57,62])await page.locator('.page').nth(n-1).screenshot({path:`tools/review/AST-VFR-R1-P${String(n).padStart(3,'0')}.png`});}
  if(media==='screen'&&width===390)await page.locator('.frame').nth(6).screenshot({path:'tools/review/AST-VFR-R1-MOBILE-390.png'});
 }
 const result={status:receipts.every(r=>!r.problems.length&&!r.horizontalOverflow)&&!errors.length?'PASS':'FAIL',receipts,errors,providerCalls:0,printBackgroundConfigured:true,pdfFileExported:false};
 fs.writeFileSync('content/professional/ast-full-production/publication/ast-vfr-r1-browser-fit-receipt.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));assert.equal(result.status,'PASS');
}finally{await browser.close();}
