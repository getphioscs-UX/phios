import fs from 'node:fs';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {reportDesignErrors} from './lib/report-design-drift.mjs';
const modulePath=process.env.PHIOS_PLAYWRIGHT_MODULE;
if(!modulePath)throw Error('PHIOS_PLAYWRIGHT_MODULE_REQUIRED');
const {chromium}=await import(pathToFileURL(modulePath).href);
const root='docs/guided-report-successor-r1/batch-2';
fs.mkdirSync(`${root}/screenshots`,{recursive:true});
const registry=JSON.parse(fs.readFileSync('content/registry/report-visual-reference-freeze-r1.json'));
const browser=await chromium.launch({channel:'msedge',headless:true});
const evidence={batch:'BAZI-DYNAMIC-R1-BATCH-02',checkedAt:new Date().toISOString(),variants:[],print:[],batch1VisualDiff:[],errors:[],humanVisualAcceptance:'PENDING'};
try{
 for(const locale of ['zh-Hans','en','bilingual']){
  for(const width of [1440,390]){
   const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1});
   page.on('pageerror',e=>evidence.errors.push(String(e)));
   await page.goto(`http://127.0.0.1:8788/${root}/review.html?locale=${locale}`);
   await page.waitForFunction(()=>window.batchReady);
   await page.evaluate(()=>document.fonts.ready);
   const metrics=await page.evaluate(()=>[...document.querySelectorAll('#report .vrpt-page')].map(el=>{
    const rect=x=>x.getBoundingClientRect(),primary=rect(el.querySelector('.vrpt-primary')),prose=rect(el.querySelector('.vrpt-insights')),body=rect(el.querySelector('[data-part="page-body"]'));
    return {pageNumber:Number(el.dataset.pageNumber),pageWidth:rect(el).width,overflow:el.scrollWidth>el.clientWidth+1,measuredLayout:{source:'BROWSER_GEOMETRY',denominator:'PAGE_BODY_PRIMARY_PLUS_INSIGHTS_AND_GAP',primaryVisualShare:primary.height/body.height,proseShare:prose.height/body.height}};
   }));
   const report=await page.evaluate(()=>window.batchReport);
   for(const metric of metrics){const p=report.pages.find(p=>p.pageNumber===metric.pageNumber);metric.designErrors=reportDesignErrors({...p,visualDesign:{...p.visualDesign,measuredLayout:metric.measuredLayout}},registry);if(metric.overflow)metric.designErrors.push('HORIZONTAL_OVERFLOW');await page.locator(`#report [data-page-number="${p.pageNumber}"]`).screenshot({path:`${root}/screenshots/${locale}-${width}-P${p.pageNumber}.png`});}
   evidence.variants.push({locale,width,metrics});
   if(width===1440){
    for(const n of [11,12,13,14,15]){await page.selectOption('#page',String(n));if(await page.locator('#comparison').isHidden())await page.click('#compare');await page.locator('#comparison img').evaluate(img=>img.decode());await page.locator('#comparison').screenshot({path:`${root}/screenshots/compare-${locale}-P${n}.png`});}
    await page.click('#compare');
    await page.emulateMedia({media:'print'});
    const printMetrics=await page.evaluate(()=>[...document.querySelectorAll('#report .vrpt-page')].map(el=>{const figure=el.querySelector('.vrpt-primary'),cards=el.querySelector('.vrpt-insights');return {pageNumber:Number(el.dataset.pageNumber),pageOverflow:el.scrollHeight>el.clientHeight+2,visualContentOverlapsCards:[...figure.children].some(child=>child.getBoundingClientRect().bottom>cards.getBoundingClientRect().top+1)};}));
    evidence.print.push({locale,metrics:printMetrics});
    if(printMetrics.some(m=>m.pageOverflow||m.visualContentOverlapsCards))evidence.errors.push(`PRINT_OVERFLOW_OR_OVERLAP:${locale}`);
    await page.pdf({path:`${root}/bazi-p11-p15-${locale}.pdf`,preferCSSPageSize:true,printBackground:true});
   }
   await page.close();
  }
 }
 // Compare the prior batch against committed captures, without rewriting them.
 for(const locale of ['zh-Hans','en','bilingual'])for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1});
  await page.goto(`http://127.0.0.1:8788/docs/guided-report-successor-r1/batch-1/review.html?locale=${locale}`);await page.waitForFunction(()=>window.batchReady);await page.evaluate(()=>document.fonts.ready);
  for(const number of [6,7,8,9,10]){
   const current=await page.locator(`#report [data-page-number="${number}"]`).screenshot(),baseline=fs.readFileSync(`docs/guided-report-successor-r1/batch-1/screenshots/${locale}-${width}-P${number}.png`),hash=v=>crypto.createHash('sha256').update(v).digest('hex');
   const unchanged=hash(current)===hash(baseline);evidence.batch1VisualDiff.push({locale,width,pageNumber:number,unchanged});if(!unchanged){fs.writeFileSync(`${root}/screenshots/regression-${locale}-${width}-P${number}.png`,current);evidence.errors.push(`BATCH_1_VISUAL_CHANGED:${locale}:${width}:P${number}`);}
  }
  await page.close();
 }
}finally{await browser.close();}
evidence.machinePass=!evidence.errors.length&&evidence.variants.every(v=>v.metrics.every(m=>!m.designErrors.length));
fs.writeFileSync(`${root}/browser-evidence.json`,JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({machinePass:evidence.machinePass,errors:evidence.errors,variants:evidence.variants.map(v=>({locale:v.locale,width:v.width,issues:v.metrics.filter(m=>m.designErrors.length)}))},null,2));
if(!evidence.machinePass)process.exitCode=1;
