import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {onRequestPost as customerPersonalReality} from '../functions/api/customer-personal-reality.js';
import {renderZiweiProduct} from '../assets/customer-ui/js/specialists/ziwei/product-renderer.js';
import {auditZiweiDom,exerciseZiweiInteractionPlan} from './lib/ziwei-cx-r1-w14-dom-harness.mjs';

const BASELINE='d1db21e6481c30d657ca3238ffb521c37560656a';
const SOURCE='content/professional/zi-wei-full-production/campaign/ziwei-fp-w21-machine-campaign-v1.json';
const OUT='content/customer-experience-rebuild/ziwei-cx-r1/campaign/ziwei-cx-r1-w14-real-api-dom-machine-campaign-v1.json';
const seed=JSON.parse(fs.readFileSync(SOURCE,'utf8'));
const stable=v=>{if(Array.isArray(v))return v.map(stable);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])]));return v;};
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const arr=v=>Array.isArray(v)?v:[];

function mockExternalFetch(){
  return async input=>{
    const url=String(input?.url||input);
    if(url.includes('nominatim.openstreetmap.org/lookup'))return new Response(JSON.stringify([{name:'Hong Kong',lat:'22.3193',lon:'114.1694',display_name:'Hong Kong',address:{city:'Hong Kong',country:'Hong Kong',country_code:'hk'},namedetails:{'name:en':'Hong Kong','name:zh':'香港'}}]),{status:200,headers:{'content-type':'application/json'}});
    if(url.includes('timeapi.io/api/TimeZone/coordinate'))return new Response(JSON.stringify({timeZone:'Asia/Hong_Kong'}),{status:200,headers:{'content-type':'application/json'}});
    throw new Error(`ZIWEI_CX_R1_W14_UNEXPECTED_EXTERNAL_FETCH:${url}`);
  };
}
function bodyFor(input){return {birthDate:input.birthDate,birthTime:String(input.birthTime).slice(0,5),birthTimeUnknown:false,placeRef:'N123',methods:['ziwei'],traditionalCalculationSex:input.traditionalCalculationSex,ziweiTargetDate:'2026-08-30',ziweiTargetTime:'12:00',ziweiTargetTimezoneIana:'Asia/Kuala_Lumpur',ziweiTargetUtcOffset:'+08:00',ziweiTargetContextSource:'EXPLICIT_REQUEST',consent:true,locale:input.locale};}
function presentationOf(product){return arr(product?.visuals).find(x=>x?.type==='ZIWEI_SPECIALIST_PRESENTATION')?.payload||null;}
function reportPalaceCount(view){return arr(arr(view?.ziweiFullProduction?.report?.sections).find(x=>x.sectionCode==='PALACES')?.items).length;}
function patternTitles(view){return arr(arr(view?.ziweiFullProduction?.report?.sections).find(x=>x.sectionCode==='PATTERNS')?.items).map(x=>x.title||x.label).filter(Boolean);}
function counterbalancedCount(view){return Number(view?.ziweiFullProduction?.report?.summary?.counterbalancedBlockCount||0);}

async function executeCase(seedCase,{withInteraction=true}={}){
  const request=new Request('https://getphios.com/api/customer-personal-reality',{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify(bodyFor(seedCase.input))});
  const response=await customerPersonalReality({request,env:{}});const payload=await response.json().catch(()=>({}));
  assert.equal(response.status,200,`API status ${response.status}`);assert.equal(payload.ok,true,'API payload not ok');
  const view=payload.view,route=view?.productRoute,product=route?.primaryProduct;
  assert.equal(route?.mode,'SINGLE_METHOD');assert.equal(product?.methodId,'ZWR');assert.equal(product?.productType,'ZIWEI_FULL_PRODUCTION');assert.equal(product?.state,'CUSTOMER_PUBLISHABLE');
  assert.equal(view?.primaryCustomerProduct?.type,'ZIWEI_FULL_PRODUCTION');assert.equal(view?.primaryCustomerProduct?.genericSmrCompleteReportOwner,false);
  assert.equal(reportPalaceCount(view),12);assert.equal(arr(view?.ziweiFullProduction?.interactiveSurface?.palaces).length,12);assert.equal(arr(view?.ziweiFullProduction?.topics?.topics).length,8);
  const plan=renderZiweiProduct({product});assert.equal(plan.status,'RENDERED');assert.equal(plan.rendererId,'ZIWEI_CX_R1_W12_W13_SPECIALIST_WORKSPACE');assert.equal(plan.legacySuppression,true);assert.equal(plan.responsiveReconstruction,true);
  const dom=auditZiweiDom(plan);
  assert.equal(Object.values(dom.invariants).every(Boolean),true,JSON.stringify({caseId:seedCase.caseId,invariants:dom.invariants,rawLeaks:dom.rawLeaks,legacy:dom.legacyCounts}));
  const p=presentationOf(product);assert.ok(p);const interaction=withInteraction?exerciseZiweiInteractionPlan(plan,{defaultPalaceIndex:p.defaultPalaceIndex||0}):null;if(interaction)assert.equal(interaction.passed,true,JSON.stringify(interaction));
  return {caseId:seedCase.caseId,input:seedCase.input,api:{status:response.status,productRouteMode:route.mode,primaryProductType:view.primaryCustomerProduct.type,publicationState:product.state,fullProductionState:view.ziweiFullProduction.state},structure:{lifeBranch:seedCase.structure?.lifeBranch||null,bodyBranch:seedCase.structure?.bodyBranch||null,patternTitles:patternTitles(view)},counts:{reportPalaces:reportPalaceCount(view),interactivePalaces:arr(view.ziweiFullProduction.interactiveSurface.palaces).length,topics:arr(view.ziweiFullProduction.topics.topics).length,openBoundaries:Number(p.evidence?.openBoundaryCount||0),counterbalancedBlocks:counterbalancedCount(view),domPalaceButtons:dom.counts.palaceButtons,domInspectors:dom.counts.inspectors,domTopicTabs:dom.counts.topicTabs,domTopicPanels:dom.counts.topicPanels,domTimingNodes:dom.counts.timingNodes,domOpenPalaceLinks:dom.counts.openPalaceLinks},dom:{engine:dom.domEngine,customerHtmlDigest:dom.customerHtmlDigest,customerTextDigest:dom.customerTextDigest,customerTextLength:dom.customerTextLength,legacyCounts:dom.legacyCounts,rawLeaks:dom.rawLeaks,invariants:dom.invariants},interaction,passed:true};
}

assert.equal(seed.summary?.passed,96);assert.equal(seed.cases?.length,96);
const originalFetch=globalThis.fetch;globalThis.fetch=mockExternalFetch();
const cases=[];let fatal=null;
try{
  for(let i=0;i<seed.cases.length;i++){
    try{const result=await executeCase(seed.cases[i],{withInteraction:true});cases.push(result);if((i+1)%12===0)console.log(`W14 API+DOM ${i+1}/96`);}
    catch(error){cases.push({caseId:seed.cases[i].caseId,input:seed.cases[i].input,passed:false,error:String(error?.stack||error)});fatal=fatal||error;console.error(`W14 case failed ${seed.cases[i].caseId}: ${error?.message||error}`);}
  }
  const replayIndices=[0,11,24,35,48,59,72,95],replay=[];
  if(!fatal){for(const index of replayIndices){const first=cases[index];const second=await executeCase(seed.cases[index],{withInteraction:true});const matched=first.dom.customerHtmlDigest===second.dom.customerHtmlDigest&&first.dom.customerTextDigest===second.dom.customerTextDigest;replay.push({caseId:first.caseId,firstHtmlDigest:first.dom.customerHtmlDigest,replayHtmlDigest:second.dom.customerHtmlDigest,firstTextDigest:first.dom.customerTextDigest,replayTextDigest:second.dom.customerTextDigest,matched});if(!matched)fatal=new Error(`ZIWEI_CX_R1_W14_DETERMINISTIC_DOM_DRIFT:${first.caseId}`);}}
  const passed=cases.filter(x=>x.passed).length,failed=96-passed,localeCounts=Object.fromEntries(['zh-Hans','en'].map(l=>[l,cases.filter(x=>x.passed&&x.input.locale===l).length])),sexCounts=Object.fromEntries(['MALE','FEMALE'].map(s=>[s,cases.filter(x=>x.passed&&x.input.traditionalCalculationSex===s).length]));
  const resultBase={schemaVersion:'PHI-OS-ZIWEI-CX-R1-W14-REAL-API-DOM-MACHINE-CAMPAIGN-v1.0.0',work:'ZIWEI-CX-R1-W14',integrationBaselineCommit:BASELINE,status:failed===0&&!fatal?'MACHINE_ACCEPTED_96_OF_96':'MACHINE_REJECTED',purpose:'Re-run the established Zi Wei diversity set through the actual Personal Reality customer API and current PPR-R3 Zi Wei specialist DOM, rather than accepting function-level Full Production evidence as customer-surface evidence.',execution:{customerApi:'/api/customer-personal-reality',route:'/perspectives/personal/',externalPlaceWitness:'DETERMINISTIC_HONG_KONG_RESOLVER_FIXTURE',targetContext:{date:'2026-08-30',time:'12:00',timezone:'Asia/Kuala_Lumpur',utcOffset:'+08:00'},rendererId:'ZIWEI_CX_R1_W12_W13_SPECIALIST_WORKSPACE',domEngine:cases.find(x=>x.dom)?.dom?.engine||'NONE'},summary:{requiredCaseCount:96,executedCaseCount:cases.length,passed,failed,passRate:`${passed}/96`,localeCounts,sexCounts,uniqueBirthMonths:new Set(cases.filter(x=>x.passed).map(x=>String(x.input.birthDate).slice(5,7))).size,uniqueBirthHours:new Set(cases.filter(x=>x.passed).map(x=>String(x.input.birthTime).slice(0,2))).size,uniqueLifeBranches:[...new Set(cases.filter(x=>x.passed).map(x=>x.structure.lifeBranch).filter(Boolean))].sort(),uniqueBodyBranches:[...new Set(cases.filter(x=>x.passed).map(x=>x.structure.bodyBranch).filter(Boolean))].sort(),domPalaceButtonsAcrossCampaign:cases.filter(x=>x.passed).reduce((n,x)=>n+x.counts.domPalaceButtons,0),domTopicTabsAcrossCampaign:cases.filter(x=>x.passed).reduce((n,x)=>n+x.counts.domTopicTabs,0),domTimingNodesAcrossCampaign:cases.filter(x=>x.passed).reduce((n,x)=>n+x.counts.domTimingNodes,0),legacyVisibleOwnerCases:cases.filter(x=>x.passed&&!x.dom.invariants.legacyVisibleOwnerCountZero).length,rawCodeLeakCases:cases.filter(x=>x.passed&&!x.dom.invariants.rawCodeLeakCountZero).length,interactionCasesPassed:cases.filter(x=>x.passed&&x.interaction?.passed).length,deterministicReplayCases:replay.length,deterministicReplayPassed:replay.filter(x=>x.matched).length},cases,replay,boundaries:{oldW21MachinePassAloneSatisfiesW14:false,customerApiWasStubbed:false,ziweiRuntimeWasStubbed:false,specialistProjectionWasStubbed:false,specialistRendererWasStubbed:false,externalPlaceResolutionUsedDeterministicWitness:true,humanVisualAccepted:false,sharedPprR3MutationRequired:false}};
  const campaign={...resultBase,campaignDigest:digest(resultBase)};fs.mkdirSync(new URL('../content/customer-experience-rebuild/ziwei-cx-r1/campaign/',import.meta.url),{recursive:true});fs.writeFileSync(OUT,JSON.stringify(campaign,null,2)+'\n');console.log(`W14 campaign written: ${OUT}`);console.log(`W14 result: ${campaign.status}; ${passed}/96; replay ${campaign.summary.deterministicReplayPassed}/${campaign.summary.deterministicReplayCases}`);if(fatal||failed)throw fatal||new Error('ZIWEI_CX_R1_W14_MACHINE_CAMPAIGN_FAILED');
}finally{globalThis.fetch=originalFetch;}
