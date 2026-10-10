import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import crypto from 'node:crypto';
import {reportDesignErrors} from './lib/report-design-drift.mjs';
import {renderVisualReportPages} from '../assets/customer-ui/js/personal-products/visual-report-pages.js';
const root='docs/guided-report-successor-r1/batch-6';
const manifest=JSON.parse(fs.readFileSync(`${root}/manifest.json`));
const registry=JSON.parse(fs.readFileSync('content/registry/report-visual-reference-freeze-r1.json'));
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
for(const [path,hash] of Object.entries(manifest.sourceHashes))assert.equal(sha(fs.readFileSync(path)),hash,`Source drift: ${path}`);
assert.equal(manifest.successorBaselineActivated,false);
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
fs.mkdirSync(`${root}/screenshots`,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const evidence={checkedAt:new Date().toISOString(),baseline:manifest.baseline,errors:[],variants:[],print:[],humanReview:'PENDING',customerPublishable:false,successorBaselineActivated:false};
try{
for(const locale of manifest.locales)for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1});
 page.on('pageerror',e=>evidence.errors.push(String(e)));
 await page.goto(`http://127.0.0.1:8788/${root}/review.html?locale=${locale}`);
 await page.waitForFunction(()=>window.batchReady,{},{timeout:120000});
 const reports=await page.evaluate(()=>window.batchReports);
 assert.deepEqual(reports.map(r=>sha(renderVisualReportPages(r))),manifest.dynamicHtmlHashes[locale]);
 const metrics=await page.evaluate(()=>[...document.querySelectorAll('#report [data-page-number]')].map(el=>{
  const rect=x=>x.getBoundingClientRect(),body=el.querySelector('[data-part="page-body"]'),img=el.querySelector('img');
  return {pageNumber:Number(el.dataset.pageNumber),kind:body?'DYNAMIC':'STATIC',width:rect(el).width,height:rect(el).height,
   horizontalOverflow:el.scrollWidth>el.clientWidth+1,image:img?{loaded:img.complete&&img.naturalWidth>0,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,url:img.currentSrc}:null,
   measuredLayout:body?{source:'BROWSER_GEOMETRY',denominator:'PAGE_BODY_PRIMARY_PLUS_INSIGHTS_AND_GAP',primaryVisualShare:rect(el.querySelector('.vrpt-primary')).height/rect(body).height,proseShare:rect(el.querySelector('.vrpt-insights')).height/rect(body).height}:null};
 }));
 assert.deepEqual(metrics.map(m=>m.pageNumber),Array.from({length:26},(_,i)=>i+1));
 for(const metric of metrics){
  metric.designErrors=[];
  if(metric.horizontalOverflow)metric.designErrors.push('HORIZONTAL_OVERFLOW');
  if(metric.image&&!metric.image.loaded)metric.designErrors.push('STATIC_IMAGE_NOT_LOADED');
  if(metric.kind==='DYNAMIC'){const p=reports.flatMap(r=>r.pages).find(p=>p.pageNumber===metric.pageNumber);metric.designErrors.push(...reportDesignErrors({...p,visualDesign:{...p.visualDesign,measuredLayout:metric.measuredLayout}},registry));}
  await page.locator(`#report [data-page-number="${metric.pageNumber}"]`).screenshot({path:`${root}/screenshots/${locale}-${width}-P${String(metric.pageNumber).padStart(2,'0')}.png`});
 }
 evidence.variants.push({locale,width,metrics});
 if(width===1440){
  await page.emulateMedia({media:'print'});
  const metrics=await page.evaluate(()=>[...document.querySelectorAll('#report .vrpt-page')].map(el=>{const figure=el.querySelector('.vrpt-primary'),cards=el.querySelector('.vrpt-insights');return {pageNumber:Number(el.dataset.pageNumber),pageOverflow:el.scrollHeight>el.clientHeight+2,visualContentOverlapsCards:[...figure.children].filter(child=>child.getClientRects().length>0).some(child=>child.getBoundingClientRect().bottom>cards.getBoundingClientRect().top+1)};}));
  evidence.print.push({locale,metrics});
  if(metrics.some(m=>m.pageOverflow||m.visualContentOverlapsCards))evidence.errors.push(`PRINT_OVERFLOW:${locale}`);
  await page.pdf({path:`${root}/bazi-p01-p26-${locale}.pdf`,preferCSSPageSize:true,printBackground:true});
 }
 await page.close();
}
}finally{await browser.close();}
evidence.machinePass=!evidence.errors.length&&evidence.variants.every(v=>v.metrics.every(m=>!m.designErrors.length));
fs.writeFileSync(`${root}/browser-evidence.json`,JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({machinePass:evidence.machinePass,errors:evidence.errors,issues:evidence.variants.flatMap(v=>v.metrics.filter(m=>m.designErrors.length).map(m=>({locale:v.locale,width:v.width,...m})))},null,2));
if(!evidence.machinePass)process.exitCode=1;
