import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {createRequire} from 'node:module';
import {PDFDocument} from 'pdf-lib';
import {buildBaziCustomerPublication} from '../functions/personal-reading/bazi-customer-publication.js';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const dir='docs/acceptance/bazi-paid-report/composition-r1';
const baseline=read(dir+'/baseline.json'),source=read('docs/guided-report-successor-r2/bazi-source.json');
const manifestPath='content/reports/shared/bazi-composition-r1-manifest.json',manifest=read(manifestPath);
for(const [file,digest] of Object.entries(baseline.acceptedCopyDigests))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),digest,'accepted source changed');
let architecture=null;
for(const a of manifest.artifacts){
 const r=await buildBaziCustomerPublication({historicalReferenceReview:true,...source,locale:a.locale,full:true,compositionR1:true}),old=baseline.reports[a.locale];
 assert(r.totalPages>=36&&r.totalPages<=40);assert.equal(r.pages.length,r.totalPages-6);
 const roles=r.pages.map(p=>[p.sectionId,p.physicalPageRole]);
 if(architecture)assert.deepEqual(roles,architecture);architecture=roles;
 const master=r.pages.filter(p=>p.pageFamily==='SECTION_OPENER_PAGE');assert.equal(master.length,10);
 for(const p of master){const prior=old.pages.find(x=>x.pageKey===p.pageKey);assert.deepEqual(p.visualBinding,prior.visualBinding);assert.deepEqual(p.paragraphs,prior.paragraphs);assert.deepEqual(p.items,prior.items);}
 const expected=old.pages.filter(p=>p.pageFamily!=='SECTION_OPENER_PAGE').flatMap(p=>p.paragraphs.map((text,index)=>({key:p.pageKey+':'+index,text})));
 const actual=r.pages.flatMap(p=>(p.compositionNodes||[]).flatMap(n=>n.paragraphs.map(b=>({key:b.sourceNodeId+':'+b.sourceParagraphIndex,text:b.text}))));
 assert.deepEqual(actual.sort((a,b)=>a.key.localeCompare(b.key)),expected.sort((a,b)=>a.key.localeCompare(b.key)),'accepted semantic coverage must be exact');
 assert.equal(new Set(actual.map(x=>x.text)).size,actual.length,'duplicate exact narrative');
 assert.deepEqual(new Set(r.physicalComposition.coverage.map(c=>c.sourceNodeId)),new Set(old.pages.map(p=>p.pageKey)));
 assert.equal(r.pages.flatMap(p=>p.compositionNodes||[]).filter(n=>n.primaryVisualHtml).length,old.pages.filter(p=>p.primaryVisualHtml).length);
 for(const p of r.pages)assert(!/· 续|· continued/i.test(p.title));
 a.semanticCoverage='PASS';
}
if(process.argv.includes('--structural-only')){console.log('PASS: composition source preservation, shared bilingual architecture within 36–40 pages, 10 unchanged masters. Browser fit remains separately required.');process.exit(0);}
const require=createRequire(import.meta.url);
let playwright;
try{playwright=require('playwright');}catch{playwright=require(path.join(process.env.USERPROFILE||process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));}
const browser=await playwright.chromium.launch({channel:process.env.REPORT_BROWSER_CHANNEL||'msedge',headless:true});
const results=[];
try{
 for(const a of manifest.artifacts){
  const page=await browser.newPage({viewport:{width:1150,height:1400},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(a.path)).href+'?mode=customer',{waitUntil:'load',timeout:60000});
  await page.waitForFunction(()=>window.batchReady,{timeout:60000});
  assert(await page.locator('.review-notice').isHidden(),'customer mode must hide review evidence metadata');
  await page.emulateMedia({media:'print'});
  const measured=await page.evaluate(()=>{
   const fit=window.measureReport();
   const pages=[...document.querySelectorAll('.pub-page')];
   return {...fit,rawTechnicalEnums:[...new Set((document.querySelector('main').innerText.match(/\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g)||[]))],brokenImages:[...document.querySelectorAll('main img')].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),
    pages:pages.map(p=>{const rect=p.getBoundingClientRect(),footer=p.querySelector('footer').getBoundingClientRect();const content=p.querySelector('.pub-composed-content');const texts=[...p.querySelectorAll('.pub-composed-content [data-source-block]')];return {pageNumber:Number(p.dataset.pageNumber),fitMode:p.dataset.textFit,contentHeight:content?.getBoundingClientRect().height||null,availableHeight:content?footer.top-content.getBoundingClientRect().top:null,minBodyFont:texts.length?Math.min(...texts.map(t=>parseFloat(getComputedStyle(t).fontSize))):null,clipped:texts.some(t=>{const r=t.getBoundingClientRect();return r.bottom>footer.top+1||r.right>rect.right+1||r.left<rect.left-1}),blank:content?!content.textContent.trim():false};})};
  });
  const printed=await PDFDocument.load(await page.pdf({format:'A4',printBackground:true,preferCSSPageSize:true}));
  measured.printedPhysicalPages=printed.getPageCount();
  assert.equal(measured.printedPhysicalPages,a.physicalPageCount,'actual print pagination differs from composed page count');
  for(const p of a.sectionPageMap){const row=measured.pages.find(x=>x.pageNumber===p.physicalPageNumber);if(!row){assert(p.physicalPageNumber<=6);p.fitMode='STANDARD';p.overflow='CLEAR';continue;}p.fitMode=row.fitMode;p.overflow=measured.overflowPages.some(x=>x.pageNumber===row.pageNumber)||row.clipped?'OVERFLOW':'CLEAR';}
  a.printedPhysicalPageCount=measured.printedPhysicalPages;
  results.push({locale:a.locale,...measured,errors});
  console.log(a.locale,JSON.stringify({overflow:measured.overflowPages,clipped:measured.pages.filter(p=>p.clipped),broken:measured.brokenImages.length,errors}));
  for(const number of [8,14,15,19,23,...a.sectionPageMap.filter(p=>['PRESSURE','MAINTENANCE','GUIDANCE','DECISIONS','EVIDENCE_BOUNDARY'].includes(p.physicalPageRole)).map(p=>p.physicalPageNumber)])await page.locator(`.pub-page[data-page-number="${number}"]`).screenshot({path:`${dir}/${a.locale}-p${number}.png`});
  await page.close();
 }
}finally{await browser.close();}
fs.writeFileSync(dir+'/browser-measurements.json',JSON.stringify(results,null,2)+'\n');
const passed=results.every(r=>!r.overflowPages.length&&!r.rawTechnicalEnums.length&&!r.brokenImages.length&&!r.errors.length&&r.pages.every(p=>!p.clipped&&!p.blank&&(p.minBodyFont===null||p.minBodyFont>=16)));
const frozen=fs.existsSync(dir+'/HUMAN-ACCEPTANCE.json');
manifest.status=passed?(frozen?'ACCEPTED_FROZEN':'READY_FOR_HUMAN_REVIEW'):'FIT_REPAIR_REQUIRED';
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
// Local-file iframe origins cannot be inspected reliably. Embed the measured
// manifest so the review switcher displays the actual verified fit evidence.
const reviewPath='tools/review/BAZI-FULL-REPORT-COMPOSITION-R1-REVIEW.html';
const reviewData=JSON.stringify(manifest.artifacts).replaceAll('<','\\u003c');
if(!frozen)fs.writeFileSync(reviewPath,fs.readFileSync(reviewPath,'utf8').replace(/const data=.*?;function show\(i\)/s,()=>`const data=${reviewData};function show(i)`));
assert(passed,'Composition browser/asset/readability gate failed; see browser-measurements.json');
console.log(`PASS: accepted copy unchanged, physical pages ${manifest.artifacts.map(a=>a.locale+': '+a.physicalPageCount).join(', ')}, actual A4 measurement without overflow/clipping, bound assets decoded; human composition decision remains pending.`);
