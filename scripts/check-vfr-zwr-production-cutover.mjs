import fs from 'node:fs';
import assert from 'node:assert/strict';
import {resolveAcceptedZwrVfrDeepManuscript,ZWR_VFR_ACCEPTED_DEEP_MANUSCRIPT_REGISTRY} from '../functions/personal-reading/visual-first/ziwei-vfr-accepted-deep-manuscript-registry.js';

const root='docs/reports/ziwei/vfr-r1';
const cutoverPath=root+'/PRODUCTION-CUTOVER.json';
const decisionPath=root+'/HUMAN-DECISION.json';
const bindingPath='functions/report-delivery/ziwei-canonical-person-binding.js';
const generatorPath='functions/report-delivery/ziwei-vfr-r1-generation.js';

for(const p of [cutoverPath,decisionPath,bindingPath,generatorPath])assert(fs.existsSync(p),'missing W10 artifact: '+p);
const cutover=JSON.parse(fs.readFileSync(cutoverPath,'utf8'));
const decision=JSON.parse(fs.readFileSync(decisionPath,'utf8'));
const binding=fs.readFileSync(bindingPath,'utf8');
const generator=fs.readFileSync(generatorPath,'utf8');

assert.equal(cutover.schemaVersion,'ZWR-VFR-R1-DEEP-PRODUCTION-CUTOVER-v2');
assert.equal(cutover.providerPolicy,'ACCEPTED_DEEP_MANUSCRIPT_REGISTRY_ZERO_PROVIDER');
assert.equal(cutover.providerCallsDuringProductionPublication,0);
assert.equal(cutover.semanticAiReviewCalls,0);
assert.equal(cutover.unmatchedAuthorityPolicy,'FAIL_CLOSED_AUTHORING_REQUIRED');
assert.equal(cutover.deterministicDiagramCount,15);
assert.equal(decision.decision,'ACCEPT');

assert(binding.includes("import {generateZiweiVfrR1Candidate} from './ziwei-vfr-r1-generation.js';"),'canonical binding must use Deep Manuscript VFR generator');
assert(binding.includes('generateCandidate=generateZiweiVfrR1Candidate'),'canonical binding default generator drift');
assert(!binding.includes("import {generateZiweiProfessionalSynthesisR5Candidate} from './ziwei-professional-synthesis-r5-generation.js';"),'legacy R5 import must be retired from canonical binding');

for(const forbidden of ['composeZwrVfrOneCall','OPENAI_API_KEY','invokeOpenAIStructured','ZIWEI_R5_PAI_REGISTRY']){
 assert(!generator.includes(forbidden),'production generator live-provider dependency detected: '+forbidden);
}
assert(generator.includes('providerCalls:0'));
assert(generator.includes('resolveAcceptedZwrVfrDeepManuscript'));
assert(generator.includes('productionAdmissionGranted:true'));

assert.equal(ZWR_VFR_ACCEPTED_DEEP_MANUSCRIPT_REGISTRY.entries.length>=1,true,'accepted Deep Manuscript registry empty');
const accepted=ZWR_VFR_ACCEPTED_DEEP_MANUSCRIPT_REGISTRY.entries[0];
assert.equal(accepted.humanDecision,'ACCEPT');
assert.equal(accepted.productionEligible,true);
assert.equal(resolveAcceptedZwrVfrDeepManuscript(accepted.authorityDigest).manuscriptId,accepted.manuscriptId);

let failedClosed=false;
try{resolveAcceptedZwrVfrDeepManuscript('UNSEEN-AUTHORITY-DIGEST');}
catch(error){
 failedClosed=error?.code==='ZWR_VFR_DEEP_MANUSCRIPT_AUTHORING_REQUIRED'&&error?.status===503;
}
assert.equal(failedClosed,true,'unseen authority must fail closed to AUTHORING_REQUIRED');

assert(fs.existsSync('scripts/rollback-zwr-vfr-production-cutover.mjs'),'rollback script missing');
const rollback=fs.readFileSync('scripts/rollback-zwr-vfr-production-cutover.mjs','utf8');
assert(rollback.includes('generateZiweiProfessionalSynthesisR5Candidate'),'rollback must restore R5 hot path');
assert(rollback.includes('provider calls=0')||rollback.includes('providerCalls:0'),'rollback must remain zero-provider');

console.log('PASS VFR-ZWR-10 production cutover: canonical binding uses accepted Deep Manuscript registry; runtime provider calls=0; unseen authority fails closed to AUTHORING_REQUIRED; 15-diagram adaptive publication retained; explicit rollback available.');
