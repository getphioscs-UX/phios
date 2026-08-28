import assert from 'node:assert/strict';
import fs from 'node:fs';
import {adaptAstrologyProductionInput} from '../functions/single-method-reading-r2/astrology-production-adapter.js';
import {adaptBaziProductionInput} from '../functions/single-method-reading-r2/bazi-production-adapter.js';
import {adaptZiWeiProductionInput} from '../functions/single-method-reading-r2/ziwei-production-adapter.js';
import {adaptNumerologyProductionInput} from '../functions/single-method-reading-r2/numerology-production-adapter.js';
import {adaptEcrProductionInput} from '../functions/single-method-reading-r2/ecr-production-adapter.js';
const contract=JSON.parse(fs.readFileSync('content/customer-experience-rebuild/r12r4b/smr-r2/contracts/smr-r2-method-production-input-contract-v1.json','utf8'));
const publicCode={AST:'ASTROLOGY_PROJECTION',BZR:'BAZI_PROJECTION',ZWR:'ZI_WEI_PROJECTION',NUM:'NUMEROLOGY_PROJECTION',ECR:'EMBODIED_CONFIGURATION_PROJECTION'};
const adapters={AST:adaptAstrologyProductionInput,BZR:adaptBaziProductionInput,ZWR:adaptZiWeiProductionInput,NUM:adaptNumerologyProductionInput,ECR:adaptEcrProductionInput};
function fixture(methodId,relation='SUPPORT'){
  const id=`UNIT-${methodId}-001`;
  return {methodId,state:'READY_TO_READ',insights:[{insightId:id,title:`${methodId} accepted title`,summary:`${methodId} accepted structural meaning`,body:`${methodId} admitted body`,observableSignals:['observable'],alternativeInterpretations:[],openQuestions:['open question'],confidenceBoundary:'Conditional interpretation only.'}],technical:{publicMethodCode:publicCode[methodId],acceptanceBasis:'ADMITTED_COMPOSITION_RULESET',interpretationResultId:`IR-${methodId}`,semanticDigest:`SEM-${methodId}`,derivationDigest:`DER-${methodId}`,admissionRef:`ADMISSION:${methodId}`,humanReviewEvidenceRef:`HUMAN:${methodId}`,compositionRuleVersion:'RULES-v1',meaningBundleCode:`MEANING-${methodId}`,graphSourceRefs:[`GRAPH:${methodId}`],boundary:{liveCustomerHumanReviewClaimed:false},interpretationUnits:[{unitId:id,semanticTags:[methodId,'SUBJECT',relation,'PRIMARY'],projectionRefs:[`PROJECTION:${methodId}`],meaningRefs:[`MEANING:${methodId}`],derivationRefs:[`RULE:${methodId}`],boundaryRefs:[`BOUNDARY:${methodId}`]}]}};
}
assert.deepEqual(contract.supportedMethods,['AST','BZR','ZWR','NUM','ECR']);
for(const methodId of contract.supportedMethods){
  const envelope=adapters[methodId](fixture(methodId,methodId==='ZWR'?'DEPENDENCY':methodId==='NUM'?'TRANSITION':'SUPPORT'));
  assert.equal(envelope.schemaVersion,'PHI-OS-ACCEPTED-METHOD-READING-ENVELOPE-v1.0.0');assert.equal(envelope.methodId,methodId);assert.equal(envelope.productionAdmissionRef,`ADMISSION:${methodId}`);assert.equal(envelope.readingAuthorityRef,`IR-${methodId}`);assert.deepEqual(envelope.findingRefs,[]);assert.deepEqual(envelope.themeRefs,[]);assert.deepEqual(envelope.interpretationUnitRefs,[`UNIT-${methodId}-001`]);assert.deepEqual(envelope.priorityRefs,[`UNIT-${methodId}-001`]);assert.ok(envelope.sourceLineage.includes(`PROJECTION:${methodId}`));assert.ok(envelope.sourceLineage.includes(`MEANING:${methodId}`));assert.ok(envelope.ruleLineage.includes(`RULE:${methodId}`));assert.equal(envelope.temporalClaims.length,0);assert.equal(envelope.boundary.methodRuntimeExecuted,false);assert.equal(envelope.boundary.newMeaningCreated,false);assert.equal(envelope.reconciliation.noSyntheticFindingPromotion,true);
}
assert.throws(()=>adaptAstrologyProductionInput(fixture('BZR')),error=>error.code==='SMR_R2_ADAPTER_METHOD_MISMATCH');
const notAccepted=fixture('AST');notAccepted.technical.acceptanceBasis='PENDING';assert.throws(()=>adaptAstrologyProductionInput(notAccepted),error=>error.code==='SMR_R2_ADMITTED_COMPOSITION_REQUIRED');
console.log('✓ CX-R12R4B SMR-R2 W1 method production adapters passed for AST/BZR/ZWR/NUM/ECR.');
