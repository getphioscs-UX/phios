import puppeteer from '@cloudflare/puppeteer';
import {renderPublicationReport} from '../../assets/customer-ui/js/personal-products/publication-report-pages.js';
import {finalizeZiweiNavigation} from '../../functions/canonical-presentation-runtime/ziwei-navigation-finalization.js';
import {createCustomerDeliverySnapshot} from '../../functions/personal-reading/narrative/report-section-snapshot.js';
import {css,fitCode} from './render-assets.generated.js';
import {assertZiweiContextSnapshot} from '../../functions/report-context/ziwei-contextual-snapshot-contract.js';
import {CONTEXTUAL_REPORT_CSS} from '../../functions/report-context/contextual-report-presentation.js';

const origin='https://qa.phios-github.pages.dev';
const ZIWEI_PAGE_COUNTS=Object.freeze({'ZIWEI-PRODUCTION-COMPOSER-V1':33,'ZIWEI-NATURAL-COMPOSER-R4':33,'ZIWEI-PROFESSIONAL-SYNTHESIS-R5':39,'ZIWEI-CONTEXTUAL-RCA-R1':41});
const ALLOWED_ZIWEI_COMPOSITIONS=new Set(Object.keys(ZIWEI_PAGE_COUNTS));
const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');

export default {
 async fetch(request,env){
  // No public endpoint. Only Pages' private service binding may invoke this worker.
  if(env.PHIOS_ENVIRONMENT!=='qa'||request.method!=='POST'||new URL(request.url).pathname!=='/verify')return new Response(null,{status:404});
  let browser,stage='INPUT';
  try{
   const reader=request.body?.getReader();if(!reader)throw Error('BODY_REQUIRED');let size=0,raw='';const decoder=new TextDecoder();
   for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8000000){await reader.cancel();throw Error('TOO_LARGE');}raw+=decoder.decode(value,{stream:true});}
   const {candidate,method,compositionVersion}=JSON.parse(raw+decoder.decode());
   const expectedPageCount=ZIWEI_PAGE_COUNTS[compositionVersion]||0;
   if(method!=='ZWR'||!ALLOWED_ZIWEI_COMPOSITIONS.has(compositionVersion)||!expectedPageCount||compositionVersion!==candidate?.snapshot?.compositionVersion||candidate?.scope!=='CONTROLLED_QA_ONLY'||!['en','zh-Hans'].includes(candidate.locale)||candidate.snapshot?.methodId!=='ZWR'||(await createCustomerDeliverySnapshot(candidate.snapshot)).semanticSnapshotId!==candidate.snapshot.semanticSnapshotId)throw Error('SNAPSHOT_INVALID');
   if(compositionVersion==='ZIWEI-CONTEXTUAL-RCA-R1')await assertZiweiContextSnapshot(candidate);

   stage='COMPOSE';
   const body=finalizeZiweiNavigation(renderPublicationReport(candidate.snapshot.semanticContent.report),candidate.locale).replaceAll('src="/assets/',`src="${origin}/assets/`);

   stage='BROWSER_LAUNCH';
   browser=await puppeteer.launch(env.BROWSER);
   const page=await browser.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.name));
   await page.setViewport({width:1440,height:1000});

   // Report image requests are restricted to the existing QA assets and public assets.
   await page.setRequestInterception(true);
   page.on('request',r=>{const u=new URL(r.url());const allowed=u.protocol==='data:'||(u.protocol==='https:'&&(u.origin===origin||u.hostname.endsWith('.getphios.com')||u.hostname.endsWith('.r2.dev')));return allowed?r.continue():r.abort();});

   stage='ASSET_LOAD';
   await page.setContent(`<!doctype html><html lang="${candidate.locale}"><head><meta charset="utf-8"><title>PHI OS · Zi Wei</title><style>${css}${compositionVersion==='ZIWEI-CONTEXTUAL-RCA-R1'?CONTEXTUAL_REPORT_CSS:''}</style></head><body><main>${body}</main></body></html>`,{waitUntil:'networkidle0',timeout:60000});
   await page.addScriptTag({content:fitCode});
   await page.emulateMediaType('print');

   stage='FIT';
   const measured=await page.evaluate(async expectedPageCount=>{
    await document.fonts.ready;
    await methodReportFit.settlePublicationAssets(document);
    await Promise.all([...document.images].map(i=>i.decode()));
    const fits=methodReportFit.fitPublicationForPrint(document);
    const physicalPages=[...document.querySelectorAll('main .pub-report > .pub-static, main .pub-report > .pub-page')];
    const pageNumbers=physicalPages.map(p=>Number(p.dataset.pageNumber));
    const pageSequenceValid=physicalPages.length===expectedPageCount&&pageNumbers.every((n,i)=>n===i+1);
    const hiddenOrZeroGeometryCount=physicalPages.filter(p=>{
     const rect=p.getBoundingClientRect(),style=getComputedStyle(p);
     return style.display==='none'||style.visibility==='hidden'||rect.width<=0||rect.height<=0;
    }).length;
    return {
     pageCount:physicalPages.length,
     pageSequenceValid,
     hiddenOrZeroGeometryCount,
     overflowCount:fits.filter(p=>!p.fits).length,
     brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).length,
     undefinedText:/undefined|\[object Object\]/.test(document.querySelector('main').innerText)
    };
   },expectedPageCount);

   stage='VERIFY';
   if(measured.pageCount!==expectedPageCount||!measured.pageSequenceValid||measured.hiddenOrZeroGeometryCount||measured.overflowCount||measured.brokenImages||measured.undefinedText||errors.length)throw Error('RENDER_VERIFICATION_FAILED');

   // The 24-report admission campaign separately proves Chromium/Edge PDF pagination
   // at 33 pages. Customer release verifies the deployed physical DOM contract
   // without regenerating and reparsing a PDF on every request.
   await page.evaluate(()=>document.querySelectorAll('script').forEach(s=>s.remove()));
   const html=await page.content();

   return Response.json({
    html,
    verification:{
     schemaVersion:'METHOD_BROWSER_VERIFICATION_V1',
     verifier:'CLOUDFLARE_BROWSER_QA',
     verificationMode:'DOM_PHYSICAL_PAGE_CONTRACT_V1',
     semanticSnapshotId:candidate.snapshot.semanticSnapshotId,
     passed:true,
     pageCount:measured.pageCount,
     pageSequenceValid:true,
     hiddenOrZeroGeometryCount:0,
     overflowCount:0,
     brokenImages:0,
     errorCount:0,
     outputDigest:await hash(html)
    }
   },{headers:{'Cache-Control':'no-store'}});
  }catch(error){
   return Response.json({
    ok:false,
    code:'REPORT_BROWSER_VERIFICATION_FAILED',
    stage,
    errorName:error.name,
    ...(['VERIFY','BROWSER_LAUNCH'].includes(stage)?{reason:String(error.message).slice(0,240)}:{}),
    ...(stage==='BROWSER_LAUNCH'?{limits:await puppeteer.limits(env.BROWSER).catch(()=>null)}:{})
   },{status:422,headers:{'Cache-Control':'no-store'}});
  }finally{
   if(browser)await browser.close();
  }
 }
};
