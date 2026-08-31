import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';
const readJson=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const source=readJson(`${ROOT}/source/HD-PRO-R3-W2A-user-authored-source-units-v1.json`);
const candidates=readJson(`${ROOT}/claims/hd-pro-r3-semantic-claim-candidates-v1.json`);
const resolution=readJson(`${ROOT}/source/HD-PRO-R3-W10-definition-source-resolution-v1.json`);
const corpus=readJson(`${ROOT}/semantics/HD-PRO-R3-W10-definition-integration-corpus-v1.json`);
const admission=readJson(`${ROOT}/semantics/HD-PRO-R3-W10-definition-semantic-admission-v1.json`);
const status=readJson(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v7.json`);
const historicalStatus=readJson(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v6.json`);

const EXPECTED={SINGLE:1,SPLIT:2,TRIPLE_SPLIT:3,QUAD_SPLIT:4,NO_DEFINITION:0};
const direct=source.sourceUnits.filter(x=>x.category==='DEFINITION');
assert.equal(direct.length,4);
assert.equal(resolution.historicalW2ASourceRewritten,false);
assert.equal(resolution.historicalW2CReconciliationRewritten,false);
assert.equal(resolution.coverage.canonicalDefinitions,5);
assert.equal(resolution.coverage.w2aDirectUserSource,4);
assert.equal(resolution.coverage.w10SupplementalUserAuthoredEnglishSource,1);
assert.equal(resolution.coverage.sourceResolved,5);
assert.equal(resolution.coverage.unresolved,0);
assert.equal(resolution.definitions.length,5);
assert.deepEqual(new Set(resolution.definitions.map(x=>x.definition)),new Set(Object.keys(EXPECTED)));
for(const d of resolution.definitions) assert.equal(d.expectedDefinedClusterCount,EXPECTED[d.definition]);

const sup=resolution.supplementalSourceUnit;
assert.equal(sup.canonicalKey,'NO_DEFINITION');
assert.equal(sup.source.sourceClass,undefined);
assert.equal(sup.source.provenanceClass,'USER_AUTHORED_PRIMARY_SUPPLEMENTAL_W10');
assert.equal(sup.source.driveFileId,'1E59JGEY_GpFSEDeNeqqI1ik8LieSIiEk');
assert.equal(sup.source.fileSha256,'307487a1501f021596a57cd5c162e3a405e46505c654f504c164de01716313d2');
assert.equal(sup.source.sheet,'几分人');
assert.deepEqual(sup.source.coordinates,['B5','B7']);
assert.equal(sup.sourceAdmissionStatus,'SOURCE_ADMITTED');
assert.equal(sup.semanticAdmissionStatus,'SEMANTIC_REVIEW_PENDING');
assert.equal(sup.publicationDisposition,'BOUNDARY_REWRITE_REQUIRED');
assert.equal(sha(sup.sourceText.en),sup.sourceTextSha256,'No Definition supplemental source digest drift');

for(const d of resolution.definitions.filter(x=>x.definition!=='NO_DEFINITION')){
  const su=direct.find(x=>x.canonicalKey===d.definition);
  assert(su,`${d.definition} direct W2A source missing`);
  assert.equal(d.sourceUnitId,su.sourceUnitId);
  assert.equal(d.sourceTextSha256,su.sourceTextSha256);
  assert.equal(d.candidateClaimId,candidates.claims.find(x=>x.sourceRefs?.includes(su.sourceUnitId))?.claimId);
  assert.equal(d.sourceAdmissionStatus,'SOURCE_ADMITTED');
}

assert.equal(corpus.semanticAdmission.canonicalDefinitionCount,5);
assert.equal(corpus.semanticAdmission.sourceResolvedDefinitions,5);
assert.equal(corpus.semanticAdmission.semanticAdmittedDefinitions,5);
assert.equal(corpus.semanticAdmission.semanticLayerClaims,30);
assert.equal(corpus.semanticAdmission.topologyCompositionSupportedDefinitions,5);
assert.equal(corpus.semanticAdmission.crossCategoryCompositionSupportedDefinitions,0);
assert.equal(corpus.semanticAdmission.machineVerifiedDefinitions,0);
assert.equal(corpus.semanticAdmission.humanAcceptedDefinitions,0);
assert.equal(corpus.semanticAdmission.customerPublishableR3Definitions,0);
assert.equal(corpus.integrationBoundary.bridgeMayChangeExperience,true);
assert.equal(corpus.integrationBoundary.bridgeImpliesDependency,false);
assert.equal(corpus.integrationBoundary.bridgeImpliesDestinedRelationship,false);
assert.equal(corpus.integrationBoundary.definitionMayOverrideAuthority,false);
assert.equal(corpus.integrationBoundary.definitionMayBePsychologicalDiagnosis,false);
assert.equal(corpus.meaningUnits.length,5);
assert.equal(corpus.semanticClaims.length,30);
assert.equal(new Set(corpus.semanticClaims.map(x=>x.claimId)).size,30);

for(const m of corpus.meaningUnits){
  assert.equal(m.expectedDefinedClusterCount,EXPECTED[m.definition]);
  assert.equal(m.semanticOwnerId,'human_design.definition');
  assert.equal(m.semanticAdmissionStatus,'SEMANTIC_ADMITTED');
  assert.equal(m.topologyCompositionSupported,true);
  assert.equal(m.crossCategoryCompositionSupported,false);
  assert.equal(m.machineVerified,false);
  assert.equal(m.humanAccepted,false);
  assert.equal(m.customerPublishableR3,false);
  for(const field of ['structuralTopology','stableClusters','integrationExperience','interactionBridge','structuralVsPsychologicalBoundary','realityObservation','authorityBoundary']){
    assert(m[field]?.zhHans?.length>=25,`${m.definition} ${field} zh too shallow`);
    assert(m[field]?.en?.length>=45,`${m.definition} ${field} en too shallow`);
  }
  assert.match(m.structuralVsPsychologicalBoundary.en,/not a psychological diagnosis/i);
  assert.match(m.authorityBoundary.en,/cannot replace Strategy or Authority/i);
  assert.match(m.customerBoundary.en,/does not establish defect, dependency, destined relationship/i);
  if(['SPLIT','TRIPLE_SPLIT','QUAD_SPLIT'].includes(m.definition)){
    assert.match(m.interactionBridge.en,/not proof of .*dependency|does not imply .*complete|does not require .*complete/i);
  }
  const text=[m.label.zhHans,m.label.en,m.structuralTopology.zhHans,m.structuralTopology.en,m.stableClusters.zhHans,m.stableClusters.en,m.integrationExperience.zhHans,m.integrationExperience.en,m.interactionBridge.zhHans,m.interactionBridge.en,m.structuralVsPsychologicalBoundary.zhHans,m.structuralVsPsychologicalBoundary.en,m.realityObservation.zhHans,m.realityObservation.en,m.authorityBoundary.zhHans,m.authorityBoundary.en,m.customerBoundary.zhHans,m.customerBoundary.en].join('\n');
  assert.equal(/\bW10\b|SHADOW_CANDIDATE|SEMANTIC_ADMITTED|sourceUnitId|sourceTextSha256/i.test(text),false,`${m.definition} leaks engineering vocabulary`);
  assert.equal(/你需要某种人才能完整|你需要别人才能完整|一定需要伴侣|灵魂伴侣|someone completes me|you need someone to complete you|must find someone who connects|ideal partner|your destined (?:partner|relationship)/i.test(text),false,`${m.definition} carries positive dependency/destiny language`);
}

for(const c of corpus.semanticClaims){
  assert.equal(c.methodId,'HUMAN_DESIGN_EXTERNAL');
  assert(c.subjectRefs?.[0]?.startsWith('DEFINITION.'));
  assert.equal(c.semanticOwnerId,'human_design.definition');
  assert.equal(c.admissionStatus,'SOURCE_ADMITTED');
  assert.equal(c.semanticAdmissionStatus,'SEMANTIC_ADMITTED');
  assert(c.customerMeaning?.zhHans && c.customerMeaning?.en);
  assert.equal(c.compositionRuleId,null);
  assert.equal(c.compositionSupported,false,'cross-category Claim IR composition remains for W12');
  assert.equal(c.machineVerified,false);
  assert.equal(c.humanAccepted,false);
  assert.equal(c.customerPublishable,false);
}

assert.equal(admission.status,'DEFINITION_5_OF_5_SEMANTIC_ADMITTED_TOPOLOGY_COMPOSED_CROSS_CATEGORY_PENDING');
assert.equal(admission.coverage.sourceResolved,5);
assert.equal(admission.coverage.semanticAdmitted,5);
assert.equal(admission.coverage.semanticCoveragePct,100);
assert.equal(admission.coverage.semanticLayerClaims,30);
assert.equal(admission.coverage.topologyCompositionSupported,5);
assert.equal(admission.coverage.crossCategoryCompositionSupported,0);
assert.equal(admission.coverage.machineVerified,0);
assert.equal(admission.coverage.humanAccepted,0);
assert.equal(admission.coverage.r3CustomerPublishable,0);
assert.equal(admission.boundaryResolution.splitBridgingDependencyLanguageForbidden,true);
assert.equal(admission.boundaryResolution.destinedRelationshipLanguageForbidden,true);
assert.equal(admission.boundaryResolution.psychologicalDiagnosisForbidden,true);
assert.equal(admission.boundaryResolution.authorityOwnershipPreserved,true);

const byCategory=Object.fromEntries(status.categories.map(x=>[x.category,x]));
assert.equal(status.schemaVersion,'PHI-OS-HD-PRO-R3-SEMANTIC-PRODUCTION-STATUS-v7.0.0');
assert.equal(status.baselineCommit,'8d66f4c885175d6cc16c8d031b3ec96b59635a81');
assert.equal(status.updatedByWork,'HD-PRO-R3-W10');
assert.equal(status.successorOf,`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v6.json`);
assert.equal(status.historicalStatusRewritten,false);
assert.equal(historicalStatus.updatedByWork,'HD-PRO-R3-W9');
assert.equal(historicalStatus.categories.find(x=>x.category==='DEFINITION').semanticAdmitted,0);
assert.equal(byCategory.CHANNEL.semanticAdmitted,36);
assert.equal(byCategory.GATE.semanticAdmitted,64);
assert.equal(byCategory.DEFINITION.expected,5);
assert.equal(byCategory.DEFINITION.sourceAdmitted,5);
assert.equal(byCategory.DEFINITION.semanticAdmitted,5);
assert.equal(byCategory.DEFINITION.semanticLayerClaims,30);
assert.equal(byCategory.DEFINITION.topologyCompositionSupported,5);
assert.equal(byCategory.DEFINITION.compositionSupported,0);
assert.equal(byCategory.VARIABLE_PHS.semanticAdmitted,0);
assert.equal(status.aggregate.definitionSemanticCoveragePct,100);
assert.equal(status.aggregate.definitionTopologyCompositionCoveragePct,100);
assert.equal(status.aggregate.crossCategoryCompositionSupportedCoveragePct,0);
assert.equal(status.aggregate.compositionSupportedCoveragePct,0);
assert.equal(status.aggregate.r3CustomerCutoverAllowed,false);
assert.equal(status.nextWork,'HD-PRO-R3-W11 Variable / PHS Professional Layer');

console.log('✓ HD-PRO-R3-W10 Definition & Integration Composition passed.');
console.log('  Single/Split/Triple Split/Quad Split/No Definition are 5/5 source-resolved and semantic-admitted; topology integration is supported while dependency language, psychological inference, cross-category composition, R3 human acceptance and publication remain gated.');
