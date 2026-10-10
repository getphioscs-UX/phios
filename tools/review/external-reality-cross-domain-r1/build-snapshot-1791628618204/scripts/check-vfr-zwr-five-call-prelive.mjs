import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildZwrVfrCompactAuthoringPack} from '../functions/personal-reading/visual-first/ziwei-vfr-authoring-pack.js';
import {planZwrFiveCallExperiment,composeZwrFiveCallExperiment} from '../functions/personal-reading/visual-first/ziwei-vfr-five-call-composer.js';

const fixture=JSON.parse(
 fs.readFileSync('docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-02-en.json','utf8')
);
const pack=await buildZwrVfrCompactAuthoringPack({evidence:fixture.evidence});
const plan=planZwrFiveCallExperiment({pack});

assert.equal(plan.providerCallsPlanned,5);
assert.equal(plan.semanticReviewCallsPlanned,0);
assert.equal(plan.model,'gpt-5.6-sol');
assert.equal(plan.batches.length,5);
assert(plan.batches.every(b=>b.sectionIds.length===2));
assert(
 plan.estimatedMaxTotalCost<=1,
 'five-call experiment exceeds USD1 max preflight: '+plan.estimatedMaxTotalCost
);
assert.equal(plan.allowed,true);

let touched=false;
await assert.rejects(
 ()=>composeZwrFiveCallExperiment({
  pack,
  env:{},
  fetcher:async()=>{
   touched=true;
   throw Error('MUST_NOT_FETCH');
  }
 }),
 /VFR_REPORT_PROVIDER_LIVE_NOT_ALLOWED/
);
assert.equal(touched,false);

const composerSource=fs.readFileSync(
 'functions/personal-reading/visual-first/ziwei-vfr-five-call-composer.js',
 'utf8'
);
const manuscriptSource=fs.readFileSync(
 'functions/personal-reading/visual-first/ziwei-vfr-five-call-manuscript.js',
 'utf8'
);
const runnerSource=fs.readFileSync(
 'scripts/run-zwr-vfr-five-call-experiment.mjs',
 'utf8'
);

assert(
 !composerSource.includes('validateZwrFiveCallBatch'),
 'five-call live path must not run a post-call verifier'
);
assert(
 !composerSource.includes('BATCH_GUARD_REJECTED'),
 'five-call live path must not reject a paid batch after structured output succeeds'
);
assert(
 !manuscriptSource.includes("required:['sectionId','authorityRefs','zhHans','en']"),
 'Sol output schema must not own authorityRefs'
);
assert(
 manuscriptSource.includes('authorityRefs:ps.claims.map(c=>c.claimId)'),
 'PHI OS must restore authorityRefs deterministically from the section pack'
);
assert(
 composerSource.includes('onBatchCompleted'),
 'five-call composer must expose checkpoint callback'
);
assert(
 runnerSource.includes('CHECKPOINT.json'),
 'five-call runner must persist resumable checkpoint'
);

console.log(
 'PASS ZWR-VFR five-call pre-live: '+
 'batches=5x2 sections; '+
 'semantic review=0; '+
 'post-call verifier=0; '+
 'authority refs=deterministic PHI OS binding; '+
 'estimated max total cost=$'+plan.estimatedMaxTotalCost+'; '+
 'checkpoint/resume present; '+
 'provider not called.'
);
