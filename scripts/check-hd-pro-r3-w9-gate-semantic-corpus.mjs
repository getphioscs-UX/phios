import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';
const readJson=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
const source=readJson(`${ROOT}/source/HD-PRO-R3-W2A-user-authored-source-units-v1.json`);
const channelResolution=readJson(`${ROOT}/source/HD-PRO-R3-W8-channel-source-structural-resolution-v1.json`);
const resolution=readJson(`${ROOT}/source/HD-PRO-R3-W9-gate-source-resolution-v1.json`);
const corpus=readJson(`${ROOT}/semantics/HD-PRO-R3-W9-gate-professional-meaning-corpus-v1.json`);
const admission=readJson(`${ROOT}/semantics/HD-PRO-R3-W9-gate-semantic-admission-v1.json`);
const status=readJson(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v6.json`);
const historicalStatus=readJson(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v5.json`);

const relationUnits=source.sourceUnits.filter(x=>x.category==='GATE_CHANNEL_RELATION');
assert.equal(relationUnits.length,72);
assert.equal(resolution.coverage.gateChannelRelationSourceUnits,72);
assert.equal(resolution.coverage.uniqueGateIdentities,64);
assert.equal(resolution.coverage.gatesWithAtLeastOneNonEmptyPrimarySource,64);
assert.equal(resolution.coverage.multiChannelGates,4);
assert.equal(resolution.coverage.unresolved,0);
assert.equal(resolution.resolutionPolicy.relationRowsAreNotDuplicateGateIdentities,true);
assert.equal(resolution.resolutionPolicy.gateIdentityOwnsAtomicMeaning,true);
assert.equal(resolution.resolutionPolicy.channelRelationRetainedAsContext,true);
assert.equal(resolution.resolutionPolicy.personalityAndDesignDistinctMeaningRequiresExplicitSource,true);
assert.equal(resolution.gates.length,64);
assert.deepEqual(resolution.gates.map(x=>x.gate).sort((a,b)=>a-b),Array.from({length:64},(_,i)=>i+1));

const gateEndpointCenters=new Map();
for(const ep of channelResolution.channelEndpoints){
  for(const [gate,center,harmonic] of [[ep.gateA,ep.centerA,ep.gateB],[ep.gateB,ep.centerB,ep.gateA]]){
    const prev=gateEndpointCenters.get(gate);
    if(prev) assert.equal(prev.center,center,`Gate ${gate} assigned to inconsistent Centers across Channels`);
    gateEndpointCenters.set(gate,{center,harmonics:new Set([...(prev?.harmonics||[]),harmonic])});
  }
}
assert.equal(gateEndpointCenters.size,64);

for(const g of resolution.gates){
  assert.equal(g.center,gateEndpointCenters.get(g.gate).center,`Gate ${g.gate} center drift`);
  assert.deepEqual([...g.harmonicGates].sort((a,b)=>a-b),[...gateEndpointCenters.get(g.gate).harmonics].sort((a,b)=>a-b),`Gate ${g.gate} harmonic drift`);
  assert.equal(g.relationSourceUnitIds.length,g.relationCount);
  for(const ref of g.relationSourceUnitIds) assert(relationUnits.some(x=>x.sourceUnitId===ref),`${g.gate} relation source missing ${ref}`);
  assert.equal(g.personalitySpecificSourceDistinct,false);
  assert.equal(g.designSpecificSourceDistinct,false);
}
for(const gate of [10,20,34,57]) assert.equal(resolution.gates.find(x=>x.gate===gate).relationCount,3,`Gate ${gate} should reconcile 3 Channel relations`);
for(const g of resolution.gates.filter(x=>![10,20,34,57].includes(x.gate))) assert.equal(g.relationCount,1,`Gate ${g.gate} should have one relation`);

assert.equal(corpus.semanticAdmission.canonicalGateCount,64);
assert.equal(corpus.semanticAdmission.sourceRelationUnits,72);
assert.equal(corpus.semanticAdmission.semanticAdmittedGates,64);
assert.equal(corpus.semanticAdmission.atomicSemanticClaims,256);
assert.equal(corpus.semanticAdmission.personalitySpecificDistinctClaims,0);
assert.equal(corpus.semanticAdmission.designSpecificDistinctClaims,0);
assert.equal(corpus.semanticAdmission.compositionSupportedGates,0);
assert.equal(corpus.semanticAdmission.machineVerifiedGates,0);
assert.equal(corpus.semanticAdmission.humanAcceptedGates,0);
assert.equal(corpus.semanticAdmission.customerPublishableR3Gates,0);
assert.equal(corpus.customerIaPolicy.gateIsSemanticEvidenceNotDefaultIa,true);
assert.equal(corpus.customerIaPolicy.defaultWholeReadingGateCardsMax,0);
assert.equal(corpus.customerIaPolicy.priorityEngineMaySelectGateLater,true);
assert.equal(corpus.customerIaPolicy.detailViewMayListAllConfirmedGates,true);
assert.equal(corpus.meaningUnits.length,64);
assert.equal(corpus.semanticClaims.length,256);
assert.equal(new Set(corpus.meaningUnits.map(x=>x.gate)).size,64);
assert.equal(new Set(corpus.semanticClaims.map(x=>x.claimId)).size,256);

for(const m of corpus.meaningUnits){
  const r=resolution.gates.find(x=>x.gate===m.gate);
  assert(r,`Gate ${m.gate} resolution missing`);
  assert.equal(m.center,r.center);
  assert.deepEqual(m.harmonicGates,r.harmonicGates);
  assert.equal(m.harmonicGate,r.harmonicGates.length===1?r.harmonicGates[0]:null);
  assert.equal(m.sourceTrace.relationCount,r.relationCount);
  assert.deepEqual(m.sourceTrace.relationSourceUnitIds,r.relationSourceUnitIds);
  assert.equal(m.semanticOwnerId,'human_design.gate');
  assert.equal(m.semanticAdmissionStatus,'SEMANTIC_ADMITTED');
  assert.equal(m.personalityDesignDistinctSemanticAdmissionStatus,'SOURCE_PENDING');
  assert.equal(m.personalityExpression.status,'SOURCE_NOT_DISTINCT');
  assert.equal(m.designExpression.status,'SOURCE_NOT_DISTINCT');
  assert.equal(m.compositionSupported,false);
  assert.equal(m.machineVerified,false);
  assert.equal(m.humanAccepted,false);
  assert.equal(m.customerPublishableR3,false);
  assert.equal(m.customerIaPolicy.defaultWholeReadingCard,false);
  assert.equal(m.customerIaPolicy.detailViewExpandable,true);
  assert.equal(m.customerIaPolicy.priorityGateEligible,true);
  assert.equal(m.customerIaPolicy.channelPrimaryWhenComplete,true);
  assert(m.identity?.zhHans?.length>=4,`Gate ${m.gate} identity zh missing`);
  assert(m.identity?.en?.length>=8,`Gate ${m.gate} identity en missing`);
  for(const field of ['coreSemanticField','personalityExpression','designExpression','hangingGateExpression','fullChannelRelationship','realityObservation']){
    assert(m[field]?.zhHans?.length>=25,`Gate ${m.gate} ${field} zh too shallow`);
    assert(m[field]?.en?.length>=45,`Gate ${m.gate} ${field} en too shallow`);
  }
  assert.match(m.hangingGateExpression.en,/no unconfirmed full-Channel meaning may be inferred/i);
  assert.match(m.fullChannelRelationship.en,/complete Channel becomes the primary semantic owner/i);
  const text=[m.identity.zhHans,m.identity.en,m.coreSemanticField.zhHans,m.coreSemanticField.en,m.personalityExpression.zhHans,m.personalityExpression.en,m.designExpression.zhHans,m.designExpression.en,m.hangingGateExpression.zhHans,m.hangingGateExpression.en,m.fullChannelRelationship.zhHans,m.fullChannelRelationship.en,m.realityObservation.zhHans,m.realityObservation.en,m.customerBoundary.zhHans,m.customerBoundary.en].join('\n');
  assert.equal(/\bW9\b|SHADOW_CANDIDATE|SEMANTIC_ADMITTED|sourceUnitId|sourceTextSha256/i.test(text),false,`Gate ${m.gate} leaks engineering vocabulary`);
  assert.equal(/灵魂伴侣|注定(?:发财|成功|恋爱|结婚)|保证(?:发财|成功)|一定会(?:发财|成功)/i.test(text),false,`Gate ${m.gate} carries deterministic claim`);
}

for(const c of corpus.semanticClaims){
  assert.equal(c.methodId,'HUMAN_DESIGN_EXTERNAL');
  assert(c.subjectRefs?.[0]?.startsWith('GATE.'));
  assert.equal(c.semanticOwnerId,'human_design.gate');
  assert.equal(c.admissionStatus,'SOURCE_ADMITTED');
  assert.equal(c.semanticAdmissionStatus,'SEMANTIC_ADMITTED');
  assert.equal(c.compositionRuleId,null);
  assert.equal(c.compositionSupported,false);
  assert.equal(c.machineVerified,false);
  assert.equal(c.humanAccepted,false);
  assert.equal(c.customerPublishable,false);
  assert(c.customerMeaning?.zhHans && c.customerMeaning?.en);
  assert.notEqual(c.claimType,'PERSONALITY_SPECIFIC_GATE');
  assert.notEqual(c.claimType,'DESIGN_SPECIFIC_GATE');
}

assert.equal(admission.status,'GATE_64_OF_64_ATOMIC_SEMANTIC_ADMITTED_LAYER_SPECIFIC_SOURCE_PENDING');
assert.equal(admission.coverage.gateIdentities,64);
assert.equal(admission.coverage.semanticAdmitted,64);
assert.equal(admission.coverage.atomicSemanticClaims,256);
assert.equal(admission.coverage.personalitySpecificDistinctClaims,0);
assert.equal(admission.coverage.designSpecificDistinctClaims,0);
assert.equal(admission.coverage.compositionSupported,0);
assert.equal(admission.coverage.humanAccepted,0);
assert.equal(admission.coverage.r3CustomerPublishable,0);
assert.equal(admission.ownershipResolution.completeChannelPrimary,true);
assert.equal(admission.ownershipResolution.gateSupportingEvidence,true);
assert.equal(admission.ownershipResolution.gateDefaultCustomerIa,false);
assert.equal(admission.ownershipResolution.personalityDesignGenericFillerForbidden,true);

const byCategory=Object.fromEntries(status.categories.map(x=>[x.category,x]));
assert.equal(status.schemaVersion,'PHI-OS-HD-PRO-R3-SEMANTIC-PRODUCTION-STATUS-v6.0.0');
assert.equal(status.baselineCommit,'8d66f4c885175d6cc16c8d031b3ec96b59635a81');
assert.equal(status.updatedByWork,'HD-PRO-R3-W9');
assert.equal(status.successorOf,`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v5.json`);
assert.equal(status.historicalStatusRewritten,false);
assert.equal(historicalStatus.updatedByWork,'HD-PRO-R3-W8');
assert.equal(historicalStatus.categories.find(x=>x.category==='GATE').semanticAdmitted,0);
assert.equal(byCategory.CHANNEL.semanticAdmitted,36);
assert.equal(byCategory.GATE.expected,64);
assert.equal(byCategory.GATE.semanticAdmitted,64);
assert.equal(byCategory.GATE.semanticLayerClaims,256);
assert.equal(byCategory.GATE.personalityDesignDistinctSourceCoverage,0);
assert.equal(byCategory.GATE.customerIa,'SUPPORTING_EVIDENCE');
assert.equal(byCategory.DEFINITION.semanticAdmitted,0);
assert.equal(byCategory.VARIABLE_PHS.semanticAdmitted,0);
assert.equal(status.aggregate.gateSemanticCoveragePct,100);
assert.equal(status.aggregate.gatePersonalityDesignDistinctCoveragePct,0);
assert.equal(status.aggregate.compositionSupportedCoveragePct,0);
assert.equal(status.aggregate.r3CustomerCutoverAllowed,false);
assert.equal(status.nextWork,'HD-PRO-R3-W10 Definition & Integration Composition');

console.log('✓ HD-PRO-R3-W9 Gate Professional Meaning Corpus passed.');
console.log('  72 source relation rows reconcile to 64/64 atomic Gate owners with 256 claims; Gate detail remains supporting evidence, complete Channel stays primary, and distinct Personality/Design Gate semantics remain SOURCE_PENDING rather than filled generically.');
