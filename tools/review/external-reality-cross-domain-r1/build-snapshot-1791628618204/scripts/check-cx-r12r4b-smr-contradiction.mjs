import assert from 'node:assert/strict';
import fs from 'node:fs';
import {preserveContradictions} from '../functions/single-method-reading/contradiction-preservation.js';
import {SMR_R2_CONTRADICTION_RULES} from '../functions/single-method-reading/smr-w6-w8-rules.js';

const contract=JSON.parse(fs.readFileSync('content/customer-experience-rebuild/r12r4b/smr/contracts/smr-contradiction-preservation-contract-v1.json','utf8'));
const registry=JSON.parse(fs.readFileSync('content/customer-experience-rebuild/r12r4b/smr/registries/smr-contradiction-state-registry-v1.json','utf8'));
assert.deepEqual(contract.states,SMR_R2_CONTRADICTION_RULES.states);
assert.deepEqual(registry.states.map(item=>item.state),SMR_R2_CONTRADICTION_RULES.states);
assert.equal(contract.rules.tensionMayBeDeletedForSmoothNarrative,false);
assert.equal(contract.rules.dedupMaySuppressRequiredContradiction,false);
assert.equal(contract.rules.counterEvidenceMayBeDeleted,false);

const claim=(id,{type='CORE_PATTERN',counter=[]}={})=>({
  claimId:`C-${id}`,methodId:'AST',semanticDimension:`METHOD_NATIVE:AST:${id}`,claimType:type,headline:`Headline ${id}`,structuralMeaning:`Accepted meaning ${id}`,
  evidenceRefs:[`E-${id}`],counterEvidenceRefs:counter,conditions:type==='CONDITION'?[`COND-${id}`]:[],boundaries:[],lineage:{productionAdmissionRef:'ADM',readingAuthorityRef:'READ',interpretationUnitRefs:[`U-${id}`],projectionRefs:[`P-${id}`],meaningRefs:[`M-${id}`],ruleRefs:[`R-${id}`],boundaryRefs:[]}
});
const claims=[claim('SUP',{type:'SUPPORT'}),claim('TEN',{type:'TENSION'}),claim('COND',{type:'CONDITION'}),claim('TRADE',{type:'TRADEOFF',counter:['CE-TRADE']}),claim('OPEN',{type:'OPEN'}),claim('CORE')];
const priorityResolution={schemaVersion:'PHI-OS-CUSTOMER-READING-PRIORITY-RESOLUTION-v1.0.0',methodId:'AST',readingAuthorityRef:'READ',semanticDigest:'SEM',claims,firstScreenClaimRefs:[],boundary:{}};
const themeCollection={schemaVersion:'PHI-OS-CUSTOMER-THEME-IR-COLLECTION-v1.0.0',methodId:'AST',themes:[
  {themeId:'T-MIX',claimRefs:['C-SUP','C-TEN']},
  {themeId:'T-COND',claimRefs:['C-COND']},
  {themeId:'T-TRADE',claimRefs:['C-TRADE']},
  {themeId:'T-OPEN',claimRefs:['C-OPEN']}
]};
const claimDedup={schemaVersion:'PHI-OS-SMR-R2-CLAIM-DEDUP-v1.0.0',decisions:[
  {claimRef:'C-SUP',decision:'PRIMARY_EXPLANATION'},
  {claimRef:'C-TEN',decision:'SUPPRESSED_DUPLICATE'},
  {claimRef:'C-COND',decision:'CONTEXT_DERIVATIVE'},
  {claimRef:'C-TRADE',decision:'PRIMARY_EXPLANATION'},
  {claimRef:'C-OPEN',decision:'PRIMARY_EXPLANATION'}
]};
const first=preserveContradictions({priorityResolution,themeCollection,claimDedup});
const second=preserveContradictions({priorityResolution,themeCollection,claimDedup});
assert.deepEqual(first,second);
assert.equal(first.boundary.deterministic,true);
assert.equal(first.boundary.tensionDeleted,false);
assert.equal(first.boundary.conditionDeleted,false);
assert.equal(first.boundary.counterEvidenceDeleted,false);
assert.equal(first.boundary.oneSidedCollapseAllowed,false);
assert.equal(first.relations.find(item=>item.claimRef==='C-SUP').state,'SUPPORT');
assert.equal(first.relations.find(item=>item.claimRef==='C-TEN').state,'TENSION');
assert.equal(first.relations.find(item=>item.claimRef==='C-COND').state,'CONDITIONAL');
assert.equal(first.relations.find(item=>item.claimRef==='C-TRADE').state,'COUNTERBALANCED');
assert.equal(first.relations.find(item=>item.claimRef==='C-OPEN').state,'OPEN');
assert.equal(first.relations.find(item=>item.claimRef==='C-TEN').narrativeDisposition,'CONTEXT_DERIVATIVE_REQUIRED');
assert.equal(first.themeStates.find(item=>item.themeRef==='T-MIX').state,'COUNTERBALANCED');
for(const ref of ['C-TEN','C-COND','C-TRADE','C-OPEN'])assert.ok(first.preservedClaimRefs.includes(ref));
assert.ok(first.preservedCounterEvidenceRefs.includes('CE-TRADE'));
assert.deepEqual(first.counts,{SUPPORT:1,TENSION:1,CONDITIONAL:1,COUNTERBALANCED:1,OPEN:1});
console.log('✓ CX-R12R4B SMR-R2 W7 contradiction preservation passed: support/tension/condition/counterbalance/open remain explicit and dedup cannot erase required contradiction.');
