import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';
const readJson=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
const source=readJson(`${ROOT}/source/HD-PRO-R3-W2A-user-authored-source-units-v1.json`);
const candidates=readJson(`${ROOT}/claims/hd-pro-r3-semantic-claim-candidates-v1.json`);
const resolution=readJson(`${ROOT}/source/HD-PRO-R3-W7-center-source-resolution-v1.json`);
const policy=readJson(`${ROOT}/semantics/HD-PRO-R3-W7-center-three-state-structural-policy-v1.json`);
const corpus=readJson(`${ROOT}/semantics/HD-PRO-R3-W7-center-professional-meaning-corpus-v1.json`);
const admission=readJson(`${ROOT}/semantics/HD-PRO-R3-W7-center-semantic-admission-v1.json`);
const status=readJson(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v4.json`);
const historicalStatus=readJson(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v3.json`);

const CENTERS=['HEAD','AJNA','THROAT','G','EGO','SPLEEN','SOLAR_PLEXUS','SACRAL','ROOT'];
const STATES=['DEFINED','UNDEFINED','OPEN'];
const REQUIRED=['centerFunction','stateMeaning','conditioningOrConsistency','authorityInteraction','channelContext','hangingGateContext','relationshipExposure','realityExpression'];
const validClaimTypes=new Set(['STRUCTURAL','DECISION','ENERGY','ROLE','RELATIONAL','ENVIRONMENT','OPENNESS','INTEGRATION','TIMING_CONTEXT','ADVANCED']);
const sourceUnits=source.sourceUnits.filter(x=>x.category==='CENTER');
const sourceByKey=new Map(sourceUnits.map(x=>[x.canonicalKey,x]));
const candidateByRef=new Map(candidates.claims.filter(x=>x.sourceRefs?.[0]?.startsWith('HD-UA-CENTER-')).map(x=>[x.sourceRefs[0],x]));

assert.equal(sourceUnits.length,27);
for(const center of CENTERS) for(const state of STATES) assert(sourceByKey.has(`${center}.${state}`),`missing source ${center}.${state}`);

assert.equal(resolution.coverage.canonicalCenters,9);
assert.equal(resolution.coverage.expectedCenterStateUnits,27);
assert.equal(resolution.coverage.directUserSourceCenterStateUnits,27);
assert.equal(resolution.coverage.resolvedForSemanticAdmission,27);
assert.equal(resolution.coverage.unresolved,0);
assert.deepEqual(resolution.stateModel.states,STATES);
assert.equal(resolution.stateModel.undefinedEqualsOpen,false);
assert.equal(resolution.stateModel.sourceExplicitThreeStateCoverage,true);
assert.equal(resolution.stateModel.r2LegacyOpenCentersIsAmbiguousForThreeStateR3,true);
assert.equal(resolution.publication.r2State,'CUSTOMER_PUBLISHED');
assert.equal(resolution.publication.r3State,'SHADOW_CANDIDATE');
assert.equal(resolution.publication.r2HumanReviewInherited,false);

assert.equal(policy.status,'R3_SHADOW_STRUCTURAL_SUCCESSOR_POLICY_NO_R2_MUTATION');
assert.equal(policy.legacyR2.openCentersSemantic,'NON_DEFINED_LEGACY_AMBIGUOUS');
assert.equal(policy.legacyR2.mayMapOpenCentersDirectlyToOPEN,false);
assert.equal(policy.legacyR2.r2ProductionAuthorityChanged,false);
assert.equal(policy.r3SuccessorRule.birthDataRecalculationAllowed,false);
assert.equal(policy.r3SuccessorRule.confirmedExternalStructureRequired,true);
assert.equal(policy.r3SuccessorRule.missingGateDataMeans,'STATE_UNRESOLVED_NOT_OPEN');
assert.equal(policy.states.UNDEFINED.gateRequirement,'AT_LEAST_ONE_CONFIRMED_GATE_IN_CENTER');
assert.equal(policy.states.OPEN.gateRequirement,'ZERO_CONFIRMED_GATES_IN_CENTER');
assert.equal(policy.precedence.completeChannelMeaning,'PRIMARY_WHEN_CONFIRMED');
assert.equal(policy.publication.customerRendererCutoverAllowed,false);

assert.equal(corpus.semanticAdmission.canonicalCenterCount,9);
assert.equal(corpus.semanticAdmission.centerStateUnitCount,27);
assert.equal(corpus.semanticAdmission.sourceAdmittedCenterStateUnits,27);
assert.equal(corpus.semanticAdmission.semanticAdmittedCenterStateUnits,27);
assert.equal(corpus.semanticAdmission.semanticLayerClaims,216);
assert.equal(corpus.semanticAdmission.compositionSupportedCenterStateUnits,0);
assert.equal(corpus.semanticAdmission.machineVerifiedCenterStateUnits,0);
assert.equal(corpus.semanticAdmission.humanAcceptedCenterStateUnits,0);
assert.equal(corpus.semanticAdmission.customerPublishableR3CenterStateUnits,0);
assert.deepEqual(corpus.requiredLayerIds,REQUIRED);
assert.equal(corpus.ownershipBoundary.fullChannelPrimaryOverGenericCenter,true);
assert.equal(corpus.ownershipBoundary.centerMayReplaceAuthority,false);
assert.equal(corpus.ownershipBoundary.centerMayPublishSpecificGateMeaning,false);
assert.deepEqual(corpus.ownershipBoundary.precedence,['COMPLETE_CHANNEL','SPECIFIC_GATE_SUPPORT','GENERIC_CENTER_STATE']);
assert.equal(corpus.meaningUnits.length,27);
assert.equal(corpus.semanticClaims.length,216);
assert.equal(new Set(corpus.meaningUnits.map(x=>x.meaningUnitId)).size,27);
assert.equal(new Set(corpus.semanticClaims.map(x=>x.claimId)).size,216);

for(const m of corpus.meaningUnits){
  assert(CENTERS.includes(m.canonicalCenter));
  assert(STATES.includes(m.centerState));
  const key=`${m.canonicalCenter}.${m.centerState}`;
  const su=sourceByKey.get(key);
  const cand=candidateByRef.get(su.sourceUnitId);
  assert(su,`${key} source missing`);
  assert(cand,`${key} W3 candidate missing`);
  assert.equal(su.sourceAdmissionStatus,'SOURCE_ADMITTED');
  assert.equal(m.sourceTrace.primarySourceUnitId,su.sourceUnitId);
  assert.equal(m.sourceTrace.sourceTextSha256,su.sourceTextSha256);
  assert.equal(m.candidateClaimId,cand.claimId);
  assert.equal(m.semanticAdmissionStatus,'SEMANTIC_ADMITTED');
  assert.equal(m.compositionSupported,false);
  assert.equal(m.machineVerified,false);
  assert.equal(m.humanAccepted,false);
  assert.equal(m.customerPublishableR3,false);
  assert.equal(m.threeStateStructure.definedUndefinedOpenDistinct,true);
  assert.equal(m.threeStateStructure.r2OpenCentersMayBeTreatedAsThisStateWithoutEvidence,false);
  assert.equal(m.threeStateStructure.stateMayBeInferredFromBirthData,false);
  assert.equal(m.threeStateStructure.stateRequiresConfirmedExternalStructure,true);
  for(const layer of REQUIRED){
    const p=m.requiredLayers[layer];
    assert(p?.zhHans?.length>=35,`${key} ${layer} zh too shallow`);
    assert(p?.en?.length>=65,`${key} ${layer} en too shallow`);
    assert.equal(su.sourceText.zhHans.includes(p.zhHans),false,`${key} ${layer} copied source verbatim`);
  }
  assert.equal(m.realityCheckQuestions.length,3,`${key} requires 3 semantic-specific reality questions`);
  assert(m.realityDomains.length>=4);
  assert(m.legacySourceMaterialExcludedFromW7.includes('medical_or_health_outcomes'));
  assert(m.legacySourceMaterialExcludedFromW7.includes('center_as_automatic_decision_authority'));
  const customerText=[...Object.values(m.requiredLayers).flatMap(x=>[x.zhHans,x.en]),...m.realityCheckQuestions.flatMap(x=>[x.zhHans,x.en]),m.customerBoundary.zhHans,m.customerBoundary.en].join('\n');
  assert.equal(/\bW7\b|\bW8\b|\bW9\b|\bW12\b|SHADOW_CANDIDATE|SEMANTIC_ADMITTED|R3 human review/i.test(customerText),false,`${key} leaks engineering vocabulary`);
  assert.equal(/(一定会生病|免疫力较强|西药可能会伤害|顺势疗法|灵媒|超感应能力|最适合.*伴侣|灵魂伴侣|注定|固定命运|保证.*成功)/i.test(customerText),false,`${key} carries excluded deterministic/medical source claim`);
  if(m.centerState==='OPEN') assert.match(m.requiredLayers.hangingGateContext.zhHans,/没有已确认 Gate activation/);
  if(m.centerState==='UNDEFINED') assert.match(m.requiredLayers.hangingGateContext.en,/hanging \/ active Gates/);
}

for(const c of corpus.semanticClaims){
  assert.equal(c.methodId,'HUMAN_DESIGN_EXTERNAL');
  assert(validClaimTypes.has(c.claimType),`${c.claimId} invalid claim type`);
  assert(c.subjectRefs[0].startsWith('CENTER.'));
  assert.equal(c.semanticOwnerId,'human_design.center');
  assert.equal(c.admissionStatus,'SOURCE_ADMITTED');
  assert.equal(c.semanticAdmissionStatus,'SEMANTIC_ADMITTED');
  assert(c.customerMeaning?.zhHans && c.customerMeaning?.en);
  assert(c.customerBoundary?.zhHans && c.customerBoundary?.en);
  assert.equal(c.compositionRuleId,null);
  assert.equal(c.compositionSupported,false);
  assert.equal(c.machineVerified,false);
  assert.equal(c.humanAccepted,false);
  assert.equal(c.customerPublishable,false);
}

const headOpen=corpus.meaningUnits.find(x=>x.canonicalCenter==='HEAD'&&x.centerState==='OPEN');
const gDefined=corpus.meaningUnits.find(x=>x.canonicalCenter==='G'&&x.centerState==='DEFINED');
const egoOpen=corpus.meaningUnits.find(x=>x.canonicalCenter==='EGO'&&x.centerState==='OPEN');
const spleenUndefined=corpus.meaningUnits.find(x=>x.canonicalCenter==='SPLEEN'&&x.centerState==='UNDEFINED');
const solarDefined=corpus.meaningUnits.find(x=>x.canonicalCenter==='SOLAR_PLEXUS'&&x.centerState==='DEFINED');
const sacralDefined=corpus.meaningUnits.find(x=>x.canonicalCenter==='SACRAL'&&x.centerState==='DEFINED');
const rootUndefined=corpus.meaningUnits.find(x=>x.canonicalCenter==='ROOT'&&x.centerState==='UNDEFINED');
assert.match(headOpen.requiredLayers.stateMeaning.zhHans,/没有固定头顶闸门/);
assert.match(gDefined.requiredLayers.stateMeaning.zhHans,/宿命化/);
assert.match(egoOpen.requiredLayers.stateMeaning.en,/money|self-worth/i);
assert.match(spleenUndefined.requiredLayers.stateMeaning.zhHans,/医疗风险/);
assert.match(solarDefined.requiredLayers.authorityInteraction.zhHans,/EMOTIONAL/);
assert.match(sacralDefined.requiredLayers.authorityInteraction.zhHans,/SACRAL/);
assert.match(rootUndefined.requiredLayers.stateMeaning.zhHans,/生理压力诊断/);

assert.equal(admission.status,'CENTER_27_OF_27_SEMANTIC_ADMITTED_THREE_STATE_COMPOSITION_PENDING');
assert.equal(admission.coverage.semanticAdmitted,27);
assert.equal(admission.coverage.semanticCoveragePct,100);
assert.equal(admission.coverage.semanticLayerClaims,216);
assert.equal(admission.coverage.compositionSupported,0);
assert.equal(admission.coverage.humanAccepted,0);
assert.equal(admission.coverage.r3CustomerPublishable,0);
assert.equal(admission.boundaryResolution.definedUndefinedOpenDistinct,true);
assert.equal(admission.boundaryResolution.r2OpenCentersDirectlyMappedToOpen,false);
assert.equal(admission.boundaryResolution.authorityOwnershipPreserved,true);
assert.equal(admission.boundaryResolution.fullChannelPrecedencePreserved,true);
assert.equal(admission.publication.r2State,'CUSTOMER_PUBLISHED');
assert.equal(admission.publication.r3State,'SHADOW_CANDIDATE');
assert.equal(admission.publication.r2HumanReviewInherited,false);

const byCategory=Object.fromEntries(status.categories.map(x=>[x.category,x]));
assert.equal(status.schemaVersion,'PHI-OS-HD-PRO-R3-SEMANTIC-PRODUCTION-STATUS-v4.0.0');
assert.equal(status.baselineCommit,'8c44a0e023a15a2e6f786306a83bd792b90bdb65');
assert.equal(status.updatedByWork,'HD-PRO-R3-W7');
assert.equal(status.r2State,'CUSTOMER_PUBLISHED');
assert.equal(status.r3State,'SHADOW_CANDIDATE');
assert.equal(status.historicalStatusRewritten,false);
assert.equal(status.successorOf,`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v3.json`);
assert.equal(historicalStatus.updatedByWork,'HD-PRO-R3-W6');
assert.equal(historicalStatus.categories.find(x=>x.category==='CENTER').semanticAdmitted,0);
assert.equal(byCategory.TYPE.semanticAdmitted,5);
assert.equal(byCategory.AUTHORITY.semanticAdmitted,8);
assert.equal(byCategory.PROFILE.semanticAdmitted,12);
assert.equal(byCategory.CENTER.expected,9);
assert.equal(byCategory.CENTER.sourceStateUnits,27);
assert.equal(byCategory.CENTER.semanticAdmitted,27);
assert.equal(byCategory.CENTER.semanticStateUnits,27);
assert.equal(byCategory.CENTER.semanticLayerClaims,216);
assert.equal(byCategory.CENTER.compositionSupported,0);
for(const k of ['CHANNEL','GATE','DEFINITION','VARIABLE_PHS']) assert.equal(byCategory[k].semanticAdmitted,0,`${k} was admitted early by W7`);
assert.equal(status.aggregate.centerSemanticCoveragePct,100);
assert.equal(status.aggregate.compositionSupportedCoveragePct,0);
assert.equal(status.aggregate.r3CustomerPublishableCoveragePct,0);
assert.equal(status.aggregate.r3CustomerCutoverAllowed,false);
assert.equal(status.nextWork,'HD-PRO-R3-W8 Channel Professional Meaning Corpus');

console.log('✓ HD-PRO-R3-W7 Center Professional Meaning Corpus passed.');
console.log('  9/9 Centers × DEFINED/UNDEFINED/OPEN = 27/27 state-specific semantic owners; 216 bounded claims admitted while Channel/Gate composition, machine verification, R3 human acceptance and customer publication remain gated.');
