import {buildEcrHumanRuntime} from '../functions/embodied-configuration/ecr-canonical-projection-runtime-v2.js';
import fs from 'node:fs';import assert from 'node:assert/strict';
import {buildEcrHumanRuntimeReport} from '../functions/ecr-full-report/ecr-human-runtime-report-v4-1.js';
const ir=await buildEcrHumanRuntime({canonicalInput:JSON.parse(fs.readFileSync('content/embodied-configuration/v4-1/acceptance/birth-fixtures-v1.json')).cases[0].canonicalInput});
assert.throws(()=>buildEcrHumanRuntimeReport({ir}),/HUMAN_REVIEW/);
const entitlement={schemaVersion:'PHI-OS-KAP-W45-METHOD-JOURNEY-ENTITLEMENT-v1.0.0',methodCode:'ECR',access:{methodAllowed:true,readingDepthAllowed:true}};
for(const locale of ['en','zh-Hans']){const free=buildEcrHumanRuntimeReport({ir,locale,reviewMode:true,sharedEntitlement:{paid:true}}),paid=buildEcrHumanRuntimeReport({ir,locale,reviewMode:true,sharedEntitlement:entitlement});assert.equal(free.depth,'FREE');assert.equal(free.sections.length,3);assert.equal(paid.sections.length,14);assert.equal(paid.publicationState,'HUMAN_REVIEW_REQUIRED');assert.equal(paid.sections.find(s=>s.sectionId==='CURRENT_REALITY').content.status,'UNBOUND');assert(paid.sections.every(s=>s.sourceRefs.includes(ir.configurationId)));}
console.log('PASS V4.1 W12: versioned 14-section bilingual report; server entitlement and human admission fail closed.');
