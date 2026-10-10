import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {onRequestPost as customerPersonalReality} from '../functions/api/customer-personal-reality.js';
import {renderZiweiProduct} from '../assets/customer-ui/js/specialists/ziwei/product-renderer.js';
import {auditZiweiDom,exerciseZiweiInteractionPlan,parseAuditDom,queryAll} from './lib/ziwei-cx-r1-w14-dom-harness.mjs';

const BASELINE='492ecdddc1f84e5a915f416c60c61ed23e4fcb7f';
const SOURCE='content/professional/zi-wei-full-production/campaign/ziwei-fp-w21-machine-campaign-v1.json';
const OUT='content/customer-experience-rebuild/ziwei-cx-r1/campaign/ziwei-cx-r1-w16-current-route-replay-v1.json';
const seed=JSON.parse(fs.readFileSync(SOURCE,'utf8'));
const stable=v=>{if(Array.isArray(v))return v.map(stable);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])]));return v;};
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const arr=v=>Array.isArray(v)?v:[];
function mockExternalFetch(){return async input=>{const url=String(input?.url||input);if(url.includes('nominatim.openstreetmap.org/lookup'))return new Response(JSON.stringify([{name:'Hong Kong',lat:'22.3193',lon:'114.1694',display_name:'Hong Kong',address:{city:'Hong Kong',country:'Hong Kong',country_code:'hk'},namedetails:{'name:en':'Hong Kong','name:zh':'香港'}}]),{status:200,headers:{'content-type':'application/json'}});if(url.includes('timeapi.io/api/TimeZone/coordinate'))return new Response(JSON.stringify({timeZone:'Asia/Hong_Kong'}),{status:200,headers:{'content-type':'application/json'}});throw new Error(`ZIWEI_CX_R1_W16_UNEXPECTED_EXTERNAL_FETCH:${url}`);};}
function bodyFor(input){return {birthDate:input.birthDate,birthTime:String(input.birthTime).slice(0,5),birthTimeUnknown:false,placeRef:'N123',methods:['ziwei'],traditionalCalculationSex:input.traditionalCalculationSex,ziweiTargetDate:'2026-08-30',ziweiTargetTime:'12:00',ziweiTargetTimezoneIana:'Asia/Kuala_Lumpur',ziweiTargetUtcOffset:'+08:00',ziweiTargetContextSource:'EXPLICIT_REQUEST',consent:true,locale:input.locale};}
function presentationOf(product){return arr(product?.visuals).find(x=>x?.type==='ZIWEI_SPECIALIST_PRESENTATION')?.payload||null;}
async function executeCase(seedCase){
 const request=new Request('https://getphios.com/api/customer-personal-reality',{method:'POST',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify(bodyFor(seedCase.input))});
 const response=await customerPersonalReality({request,env:{}});const payload=await response.json().catch(()=>({}));
 assert.equal(response.status,200);assert.equal(payload.ok,true);const view=payload.view,route=view?.productRoute,product=route?.primaryProduct;
 assert.equal(route?.mode,'SINGLE_METHOD');assert.equal(product?.methodId,'ZWR');assert.equal(product?.productType,'ZIWEI_FULL_PRODUCTION');assert.equal(product?.state,'CUSTOMER_PUBLISHABLE');
 assert.equal(product?.surfaceActivation?.state,'ACTIVE_CUSTOMER_SURFACE');assert.equal(product?.surfaceActivation?.fullProductionVisibleToCustomer,true);assert.equal(product?.surfaceActivation?.humanVisualAdmission,'12/12');
 assert.equal(view?.primaryCustomerProduct?.genericSmrCompleteReportOwner,false);assert.equal(arr(view?.ziweiFullProduction?.interactiveSurface?.palaces).length,12);assert.equal(arr(view?.ziweiFullProduction?.topics?.topics).length,8);
 const plan=renderZiweiProduct({product});assert.equal(plan.status,'RENDERED');assert.equal(plan.rendererId,'ZIWEI_CX_R1_W12_W13_SPECIALIST_WORKSPACE');assert.equal(plan.customerSurfaceActivation,'W16_ACTIVE');assert.equal(plan.fullProductionVisibleToCustomer,true);assert.equal(plan.legacySuppression,true);
 const dom=auditZiweiDom(plan);assert.equal(Object.values(dom.invariants).every(Boolean),true,JSON.stringify({caseId:seedCase.caseId,invariants:dom.invariants,rawLeaks:dom.rawLeaks}));
 const tree=parseAuditDom(plan.readingHtml);assert.equal(queryAll(tree,'[data-ziwei-customer-surface-activation="W16_ACTIVE"]').length,1);assert.equal(queryAll(tree,'[data-ziwei-full-production-visible="true"]').length,1);
 const p=presentationOf(product);assert.ok(p);const interaction=exerciseZiweiInteractionPlan(plan,{defaultPalaceIndex:p.defaultPalaceIndex||0});assert.equal(interaction.passed,true);
 return {caseId:seedCase.caseId,locale:seedCase.input.locale,traditionalCalculationSex:seedCase.input.traditionalCalculationSex,lifeBranch:seedCase.structure?.lifeBranch||null,bodyBranch:seedCase.structure?.bodyBranch||null,htmlDigest:dom.customerHtmlDigest,textDigest:dom.customerTextDigest,palaceButtons:dom.counts.palaceButtons,topicTabs:dom.counts.topicTabs,timingNodes:dom.counts.timingNodes,activation:'W16_ACTIVE',interactionPassed:true,passed:true};
}
assert.equal(seed.summary?.passed,96);assert.equal(seed.cases?.length,96);
const oldFetch=globalThis.fetch;globalThis.fetch=mockExternalFetch();
try{
 const cases=[];for(let i=0;i<seed.cases.length;i++){cases.push(await executeCase(seed.cases[i]));if((i+1)%12===0)console.log(`W16 current route ${i+1}/96`);}
 const replayIndices=[0,11,24,35,48,59,72,95],replay=[];for(const index of replayIndices){const first=cases[index],second=await executeCase(seed.cases[index]);const matched=first.htmlDigest===second.htmlDigest&&first.textDigest===second.textDigest;assert.equal(matched,true,`W16 deterministic replay drift ${first.caseId}`);replay.push({caseId:first.caseId,matched,htmlDigest:first.htmlDigest,textDigest:first.textDigest});}
 const base={schemaVersion:'PHI-OS-ZIWEI-CX-R1-W16-CURRENT-ROUTE-REPLAY-v1.0.0',work:'ZIWEI-CX-R1-W16',integrationBaselineCommit:BASELINE,status:'ACTIVATION_REPLAY_ACCEPTED_96_OF_96',purpose:'Verify the actually activated Zi Wei customer surface on the current integration baseline after W15 12/12 human visual admission.',execution:{customerApi:'/api/customer-personal-reality',canonicalRoute:'/perspectives/personal/',rendererId:'ZIWEI_CX_R1_W12_W13_SPECIALIST_WORKSPACE',surfaceActivation:'W16_ACTIVE',targetContext:{date:'2026-08-30',time:'12:00',timezone:'Asia/Kuala_Lumpur',utcOffset:'+08:00'}},summary:{required:96,executed:cases.length,passed:cases.filter(x=>x.passed).length,failed:cases.filter(x=>!x.passed).length,localeCounts:{'zh-Hans':cases.filter(x=>x.locale==='zh-Hans').length,en:cases.filter(x=>x.locale==='en').length},sexCounts:{MALE:cases.filter(x=>x.traditionalCalculationSex==='MALE').length,FEMALE:cases.filter(x=>x.traditionalCalculationSex==='FEMALE').length},uniqueLifeBranches:[...new Set(cases.map(x=>x.lifeBranch).filter(Boolean))].sort(),uniqueBodyBranches:[...new Set(cases.map(x=>x.bodyBranch).filter(Boolean))].sort(),domPalaceButtons:cases.reduce((n,x)=>n+x.palaceButtons,0),domTopicTabs:cases.reduce((n,x)=>n+x.topicTabs,0),domTimingNodes:cases.reduce((n,x)=>n+x.timingNodes,0),surfaceActivationCases:cases.filter(x=>x.activation==='W16_ACTIVE').length,interactionPassed:cases.filter(x=>x.interactionPassed).length,deterministicReplayRequired:8,deterministicReplayPassed:replay.filter(x=>x.matched).length},cases,replay,boundaries:{humanVisualAdmissionRequired:true,humanVisualAdmission:'12/12',legacyGenericFallbackAllowed:false,sharedPprMutationRequired:false,newMeaningCreated:false}};
 const out={...base,campaignDigest:digest(base)};fs.writeFileSync(OUT,JSON.stringify(out,null,2)+'\n');console.log(`W16 activation replay written ${OUT}`);console.log(`W16 result ${out.status}; ${out.summary.passed}/96; replay ${out.summary.deterministicReplayPassed}/8`);
}finally{globalThis.fetch=oldFetch;}
