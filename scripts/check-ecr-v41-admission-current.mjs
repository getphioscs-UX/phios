import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {isEcrHumanAdmitted,resolveEcrSemanticComposition} from '../functions/embodied-configuration/ecr-semantic-composition-r2.js';
import {selectEcrRuntimeSlotCards} from '../functions/ecr-phi-card/ecr-human-runtime-cards-v4-1.js';
import './check-ecr-v41-r8-runtime-alignment.mjs';
const read=p=>JSON.parse(fs.readFileSync(p)),root='content/embodied-configuration/v4-1/';
const successor=read(root+'admission/ecr-current-checker-successor-v1.json');
assert.equal(successor.productionAdmissionChanged,false);
assert.equal(createHash('sha256').update(fs.readFileSync(successor.historicalWorkspace.path)).digest('hex'),successor.historicalWorkspace.sha256);
const policy=read(root+'semantic-admission-r2/composition-policy.json');
for(const [key,count] of Object.entries({gateBases:64,lineModifiers:6,planetaryDriverRoles:12,layerRoles:2})){
  assert.equal(policy[key].length,count);assert(policy[key].every(isEcrHumanAdmitted));
  const changed=structuredClone(policy[key][0]);changed.meaningRef+='-TAMPERED';assert.equal(isEcrHumanAdmitted(changed),false);
}
const input={gate:41,line:1,driverId:'D1',layer:'PERSONALITY'},evidence=read(policy.operationalTagEvidenceRef).records;
const resolved=resolveEcrSemanticComposition(input,policy,evidence);
assert.equal(resolved.status,'ADMITTED_TAG_COMPOSITION');assert(resolved.semanticTags.length);assert.deepEqual(resolved.runtimeOwners,[]);
assert.equal(resolveEcrSemanticComposition(input,policy,[]).status,'UNKNOWN');
for(const bad of [{...input,gate:999},{...input,line:999},{...input,driverId:'UNADMITTED'}])assert.equal(resolveEcrSemanticComposition(bad,policy,evidence).status,'UNKNOWN');
const tampered=structuredClone(evidence);tampered.find(e=>e.gate===41).outputTags.push('UNADMITTED');assert.equal(resolveEcrSemanticComposition(input,policy,tampered).status,'UNKNOWN');
const cards=read(root+'semantic-admission-r2/card-eligibility.json'),deck=read('content/ecr-phi-card/ecr-phi-card-deck-registry-v2.json');
assert.equal(cards.runtimeSlotEligibility.length,48);assert(cards.runtimeSlotEligibility.every(isEcrHumanAdmitted));
assert(selectEcrRuntimeSlotCards([{customerSurfaceAllowed:false,semanticTags:resolved.semanticTags}],cards,deck).every(c=>c.status==='UNKNOWN'));
const customer=read(root+'admission/customer-admission-v1.json'),visual=read(root+'admission/ecr-r8-rendered-visual-owner-acceptance-v1.json');
assert.equal(visual.decision,'ACCEPT');assert.equal(customer.customerProductionAdmitted,false);assert(customer.remainingGates.includes('DEPLOYED_PREVIEW_E2E'));
console.log('PASS current ECR R7/R8 admission: exact-content semantic and card admission, tamper/missing evidence denied, runtime owners unresolved, deployed production still closed. Historical R4 workspace preserved.');
