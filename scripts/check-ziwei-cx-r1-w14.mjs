import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {onRequestPost as customerPersonalReality} from '../functions/api/customer-personal-reality.js';
import {renderZiweiProduct} from '../assets/customer-ui/js/specialists/ziwei/product-renderer.js';
import {auditZiweiDom,exerciseZiweiInteractionPlan} from './lib/ziwei-cx-r1-w14-dom-harness.mjs';

const BASE='content/customer-experience-rebuild/ziwei-cx-r1';
const BASELINE='d1db21e6481c30d657ca3238ffb521c37560656a';
const paths={
 contract:`${BASE}/contracts/ziwei-cx-r1-w14-real-api-dom-machine-campaign-contract-v1.json`,
 authority:`${BASE}/authority/ziwei-cx-r1-w14-machine-campaign-authority-v1.json`,
 campaign:`${BASE}/campaign/ziwei-cx-r1-w14-real-api-dom-machine-campaign-v1.json`,
 acceptance:`${BASE}/acceptance/ziwei-cx-r1-w14-machine-campaign-acceptance-v1.json`,
 regression:`${BASE}/fixtures/ziwei-cx-r1-w14-english-raw-code-regression-v1.json`,
 roadmap:`${BASE}/roadmap/ziwei-cx-r1-master-work-v4.json`
};
for(const p of Object.values(paths))assert.ok(fs.existsSync(p),`missing ${p}`);
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const stable=v=>{if(Array.isArray(v))return v.map(stable);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])]));return v;};
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
const contract=j(paths.contract),authority=j(paths.authority),campaign=j(paths.campaign),acceptance=j(paths.acceptance),regression=j(paths.regression),roadmap=j(paths.roadmap);
for(const x of [contract,authority,campaign,acceptance,regression,roadmap])assert.equal(x.integrationBaselineCommit,BASELINE,`${x.schemaVersion} baseline drift`);
assert.equal(contract.requiredCaseCount,96);assert.equal(contract.sharedLayerMutationAllowed,false);assert.equal(contract.humanVisualAcceptanceCreated,false);
assert.equal(authority.rules.eachCaseMustReenterCanonicalCustomerApi,true);assert.equal(authority.rules.existingW21InputsMaySeedDiversityButOldW21PassResultsMayNotSatisfyW14,true);
assert.equal(campaign.status,'MACHINE_ACCEPTED_96_OF_96');
assert.equal(campaign.summary.requiredCaseCount,96);assert.equal(campaign.summary.executedCaseCount,96);assert.equal(campaign.summary.passed,96);assert.equal(campaign.summary.failed,0);
assert.deepEqual(campaign.summary.localeCounts,{'zh-Hans':48,en:48});assert.deepEqual(campaign.summary.sexCounts,{MALE:48,FEMALE:48});
assert.equal(campaign.summary.uniqueBirthMonths,12);assert.equal(campaign.summary.uniqueBirthHours,4);assert.equal(campaign.summary.uniqueLifeBranches.length,12);assert.equal(campaign.summary.uniqueBodyBranches.length,12);
assert.equal(campaign.summary.domPalaceButtonsAcrossCampaign,1152);assert.equal(campaign.summary.domTopicTabsAcrossCampaign,768);assert.equal(campaign.summary.domTimingNodesAcrossCampaign,288);
assert.equal(campaign.summary.legacyVisibleOwnerCases,0);assert.equal(campaign.summary.rawCodeLeakCases,0);assert.equal(campaign.summary.interactionCasesPassed,96);assert.equal(campaign.summary.deterministicReplayCases,8);assert.equal(campaign.summary.deterministicReplayPassed,8);
assert.equal(campaign.cases.length,96);assert.equal(campaign.cases.every(x=>x.passed),true);assert.equal(campaign.cases.every(x=>Object.values(x.dom.invariants).every(Boolean)),true);assert.equal(campaign.cases.every(x=>x.interaction?.passed===true),true);assert.equal(campaign.replay.every(x=>x.matched===true),true);
const {campaignDigest,...base}=campaign;assert.equal(campaignDigest,digest(base),'campaign digest drift');assert.equal(acceptance.campaignDigest,campaignDigest);
assert.equal(acceptance.status,'MACHINE_ACCEPTED_96_OF_96_REAL_API_DOM');const positiveGates=Object.entries(acceptance.gates).filter(([k])=>!['HUMAN_VISUAL_ACCEPTED','SHARED_PPR_R3_MUTATION_REQUIRED'].includes(k));assert.equal(positiveGates.every(([,v])=>v===true),true);assert.equal(acceptance.gates.SHARED_PPR_R3_MUTATION_REQUIRED,false);assert.equal(acceptance.gates.HUMAN_VISUAL_ACCEPTED,false);
assert.equal(roadmap.status,'W0_W14_MACHINE_ACCEPTED_REAL_API_DOM_W15_HUMAN_VISUAL_NEXT');assert.equal(roadmap.nextWork,'ZIWEI-CX-R1-W15｜Human Visual & Interaction Acceptance');assert.equal(roadmap.customerSurface.visualHumanAcceptance,false);

function mockExternalFetch(){return async input=>{const url=String(input?.url||input);if(url.includes('nominatim.openstreetmap.org/lookup'))return new Response(JSON.stringify([{name:'Hong Kong',lat:'22.3193',lon:'114.1694',display_name:'Hong Kong',address:{city:'Hong Kong',country:'Hong Kong',country_code:'hk'},namedetails:{'name:en':'Hong Kong','name:zh':'香港'}}]),{status:200,headers:{'content-type':'application/json'}});if(url.includes('timeapi.io/api/TimeZone/coordinate'))return new Response(JSON.stringify({timeZone:'Asia/Hong_Kong'}),{status:200,headers:{'content-type':'application/json'}});throw new Error(`ZIWEI_CX_R1_W14_UNEXPECTED_EXTERNAL_FETCH:${url}`);};}
const oldFetch=globalThis.fetch;globalThis.fetch=mockExternalFetch();
try{
 const i=regression.input;
 const body={birthDate:i.birthDate,birthTime:i.birthTime,birthTimeUnknown:false,placeRef:i.placeRef,methods:['ziwei'],traditionalCalculationSex:i.traditionalCalculationSex,ziweiTargetDate:i.targetDate,ziweiTargetTime:i.targetTime,ziweiTargetTimezoneIana:i.targetTimezone,ziweiTargetUtcOffset:i.targetUtcOffset,ziweiTargetContextSource:'EXPLICIT_REQUEST',consent:true,locale:i.locale};
 const response=await customerPersonalReality({request:new Request('https://getphios.com/api/customer-personal-reality',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),env:{}});const payload=await response.json();
 assert.equal(response.status,regression.expected.apiStatus);assert.equal(payload.ok,true);const route=payload.view?.productRoute,product=route?.primaryProduct;
 assert.equal(route?.mode,regression.expected.productRouteMode);assert.equal(product?.methodId,regression.expected.methodId);assert.equal(product?.state,regression.expected.productState);
 const presentation=product?.visuals?.find(x=>x.type==='ZIWEI_SPECIALIST_PRESENTATION')?.payload;assert.ok(presentation,'English specialist presentation missing');
 const customerStarText=presentation.palaces.flatMap(x=>x.starNames||[]).join('\n');assert.match(customerStarText,/Ju Men（Miao）/);assert.doesNotMatch(customerStarText,/JU_MEN（MIAO）/);
 const plan=renderZiweiProduct({product});assert.equal(plan.rendererId,regression.expected.rendererId);const dom=auditZiweiDom(plan);assert.equal(Object.values(dom.invariants).every(Boolean),true);const interaction=exerciseZiweiInteractionPlan(plan,{defaultPalaceIndex:presentation.defaultPalaceIndex||0});assert.equal(interaction.passed,true);
}finally{globalThis.fetch=oldFetch;}

const sharedFrozen=[
 'perspectives/personal/index.html','assets/customer-ui/js/surfaces/personal-reality.js','assets/customer-ui/surfaces/personal-reality.css','functions/api/customer-personal-reality.js',
 'assets/customer-ui/js/personal-products/personal-product-renderers.js','assets/customer-ui/js/personal-products/specialist-renderer-host.js','assets/customer-ui/js/personal-products/specialist-renderer-registry.js',
 'assets/customer-ui/surfaces/single-method-reading.css','functions/single-method-reading/single-method-reading-production.js'
];
for(const p of sharedFrozen)assert.ok(fs.existsSync(p),`frozen shared file missing ${p}`);assert.equal(fs.existsSync('assets/customer-ui/js/surfaces/single-method-reading.js'),false,'PPR-R3 successor retired shared single-method-reading.js; W14 may not resurrect it');
console.log('✓ ZIWEI-CX-R1-W14 Real API + DOM 96-Case Machine Campaign passed.');
console.log('  96/96 customer API routes; 1152 palace buttons; 768 topic tabs; 288 timing nodes; 0 legacy owners; 0 raw-code leaks.');
console.log('  96/96 interaction exercises and 8/8 deterministic DOM replays passed.');
console.log('  English JU_MEN（MIAO） live product-route regression is closed as Ju Men（Miao） while unknown raw identifiers remain fail-closed.');
console.log('  Human visual and interaction acceptance remains pending for W15.');
