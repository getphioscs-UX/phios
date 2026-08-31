import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {composeHumanDesignR3} from '../functions/external-profile/human-design-r3-composition-runtime.js';
import {HD_R3_DEDUP_PRECEDENCE,deduplicateHumanDesignR3Claims} from '../functions/external-profile/human-design-r3-semantic-dedup.js';

const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';
const readJson=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
const policy=readJson(`${ROOT}/dedup/HD-PRO-R3-W13-semantic-precedence-policy-v1.json`);
const fixture=readJson(`${ROOT}/dedup/HD-PRO-R3-W13-dedup-fixture-v1.json`);
const compositionFixture=readJson(`${ROOT}/composition/HD-PRO-R3-W12-composition-fixture-v1.json`);
const status=readJson(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v10.json`);
const historical=readJson(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v9.json`);

const expectedOrder=[
  ['CHART_LEVEL_COMPOSITION',800],
  ['AUTHORITY_COMPOSITION',700],
  ['PROFILE_COMPOSITION',600],
  ['CHANNEL_COMPOSITION',500],
  ['DEFINITION_COMPOSITION',400],
  ['CENTER_MEANING',300],
  ['GATE_DETAIL',200],
  ['ADVANCED_VARIABLE_MODIFIER',100]
];
assert.equal(policy.baselineCommit,'78ac0ae651133131d162e53c07cbccd793a55672');
assert.deepEqual(policy.precedence.map(x=>[x.precedenceClass,x.rank]),expectedOrder);
assert.deepEqual(HD_R3_DEDUP_PRECEDENCE.map(x=>[x.precedenceClass,x.rank]),expectedOrder);
assert.equal(policy.duplicateDetection.sameSemanticCluster,true);
assert.equal(policy.duplicateDetection.sameRealityImplication,true);
assert.equal(policy.duplicateDetection.sameEvidenceSet,true);
assert.equal(policy.duplicateDetection.semanticSimilarityEmbeddingRequired,false);
assert.equal(policy.supportPolicy.onePrimaryExplanationPerCluster,true);
assert.equal(policy.supportPolicy.supportingClaimsDeleted,false);
assert.equal(policy.supportPolicy.supportingEvidenceAvailableUnderWhy,true);
assert.equal(policy.supportPolicy.sourceRefsUnionRetainedOnPrimary,true);
assert.equal(policy.supportPolicy.contradictoryClaimsAutomaticallyDeduped,false);
assert.equal(policy.boundaries.advancedVariableMayOverrideCore,false);
assert.equal(policy.boundaries.gateMayOverrideCompleteChannel,false);
assert.equal(policy.boundaries.centerMayOverrideCompleteChannel,false);
assert.equal(policy.boundaries.lowerPrecedenceMaySuppressAuthorityComposition,false);
assert.equal(policy.boundaries.dedupCreatesNewSemanticClaim,false);
assert.equal(policy.boundaries.dedupCreatesNewChartFact,false);
assert.equal(policy.boundaries.r3CustomerPublishable,false);

const first=deduplicateHumanDesignR3Claims(fixture.claims);
const second=deduplicateHumanDesignR3Claims(JSON.parse(JSON.stringify(fixture.claims)));
assert.deepEqual(first,second,'W13 dedup must be deterministic');
assert.equal(first.dedupDigest,second.dedupDigest);
assert.equal(first.inputClaimCount,fixture.expected.inputClaims);
assert.equal(first.primaryClaimCount,fixture.expected.primaryClaims);
assert.equal(first.supportingClaimCount,fixture.expected.supportingClaims);
assert.equal(first.clusters.length,2);
assert.equal(first.boundaries.onePrimaryExplanationPerDedupCluster,true);
assert.equal(first.boundaries.supportingEvidenceRetained,true);
assert.equal(first.boundaries.sourceEvidenceDeleted,false);
assert.equal(first.boundaries.advancedVariableMayOverrideCore,false);
assert.equal(first.boundaries.authorityCompositionMayBeSuppressedByLowerPrecedence,false);
assert.equal(first.boundaries.r3CustomerPublishable,false);

const rush=first.clusters.find(x=>x.clusterId==='RUSHED_DECISION_PRESSURE');
assert(rush);
assert.equal(rush.primaryClaimId,fixture.expected.rushClusterPrimary);
assert.equal(rush.primaryPrecedenceClass,'AUTHORITY_COMPOSITION');
assert.equal(rush.primaryPrecedenceRank,700);
assert.equal(rush.memberClaimIds.length,4);
assert.equal(rush.supportingClaimIds.length,3);
assert(rush.supportingClaimIds.includes('FIX-VARIABLE-RUSH'));
for(const src of ['HD-UA-AUTHORITY-EMOTIONAL','HD-UA-PROFILE-5_1','HD-UA-TYPE-GENERATOR','HD-UA-CENTER-ROOT-UNDEFINED','HD-UA-ENVIRONMENT-2-左']) assert(rush.evidenceRefs.includes(src),`rush evidence lost: ${src}`);
const rushPrimary=first.primaryClaims.find(x=>x.claimId===fixture.expected.rushClusterPrimary);
assert.equal(rushPrimary.dedupRole,'PRIMARY_EXPLANATION');
assert.equal(rushPrimary.supportingEvidence.length,3);
assert.deepEqual(rushPrimary.evidenceRefs,rush.evidenceRefs);

const ch=first.clusters.find(x=>x.clusterId==='CHANNEL_43-23_EXPRESSION');
assert(ch);
assert.equal(ch.primaryClaimId,fixture.expected.channelClusterPrimary);
assert.equal(ch.primaryPrecedenceClass,'CHANNEL_COMPOSITION');
assert.equal(ch.primaryPrecedenceRank,500);
assert.equal(ch.memberClaimIds.length,3);
assert.equal(ch.supportingClaimIds.length,2);
assert(ch.supportingClaimIds.includes('FIX-GATE-43'));
assert(ch.supportingClaimIds.includes('FIX-CENTER-AJNA'));
for(const src of ['HD-UA-CHANNEL-43_23','HD-UA-GATE-43-REL-43_23-LEFT','HD-UA-GATE-23-REL-43_23-RIGHT','HD-UA-CENTER-AJNA-DEFINED']) assert(ch.evidenceRefs.includes(src),`channel evidence lost: ${src}`);

// Run W13 over the real W12 synthetic composition output too: duplicated channel cluster must collapse while evidence survives.
const composed=composeHumanDesignR3(compositionFixture.facts);
const composedDedup=deduplicateHumanDesignR3Claims(composed.claims);
assert(composedDedup.primaryClaimCount<composedDedup.inputClaimCount,'actual W12 fixture should contain at least one dedup cluster');
assert.equal(composedDedup.inputClaimCount,composed.claims.length);
assert.equal(composedDedup.primaryClaimCount+composedDedup.supportingClaimCount,composedDedup.inputClaimCount);
const c4323=composedDedup.clusters.find(x=>x.clusterId==='CHANNEL_43-23_PRIMARY');
assert(c4323,'W12 Channel 43-23 semantic cluster missing after W13');
assert(c4323.memberClaimIds.length>=2);
assert(c4323.supportingClaimIds.length>=1);
assert(c4323.evidenceRefs.includes('HD-UA-CHANNEL-43_23'));
assert(c4323.evidenceRefs.includes('HD-UA-GATE-43-REL-43_23-LEFT'));
assert(c4323.evidenceRefs.includes('HD-UA-GATE-23-REL-43_23-RIGHT'));
const advancedPrimary=composedDedup.primaryClaims.filter(x=>x.precedenceClass==='ADVANCED_VARIABLE_MODIFIER');
assert(advancedPrimary.length>=1);
assert(advancedPrimary.every(x=>x.precedenceRank===100));

assert.equal(status.schemaVersion,'PHI-OS-HD-PRO-R3-SEMANTIC-PRODUCTION-STATUS-v10.0.0');
assert.equal(status.updatedByWork,'HD-PRO-R3-W13');
assert.equal(status.successorOf,`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v9.json`);
assert.equal(status.historicalStatusRewritten,false);
assert.equal(historical.updatedByWork,'HD-PRO-R3-W12');
assert.equal(status.aggregate.semanticDedupEngineActive,true);
assert.equal(status.aggregate.semanticPrecedenceFrozen,true);
assert.equal(status.aggregate.dedupSupportingEvidenceRetained,true);
assert.equal(status.aggregate.dedupOpaqueSimilarityScoringUsed,false);
assert.equal(status.aggregate.dedupCreatesNewMeaning,false);
assert.equal(status.aggregate.r3CustomerCutoverAllowed,false);
assert.equal(status.nextWork,'HD-PRO-R3-W14 Whole-Chart Priority Engine');

console.log('✓ HD-PRO-R3-W13 Semantic Precedence + Dedup Engine passed.');
console.log(`  ${first.inputClaimCount} fixture claims collapse deterministically to ${first.primaryClaimCount} primary explanations with ${first.supportingClaimCount} retained supporting claims; Authority composition outranks Profile/Center/Variable duplicates and complete Channel composition outranks Gate/Center detail without deleting evidence.`);
