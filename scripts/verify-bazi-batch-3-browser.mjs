import fs from 'node:fs';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {reportDesignErrors} from './lib/report-design-drift.mjs';
const modulePath=process.env.PHIOS_PLAYWRIGHT_MODULE;
if(!modulePath)throw Error('PHIOS_PLAYWRIGHT_MODULE_REQUIRED');
const {chromium}=await import(pathToFileURL(modulePath).href);
const root='docs/guided-report-successor-r1/batch-3';
fs.mkdirSync(`${root}/screenshots`,{recursive:true});
const registry=JSON.parse(fs.readFileSync('content/registry/report-visual-reference-freeze-r1.json'));
const browser=await chromium.launch({channel:'msedge',headless:true});
const evidence={batch:'BAZI-DYNAMIC-R1-BATCH-03',checkedAt:new Date().toISOString(),variants:[],print:[],previousBatchesVisualDiff:[],errors:[],humanVisualAcceptance:'PENDING'};
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
    for(const n of [16,17,18,19]){await page.selectOption('#page',String(n));if(await page.locator('#comparison').isHidden())await page.click('#compare');await page.locator('#comparison img').evaluate(img=>img.decode());await page.locator('#comparison').screenshot({path:`${root}/screenshots/compare-${locale}-P${n}.png`});}
    await page.click('#compare');
    await page.emulateMedia({media:'print'});
    const printMetrics=await page.evaluate(()=>[...document.querySelectorAll('#report .vrpt-page')].map(el=>{const figure=el.querySelector('.vrpt-primary'),cards=el.querySelector('.vrpt-insights');return {pageNumber:Number(el.dataset.pageNumber),pageOverflow:el.scrollHeight>el.clientHeight+2,visualContentOverlapsCards:[...figure.children].some(child=>child.getBoundingClientRect().bottom>cards.getBoundingClientRect().top+1)};}));
    evidence.print.push({locale,metrics:printMetrics});
    if(printMetrics.some(m=>m.pageOverflow||m.visualContentOverlapsCards))evidence.errors.push(`PRINT_OVERFLOW_OR_OVERLAP:${locale}`);
    await page.pdf({path:`${root}/bazi-p16-p19-${locale}.pdf`,preferCSSPageSize:true,printBackground:true});
   }
   await page.close();
  }
 }
 // Compare the prior batch against committed captures, without rewriting them.
 for(const priorBatch of [1,2])for(const locale of ['zh-Hans','en','bilingual'])for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1});
  await page.goto(`http://127.0.0.1:8788/docs/guided-report-successor-r1/batch-${priorBatch}/review.html?locale=${locale}`);await page.waitForFunction(()=>window.batchReady);await page.evaluate(()=>document.fonts.ready);
  for(const number of (priorBatch===1?[6,7,8,9,10]:[11,12,13,14,15])){
   const current=await page.locator(`#report [data-page-number="${number}"]`).screenshot(),baseline=fs.readFileSync(`docs/guided-report-successor-r1/batch-${priorBatch}/screenshots/${locale}-${width}-P${number}.png`),hash=v=>crypto.createHash('sha256').update(v).digest('hex');
   const unchanged=hash(current)===hash(baseline);let baselineStyleReproductionUnchanged=null;
   if(!unchanged){
    // Preserve the committed-capture mismatch. Reproduce with the exact prior
    // CSS to distinguish browser raster drift from this batch's composition.
    const priorCss=fs.readFileSync('assets/customer-ui/surfaces/visual-report.css','utf8').split('/* BAZI-DYNAMIC-R1-BATCH-03')[0];
    await page.evaluate(css=>{document.querySelector('link[href="/assets/customer-ui/surfaces/visual-report.css"]').sheet.disabled=true;const style=document.createElement('style');style.id='regression-prior-css';style.textContent=css;document.head.append(style);},priorCss);
    const reproduced=await page.locator(`#report [data-page-number="${number}"]`).screenshot();
    baselineStyleReproductionUnchanged=hash(current)===hash(reproduced);
    await page.evaluate(()=>{document.querySelector('#regression-prior-css').remove();document.querySelector('link[href="/assets/customer-ui/surfaces/visual-report.css"]').sheet.disabled=false;});
    fs.writeFileSync(`${root}/screenshots/regression-${locale}-${width}-P${number}.png`,current);
    if(!baselineStyleReproductionUnchanged)evidence.errors.push(`BATCH_${priorBatch}_VISUAL_CHANGED:${locale}:${width}:P${number}`);
   }
   evidence.previousBatchesVisualDiff.push({batch:priorBatch,locale,width,pageNumber:number,unchanged,baselineStyleReproductionUnchanged});
  }
  await page.close();
 }
}finally{await browser.close();}
evidence.machinePass=!evidence.errors.length&&evidence.variants.every(v=>v.metrics.every(m=>!m.designErrors.length));
fs.writeFileSync(`${root}/browser-evidence.json`,JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({machinePass:evidence.machinePass,errors:evidence.errors,variants:evidence.variants.map(v=>({locale:v.locale,width:v.width,issues:v.metrics.filter(m=>m.designErrors.length)}))},null,2));
if(!evidence.machinePass)process.exitCode=1;
