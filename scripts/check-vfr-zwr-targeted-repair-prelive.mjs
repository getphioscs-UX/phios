import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildZwrVfrCompactAuthoringPack} from '../functions/personal-reading/visual-first/ziwei-vfr-authoring-pack.js';
import {buildTargetedRepairPlan,runTargetedRepair} from '../functions/personal-reading/visual-first/ziwei-vfr-targeted-repair.js';

const root='docs/reports/ziwei/vfr-r1/five-call-experiment/';
for(const name of ['RESULT.json','COMPLETENESS-MANIFEST.json'])assert(fs.existsSync(root+name),'missing targeted repair input: '+name);
const result=JSON.parse(fs.readFileSync(root+'RESULT.json','utf8'));
const manifest=JSON.parse(fs.readFileSync(root+'COMPLETENESS-MANIFEST.json','utf8'));
const fixture=JSON.parse(fs.readFileSync('docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-02-en.json','utf8'));
const pack=await buildZwrVfrCompactAuthoringPack({evidence:fixture.evidence});
const plan=buildTargetedRepairPlan({pack,result,manifest});

assert.equal(plan.semanticReviewCallsPlanned,0);
assert.equal(plan.postCallVerifierCallsPlanned,0);
assert.equal(plan.allowed,true,'targeted repair projected total exceeds USD1: '+plan.estimatedTotalExperimentCost);
assert(plan.repairCallsPlanned>0,'targeted repair should have at least one affected section');
assert(!plan.repairs.some(r=>r.sectionId==='S05'),'S05 must remain untouched because completeness passed');
const s02=plan.repairs.find(r=>r.sectionId==='S02');
const s03=plan.repairs.find(r=>r.sectionId==='S03');
assert.deepEqual(s02?.locales,['zhHans','en']);
assert.deepEqual(s03?.locales,['zhHans','en']);
for(const id of ['S04','S06','S07','S08','S09','S10','S11']){
 const r=plan.repairs.find(x=>x.sectionId===id);
 assert.deepEqual(r?.locales,['en'],id+' should repair English only');
}

let touched=false;
await assert.rejects(
 ()=>runTargetedRepair({pack,result,manifest,env:{},fetcher:async()=>{touched=true;throw Error('MUST_NOT_FETCH');}}),
 /VFR_REPORT_PROVIDER_LIVE_NOT_ALLOWED/
);
assert.equal(touched,false);

const src=fs.readFileSync('functions/personal-reading/visual-first/ziwei-vfr-targeted-repair.js','utf8');
assert(!src.includes('maxLength:'),'targeted repair schema must not use maxLength');
assert(!src.includes('validateZwrFiveCallBatch'),'targeted repair live path must not use semantic verifier');

console.log(
 'PASS ZWR-VFR targeted repair pre-live: calls='+plan.repairCallsPlanned+
 '; originalCost=$'+plan.originalProviderCost+
 '; estimatedRepairMax=$'+plan.estimatedRepairMaxCost+
 '; estimatedTotal=$'+plan.estimatedTotalExperimentCost+
 '; S05 preserved; post-call verifier=0; provider not called.'
);
