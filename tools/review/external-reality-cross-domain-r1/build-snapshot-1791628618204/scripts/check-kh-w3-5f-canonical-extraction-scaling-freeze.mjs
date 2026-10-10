import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';

const readJson = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const digest = async file => crypto
  .createHash('sha256')
  .update((await fs.readFile(file, 'utf8')).replace(/\r\n?/g, '\n'))
  .digest('hex');

const policyPath =
  'content/knowledge/registry/canonical-extraction-policy.json';
const [policy, freeze] = await Promise.all([
  readJson(policyPath),
  readJson(
    'docs/knowledge/kh-w3-5f-canonical-extraction-scaling-freeze-v1.json'
  )
]);

assert.equal(freeze.freezeId, 'KH-W3.5F-Frozen');
assert.equal(freeze.status, 'frozen');
assert.equal(freeze.baseline.commit, '7dc7235');
assert.equal(policy.status, 'frozen');
assert.equal(policy.effectiveFrom, 'KH-W3.5F');
assert.equal(
  policy.contract,
  'PHI-OS-PKR-Canonical-Extraction-Scaling-v1.2.0'
);
assert.equal(policy.unitOfRegistration, 'independent_reusable_mechanism');

assert.deepEqual(policy.hierarchy, [
  'knowledge_domain',
  'knowledge_theme',
  'canonical_knowledge_node',
  'supporting_question',
  'search_alias'
]);
assert.deepEqual(freeze.hierarchy, [
  'Knowledge Domain',
  'Knowledge Theme',
  'Canonical Knowledge Node',
  'Supporting Question',
  'Search Alias'
]);
assert.deepEqual(policy.scaling.partThresholds, {
  softReview: 18,
  mandatoryAudit: 24,
  hardFreeze: 30
});
assert.deepEqual(freeze.partScalingBoundary, {
  softReviewAt: 18,
  softReviewAction: 'flexible_granularity_review',
  mandatoryAuditAt: 24,
  mandatoryAuditAction: 'duplication_relationship_boundary_audit',
  hardFreezeAt: 30,
  hardFreezeAction: 'stop_registry_population'
});

assert.equal(
  policy.productionQueue.registryPresenceImpliesProduction,
  false
);
assert.equal(policy.productionQueue.totalActiveArticleMaximum, 8);
assert.equal(
  freeze.productionBoundary.registryPresenceEqualsProductionRequirement,
  false
);
assert.equal(freeze.productionBoundary.activeArticleMaximum, 8);
assert.equal(freeze.impacts.newRegistryLayerAdded, false);
assert.equal(freeze.impacts.contentProductionStarted, false);
assert.equal(freeze.impacts.runtimeChanged, false);
assert.equal(freeze.impacts.publicPageChanged, false);

assert.deepEqual(policy.reviewGates, [
  'source_coverage',
  'canonical_admission',
  'duplicate_comparison',
  'supporting_question_mapping',
  'boundary_review',
  'scaling_review',
  'production_tier_review'
]);
assert.equal(policy.prohibitedMappings.length, 6);
assert.equal(policy.admissionTests.length, 7);
assert.equal(policy.classifications.length, 7);
assert.equal(await digest(policyPath), freeze.canonicalPolicy.sha256);

console.log('✓ KH-W3.5F Canonical Extraction and Scaling Freeze passed.');
console.log('  Domain → Theme → Node → Question → Alias is the frozen hierarchy.');
console.log('  Part thresholds are 18 flexible review, 24 mandatory audit and 30 hard stop.');
console.log('  Registry presence creates no production requirement; active articles remain capped at 8.');
console.log('  State: KH-W3.5F-Frozen.');
