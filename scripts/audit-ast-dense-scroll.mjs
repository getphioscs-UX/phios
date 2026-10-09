import './lib/report-zero-cost-preload.mjs';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {buildAstPhase10Case,installPhase10DomStub} from './lib/pvp-phase10-method-fixture.mjs';
import {buildNatalChartV2} from '../assets/customer-ui/js/specialists/ast/ast-specialist-surface-v3.js';
const {chromium}=createRequire(import.meta.url)('C:/Users/Guest Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='docs/commerce/economics-20261009/windows-integration/free-natal-diagram-audit';
const template=fs.readFileSync(out+'/AST-en.html','utf8'),css=template.match(/<style>([\s\S]*?)<\/style>/)[1];
const englishModel=JSON.parse(template.match(/window.auditModels=(\[.*?\]);/s)[1])[0];
const fixture=await buildAstPhase10Case(),results=[],requests=[];
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
try{
 const context=await browser.newContext();await context.route('**/*',r=>{requests.push(r.request().url());return r.abort();});
 for(const dense of [false,true])for(const locale of ['en','zh-Hans'])for(const width of [390,1440]){
  installPhase10DomStub(locale);const model=structuredClone(locale==='en'?englishModel:fixture.sourceProjection);
  if(dense)model.chart.positions.forEach((p,i)=>{p.longitude=120+i*0.8;p.degreeWithinSign=i*0.8;});
  const html=`<html lang="${locale}"><style>${css}</style><body data-cx-surface="PERSONAL_REALITY" data-cx-r12-successor="true"><article class="ast-cx-r3">${buildNatalChartV2(model)}</article></body></html>`;
  const page=await context.newPage();await page.setViewportSize({width,height:1000});await page.setContent(html);await page.evaluate(()=>document.fonts.ready);
  const metrics=await page.evaluate(()=>{
   const labels=[...document.querySelectorAll('.ast-cx-r3-body-label')].map(e=>({text:e.textContent,...(()=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};})()}));
   const overlaps=[];for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i],b=labels[j];if(a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h)overlaps.push([a.text,b.text]);}
   const wheel=document.querySelector('.ast-cx-r3-wheel'),svg=wheel.querySelector('svg'),max=wheel.scrollWidth-wheel.clientWidth;
   wheel.scrollLeft=max;const actual=wheel.scrollLeft,wr=wheel.getBoundingClientRect(),sr=svg.getBoundingClientRect();
   return {labelOverlapPairs:overlaps,scroll:{max,actual,reachesRightEdge:sr.right<=wr.right+2,overflowX:getComputedStyle(wheel).overflowX},bodyOverflow:document.documentElement.scrollWidth>innerWidth+2};
  });
  const name=`AST-${dense?'synthetic-dense':'baseline'}-${locale}-${width}`;await page.screenshot({path:out+'/'+name+'.png',fullPage:true});
  results.push({case:name,scope:dense?'SYNTHETIC_LAYOUT_STRESS_NOT_A_CALCULATED_CUSTOMER_CHART':'EXISTING_CALCULATED_FIXTURE',...metrics});await page.close();
 }
 await context.close();
}finally{await browser.close();}
fs.writeFileSync(out+'/AST-DENSE-SCROLL.json',JSON.stringify({externalRequests:requests,providerCalls:0,results},null,2)+'\n');console.log(JSON.stringify(results));
