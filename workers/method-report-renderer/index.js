import {assertMethodGeneration} from '../../functions/report-delivery/method-render-contract.js';
import puppeteer from '@cloudflare/puppeteer';
import {createCustomerDeliverySnapshot} from '../../functions/personal-reading/narrative/report-section-snapshot.js';
import {css,fitCode} from './render-assets.generated.js';
import {assertZiweiContextSnapshot} from '../../functions/report-context/ziwei-contextual-snapshot-contract.js';
import {CONTEXTUAL_REPORT_CSS} from '../../functions/report-context/contextual-report-presentation.js';

const origin='https://qa.phios-github.pages.dev';
const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');

export default {
 async fetch(request,env){
  // No public endpoint. Only Pages' private service binding may invoke this worker.
  if(env.PHIOS_ENVIRONMENT!=='qa'||request.method!=='POST'||new URL(request.url).pathname!=='/verify')return new Response(null,{status:404});
  let browser,stage='INPUT';const startedAt=Date.now(),timings={};
  try{
   const reader=request.body?.getReader();if(!reader)throw Error('BODY_REQUIRED');let size=0,raw='';const decoder=new TextDecoder();
   for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8000000){await reader.cancel();throw Error('TOO_LARGE');}raw+=decoder.decode(value,{stream:true});}
   const {candidate,method,compositionVersion}=JSON.parse(raw+decoder.decode());
   const contract=await assertMethodGeneration(candidate),expectedPageCount=contract.expectedPageCount;
   if(method!==contract.methodCode||compositionVersion!==contract.compositionVersion||candidate?.scope!=='CONTROLLED_QA_ONLY'||candidate.snapshot?.locale!==candidate.locale||(await createCustomerDeliverySnapshot(candidate.snapshot)).semanticSnapshotId!==candidate.snapshot.semanticSnapshotId)throw Error('SNAPSHOT_INVALID');
   if(compositionVersion==='ZIWEI-CONTEXTUAL-RCA-R1')await assertZiweiContextSnapshot(candidate);

   stage='COMPOSE';
   const body=contract.renderFunction().replaceAll('src="/assets/',`src="${origin}/assets/`);

   stage='BROWSER_LAUNCH';
   const launchStarted=Date.now();
   browser=await puppeteer.launch(env.BROWSER);
   timings.browserLaunchMs=Date.now()-launchStarted;
   const page=await browser.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.name));
   await page.setViewport({width:1440,height:1000});

   // Report image requests are restricted to the existing QA assets and public assets.
   await page.setRequestInterception(true);
   page.on('request',r=>{const u=new URL(r.url());const allowed=u.protocol==='data:'||(u.protocol==='https:'&&(u.origin===origin||u.hostname.endsWith('.getphios.com')||u.hostname.endsWith('.r2.dev')));return allowed?r.continue():r.abort();});

   stage='ASSET_LOAD';
   const assetStarted=Date.now();
   await page.setContent(`<!doctype html><html lang="${candidate.locale}"><head><meta charset="utf-8"><title>PHI OS · Zi Wei</title><style>${contract.styles||css}${compositionVersion==='ZIWEI-CONTEXTUAL-RCA-R1'?CONTEXTUAL_REPORT_CSS:''}</style></head><body><main class="report-root">${body}</main></body></html>`,{waitUntil:'networkidle0',timeout:60000});
   timings.assetLoadMs=Date.now()-assetStarted;
   if(contract.rendererId!=='ZIWEI_VFR')await page.addScriptTag({content:fitCode});
   await page.emulateMediaType('print');

   stage='FIT';
   const measured=await page.evaluate(async ({expectedPageCount,pageSelector,rendererId,requiredDiagramIds})=>{
    const started=performance.now();
    await document.fonts.ready;
    const fontSettleMs=performance.now()-started;
    if(rendererId!=='ZIWEI_VFR')await methodReportFit.settlePublicationAssets(document);
    const decodeStarted=performance.now();
    await Promise.all([...document.images].map(i=>i.decode()));
    const imageDecodeMs=performance.now()-decodeStarted,fitStarted=performance.now();
    const fits=rendererId==='ZIWEI_VFR'?[]:methodReportFit.fitPublicationForPrint(document);
    const physicalPages=[...document.querySelectorAll(pageSelector)];
    const pageNumbers=physicalPages.map(p=>Number(p.dataset.pageNumber));
    const pageSequenceValid=physicalPages.length===expectedPageCount&&pageNumbers.every((n,i)=>n===i+1);
    const hiddenOrZeroGeometryCount=physicalPages.filter(p=>{
     const rect=p.getBoundingClientRect(),style=getComputedStyle(p);
     return style.display==='none'||style.visibility==='hidden'||style.opacity==='0'||rect.width<=0||rect.height<=0;
    }).length;
    const hiddenRequiredContentCount=rendererId==='ZIWEI_VFR'?[...document.querySelectorAll('.zv-page main p,.zv-page figure,.zv-page figcaption,.zv-page main h1,.zv-page main h2')].filter(n=>{const r=n.getBoundingClientRect(),style=getComputedStyle(n);return style.display==='none'||style.visibility==='hidden'||style.opacity==='0'||r.width<=0||r.height<=0;}).length:0;
    const diagramCaptionsValid=rendererId!=='ZIWEI_VFR'||[...document.querySelectorAll('[data-diagram-id]')].every(d=>d.querySelector('figcaption b')?.textContent.trim()&&d.querySelector('figcaption span')?.textContent.trim()&&d.querySelectorAll('.zv-empty').length===0&&d.children.length>1);
    const diagrams=[...document.querySelectorAll('[data-diagram-id]')].map(d=>d.dataset.diagramId);
    const diagramRegistryValid=requiredDiagramIds.length===0||(diagrams.length===requiredDiagramIds.length&&requiredDiagramIds.every(id=>diagrams.filter(x=>x===id).length===1));
    const overflowPages=rendererId==='ZIWEI_VFR'?physicalPages.filter(p=>{
     const main=p.querySelector('main'),footer=p.querySelector('footer');
     if(p.scrollHeight>p.clientHeight+2)return true;
     if(!main)return false;
     const boundary=footer?.getBoundingClientRect().top??p.getBoundingClientRect().bottom;
     const content=[...main.querySelectorAll('p,figure,figcaption,article,h1,h2,.zv-diagram *')];
     return main.scrollHeight>main.clientHeight+2||content.some(n=>{
      const r=n.getBoundingClientRect(),style=getComputedStyle(n);
      return r.bottom>boundary+1||style.display==='none'||style.visibility==='hidden'||style.opacity==='0';
     });
    }):[];
    return {
     fontSettleMs,imageDecodeMs,fitMs:performance.now()-fitStarted,imageCount:document.images.length,
     diagramRegistryValid,diagramCaptionsValid,hiddenRequiredContentCount,
     missingRenderer:document.querySelectorAll('.zv-empty').length,
     pageCount:physicalPages.length,
     pageSequenceValid,
     hiddenOrZeroGeometryCount,
     overflowCount:fits.filter(p=>!p.fits).length+overflowPages.length,
     brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).length,
     undefinedText:/undefined|\[object Object\]/.test(document.querySelector('main').innerText)
    };
   },{expectedPageCount,pageSelector:contract.pageSelector,rendererId:contract.rendererId,requiredDiagramIds:contract.requiredDiagramIds});

   stage='VERIFY';
   if(measured.pageCount!==expectedPageCount||!measured.pageSequenceValid||measured.hiddenOrZeroGeometryCount||measured.overflowCount||measured.brokenImages||measured.undefinedText||!measured.diagramRegistryValid||!measured.diagramCaptionsValid||measured.hiddenRequiredContentCount||measured.missingRenderer||errors.length)throw Error('RENDER_VERIFICATION_FAILED');

   // Verify the method-owned physical DOM contract. PDF admission is a separate
   // receipt; reopening always reads the already stored material.
   await page.evaluate(()=>document.querySelectorAll('script').forEach(s=>s.remove()));
   const html=await page.content();

   return Response.json({
    html,
    verification:{
     schemaVersion:'METHOD_BROWSER_VERIFICATION_V1',
     verifier:'CLOUDFLARE_BROWSER_QA',
     verificationMode:contract.verificationMode,
     rendererVersion:contract.rendererVersion,
     compositionVersion:contract.compositionVersion,
     publicationVersion:contract.publicationVersion,
     diagramRegistryValid:measured.diagramRegistryValid,
     undefinedText:false,
     semanticSnapshotId:candidate.snapshot.semanticSnapshotId,
     snapshotId:candidate.snapshot.semanticSnapshotId,
     pagePlanDigest:candidate.snapshot.semanticContent.vfrLineage?.pagePlanDigest||null,
     publicationIrDigest:candidate.snapshot.semanticContent.visualReportIr?.publicationIrDigest||null,
     sourceResultDigest:candidate.snapshot.semanticContent.vfrDeepManuscriptDigest||null,
     expectedPageCount,actualPageCount:measured.pageCount,hiddenRequiredContentCount:measured.hiddenRequiredContentCount,
     passed:true,
     timings:{...timings,fontSettleMs:measured.fontSettleMs,imageDecodeMs:measured.imageDecodeMs,fitMs:measured.fitMs,totalRequestMs:Date.now()-startedAt},
     imageCount:measured.imageCount,
     htmlBytes:new TextEncoder().encode(html).byteLength,
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
    timings:{...timings,totalRequestMs:Date.now()-startedAt},
    ...(['VERIFY','BROWSER_LAUNCH'].includes(stage)?{reason:String(error.message).slice(0,240)}:{}),
    ...(stage==='BROWSER_LAUNCH'?{limits:await puppeteer.limits(env.BROWSER).catch(()=>null)}:{})
   },{status:422,headers:{'Cache-Control':'no-store'}});
  }finally{
   if(browser)await browser.close();
  }
 }
};
