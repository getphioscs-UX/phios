import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildZwrVfrCompactAuthoringPack} from '../functions/personal-reading/visual-first/ziwei-vfr-authoring-pack.js';
import {planZwrFiveCallExperiment,composeZwrFiveCallExperiment} from '../functions/personal-reading/visual-first/ziwei-vfr-five-call-composer.js';

const fixture=JSON.parse(fs.readFileSync('docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-02-en.json','utf8'));
const pack=await buildZwrVfrCompactAuthoringPack({evidence:fixture.evidence});
const plan=planZwrFiveCallExperiment({pack});
assert.equal(plan.providerCallsPlanned,5);
assert.equal(plan.semanticReviewCallsPlanned,0);
assert.equal(plan.model,'gpt-5.6-sol');
assert.equal(plan.batches.length,5);
assert(plan.batches.every(b=>b.sectionIds.length===2));
assert(plan.estimatedMaxTotalCost<=1,'five-call experiment exceeds USD1 max preflight: '+plan.estimatedMaxTotalCost);
assert.equal(plan.allowed,true);
let touched=false;
await assert.rejects(
 ()=>composeZwrFiveCallExperiment({pack,env:{},fetcher:async()=>{touched=true;throw Error('MUST_NOT_FETCH');}}),
 /VFR_REPORT_PROVIDER_LIVE_NOT_ALLOWED/
);
assert.equal(touched,false);
console.log('PASS ZWR-VFR five-call pre-live: batches=5x2 sections; semantic review=0; estimated max total cost=$'+plan.estimatedMaxTotalCost+'; provider not called.');
