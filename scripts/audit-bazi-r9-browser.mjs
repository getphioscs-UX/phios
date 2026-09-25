import fs from 'node:fs';
import {chromium} from 'playwright';
import {PDFDocument} from 'pdf-lib';

const root='artifacts/bazi-r9-browser';
const origin='http://127.0.0.1:8788';
const widths=[1440,390];
const screenshotPages=new Set([1,6,7,11,20,23,24,25,26,27,28,29,30,39,40,44]);
const evidence={schemaVersion:'BAZI_R11_CANONICAL_BROWSER_PDF_AUDIT_V1',variants:[],print:[],physicalPdf:[],errors:[],humanAccepted:false};
const browser=await chromium.launch({headless:true});
try{
 for(const locale of ['en','zh-Hans']){
  const snapshot=JSON.parse(fs.readFileSync(`${root}/snapshot-${locale}.json`,'utf8'));
  for(const width of widths){
   const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:1});
   page.on('pageerror',e=>evidence.errors.push(`PAGEERROR:${locale}:${width}:${String(e)}`));
   await page.goto(`${origin}/${root}/review.html?locale=${locale}`,{waitUntil:'networkidle',timeout:120000});
   await page.waitForFunction(()=>window.batchReady===true,{timeout:120000});
   const metrics=await page.evaluate(()=>[...document.querySelectorAll('#report [data-page-number]')].map(p=>{
    const footer=p.querySelector('footer');
    const bodyEls=[...p.querySelectorAll('.pub-narrative p,.pub-reflection p,.pub-body p,.vrpt-copy p')];
    const text=p.innerText||'';
    return {
     pageNumber:Number(p.dataset.pageNumber),
     scrollWidth:p.scrollWidth,clientWidth:p.clientWidth,
     scrollHeight:p.scrollHeight,clientHeight:p.clientHeight,
     overflowX:p.scrollWidth>p.clientWidth+1,
     overflowY:p.scrollHeight>p.clientHeight+2,
     headerCount:p.querySelectorAll('header').length,
     footerCount:p.querySelectorAll('footer').length,
     paginationCount:p.querySelectorAll('[data-pagination-owner]').length,
     minBodyFont:bodyEls.length?Math.min(...bodyEls.map(el=>parseFloat(getComputedStyle(el).fontSize)||999)):null,
     text
    };
   }));
   if(metrics.length!==snapshot.totalPages)evidence.errors.push(`PAGE_COUNT:${locale}:${width}:${metrics.length}/${snapshot.totalPages}`);
   for(const m of metrics){
    if(m.overflowX)evidence.errors.push(`OVERFLOW_X:${locale}:${width}:P${m.pageNumber}`);
    if(m.overflowY)evidence.errors.push(`OVERFLOW_Y:${locale}:${width}:P${m.pageNumber}`);
    if(m.pageNumber>=6&&(m.paginationCount!==1||m.headerCount!==1||m.footerCount!==1))evidence.errors.push(`PAGE_CHROME:${locale}:${width}:P${m.pageNumber}`);
    if(m.minBodyFont!==null&&m.minBodyFont<16)evidence.errors.push(`FONT_MIN:${locale}:${width}:P${m.pageNumber}:${m.minBodyFont}`);
    if(/BAZI_FULL_REPORT:|PPR-C1-|CMP-|[a-f0-9]{32,}|OpenAI|DeepSeek|T[0-3]_|PROVIDER_|SECTION_BLOCK_|claimIr|sourceRefs|STEM_COMBINATION|BRANCH_(?:HARM|SELF_PUNISHMENT|REPEAT)|\b(?:YEAR|MONTH|DAY|HOUR)\b(?=\s*(?:and|且|，|\.|$))/i.test(m.text))evidence.errors.push(`INTERNAL_LEAK:${locale}:P${m.pageNumber}`);
    if(width===1440&&screenshotPages.has(m.pageNumber)){
     await page.locator(`#report [data-page-number="${m.pageNumber}"]`).screenshot({path:`${root}/${locale}-desktop-P${String(m.pageNumber).padStart(2,'0')}.png`});
    }
    if(width===390&&[7,11,30,50,63].includes(m.pageNumber)){
     await page.locator(`#report [data-page-number="${m.pageNumber}"]`).screenshot({path:`${root}/${locale}-mobile-P${String(m.pageNumber).padStart(2,'0')}.png`});
    }
    delete m.text;
   }
   const broken=await page.locator('#report img').evaluateAll(images=>images.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.currentSrc||i.src));
   if(broken.length)evidence.errors.push(`BROKEN_ASSET:${locale}:${width}:${JSON.stringify(broken)}`);
   evidence.variants.push({locale,width,pageCount:metrics.length,metrics,brokenAssets:broken});
   if(width===1440){
    await page.emulateMedia({media:'print'});
    await page.evaluate(()=>window.fitPublication());
    const print=await page.evaluate(()=>[...document.querySelectorAll('#report [data-page-number]')].map(p=>{
     const footer=p.querySelector('footer');
     const footerTop=footer?.getBoundingClientRect().top??Infinity;
     const content=[...p.children].filter(el=>!['SVG','HEADER','FOOTER'].includes(el.tagName)&&el.getAttribute('aria-hidden')!=='true');
     return {
      pageNumber:Number(p.dataset.pageNumber),
      overflow:p.scrollHeight>p.clientHeight+2,
      footerOverlap:content.some(el=>el.getBoundingClientRect().bottom>footerTop+1)
     };
    }));
    if(print.some(x=>x.overflow||x.footerOverlap))evidence.errors.push(`PRINT_FIT:${locale}`);
    evidence.print.push({locale,metrics:print});
    const pdfPath=`${root}/bazi-r11-${locale}.pdf`;
    await page.pdf({path:pdfPath,preferCSSPageSize:true,printBackground:true});
    const pdf=await PDFDocument.load(fs.readFileSync(pdfPath));
    const physicalPages=pdf.getPageCount();
    evidence.physicalPdf.push({locale,logicalPages:snapshot.totalPages,physicalPages,match:physicalPages===snapshot.totalPages});
    if(physicalPages!==snapshot.totalPages)evidence.errors.push(`PHYSICAL_PAGE_COUNT:${locale}:${physicalPages}/${snapshot.totalPages}`);
   }
   await page.close();
  }
 }
}finally{await browser.close();}
evidence.machinePass=evidence.errors.length===0;
fs.writeFileSync(`${root}/browser-evidence.json`,JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({machinePass:evidence.machinePass,errorCount:evidence.errors.length,errors:evidence.errors.slice(0,80)},null,2));
if(!evidence.machinePass)process.exitCode=1;
