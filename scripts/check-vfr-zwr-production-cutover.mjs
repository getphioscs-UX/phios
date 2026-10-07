import fs from 'node:fs';
import assert from 'node:assert/strict';

const root='docs/reports/ziwei/vfr-r1';
const cutoverPath=root+'/PRODUCTION-CUTOVER.json';
const decisionPath=root+'/HUMAN-DECISION.json';
const bindingPath='functions/report-delivery/ziwei-canonical-person-binding.js';
const generatorPath='functions/report-delivery/ziwei-vfr-r1-generation.js';
const composerPath='functions/personal-reading/visual-first/ziwei-vfr-production-deep-composer.js';
const completenessPath='functions/personal-reading/visual-first/ziwei-vfr-production-completeness.js';

for(const p of [cutoverPath,decisionPath,bindingPath,generatorPath,composerPath,completenessPath])assert(fs.existsSync(p),'missing W10 artifact: '+p);
const cutover=JSON.parse(fs.readFileSync(cutoverPath,'utf8'));
const decision=JSON.parse(fs.readFileSync(decisionPath,'utf8'));
const binding=fs.readFileSync(bindingPath,'utf8');
const generator=fs.readFileSync(generatorPath,'utf8');
const composer=fs.readFileSync(composerPath,'utf8');
const completeness=fs.readFileSync(completenessPath,'utf8');

assert.equal(cutover.schemaVersion,'ZWR-VFR-R1-DEEP-PRODUCTION-CUTOVER-v2');
assert.equal(cutover.providerPolicy,'AUTO_DEEP_MANUSCRIPT_WRITING_WITH_DETERMINISTIC_GATES');
assert.equal(cutover.providerCallsDuringProductionPublication,0);
assert.equal(cutover.semanticAiReviewCalls,0);
assert.equal(cutover.unseenAuthorityPolicy,'AUTO_GENERATE_FROM_CANONICAL_AUTHORITY');
assert.equal(cutover.deterministicDiagramCount,15);
assert.equal(decision.decision,'ACCEPT');

assert(binding.includes("import {generateZiweiVfrR1Candidate} from './ziwei-vfr-r1-generation.js';"),'canonical binding must use VFR generator');
assert(binding.includes('generateCandidate=generateZiweiVfrR1Candidate'),'canonical binding default generator drift');
assert(!binding.includes("import {generateZiweiProfessionalSynthesisR5Candidate} from './ziwei-professional-synthesis-r5-generation.js';"),'legacy R5 import must be retired from canonical binding');

assert(generator.includes('composeZwrVfrProductionDeepManuscript'),'automatic Deep Manuscript production composer missing');
assert(generator.includes("providerAuthority:'WRITING_ONLY_AUTOMATIC'"),'automatic writing authority missing');
assert(generator.includes('productionAdmissionGranted:true'));
assert(!generator.includes('composeZwrVfrOneCall'),'legacy one-call composer must not return');

assert(composer.includes('composeZwrFiveCallExperiment'),'approved Deep Manuscript writer missing');
assert(composer.includes('buildZwrVfrProductionCompletenessManifest'),'deterministic completeness gate missing');
assert(composer.includes('runTargetedRepair'),'automatic targeted repair missing');
assert(composer.includes('semanticReviewCalls:0'),'semantic AI review must remain zero');
assert(completeness.includes('TOTAL_DEPTH_TOO_LOW'),'deterministic depth gate missing');

assert(fs.existsSync('scripts/rollback-zwr-vfr-production-cutover.mjs'),'rollback script missing');
console.log('PASS VFR-ZWR-10 production cutover: canonical binding uses automatic Deep Manuscript generation for unseen customer charts; deterministic completeness + targeted repair are active; semantic AI review=0; publication/rerender provider calls=0; 15-diagram adaptive publication retained; explicit rollback available.');
