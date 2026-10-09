import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {buildAstPhase10Case,buildBzrPhase10Case,installPhase10DomStub} from './lib/pvp-phase10-method-fixture.mjs';
import {loadPhase9ZiweiCases,buildPhase9ZiweiCase} from './lib/pvp-phase9-ziwei-fixture.mjs';
import {buildNatalChartV2} from '../assets/customer-ui/js/specialists/ast/ast-specialist-surface-v3.js';
import {renderBaziProfessionalStructure} from '../assets/customer-ui/js/surfaces/bazi-professional-reading.js';
import {buildAstCustomerWorkspaceCandidate} from '../functions/ast-full-production/ast-customer-reading-production.js';
import {buildBaziMethodNativeReading} from '../functions/personal-professional-reading/bazi-method-native-reading-adapter.js';
import {attachBaziPublicationAccess} from '../functions/personal-reading/bazi-customer-publication.js';
import {renderBaziProduct} from '../assets/customer-ui/js/specialists/bazi/product-renderer.js';
import {build} from 'esbuild';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='docs/commerce/economics-20261009/windows-integration/free-natal-diagram-audit';
fs.mkdirSync(out,{recursive:true});
const cssFiles=[...fs.readFileSync('perspectives/personal/index.html','utf8').matchAll(/href="\/(assets\/[^"?]+\.css)"/g)].map(m=>m[1]).concat(['assets/customer-ui/surfaces/bazi-professional-reading.css','assets/customer-ui/surfaces/astrology-specialist-v3.css','assets/customer-ui/surfaces/ziwei-specialist-workspace.css']);
const css=cssFiles.map(p=>fs.readFileSync(p,'utf8')).join('\n');
installPhase10DomStub();
const ast=await buildAstPhase10Case(),bzr=await buildBzrPhase10Case();
const astEn=await buildAstCustomerWorkspaceCandidate({canonicalProjection:JSON.parse(fs.readFileSync('content/professional/ast-full-production/fixtures/ast-fp-r4-professional-semantic-fixture-v1.json')).inputProjection,rawIntent:'work role direction',locale:'en'});
const bzrEn=await buildBaziMethodNativeReading({canonicalProjection:JSON.parse(fs.readFileSync('content/professional/bzr-full-production/fixtures/bazi-da-yun-integration-fixture-v1.json')),locale:'en'});
const freeBazi=async(native,locale)=>{
 const product={...bzr.product,locale};
 const view=await attachBaziPublicationAccess({methodNativeReading:{BZR:native},productRoute:{mode:'SINGLE_METHOD',primaryProduct:product,products:[product]}},{env:{PHIOS_ENVIRONMENT:'qa'},data:{},request:new Request('https://local.fixture.test/')},{loadEntitlement:async()=>null});
 return view.productRoute.primaryProduct;
};
const freeBzrZh=await freeBazi(bzr.native,'zh-Hans'),freeBzrEn=await freeBazi(bzrEn,'en');
const cases=loadPhase9ZiweiCases();
const zw=await buildPhase9ZiweiCase(cases.find(c=>c.input.locale==='zh-Hans'));
const zwEn=await buildPhase9ZiweiCase({...cases.find(c=>c.input.locale==='zh-Hans'),input:{...cases.find(c=>c.input.locale==='zh-Hans').input,locale:'en'}});
const fixtureData={AST:ast.sourceProjection,BZR:bzr.native,ZIWEI:zw.plan.visualHtml};
const interactionBundle=(await build({stdin:{contents:`
 import {installAstrologySpecialistInteractions} from './assets/customer-ui/js/specialists/ast/ast-specialist-surface-v3.js';
 import {buildZiweiW12W13RenderPlan} from './assets/customer-ui/js/specialists/ziwei/ziwei-specialist-workspace.js';
 document.querySelectorAll('.ast-cx-r3').forEach((root,i)=>installAstrologySpecialistInteractions(root,window.auditModels[i]));
 document.querySelectorAll('#ziwei-palaces').forEach((root,i)=>buildZiweiW12W13RenderPlan(window.auditModels[i]).afterMount?.({host:root}));
 window.auditInteractionsReady=true;
 `,resolveDir:process.cwd()},bundle:true,write:false,format:'iife',platform:'browser',minify:true})).outputFiles[0].text;
const selectors={AST:'.ast-cx-r3-chart-panel',BZR:'.cx-bazi-structure-surface',ZIWEI:'#ziwei-palaces'};
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const result={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),scope:'CURRENT_RENDERER_COMPONENT_FIXTURES_NOT_ACCOUNT_FREE_FLOW_OR_LIVE_ACCEPTANCE',cssFiles,externalRequests:[],providerCalls:0,checks:[]};
try{
 const context=await browser.newContext();
 await context.route('**/*',route=>{result.externalRequests.push(route.request().url());return route.abort();});
 for(const method of ['BZR','AST','ZIWEI'])for(const mode of ['zh-Hans','en','BILINGUAL']){
  const render=locale=>{
   installPhase10DomStub(locale);
   if(method==='BZR')return renderBaziProduct({product:locale==='en'?freeBzrEn:freeBzrZh}).visualHtml;
   if(method==='AST')return `<article class="ast-cx-r3">${buildNatalChartV2(locale==='en'?(astEn.customerProductProjection||astEn.workspace.customerProductProjection):fixtureData.AST)}</article>`;
   return locale==='en'?zwEn.plan.visualHtml:fixtureData.ZIWEI;
  };
  let body=mode==='BILINGUAL'?render('zh-Hans')+render('en'):render(mode);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent(`<html lang="${mode==='BILINGUAL'?'zh-Hans':mode}"><meta charset="utf-8"><style>${css}</style><main>${body}</main></html>`);
  if(method==='ZIWEI')body=await page.locator(selectors.ZIWEI).evaluateAll(els=>els.map(e=>e.outerHTML).join(''));
  const models=method==='AST'?[fixtureData.AST,astEn.customerProductProjection||astEn.workspace.customerProductProjection]:method==='ZIWEI'?[zw.product,zwEn.product]:[];
  const selectedModels=mode==='BILINGUAL'?models:[models[mode==='en'?1:0]];
  const html=`<!doctype html><html lang="${mode==='BILINGUAL'?'zh-Hans':mode}"><meta charset="utf-8"><style>${css}</style><body data-cx-surface="PERSONAL_REALITY" data-cx-r12-successor="true"><main>${body}</main><script>window.auditModels=${JSON.stringify(selectedModels).replaceAll('<','\\u003c')};${interactionBundle}</script></body></html>`;
  fs.writeFileSync(`${out}/${method}-${mode}.html`,html);
  for(const viewport of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844},{name:'print',width:794,height:1123}]){
   await page.setViewportSize(viewport);await page.emulateMedia({media:viewport.name==='print'?'print':'screen'});await page.setContent(html);await page.waitForFunction(()=>window.auditInteractionsReady);await page.evaluate(()=>document.fonts.ready);
   const metrics=await page.evaluate(()=>{
    const text=[...document.querySelectorAll('main *')].filter(e=>e.childNodes.length&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()));
    const clipped=text.filter(e=>e.scrollWidth>e.clientWidth+2&&e.clientWidth>0&&!e.closest('svg')).map(e=>({tag:e.tagName,class:e.className,text:e.textContent.trim().slice(0,70),scrollWidth:e.scrollWidth,width:e.clientWidth}));
    return {bodyOverflow:document.documentElement.scrollWidth>innerWidth+2,clippedText:clipped,svgCount:document.querySelectorAll('main svg').length,badText:/undefined|\[object Object\]|NaN/.test(document.querySelector('main').innerText),diagramCount:document.querySelectorAll('.ast-cx-r3-chart-panel,.cx-bazi-structure-surface,#ziwei-palaces').length,chartScrollContainers:[...document.querySelectorAll('.ast-cx-r3-wheel,.cx-ziwei-specialist-grid')].map(e=>({width:e.clientWidth,contentWidth:e.scrollWidth,horizontalScroll:getComputedStyle(e).overflowX}))};
   });
   const base=`${method}-${mode}-${viewport.name}`;
   await page.screenshot({path:`${out}/${base}.png`,fullPage:true});
   if(viewport.name==='print')await page.pdf({path:`${out}/${base}.pdf`,format:'A4',printBackground:true});
   let switchResult=null;
   if(viewport.name!=='print'&&method==='ZIWEI')switchResult=await page.evaluate(()=>{
    const root=document.querySelector('#ziwei-palaces'),buttons=root.querySelectorAll('[data-ziwei-palace-index]');
    if(buttons.length<2)return {status:'UNVERIFIED_SELECTOR'};
    buttons[1].click();const switched=[...root.querySelectorAll('[data-ziwei-inspector-index]')].filter(e=>getComputedStyle(e).display!=='none').length;
    buttons[0].click();const reopened=[...root.querySelectorAll('[data-ziwei-inspector-index]')].filter(e=>getComputedStyle(e).display!=='none').length;
    return {status:switched===1&&reopened===1?'PASS':'FAIL',switchedVisiblePanels:switched,reopenedVisiblePanels:reopened};
   });
   if(viewport.name!=='print'&&method==='AST')switchResult=await page.evaluate(()=>{
    const root=document.querySelector('.ast-cx-r3'),buttons=root.querySelectorAll('[data-astcx-select-kind="planet"]'),inspector=root.querySelector('[data-astcx-inspector]');
    if(buttons.length<2||!inspector)return {status:'UNVERIFIED_SELECTOR'};
    buttons[0].dispatchEvent(new MouseEvent('click',{bubbles:true}));const first=inspector.innerHTML;
    buttons[1].dispatchEvent(new MouseEvent('click',{bubbles:true}));const second=inspector.innerHTML;
    buttons[0].dispatchEvent(new MouseEvent('click',{bubbles:true}));
    return {status:first!==second&&first===inspector.innerHTML?'PASS':'FAIL',changed:first!==second,reopened:first===inspector.innerHTML};
   });
   result.checks.push({method,mode,viewport:viewport.name,...metrics,switchResult,errors:[...errors],screenshot:base+'.png',visualHumanReview:'NOT_GRANTED_BY_METRICS',localeCoverage:'CURRENT_RENDERER_LANGUAGE_SWITCH_BILINGUAL_IS_PAIRED_COMPONENT_HARNESS'});
  }
  await page.close();
 }
 await context.close();
}finally{await browser.close();fs.writeFileSync(`${out}/PREVIEW-RESULTS.json`,JSON.stringify(result,null,2)+'\n');}
console.log(JSON.stringify({previews:result.checks.length,bodyOverflow:result.checks.filter(r=>r.bodyOverflow).map(r=>[r.method,r.mode,r.viewport]),clipped:result.checks.filter(r=>r.clippedText.length).map(r=>[r.method,r.mode,r.viewport,r.clippedText.length]),blockedRequests:result.externalRequests.length,providerCalls:0}));
