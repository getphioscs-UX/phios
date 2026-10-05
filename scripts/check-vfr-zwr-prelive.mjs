import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildZwrVfrCompactAuthoringPack} from '../functions/personal-reading/visual-first/ziwei-vfr-authoring-pack.js';
import {planZwrVfrOneCall,composeZwrVfrOneCall} from '../functions/personal-reading/visual-first/ziwei-vfr-one-call-composer.js';

const fixture=JSON.parse(fs.readFileSync('docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-02-en.json','utf8'));
const pack=await buildZwrVfrCompactAuthoringPack({evidence:fixture.evidence});
assert.equal(pack.schemaVersion,'ZWR-VFR-R1-COMPACT-AUTHORING-PACK-v1');
assert.equal(pack.localeMode,'BILINGUAL_SINGLE_CALL');
assert.equal(pack.sections.length,10);
assert.equal(new Set(pack.sections.map(s=>s.sectionId)).size,10);
assert(pack.sections.every(s=>s.claims.length>0));
assert(pack.sections.every(s=>s.claims.every(c=>typeof c.textEn==='undefined')),'compact Zi Wei pack must not duplicate full English claim prose');
const serializedPack=JSON.stringify(pack);
assert(serializedPack.length<=60000,'compact Zi Wei authoring pack exceeds 60k character envelope: '+serializedPack.length);
const plan=await planZwrVfrOneCall({pack});
assert.equal(plan.providerCallsPlanned,1);
assert.equal(plan.semanticReviewCallsPlanned,0);
assert.equal(plan.model,'gpt-5.6-sol');
assert(plan.budget.inputTokens<=25000,'compact Zi Wei pack exceeds 25k planning-token target: '+plan.budget.inputTokens);
assert(plan.budget.estimatedNextCallCost<=.80,'first-call maximum cost exceeds USD0.80: '+plan.budget.estimatedNextCallCost);
assert.equal(plan.budget.allowed,true);
const composer=fs.readFileSync('functions/personal-reading/visual-first/ziwei-vfr-one-call-composer.js','utf8');
assert(!composer.includes("report-section-semantic-review"),'VFR composer must not import AI semantic reviewer');
assert(!composer.includes("verifyReportSectionComposition"),'VFR composer must not use old shared semantic verifier');
let providerFetchTouched=false;
await assert.rejects(
  ()=>composeZwrVfrOneCall({
    pack,
    env:{},
    fetcher:async()=>{providerFetchTouched=true;throw Error('PRELIVE_PROVIDER_FETCH_MUST_NOT_RUN');}
  }),
  /VFR_REPORT_PROVIDER_LIVE_NOT_ALLOWED/,
  'VFR live provider must require explicit opt-in'
);
assert.equal(providerFetchTouched,false,'pre-live opt-in guard must run before provider fetch');
const binding=fs.readFileSync('functions/report-delivery/ziwei-canonical-person-binding.js','utf8');
assert(!binding.includes('ziwei-vfr-one-call-composer.js'),'pre-live VFR must not cut over canonical account binding');
console.log('PASS ZWR-VFR pre-live: bilingual compact pack sections=10; planned provider calls=1; semantic reviewer calls=0; estimated input tokens='+plan.budget.inputTokens+'; max output='+plan.maxOutputTokens+'; planned max cost=$'+plan.budget.estimatedNextCallCost+'; production binding unchanged; live provider not called.');
