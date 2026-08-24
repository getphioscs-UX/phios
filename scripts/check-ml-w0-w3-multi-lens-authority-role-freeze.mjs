import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const BASELINE = '6f2b4c6791c552c065ac699b12e08ebe4aa1e7fe';
const P='content/governance/multi-lens';
const audit=read(`${P}/audits/multi-lens-authority-reconciliation-v1.json`);
const lenses=read(`${P}/registries/canonical-lens-registry-v1.json`);
const roles=read(`${P}/contracts/primary-supporting-lens-contract-v1.json`);
const voting=read(`${P}/contracts/no-method-voting-contract-v1.json`);
const stateContract=read(`${P}/contracts/lens-capability-state-contract-v1.json`);
const states=read(`${P}/registries/multi-lens-capability-state-registry-v1.json`);
const acceptance=read(`${P}/acceptance/ml-w0-w3-multi-lens-authority-acceptance-v1.json`);
const freeze=read(`${P}/freeze/multi-lens-authority-role-freeze-v1.json`);
const pcm=read('content/governance/production-capability-matrix/registries/production-capability-registry-v6.json');
const hdrFreeze=read('content/professional/core-method-runtime/hdr-production-freeze-v1.json');

for (const x of [audit,lenses,roles,voting,stateContract,states,acceptance,freeze]) assert.equal(x.baselineCommit,BASELINE);

// ML-W0: exactly five orthogonal method roles; Reality remains above them.
const expected={AST:'FUNCTION',BZR:'TIME',ZWR:'DOMAIN',HDR:'OPERATION',NUM:'RHYTHM'};
assert.equal(lenses.lenses.length,5);
assert.equal(new Set(lenses.lenses.map(x=>x.pluginCode)).size,5);
assert.equal(new Set(lenses.lenses.map(x=>x.lensCode)).size,5);
for(const [plugin,lens] of Object.entries(expected)) assert.equal(lenses.lenses.find(x=>x.pluginCode===plugin)?.lensCode,lens);
assert.equal(lenses.realityAuthority.role,'FINAL_REALITY_AUTHORITY');
assert.equal(lenses.realityAuthority.methodLensMayOverrideRealityEvidence,false);
assert.equal(lenses.globalRules.roleDoesNotActivateDeferredRuntime,true);
for(const x of lenses.lenses) assert.equal(x.futureCapabilityNotActivatedByThisRegistry,true);

// Historical authorities are immutable evidence, not rewritten inputs.
for(const x of audit.predecessorAuthorities){
  assert.equal(x.mutatedByMaster1,false);
  assert.ok(fs.existsSync(x.path),`missing predecessor ${x.path}`);
  assert.equal(sha(x.path),x.sha256,`predecessor drift ${x.path}`);
}

// ML-W1: composition roles are not truth ranks and routing remains deferred.
assert.deepEqual(roles.roleEnum,['PRIMARY','SUPPORTING','CONTEXTUAL','NOT_APPLICABLE']);
assert.equal(roles.rules.primaryIsTruthAuthority,false);
assert.equal(roles.rules.supportingIsValidationVote,false);
assert.equal(roles.rules.roleAssignmentMayCreateMissingCapability,false);
assert.equal(roles.rules.roleAssignmentMaySubstituteNatalForDeferredDynamicRuntime,false);
assert.equal(roles.rules.questionRoutingActivatedByThisContract,false);
assert.equal(roles.rules.realityEvidenceRemainsFinalAuthority,true);

// ML-W2: no voting, no winner and no silent reconciliation.
for(const k of ['noMethodVoting','noMajorityTruth','noWeightedTruthScore','noConvergenceAsProof','noAutomaticConflictResolution','noCrossMethodCanonicalMeaningCreation','noMethodResultMutationOfAnotherMethod','divergenceMustRemainVisible','unknownsMustRemainVisible','sourceAttributionRequired','realityEvidenceRemainsFinalAuthority']) assert.equal(voting.invariants[k],true,`voting invariant ${k}`);
assert.equal(voting.allowedComposition.observedAlignmentMayBecomeTruthConfidence,false);
assert.equal(voting.allowedComposition.crossLensRecommendationMayBeCreatedByThisContract,false);
assert.equal(voting.allowedComposition.runtimeCompositionActivationGranted,false);
assert.equal(voting.predecessorBoundary.fmaContractAutomaticallyExtendedToZiWeiOrHdr,false);

// ML-W3: capability status is explicitly three-dimensional.
assert.deepEqual(stateContract.dimensions.internalCapabilityAvailability.enum,['AVAILABLE','LIMITED','BLOCKED','COMING_LATER']);
assert.deepEqual(stateContract.dimensions.publicCapabilityAvailability.enum,['AVAILABLE','LIMITED','PREVIEW','RESTRICTED_INTERNAL','BLOCKED','COMING_LATER']);
assert.deepEqual(stateContract.dimensions.executionCompleteness.enum,['COMPLETE','PARTIAL','INPUT_REQUIRED','FAILED','UNAVAILABLE']);
assert.equal(stateContract.rules.internalAvailabilityImpliesPublicAvailability,false);
assert.equal(stateContract.rules.publicAvailabilityImpliesCompleteExecution,false);
assert.equal(stateContract.rules.capabilityAvailabilityNotEqualExecutionCompleteness,true);

assert.equal(states.records.length,5);
for(const [plugin,lens] of Object.entries(expected)) assert.equal(states.records.find(x=>x.pluginCode===plugin)?.lensCode,lens);
for(const plugin of ['AST','BZR','ZWR','NUM']){
  const r=states.records.find(x=>x.pluginCode===plugin);
  assert.equal(r.internalCapabilityAvailability,'AVAILABLE');
  assert.equal(r.publicCapabilityAvailability,'AVAILABLE');
  assert.equal(r.publicExecutionAllowed,true);
  assert.equal(r.executionCompleteness,'PER_EXECUTION');
}
const hdr=states.records.find(x=>x.pluginCode==='HDR');
assert.equal(hdr.internalCapabilityAvailability,'AVAILABLE');
assert.equal(hdr.publicCapabilityAvailability,'RESTRICTED_INTERNAL');
assert.equal(hdr.publicExecutionAllowed,false);
assert.equal(hdr.internalAccessClass,'GOVERNED_INTERNAL_VALIDATION');
assert.equal(hdr.pcmPublicProductionState,'BLOCKED');
assert.equal(hdr.publicTrademarkUseAllowed,false);
assert.equal(hdr.publicSelfServiceAllowed,false);
assert.equal(hdr.manualProfessionalExtensions.PHS,'MANUAL_INPUT_ONLY');
assert.equal(hdr.manualProfessionalExtensions.DREAM_RAVE,'MANUAL_INPUT_ONLY');
assert.equal(hdr.automaticProfessionalExtensionCalculationAllowed,false);
assert.equal(stateContract.hdrSpecificBoundary.phsAutomaticCalculationAllowed,false);
assert.equal(stateContract.hdrSpecificBoundary.dreamRaveAutomaticCalculationAllowed,false);
assert.equal(stateContract.hdrSpecificBoundary.existingCalculationReimplementationRequired,false);

// Current public PCM authority remains intact: four public methods Available, HDR still Blocked.
const pcmState = Object.fromEntries(pcm.capabilities.map(c=>[c.methodRuntime.pluginCode,c.capabilityAvailability]));
assert.equal(pcmState.AST,'AVAILABLE');
assert.equal(pcmState.BZR,'AVAILABLE');
assert.equal(pcmState.NUM,'AVAILABLE');
assert.equal(pcmState.ZWR,'AVAILABLE');
assert.equal(pcmState.HDR,'BLOCKED');
assert.equal(hdrFreeze.productionStatus,'blocked');
assert.equal(hdrFreeze.executionMode,'validation_only');
assert.equal(hdrFreeze.productionGates.productionExecutionAllowed,false);

// Acceptance + freeze and immutable artifact digests.
assert.equal(acceptance.status,'ACCEPTED_AUTHORITY_ROLE_FREEZE');
assert.equal(acceptance.hdrDecision.publicPcmPromoted,false);
assert.equal(acceptance.hdrDecision.historicalHdrProductionFreezeMutated,false);
assert.equal(freeze.status,'FROZEN_MASTER_1_MULTI_LENS_AUTHORITY');
assert.deepEqual(freeze.frozenRoles,expected);
for(const a of freeze.immutableArtifacts){
  assert.ok(fs.existsSync(a.path),`missing frozen artifact ${a.path}`);
  assert.equal(sha(a.path),a.sha256,`frozen artifact drift ${a.path}`);
}

console.log('✓ ML-W0–W3 Multi-Lens authority / role freeze passed.');
console.log('  AST=FUNCTION, BZR=TIME, ZWR=DOMAIN, HDR=OPERATION, NUM=RHYTHM; Reality Evidence remains final authority.');
console.log('  Primary/supporting/contextual are composition roles, not truth ranks; method voting and automatic conflict resolution are forbidden.');
console.log('  HDR is internally available only under governed validation access while public PCM remains Blocked / RESTRICTED_INTERNAL; PHS and DreamRave remain manual-only professional extensions.');
