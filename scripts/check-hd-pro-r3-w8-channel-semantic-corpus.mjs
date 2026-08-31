import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';
const readJson=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
const source=readJson(`${ROOT}/source/HD-PRO-R3-W2A-user-authored-source-units-v1.json`);
const candidates=readJson(`${ROOT}/claims/hd-pro-r3-semantic-claim-candidates-v1.json`);
const resolution=readJson(`${ROOT}/source/HD-PRO-R3-W8-channel-source-structural-resolution-v1.json`);
const corpus=readJson(`${ROOT}/semantics/HD-PRO-R3-W8-channel-professional-meaning-corpus-v1.json`);
const admission=readJson(`${ROOT}/semantics/HD-PRO-R3-W8-channel-semantic-admission-v1.json`);
const status=readJson(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v5.json`);
const historicalStatus=readJson(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v4.json`);

const REQUIRED=['channelId','gateA','gateB','centerA','centerB','structuralTheme','functionalExpression','relationshipExpression','realityExpression','priorityWeight','sourceRefs'];
const CENTERS=new Set(['HEAD','AJNA','THROAT','G','EGO','SPLEEN','SOLAR_PLEXUS','SACRAL','ROOT']);
const sourceUnits=source.sourceUnits.filter(x=>x.category==='CHANNEL');
const sourceByKey=new Map(sourceUnits.map(x=>[x.canonicalKey.replace('_','-'),x]));
const candidateBySource=new Map(candidates.claims.filter(x=>x.sourceRefs?.[0]?.startsWith('HD-UA-CHANNEL-')).map(x=>[x.sourceRefs[0],x]));

assert.equal(sourceUnits.length,36,'W2A must preserve 36 channel source units');
assert.equal(resolution.coverage.canonicalChannels,36);
assert.equal(resolution.coverage.sourceAdmittedChannels,36);
assert.equal(resolution.coverage.endpointResolvedChannels,36);
assert.equal(resolution.coverage.uniqueGateIdentities,64);
assert.equal(resolution.coverage.unresolved,0);
assert.equal(resolution.authority.historicalW2BRewritten,false);
assert.equal(resolution.ownership.completeChannelPrimaryWhenConfirmed,true);
assert.equal(resolution.ownership.componentGatesSupportingOnly,true);
assert.equal(resolution.ownership.genericCentersStructuralContextOnly,true);
assert.equal(resolution.ownership.parallelChannelGateCenterOutputAllowed,false);
assert.equal(resolution.channelEndpoints.length,36);
assert.equal(new Set(resolution.channelEndpoints.map(x=>x.channelId)).size,36);
assert.equal(new Set(resolution.channelEndpoints.flatMap(x=>[x.gateA,x.gateB])).size,64);

const endpointById=new Map(resolution.channelEndpoints.map(x=>[x.channelId,x]));
for(const ep of resolution.channelEndpoints){
  assert(Number.isInteger(ep.gateA)&&ep.gateA>=1&&ep.gateA<=64);
  assert(Number.isInteger(ep.gateB)&&ep.gateB>=1&&ep.gateB<=64);
  assert.notEqual(ep.gateA,ep.gateB);
  assert(CENTERS.has(ep.centerA));
  assert(CENTERS.has(ep.centerB));
  assert.notEqual(ep.centerA,ep.centerB);
  const su=sourceByKey.get(ep.channelId);
  assert(su,`${ep.channelId} missing W2A source`);
  assert.equal(ep.sourceUnitId,su.sourceUnitId);
  assert.equal(ep.sourceTextSha256,su.sourceTextSha256);
  assert.equal(ep.candidateClaimId,candidateBySource.get(su.sourceUnitId)?.claimId,`${ep.channelId} missing W3 lineage`);
  assert.equal(ep.userAuthoredEnglishStructuralWitness.driveFileId,'1E59JGEY_GpFSEDeNeqqI1ik8LieSIiEk');
  assert.equal(ep.userAuthoredEnglishStructuralWitness.fileSha256,'307487a1501f021596a57cd5c162e3a405e46505c654f504c164de01716313d2');
  assert.equal(ep.userAuthoredEnglishStructuralWitness.sheet,'通道');
  assert.equal(ep.userAuthoredEnglishStructuralWitness.contentScope,'CHANNEL_ENDPOINT_STRUCTURE_AND_ENGLISH_LABEL_ONLY');
}

assert.equal(corpus.semanticAdmission.canonicalChannelCount,36);
assert.equal(corpus.semanticAdmission.sourceAdmittedChannels,36);
assert.equal(corpus.semanticAdmission.semanticAdmittedChannels,36);
assert.equal(corpus.semanticAdmission.semanticLayerClaims,144);
assert.equal(corpus.semanticAdmission.compositionSupportedChannels,0);
assert.equal(corpus.semanticAdmission.machineVerifiedChannels,0);
assert.equal(corpus.semanticAdmission.humanAcceptedChannels,0);
assert.equal(corpus.semanticAdmission.customerPublishableR3Channels,0);
assert.deepEqual(corpus.requiredFields,REQUIRED);
assert.equal(corpus.ownershipBoundary.completeChannelPrimary,true);
assert.equal(corpus.ownershipBoundary.componentGateParallelPrimaryOutputAllowed,false);
assert.equal(corpus.ownershipBoundary.genericCenterParallelPrimaryOutputAllowed,false);
assert.equal(corpus.ownershipBoundary.authorityStillOwnsFinalDecision,true);
assert.deepEqual(corpus.ownershipBoundary.precedence,['COMPLETE_CHANNEL','COMPONENT_GATE_SUPPORT','GENERIC_CENTER_CONTEXT']);
assert.equal(corpus.meaningUnits.length,36);
assert.equal(corpus.semanticClaims.length,144);
assert.equal(new Set(corpus.meaningUnits.map(x=>x.channelId)).size,36);
assert.equal(new Set(corpus.semanticClaims.map(x=>x.claimId)).size,144);

for(const m of corpus.meaningUnits){
  for(const f of REQUIRED) assert.notEqual(m[f],undefined,`${m.channelId} missing ${f}`);
  const ep=endpointById.get(m.channelId);
  assert(ep,`${m.channelId} endpoint missing`);
  assert.equal(m.gateA,ep.gateA);
  assert.equal(m.gateB,ep.gateB);
  assert.equal(m.centerA,ep.centerA);
  assert.equal(m.centerB,ep.centerB);
  assert.equal(m.sourceTrace.primarySourceUnitId,ep.sourceUnitId);
  assert.equal(m.sourceTrace.sourceTextSha256,ep.sourceTextSha256);
  assert.equal(m.sourceTrace.candidateClaimId,ep.candidateClaimId);
  assert.equal(m.sourceTrace.englishWorkbookSha256,ep.userAuthoredEnglishStructuralWitness.fileSha256);
  assert(m.sourceRefs.includes(ep.sourceUnitId));
  assert.equal(m.semanticOwnerId,'human_design.channel');
  assert.equal(m.semanticAdmissionStatus,'SEMANTIC_ADMITTED');
  assert.equal(m.compositionSupported,false);
  assert.equal(m.machineVerified,false);
  assert.equal(m.humanAccepted,false);
  assert.equal(m.customerPublishableR3,false);
  assert.equal(m.ownership.fullChannelPrimary,true);
  assert.equal(m.ownership.gateASupportingOnly,true);
  assert.equal(m.ownership.gateBSupportingOnly,true);
  assert.equal(m.ownership.centerAContextOnly,true);
  assert.equal(m.ownership.centerBContextOnly,true);
  assert.equal(m.priorityWeight.class,'PRIMARY_WHEN_COMPLETE_CHANNEL_CONFIRMED');
  assert.equal(m.priorityWeight.rationale.includes('Complete Channel > component Gate > generic Center'),true);
  for(const field of ['structuralTheme','functionalExpression','relationshipExpression','realityExpression']){
    assert(m[field]?.zhHans?.length>=25,`${m.channelId} ${field} zh too shallow`);
    assert(m[field]?.en?.length>=45,`${m.channelId} ${field} en too shallow`);
  }
  assert(m.realityCheckQuestions.length>=2,`${m.channelId} needs semantic-specific reality questions`);
  const customerText=[m.label.zhHans,m.label.en,m.structuralTheme.zhHans,m.structuralTheme.en,m.functionalExpression.zhHans,m.functionalExpression.en,m.relationshipExpression.zhHans,m.relationshipExpression.en,m.realityExpression.zhHans,m.realityExpression.en,...m.realityCheckQuestions.flatMap(q=>[q.zhHans,q.en]),m.customerBoundary.zhHans,m.customerBoundary.en].join('\n');
  assert.equal(/\bW8\b|SHADOW_CANDIDATE|SEMANTIC_ADMITTED|sourceUnitId|candidateClaimId/i.test(customerText),false,`${m.channelId} leaks engineering vocabulary`);
  assert.equal(/the the\b/i.test(customerText),false,`${m.channelId} duplicated English article`);
  assert.equal(/灵魂伴侣|注定(?:发财|成功|恋爱|结婚)|保证(?:发财|成功)|一定会(?:发财|成功)|medical diagnosis/i.test(customerText),false,`${m.channelId} carries deterministic/sensitive claim`);
}

for(const c of corpus.semanticClaims){
  assert.equal(c.methodId,'HUMAN_DESIGN_EXTERNAL');
  assert(c.subjectRefs?.[0]?.startsWith('CHANNEL.'));
  assert.equal(c.semanticOwnerId,'human_design.channel');
  assert.equal(c.admissionStatus,'SOURCE_ADMITTED');
  assert.equal(c.semanticAdmissionStatus,'SEMANTIC_ADMITTED');
  assert(c.customerMeaning?.zhHans && c.customerMeaning?.en);
  assert.equal(c.compositionRuleId,null);
  assert.equal(c.compositionSupported,false);
  assert.equal(c.machineVerified,false);
  assert.equal(c.humanAccepted,false);
  assert.equal(c.customerPublishable,false);
}

assert.equal(admission.status,'CHANNEL_36_OF_36_SEMANTIC_ADMITTED_PRIMARY_OWNER_COMPOSITION_PENDING');
assert.equal(admission.coverage.semanticAdmitted,36);
assert.equal(admission.coverage.semanticCoveragePct,100);
assert.equal(admission.coverage.semanticLayerClaims,144);
assert.equal(admission.coverage.compositionSupported,0);
assert.equal(admission.coverage.humanAccepted,0);
assert.equal(admission.coverage.r3CustomerPublishable,0);
assert.equal(admission.ownershipResolution.completeChannelPrimary,true);
assert.equal(admission.ownershipResolution.componentGatesSupportingOnly,true);
assert.equal(admission.ownershipResolution.genericCentersContextOnly,true);
assert.equal(admission.ownershipResolution.threeOwnersParallelOutputForbidden,true);
assert.equal(admission.publication.r2State,'CUSTOMER_PUBLISHED');
assert.equal(admission.publication.r3State,'SHADOW_CANDIDATE');
assert.equal(admission.publication.r2HumanReviewInherited,false);

const byCategory=Object.fromEntries(status.categories.map(x=>[x.category,x]));
assert.equal(status.schemaVersion,'PHI-OS-HD-PRO-R3-SEMANTIC-PRODUCTION-STATUS-v5.0.0');
assert.equal(status.baselineCommit,'8d66f4c885175d6cc16c8d031b3ec96b59635a81');
assert.equal(status.updatedByWork,'HD-PRO-R3-W8');
assert.equal(status.successorOf,`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v4.json`);
assert.equal(status.historicalStatusRewritten,false);
assert.equal(historicalStatus.updatedByWork,'HD-PRO-R3-W7');
assert.equal(historicalStatus.categories.find(x=>x.category==='CHANNEL').semanticAdmitted,0);
assert.equal(byCategory.CHANNEL.expected,36);
assert.equal(byCategory.CHANNEL.semanticAdmitted,36);
assert.equal(byCategory.CHANNEL.semanticLayerClaims,144);
assert.equal(byCategory.CHANNEL.ownership,'COMPLETE_CHANNEL_PRIMARY');
assert.equal(byCategory.GATE.semanticAdmitted,0);
assert.equal(byCategory.DEFINITION.semanticAdmitted,0);
assert.equal(byCategory.VARIABLE_PHS.semanticAdmitted,0);
assert.equal(status.aggregate.channelSemanticCoveragePct,100);
assert.equal(status.aggregate.compositionSupportedCoveragePct,0);
assert.equal(status.aggregate.r3CustomerCutoverAllowed,false);
assert.equal(status.nextWork,'HD-PRO-R3-W9 Gate Professional Meaning Corpus');

console.log('✓ HD-PRO-R3-W8 Channel Professional Meaning Corpus passed.');
console.log('  36/36 complete Channels are primary semantic owners with 144 bounded claims; component Gates remain supporting detail, generic Centers remain context, and R3 composition/publication remain gated.');
