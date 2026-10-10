import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {reportDesignErrors} from './lib/report-design-drift.mjs';
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const root='docs/guided-report-successor-r1/batch-4',registry=JSON.parse(fs.readFileSync('content/registry/report-visual-reference-freeze-r1.json'));
const browser=await chromium.launch({channel:'msedge',headless:true}),evidence={variants:[],errors:[]};
try{
 const cases=['zh-Hans','en','bilingual'].flatMap(locale=>[1440,390].map(width=>({key:'selected',locale,width}))).concat(['transition','annualMissing','cycleMissing'].map(key=>({key,locale:'en',width:390})));
 for(const {key,locale,width} of cases){
  const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1});page.on('pageerror',e=>evidence.errors.push(String(e)));
  await page.goto(`http://127.0.0.1:8788/${root}/review.html?locale=${locale}&case=${key}`);await page.waitForFunction(()=>window.batchReady);await page.evaluate(()=>document.fonts.ready);
  const report=await page.evaluate(()=>window.batchReport);
  if(!report.pages[1].visual.target?.targetDate||report.pages[2].visual.comparisonState!=='NOT_COMPARED')evidence.errors.push(`TARGET_OR_REALITY_STATE:${key}`);
  const metrics=await page.evaluate(()=>[...document.querySelectorAll('#report .vrpt-page')].map(el=>{const rect=x=>x.getBoundingClientRect(),body=rect(el.querySelector('[data-part="page-body"]'));return {pageNumber:Number(el.dataset.pageNumber),overflow:el.scrollWidth>el.clientWidth+1,measuredLayout:{source:'BROWSER_GEOMETRY',primaryVisualShare:rect(el.querySelector('.vrpt-primary')).height/body.height,proseShare:rect(el.querySelector('.vrpt-insights')).height/body.height}};}));
  for(const m of metrics){const p=report.pages.find(x=>x.pageNumber===m.pageNumber);m.errors=reportDesignErrors({...p,visualDesign:{...p.visualDesign,measuredLayout:m.measuredLayout}},registry);if(m.overflow)m.errors.push('OVERFLOW');await page.locator(`#report [data-page-number="${m.pageNumber}"]`).screenshot({path:`${root}/screenshots/${key}-${locale}-${width}-P${m.pageNumber}.png`});}
  // Match the A4 export harness, rather than applying mobile screen media rules to print.
  await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({media:'print'});const print=await page.evaluate(()=>[...document.querySelectorAll('#report .vrpt-page')].map(el=>({pageNumber:el.dataset.pageNumber,overflow:el.scrollHeight>el.clientHeight+2,overlap:[...el.querySelector('.vrpt-primary').children].some(c=>c.getBoundingClientRect().bottom>el.querySelector('.vrpt-insights').getBoundingClientRect().top+1)})));
  if(print.some(x=>x.overflow||x.overlap))evidence.errors.push(`PRINT_OVERFLOW:${key}:${locale}`);
  evidence.variants.push({key,locale,width,completeness:report.pages[1].visual.completeness,metrics,print});await page.close();
 }
}finally{await browser.close();}
evidence.machinePass=!evidence.errors.length&&evidence.variants.every(v=>v.metrics.every(m=>!m.errors.length));
fs.writeFileSync(`${root}/timing-state-evidence.json`,JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence,null,2));if(!evidence.machinePass)process.exitCode=1;
