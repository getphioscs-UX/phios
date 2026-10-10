import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createPublicationReviewServer} from './lib/book-publication-review-server.mjs';
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const root='docs/guided-report-successor-r1',results=[];fs.mkdirSync(root+'/pdf',{recursive:true});
const server=createPublicationReviewServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:'msedge',headless:true});
try{for(const method of ['BZR','ECR','HD','CROSS'])for(const locale of ['en','zh-Hans','bilingual']){
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto(`${origin}/${root}/review.html?case=cases/${method}-${locale}.json`);await page.waitForSelector('body[data-ready=true]');await page.evaluate(()=>document.fonts.ready);
 await page.locator('.vrpt-locale-page').first().screenshot({path:`${root}/browser/${method}-${locale}-dynamic.png`});
 await page.addStyleTag({content:'@media print{body{background:white}main{padding:0}main>h1,main>p,main>label,.vrpt-editorial,.vrpt-report-map{display:none}.vrpt-locale-page{break-after:page}.vrpt-page{margin:0;min-height:0;box-shadow:none;break-after:auto}.vrpt-evidence{display:none}.vrpt-bilingual{display:block}.vrpt-bilingual .vrpt-page{padding:12px;font-size:12px}.vrpt-bilingual .vrpt-primary{min-height:0;max-height:280px}.vrpt-bilingual .vrpt-primary svg{max-height:270px}.vrpt-bilingual .vrpt-heading h2{font-size:20px}.vrpt-bilingual .vrpt-insights{font-size:12px}footer{display:none}}'});
 await page.pdf({path:`${root}/pdf/${method}-${locale}-DYNAMIC-ONLY.pdf`,format:'A4',preferCSSPageSize:true,printBackground:true,margin:{top:'15mm',bottom:'15mm',left:'15mm',right:'15mm'},displayHeaderFooter:true,headerTemplate:'<span></span>',footerTemplate:'<div style="font:9px sans-serif;width:100%;text-align:center">DYNAMIC QA · STATIC P01–P05 MISSING · <span class="pageNumber"></span> / <span class="totalPages"></span></div>'});
 results.push({method,locale,exported:true,completeReport:false,staticPages:'BLOCKED_MISSING_5_ASSETS',semanticReview:'PENDING'});await page.close();
}}finally{await browser.close();await new Promise(r=>server.close(r));fs.writeFileSync(root+'/print-results.json',JSON.stringify({results,fullReportPdfStatus:'BLOCKED_STATIC_ARTWORK_MISSING',humanReview:'PENDING'},null,2)+'\n');}
console.log(`Exported ${results.length} dynamic-only PDF test drafts; full report PDF acceptance remains blocked.`);
