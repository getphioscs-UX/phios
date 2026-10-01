import puppeteer from '@cloudflare/puppeteer';
import {PDFDocument} from 'pdf-lib';
import {renderPublicationReport} from '../../assets/customer-ui/js/personal-products/publication-report-pages.js';
import {finalizeZiweiNavigation} from '../../functions/canonical-presentation-runtime/ziwei-navigation-finalization.js';
import {createCustomerDeliverySnapshot} from '../../functions/personal-reading/narrative/report-section-snapshot.js';
import {css,fitCode} from './render-assets.generated.js';
const origin='https://qa.phios-github.pages.dev';
const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
export default {
 async fetch(request,env){
  // No public endpoint. Only Pages' private service binding may invoke this worker.
  if(env.PHIOS_ENVIRONMENT!=='qa'||request.method!=='POST'||new URL(request.url).pathname!=='/verify')return new Response(null,{status:404});
  let browser;
  try{
   const reader=request.body?.getReader();if(!reader)throw Error('BODY_REQUIRED');let size=0,raw='';const decoder=new TextDecoder();
   for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8000000){await reader.cancel();throw Error('TOO_LARGE');}raw+=decoder.decode(value,{stream:true});}
   const {candidate,method,compositionVersion}=JSON.parse(raw+decoder.decode());
   if(method!=='ZWR'||compositionVersion!=='ZIWEI-PRODUCTION-COMPOSER-V1'||candidate?.scope!=='CONTROLLED_QA_ONLY'||!['en','zh-Hans'].includes(candidate.locale)||candidate.snapshot?.methodId!=='ZWR'||(await createCustomerDeliverySnapshot(candidate.snapshot)).semanticSnapshotId!==candidate.snapshot.semanticSnapshotId)throw Error('SNAPSHOT_INVALID');
   const body=finalizeZiweiNavigation(renderPublicationReport(candidate.snapshot),candidate.locale).replaceAll('src="/assets/',`src="${origin}/assets/`);
   browser=await puppeteer.launch(env.BROWSER);
   const page=await browser.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.name));
   await page.setViewport({width:1440,height:1000});
   // Report image requests are restricted to the existing QA assets and public assets.
   await page.setRequestInterception(true);
   page.on('request',r=>{const u=new URL(r.url());const allowed=u.protocol==='data:'||(u.protocol==='https:'&&(u.origin===origin||u.hostname.endsWith('.getphios.com')||u.hostname.endsWith('.r2.dev')));return allowed?r.continue():r.abort();});
   await page.setContent(`<!doctype html><html lang="${candidate.locale}"><head><meta charset="utf-8"><title>PHI OS · Zi Wei</title><style>${css}</style></head><body><main>${body}</main></body></html>`,{waitUntil:'networkidle0',timeout:60000});
   await page.addScriptTag({content:fitCode});
   await page.emulateMediaType('print');
   const measured=await page.evaluate(async()=>{
    await document.fonts.ready;await methodReportFit.settlePublicationAssets(document);
    await Promise.all([...document.images].map(i=>i.decode()));
    const fits=methodReportFit.fitPublicationForPrint(document);
    return {overflowCount:fits.filter(p=>!p.fits).length,brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).length,undefinedText:/undefined|\[object Object\]/.test(document.querySelector('main').innerText)};
   });
   const pageCount=(await PDFDocument.load(await page.pdf({format:'A4',printBackground:true,preferCSSPageSize:true}))).getPageCount();
   if(pageCount!==33||measured.overflowCount||measured.brokenImages||measured.undefinedText||errors.length)throw Error('RENDER_VERIFICATION_FAILED');
   // Persist already-fitted static material; ordinary customer open runs no code.
   await page.evaluate(()=>document.querySelectorAll('script').forEach(s=>s.remove()));
   const html=await page.content();
   return Response.json({html,verification:{schemaVersion:'METHOD_BROWSER_VERIFICATION_V1',verifier:'CLOUDFLARE_BROWSER_QA',semanticSnapshotId:candidate.snapshot.semanticSnapshotId,passed:true,pageCount,overflowCount:0,brokenImages:0,errorCount:0,outputDigest:await hash(html)}},{headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({ok:false,code:'REPORT_BROWSER_VERIFICATION_FAILED'},{status:422,headers:{'Cache-Control':'no-store'}});}
  finally{if(browser)await browser.close();}
 }
};
