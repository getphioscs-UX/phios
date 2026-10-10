import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';
const readJson=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
const sourceAll=readJson(`${ROOT}/source/HD-PRO-R3-W2A-user-authored-source-units-v1.json`);
const resolution=readJson(`${ROOT}/source/HD-PRO-R3-W11-variable-phs-source-resolution-v1.json`);
const corpus=readJson(`${ROOT}/semantics/HD-PRO-R3-W11-variable-phs-professional-meaning-corpus-v1.json`);
const admission=readJson(`${ROOT}/semantics/HD-PRO-R3-W11-variable-phs-semantic-admission-v1.json`);
const status=readJson(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v8.json`);
const historical=readJson(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v7.json`);

const fields=['DETERMINATION','COGNITION','ENVIRONMENT','PERSPECTIVE','MOTIVATION','TRAJECTORY'];
const counts={DETERMINATION:12,COGNITION:6,ENVIRONMENT:12,PERSPECTIVE:6,MOTIVATION:6,TRAJECTORY:12};
assert.equal(resolution.baselineCommit,'78ac0ae651133131d162e53c07cbccd793a55672');
assert.deepEqual(resolution.customerFields,fields);
assert.deepEqual(resolution.sourceCounts,counts);
assert.equal(resolution.sourceResolvedUnits,54);
assert.equal(resolution.deferredSourceCategory.category,'SENSE');
assert.equal(resolution.deferredSourceCategory.sourceUnits,6);
assert.equal(resolution.deferredSourceCategory.status,'SOURCE_AVAILABLE_NOT_CURRENT_CUSTOMER_FIELD');
assert.equal(resolution.admissionPolicy.automaticCalculationAllowed,false);
assert.equal(resolution.admissionPolicy.reverseInferenceAllowed,false);
assert.equal(resolution.admissionPolicy.customerConfirmedValueRequired,true);
assert.equal(resolution.admissionPolicy.advancedModifierOnly,true);
assert.equal(resolution.admissionPolicy.medicalNutritionTreatmentAllowed,false);
assert.equal(resolution.admissionPolicy.forcedDietAllowed,false);
assert.equal(resolution.admissionPolicy.coreOverrideAllowed,false);
assert.equal(resolution.sourceUnits.length,54);

const sourceMap=new Map(sourceAll.sourceUnits.map(x=>[x.sourceUnitId,x]));
for(const unit of resolution.sourceUnits){
  assert(fields.includes(unit.category),`unexpected current customer field ${unit.category}`);
  const original=sourceMap.get(unit.sourceUnitId);
  assert(original,`missing W2A source ${unit.sourceUnitId}`);
  assert.equal(original.sourceTextSha256,unit.sourceTextSha256,`${unit.sourceUnitId} source digest drift`);
  assert.equal(original.canonicalKey,unit.canonicalKey,`${unit.sourceUnitId} canonical-key drift`);
}

assert.equal(corpus.status,'VARIABLE_PHS_54_OF_54_SEMANTIC_ADMITTED_ADVANCED_MODIFIER_ONLY');
assert.equal(corpus.precedenceBoundary.priorityClass,'ADVANCED_VARIABLE_MODIFIER');
assert.equal(corpus.precedenceBoundary.mayOverrideCoreStructure,false);
assert.equal(corpus.precedenceBoundary.mayCreateDecisionRule,false);
assert.equal(corpus.precedenceBoundary.mayCreateMedicalNutritionPrescription,false);
assert.equal(corpus.semanticAdmission.sourceResolvedUnits,54);
assert.equal(corpus.semanticAdmission.semanticAdmittedUnits,54);
assert.equal(corpus.semanticAdmission.semanticLayerClaims,216);
assert.equal(corpus.semanticAdmission.compositionSupportedUnits,0);
assert.equal(corpus.semanticAdmission.machineVerifiedUnits,0);
assert.equal(corpus.semanticAdmission.humanAcceptedUnits,0);
assert.equal(corpus.semanticAdmission.customerPublishableR3Units,0);
assert.equal(corpus.meaningUnits.length,54);
assert.equal(corpus.semanticClaims.length,216);
assert.equal(new Set(corpus.semanticClaims.map(x=>x.claimId)).size,216);

const byField=Object.fromEntries(fields.map(f=>[f,corpus.meaningUnits.filter(x=>x.field===f)]));
for(const f of fields) assert.equal(byField[f].length,counts[f],`${f} meaning-unit count`);
const env5=byField.ENVIRONMENT.filter(x=>x.canonicalKey==='5.左'||x.canonicalKey==='5.右');
assert.equal(env5.length,2);
assert(env5.every(x=>x.directionDistinctSemanticStatus==='SOURCE_NOT_DISTINCT'));
assert.equal(env5[0].semanticTheme.en,env5[1].semanticTheme.en,'Environment 5 left/right source gap must not be filled');
assert.equal(env5[0].semanticTheme.zhHans,env5[1].semanticTheme.zhHans,'Environment 5 left/right source gap must not be filled');

const dangerousPositive=/\b(must|should)\s+(eat|fast|avoid\s+food|take\s+supplements)|\b(cure|heal|treat)\s+(disease|illness)|diagnos(?:e|es|is)\s+you|必须(?:吃|禁食)|应该(?:吃|禁食)|治疗(?:疾病|病症)|治愈(?:疾病|病症)|诊断你/iu;
for(const m of corpus.meaningUnits){
  assert.equal(m.priorityClass,'ADVANCED_VARIABLE_MODIFIER');
  assert.equal(m.semanticAdmissionStatus,'SEMANTIC_ADMITTED');
  assert.equal(m.compositionSupported,false);
  assert.equal(m.machineVerified,false);
  assert.equal(m.humanAccepted,false);
  assert.equal(m.customerPublishableR3,false);
  assert.equal(m.sourceRefs.length,1);
  const src=sourceMap.get(m.sourceRefs[0]);
  assert(src,`${m.meaningUnitId} source missing`);
  assert.equal(m.sourceTrace.sourceTextSha256,src.sourceTextSha256);
  for(const k of ['semanticTheme','experientialExpression','experimentInvitation','coreStructureInteraction','realityObservation','customerBoundary']){
    assert(m[k]?.en?.length>=35,`${m.meaningUnitId} ${k}.en too shallow`);
    assert(m[k]?.zhHans?.length>=18,`${m.meaningUnitId} ${k}.zhHans too shallow`);
    assert.equal(dangerousPositive.test(`${m[k].en}\n${m[k].zhHans}`),false,`${m.meaningUnitId} ${k} contains positive medical/diet prescription`);
  }
  assert.match(m.coreStructureInteraction.en,/after Type, Authority, Profile, Definition, Channels, Centers/i);
  assert.match(m.coreStructureInteraction.en,/core structure/i);
  assert.equal(/decision authority.*replace|overrides? the confirmed Authority|must decide/i.test(m.customerBoundary.en),false,`${m.meaningUnitId} customerBoundary steals Authority ownership`);
  assert(m.realityCheckQuestions?.length>=2);
}
for(const c of corpus.semanticClaims){
  assert.equal(c.methodId,'HUMAN_DESIGN_EXTERNAL');
  assert.equal(c.claimType,'ADVANCED');
  assert.equal(c.admissionStatus,'SOURCE_ADMITTED');
  assert.equal(c.semanticAdmissionStatus,'SEMANTIC_ADMITTED');
  assert.equal(c.compositionRuleId,null);
  assert.equal(c.compositionSupported,false);
  assert.equal(c.machineVerified,false);
  assert.equal(c.humanAccepted,false);
  assert.equal(c.customerPublishable,false);
}

assert.equal(admission.status,'VARIABLE_PHS_54_OF_54_SEMANTIC_ADMITTED_COMPOSITION_PENDING');
assert.equal(admission.coverage.fields,6);
assert.equal(admission.coverage.sourceResolvedUnits,54);
assert.equal(admission.coverage.semanticAdmittedUnits,54);
assert.equal(admission.coverage.semanticCoveragePct,100);
assert.equal(admission.coverage.semanticLayerClaims,216);
assert.equal(admission.coverage.compositionSupportedUnits,0);
assert.equal(admission.coverage.machineVerified,0);
assert.equal(admission.coverage.humanAccepted,0);
assert.equal(admission.coverage.r3CustomerPublishable,0);
assert.equal(admission.boundaries.advancedModifierOnly,true);
assert.equal(admission.boundaries.automaticCalculationForbidden,true);
assert.equal(admission.boundaries.reverseInferenceForbidden,true);
assert.equal(admission.boundaries.medicalDiagnosisForbidden,true);
assert.equal(admission.boundaries.nutritionTreatmentForbidden,true);
assert.equal(admission.boundaries.forcedDietForbidden,true);
assert.equal(admission.boundaries.coreOverrideForbidden,true);
assert.equal(admission.boundaries.authorityOwnershipPreserved,true);
assert.equal(admission.boundaries.environment5DirectionDistinction,'SOURCE_NOT_DISTINCT');
assert.equal(admission.boundaries.senseCustomerPromotion,'NOT_ADMITTED_CURRENT_CONTRACT');

const byCategory=Object.fromEntries(status.categories.map(x=>[x.category,x]));
assert.equal(status.schemaVersion,'PHI-OS-HD-PRO-R3-SEMANTIC-PRODUCTION-STATUS-v8.0.0');
assert.equal(status.updatedByWork,'HD-PRO-R3-W11');
assert.equal(status.successorOf,`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v7.json`);
assert.equal(status.historicalStatusRewritten,false);
assert.equal(historical.updatedByWork,'HD-PRO-R3-W10');
assert.equal(byCategory.VARIABLE_PHS.expectedFields,6);
assert.equal(byCategory.VARIABLE_PHS.sourceResolvedUnits,54);
assert.equal(byCategory.VARIABLE_PHS.semanticAdmitted,54);
assert.equal(byCategory.VARIABLE_PHS.semanticLayerClaims,216);
assert.equal(byCategory.VARIABLE_PHS.advancedModifierOnly,true);
assert.equal(status.aggregate.variablePhsSemanticCoveragePct,100);
assert.equal(status.aggregate.compositionSupportedCoveragePct,0);
assert.equal(status.aggregate.r3CustomerCutoverAllowed,false);
assert.equal(status.nextWork,'HD-PRO-R3-W12 Composition Rule Engine');

console.log('✓ HD-PRO-R3-W11 Variable / PHS Professional Layer passed.');
console.log('  Six current customer advanced fields are 54/54 source-resolved and semantic-admitted as ADVANCED MODIFIER only; medical/nutrition prescription, forced diet, core override, reverse inference and silent Sense promotion remain blocked.');
