import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PHIOS_PLAYWRIGHT_MODULE).href);
const root='docs/guided-report-successor-r2';fs.mkdirSync(`${root}/screenshots`,{recursive:true});
const evidence={variants:[],print:[],errors:[],humanAccepted:false};
const browser=await chromium.launch({channel:'msedge',headless:true});
try{for(const locale of ['zh-Hans','en'])for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1});page.on('pageerror',e=>evidence.errors.push(String(e)));
 await page.goto(`http://127.0.0.1:8788/${root}/review.html?locale=${locale}`);await page.waitForFunction(()=>window.batchReady,{},{timeout:120000});
 const metrics=await page.evaluate(()=>[...document.querySelectorAll('#report [data-page-number]')].map(p=>({pageNumber:Number(p.dataset.pageNumber),overflow:p.scrollWidth>p.clientWidth+1,header:p.querySelectorAll('header').length,footer:p.querySelectorAll('footer').length,pagination:p.querySelectorAll('[data-pagination-owner]').length,minBody:p.matches('.pub-page')?Math.min(...[...p.querySelectorAll('.pub-narrative p,.pub-reflection p')].map(el=>parseFloat(getComputedStyle(el).fontSize))):null,visibleText:p.innerText})));
 if(metrics.length!==26)evidence.errors.push(`PAGE_COUNT:${locale}:${width}`);
 for(const m of metrics){if(m.overflow)evidence.errors.push(`OVERFLOW:${locale}:${width}:${m.pageNumber}`);if(m.pageNumber>=6&&(m.pagination!==1||m.header!==1||m.footer!==1))evidence.errors.push(`CHROME:${locale}:${width}:${m.pageNumber}`);if(m.minBody&&m.minBody<16)evidence.errors.push(`FONT_MIN:${locale}:${width}:${m.pageNumber}`);if(/BAZI_FULL_REPORT:|PPR-C1-|CMP-|[a-f0-9]{32,}|OpenAI|DeepSeek|T[0-3]_|PROVIDER_|未选择目标时间|需要目标时间/.test(m.visibleText))evidence.errors.push(`INTERNAL_OR_PLACEHOLDER:${locale}:${m.pageNumber}`);await page.locator(`#report [data-page-number="${m.pageNumber}"]`).screenshot({path:`${root}/screenshots/${locale}-${width}-P${String(m.pageNumber).padStart(2,'0')}.png`});delete m.visibleText;}
 evidence.variants.push({locale,width,metrics});
 if(width===1440){await page.emulateMedia({media:'print'});await page.evaluate(()=>window.fitPublication());
  const print=await page.evaluate(()=>[...document.querySelectorAll('.pub-page')].map(p=>{const footer=p.querySelector('footer'),top=footer.getBoundingClientRect().top;return {pageNumber:Number(p.dataset.pageNumber),height:p.getBoundingClientRect().height,overflow:p.scrollHeight>p.clientHeight+2,footerOverlap:[...p.children].filter(el=>!['svg','HEADER','FOOTER'].includes(el.tagName)&&!el.classList.contains('pub-motif')).some(el=>el.getBoundingClientRect().bottom>top+1)};}));
  evidence.print.push({locale,metrics:print});if(print.some(m=>m.overflow||m.footerOverlap))evidence.errors.push(`PRINT_FIT:${locale}`);
  await page.pdf({path:`${root}/bazi-${locale}.pdf`,preferCSSPageSize:true,printBackground:true});
 }await page.close();
}}finally{await browser.close();}
evidence.machinePass=evidence.errors.length===0;fs.writeFileSync(`${root}/browser-evidence.json`,JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify({machinePass:evidence.machinePass,errors:evidence.errors,print:evidence.print.map(p=>({locale:p.locale,issues:p.metrics.filter(m=>m.overflow||m.footerOverlap)}))},null,2));if(!evidence.machinePass)process.exitCode=1;
