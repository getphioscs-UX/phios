import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha256 = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const resolution = read('content/knowledge/reconciliation/kau-r3/kau-r3-human-resolution-v1.json');
const freeze = read('content/knowledge/reconciliation/kau-r3/kau-r3-freeze-v1.json');
const bindings = read('content/knowledge/source-access/registries/manuscript-section-canonical-binding-v1.json');
const corrections = read('content/knowledge/source-access/registries/manuscript-editorial-correction-v1.json');
const meta = read('content/knowledge/reconciliation/kau-r3/book-1-metadata-revision-candidates-v1.json');
const blueprint = read('content/knowledge/blueprints/book-1-knowledge-blueprint.json');
const pkg = read('package.json');

assert.equal(resolution.status, 'HUMAN_RESOLVED');
assert.equal(resolution.bookCode, 'BOOK-1');
assert.equal(resolution.decision, 'ACCEPT_WITH_CHANGES');
assert.equal(resolution.acceptStraightforwardMappings, true);
assert.equal(resolution.metadataRevisionDecisions.every(r => r.decision === 'ACCEPT'), true);
assert.equal(resolution.sourceEditorialNoticeDecisions[0].to, 'Domain III Coexistence |');

assert.equal(freeze.status, 'FROZEN_HUMAN_ACCEPTED');
assert.equal(freeze.acceptedReconciliation.sections, 275);
assert.equal(freeze.acceptedReconciliation.canonicalNodesCovered, 65);
assert.equal(freeze.acceptedReconciliation.primaryApprovedKsarbBindings, 62);
assert.equal(freeze.authorityBoundaries.nodesJsonUnchanged, true);
assert.equal(freeze.nextStage, 'KAU-R4 Volume II Reconciliation');

assert.equal(bindings.status, 'ACTIVE_PARTIAL_VOLUME_I_APPROVED');
assert.equal(bindings.records.length, 62);
assert(bindings.records.every(r => r.authority === 'KAU-R3_HUMAN_ACCEPTED_VOLUME_I_RECONCILIATION'));
assert(bindings.records.every(r => ['EXACT_MATCH','EXPANDED_MATCH'].includes(r.reconciliationDecision)));

assert.equal(corrections.status, 'ACTIVE_HUMAN_CONFIRMED_CORRECTIONS');
assert.equal(corrections.records.length, 1);
assert.equal(corrections.records[0].rawValue, 'Domain II Coexistence |');
assert.equal(corrections.records[0].correctedValue, 'Domain III Coexistence |');
assert.equal(corrections.policy.rawMaterializedTextMutationByRegistry, false);
assert.equal(corrections.policy.correctionAppliedAtRetrievalProjection, true);

assert.equal(meta.status, 'HUMAN_ACCEPTED_APPLICATION_DEFERRED_TO_KAU_R5');
assert.equal(meta.records.every(r => r.applicationStatus === 'DEFERRED_TO_KAU_R5'), true);
assert.equal(blueprint.nodes.find(n => n.nodeCode === 'KN-B1-P1-002').titleZhHans, '为什么差异会持续扩大');
assert.equal(blueprint.nodes.find(n => n.nodeCode === 'KN-B1-P1-005').titleZhHans, '为什么现实会不断演化');

assert.equal(sha256('content/knowledge/registry/nodes.json'), '61c1d8bd00a13af5fa3d41e802fa3a787c97750c60b04e037377b585a3d01431');
assert.equal(pkg.scripts['check:kau-r3-acceptance'], 'node scripts/check-kau-r3-volume-i-human-acceptance.mjs');

console.log('✓ KAU-R3 Human Acceptance & Volume-I Freeze passed.');
console.log('  All Volume-I reconciliation decisions are accepted.');
console.log('  Domain III Coexistence correction is active as a provenance-preserving editorial projection.');
console.log('  62 KSAR primary canonical bindings are approved; KAU-R4 may begin.');
