import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {startP7} from './lib/bazi-r2-p7-terminal-harness.mjs';
import {renderBaziDeepManuscript} from '../assets/customer-ui/js/personal-products/bazi-deep-manuscript-pages.js';
const dir='content/production-closure/live-customer-commercial-convergence/bazi-r2-p7/';
const owner='assets/customer-ui/surfaces/bazi-deep-manuscript-r2.css';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const write=(n,v)=>fs.writeFileSync(dir+n,JSON.stringify(v,null,2)+'\n');
const beforeCss=fs.readFileSync(owner);
const prior=read(dir+'P7R1-BEFORE.json');
const protectedHashes=Object.fromEntries(Object.keys(prior.protectedHashes).filter(p=>p!==owner).map(p=>[p,sha(fs.readFileSync(p))]));
protectedHashes['functions/personal-reading/publication-fit/bazi-diagram-fidelity.js']='700e29de1f9b5c06e577c16fe6facc6b5521c7574f617a8116625b5a07b96a5a';
assert.equal(sha(fs.readFileSync('functions/personal-reading/publication-fit/bazi-diagram-fidelity.js')),protectedHashes['functions/personal-reading/publication-fit/bazi-diagram-fidelity.js']);
write('P7R2-BEFORE.json',{head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),status:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}),owner,beforeSha256:sha(beforeCss),protectedHashes});
fs.writeFileSync(dir+'P7R2-CSS-BEFORE.css',beforeCss);
const result={status:'RUNNING',productionOwner:owner,beforeSha256:sha(beforeCss),afterSha256:null,fontSizeChanged:false,lineHeightChanged:false,footerPositionChanged:false,pagePlanChanged:false,providerCalls:0,providerCostUSD:0,providerNetworkCalls:0,targetedRendererHttpStatus:null,targetedRendererPassed:false,fullP7Run:false,fullP7Status:'NOT_RUN',remainingBlocker:null};
const terminal=await startP7();
try{
 const customerHtml=fs.readFileSync(dir+'REJECTED-RENDERER-OUTPUT.html','utf8');
 const cases=[{name:'CUSTOMER_BILINGUAL',html:customerHtml}];
 for(const mode of ['BILINGUAL','EN','ZH_HANS']){
  const ir=read('docs/acceptance/bazi-paid-report/deep-manuscript-r2/LIVE-PUBLICATION-IR-R2-CLOSURE-'+mode+'.json');
  const styles=['bazi-deep-manuscript-r2.css','report-print-shell-v2.css','bazi-print-shell-v2.css'];
  cases.push({name:mode,irDigest:ir.digest,diagramSemanticDigest:sha(JSON.stringify(ir.technical.diagrams)),html:`<!doctype html><html><head><meta charset="utf-8">${styles.map(s=>`<link rel="stylesheet" href="/assets/customer-ui/surfaces/${s}">`).join('')}</head><body><main class="report-root">${renderBaziDeepManuscript(ir)}</main></body></html>`});
 }
 async function measure(c){
  const page=await terminal.newPage({width:1440,height:1000});
  await page.setContent(c.html.replaceAll('href="/assets/','href="'+terminal.origin+'/assets/'),{waitUntil:'networkidle',timeout:60000});
  await page.evaluate(()=>document.fonts.ready);await page.emulateMedia({media:'print'});
  const m=await page.evaluate(()=>{
   const rect=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,left:r.left,width:r.width};};
   const pages=[...document.querySelectorAll('.bdm-page')];
   const p=pages.find(x=>x.dataset.pageNumber==='10'),c=p.querySelector('.bdm-content'),f=p.querySelector('footer'),d=p.querySelector('[data-diagram-id="D04"]'),svg=d.querySelector('svg'),caption=d.querySelector('figcaption'),h=p.querySelector('.pub-heading'),cs=getComputedStyle(d);
   const gap=rect(f).top-rect(c).bottom;
   return {pageCount:pages.length,diagramCount:new Set([...document.querySelectorAll('[data-diagram-id]')].map(d=>d.dataset.diagramId)).size,undefinedText:/\b(undefined|NaN)\b/.test(document.body.textContent),brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth||!i.naturalHeight).map(i=>i.src),geometry:{pageTop:rect(p).top,pageBottom:rect(p).bottom,contentTop:rect(c).top,contentBottom:rect(c).bottom,footerTop:rect(f).top,footerBottom:rect(f).bottom,requiredFooterGapPx:4,actualFooterGapPx:gap,deficitPx:4-gap,heading:rect(h),figure:rect(d),figureHeight:rect(d).height,svg:rect(svg),svgHeight:rect(svg).height,figcaptionHeight:rect(caption).height,figurePaddingBlock:{top:cs.paddingTop,bottom:cs.paddingBottom},figureMarginBottom:cs.marginBottom,pageRole:p.dataset.pageRole,diagramGrammar:d.dataset.visualGrammar},pages:pages.map(p=>{const c=p.querySelector('.bdm-content'),f=p.querySelector('footer'),r=rect(p);return {pageNumber:p.dataset.pageNumber,pageRole:p.dataset.pageRole,text:p.innerText,assets:[...p.querySelectorAll('img')].map(i=>i.getAttribute('src')),geometry:[...p.querySelectorAll('.pub-heading,.bdm-content,figure,svg,figcaption,footer')].map(e=>{const b=rect(e);return {tag:e.tagName,top:b.top-r.top,bottom:b.bottom-r.top,height:b.height,width:b.width};}),typography:[...p.querySelectorAll('h2,h3,p,text,footer')].map(e=>{const s=getComputedStyle(e);return {fontSize:s.fontSize,lineHeight:s.lineHeight};}),overflow:p.scrollWidth>p.clientWidth+2||p.scrollHeight>p.clientHeight+2||!!(c&&f&&rect(c).bottom>rect(f).top-4)};})};
  });await page.close();return m;
 }
 const before={};for(const c of cases)before[c.name]=await measure(c);
 write('P7R2-GEOMETRY-BEFORE.json',before);result.beforeGeometry=before.CUSTOMER_BILINGUAL.geometry;result.referenceBeforeGeometry=before.BILINGUAL.geometry;
 assert.equal(result.beforeGeometry.pageRole,'TECHNICAL_FOUNDATION');assert.equal(result.beforeGeometry.diagramGrammar,'SUPPORT_DIRECTION');
 const adjustmentPx=Math.ceil(Math.max(0,result.beforeGeometry.deficitPx)+1);
 if(adjustmentPx>3*96/25.4)throw Error('P10_LAYOUT_REQUIRES_MATERIAL_RECOMPOSITION');
 const margin=parseFloat(result.beforeGeometry.figureMarginBottom);assert(margin>adjustmentPx);
 const cssRule=`\n/* P7R2: measured P10 footer clearance; recover ${adjustmentPx}px of D04 whitespace only. */\n.bdm-report .bdm-page[data-page-number="10"] .bdm-compact-diagram[data-diagram-id="D04"]{margin-bottom:calc(3mm - ${adjustmentPx}px)}\n`;
 fs.writeFileSync(owner,Buffer.concat([beforeCss,Buffer.from(cssRule)]));
 result.verticalAdjustmentMm=adjustmentPx*25.4/96;result.verticalAdjustmentPx=adjustmentPx;result.afterSha256=sha(fs.readFileSync(owner));
 const after={};for(const c of cases)after[c.name]=await measure(c);write('P7R2-GEOMETRY-AFTER.json',after);result.afterGeometry=after.CUSTOMER_BILINGUAL.geometry;result.gengSuccessorTolerance={};
 for(const c of cases){
  const a=after[c.name],b=before[c.name];assert.equal(a.pageCount,48);assert.equal(a.diagramCount,15);assert.equal(a.undefinedText,false);assert.deepEqual(a.brokenImages,[]);assert.equal(a.geometry.pageRole,'TECHNICAL_FOUNDATION');assert.equal(a.geometry.diagramGrammar,'SUPPORT_DIRECTION');assert(a.geometry.actualFooterGapPx>=4);
  const newlyOverflowed=a.pages.filter((p,i)=>p.overflow&&!b.pages[i].overflow).map(p=>p.pageNumber);assert.deepEqual(newlyOverflowed,[]);
  for(let i=0;i<48;i++){
   const ap=a.pages[i],bp=b.pages[i];assert.equal(ap.pageNumber,bp.pageNumber);assert.equal(ap.pageRole,bp.pageRole);assert.equal(ap.text,bp.text);assert.deepEqual(ap.assets,bp.assets);assert.deepEqual(ap.typography,bp.typography);
   if(ap.pageNumber!=='10'){assert.deepEqual(ap.geometry,bp.geometry,'LAYOUT_SUCCESSOR_SCOPE_ESCAPED');assert.equal(ap.overflow,bp.overflow,'LAYOUT_SUCCESSOR_SCOPE_ESCAPED');}
   else{assert.equal(a.geometry.footerTop,b.geometry.footerTop);assert.equal(a.geometry.footerBottom,b.geometry.footerBottom);assert.equal(a.geometry.figureHeight,b.geometry.figureHeight);assert.equal(a.geometry.svgHeight,b.geometry.svgHeight);for(let j=0;j<ap.geometry.length;j++)for(const k of ['top','bottom','height'])assert(Math.abs(ap.geometry[j][k]-bp.geometry[j][k])<=3*96/25.4,'LAYOUT_SUCCESSOR_SCOPE_ESCAPED');}
  }
  if(c.name!=='CUSTOMER_BILINGUAL')result.gengSuccessorTolerance[c.name]={status:'PASS',pageCount:48,diagramCount:15,textUnchanged:true,diagramSemanticDigest:c.diagramSemanticDigest,assetsUnchanged:true,otherPagesIdentical:true,beforeGeometry:b.geometry,afterGeometry:a.geometry};
 }
 assert.deepEqual(after.CUSTOMER_BILINGUAL.pages.filter(p=>p.overflow).map(p=>p.pageNumber),[]);
 result.protectedBaselineUnchanged=Object.entries(protectedHashes).every(([p,h])=>sha(fs.readFileSync(p))===h);assert(result.protectedBaselineUnchanged);result.status='PASS_LOCAL';write('P7R2-P10-FOOTER-SPACING-REPAIR.json',result);console.log(JSON.stringify({status:result.status,beforeGap:result.beforeGeometry.actualFooterGapPx,afterGap:result.afterGeometry.actualFooterGapPx,adjustmentPx,geng:Object.keys(result.gengSuccessorTolerance)}));
}catch(error){result.status='FAILED';result.remainingBlocker=error.message;result.afterSha256=sha(fs.readFileSync(owner));write('P7R2-P10-FOOTER-SPACING-REPAIR.json',result);throw error;}finally{await terminal.close();}
