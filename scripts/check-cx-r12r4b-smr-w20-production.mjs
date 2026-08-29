import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildBenchmark,METHODS} from './smr-benchmark-support.mjs';
import {SMR_PRODUCTION_ADMISSION,maybeBuildProductionSingleMethodReading} from '../functions/single-method-reading/single-method-reading-production.js';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const w17=read('content/customer-experience-rebuild/r12r4b/smr/admission/smr-w17-five-benchmark-human-admission-v1.json');
const w18=read('content/customer-experience-rebuild/r12r4b/smr/campaign/smr-structural-diversity-campaign-v1.json');
const w19=read('content/customer-experience-rebuild/r12r4b/smr/admission/smr-w19-product-integration-human-admission-v1.json');
const admission=read('content/customer-experience-rebuild/r12r4b/smr/admission/smr-production-admission-v1.json');
const acceptance=read('content/customer-experience-rebuild/r12r4b/smr/acceptance/smr-w20-production-cutover-acceptance-v1.json');
const hardDelete=read('content/customer-experience-rebuild/r12r4b/smr/acceptance/smr-w20b-hard-delete-legacy-acceptance-v1.json');
const canonicalRename=read('content/customer-experience-rebuild/r12r4b/smr/acceptance/smr-w20c-canonical-rename-acceptance-v1.json');

assert.equal(w17.status,'HUMAN_ACCEPTED_5_OF_5');
assert.deepEqual(w17.actual,{accepted:5,rejected:0,pending:0});
assert.equal(w18.cases.length,40);assert.equal(w18.summary.totalCases,40);
assert.equal(w19.status,'HUMAN_ACCEPTED_20_OF_20');assert.deepEqual(w19.actual,{accepted:20,rejected:0,pending:0});
assert.equal(w19.productionCutoverAllowed,true);
assert.equal(admission.status,'PRODUCTION');assert.equal(admission.productionAllowed,true);assert.equal(admission.customerCutoverAllowed,true);assert.equal(admission.currentApiMutationApplied,true);assert.equal(admission.humanReviewedProductComposition,true);assert.equal(admission.liveCustomerIndividuallyHumanReviewed,false);assert.equal(admission.singleApi,'/api/customer-personal-reality');assert.equal(admission.methodSpecificApiCreated,false);assert.equal(admission.oldSmrHardReplacementApplied,true);assert.equal(admission.canonicalRenameApplied,true);assert.equal(admission.canonicalRuntimePath,'functions/single-method-reading');assert.equal(admission.canonicalContentPath,'content/customer-experience-rebuild/r12r4b/smr');
for(const methodId of METHODS)assert.equal(admission.methods[methodId].state,'PRODUCTION');
assert.equal(acceptance.status,'PRODUCTION_ACCEPTED');assert.equal(acceptance.governance.productionAllowed,true);assert.equal(acceptance.governance.customerCutoverAllowed,true);assert.equal(acceptance.runtime.oldSmrPhysicalDeletionApplied,true);assert.equal(acceptance.runtime.canonicalRenameApplied,true);
assert.equal(hardDelete.status,'HARD_DELETE_ACCEPTED');assert.equal(hardDelete.rules.legacyRuntimeExecutable,false);
assert.equal(canonicalRename.status,'CANONICAL_RENAME_ACCEPTED');
assert.equal(SMR_PRODUCTION_ADMISSION.productionAllowed,true);assert.equal(SMR_PRODUCTION_ADMISSION.customerCutoverAllowed,true);
for(const methodId of METHODS)assert.equal(SMR_PRODUCTION_ADMISSION.methods[methodId],true);

const api=fs.readFileSync('functions/api/customer-personal-reality.js','utf8');
assert.match(api,/\.\.\/single-method-reading\/single-method-reading-production\.js/);
assert.doesNotMatch(api,/single-method-reading-r2\//);
assert.match(api,/selected\.length===1&&readingMethods\[0\]\?\.state==='READY_TO_READ'/);
assert.match(api,/reading,singleMethodReading/);
const ui=fs.readFileSync('assets/customer-ui/surfaces/single-method-reading.js','utf8');
const css=fs.readFileSync('assets/customer-ui/surfaces/single-method-reading.css','utf8');
assert.match(ui,/PHI-OS-SINGLE-METHOD-READING-PRODUCTION-v2\.0\.0/);assert.equal(fs.existsSync('assets/css/single-method-reading.css'),false);assert.equal(fs.existsSync('assets/customer-ui/surfaces/single-method-reading.css'),true);assert.ok(css.includes('.cx-smr-report')); assert.match(ui,/ECR:/);assert.doesNotMatch(ui,/data-smr-version="R2"/);

for(const methodId of METHODS){
  const b=await buildBenchmark(methodId);
  const result=await maybeBuildProductionSingleMethodReading({methodResult:b.methodResult,customerIntent:{intentId:'OPEN',prompt:'Production cutover validation.'},locale:'en'});
  assert.equal(result.schemaVersion,'PHI-OS-SINGLE-METHOD-READING-PRODUCTION-v2.0.0');assert.equal(result.state,'PRODUCTION');assert.equal(result.methodId,methodId);assert.equal(result.governance.humanReviewedProductComposition,true);assert.equal(result.governance.liveCustomerIndividuallyHumanReviewed,false);assert.ok(result.readingIA.sections.some(section=>section.eligibility==='SECTION_ELIGIBLE'));assert.ok(result.layout.firstScreen.blockCount<=8);assert.ok(result.layout.firstScreen.themeCount<=3);
}
console.log('✓ W20 canonical SMR production passed: W17 5/5 + W18 40/40 + W19 20/20; five methods use the canonical single-method-reading namespace and the v2 production schema.');
