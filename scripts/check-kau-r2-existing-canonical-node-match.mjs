import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha256 = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const nodes = readJson('content/knowledge/registry/nodes.json');
const nodeList = Array.isArray(nodes) ? nodes : (nodes.nodes || []);
assert.equal(nodeList.length, 716, 'Canonical Node count must remain 716.');
assert.equal(sha256('content/knowledge/registry/nodes.json'), '61c1d8bd00a13af5fa3d41e802fa3a787c97750c60b04e037377b585a3d01431', 'nodes.json must remain byte-identical in KAU-R2.');
const nodeCodes = new Set(nodeList.map(n => n.nodeCode));

const b1 = readJson('content/knowledge/reconciliation/kau-r2/book-1-section-node-candidates-v1.json');
const b2 = readJson('content/knowledge/reconciliation/kau-r2/book-2-section-node-candidates-v1.json');
assert.equal(b1.recordCount, 275);
assert.equal(b2.recordCount, 173);
assert.equal(b1.records.length + b2.records.length, 448);
for (const registry of [b1,b2]) {
  assert.equal(registry.automaticAcceptanceAllowed, false);
  assert.equal(registry.canonicalRegistryMutationAllowed, false);
  for (const rec of registry.records) {
    assert.equal(rec.decisionStatus, 'CANDIDATE_ONLY_HUMAN_REVIEW_REQUIRED');
    assert.equal(rec.automaticAcceptanceAllowed, false);
    assert.equal(rec.nodesJsonMutationAllowed, false);
    for (const c of rec.candidateNodes) assert(nodeCodes.has(c.nodeCode), `Unknown candidate node ${c.nodeCode}`);
    for (const c of rec.primaryCandidateNodeCodes) assert(nodeCodes.has(c), `Unknown primary candidate ${c}`);
  }
}

const coverage = readJson('content/knowledge/reconciliation/kau-r2/completed-manuscript-canonical-coverage-candidates-v1.json');
assert.equal(coverage.canonicalNodeCount, 245);
assert.equal(coverage.records.length, 245);
assert.equal(new Set(coverage.records.map(r => r.nodeCode)).size, 245);

const future = readJson('content/knowledge/reconciliation/kau-r2/future-volume-outline-upgrade-guard-v1.json');
assert.equal(future.totalUpgradedOutlineChapters, 621);
assert.equal(future.existingCanonicalNodesAcrossP8P15, 471);
assert.equal(future.outlineChapterMinusExistingNodeCount, 150);
assert.equal(future.records.length, 8);
assert(future.records.every(r => r.canonicalAcceptanceEligible === false));
assert(future.records.every(r => r.chapterCountMayBeUsedAsNodeCount === false));
const p13 = future.records.find(r => r.partCode === 'P13');
assert.equal(p13.chapters.length, 87);
assert.equal(p13.chapters.at(-1).chapterCode, '13.87');
assert.equal(p13.chapters.at(-1).titleZhHans, '导航阈值');

const drift = readJson('content/knowledge/reconciliation/kau-r2/kau-r2-cross-volume-semantic-drift-v1.json');
assert(drift.records.some(r => r.findingCode === 'KAU-R2-DRIFT-P7-057' && r.futureAnchor?.chapterCode === '10.81'));

const acceptance = readJson('content/knowledge/reconciliation/kau-r2/kau-r2-acceptance-v1.json');
assert.equal(acceptance.status, 'CANDIDATE_MATCHING_COMPLETE_HUMAN_ACCEPTANCE_PENDING');
assert.equal(acceptance.acceptance.nodesJsonModified, false);
assert.equal(acceptance.acceptance.automaticCanonicalAcceptance, false);
assert.equal(acceptance.acceptance.ksarCanonicalBindingRegistryPopulated, false);

// KAU-R2 itself never auto-populates bindings. A later human-accepted successor may do so.
const ksarBindings = readJson('content/knowledge/source-access/registries/manuscript-section-canonical-binding-v1.json');
const r3ResolutionPath = 'content/knowledge/reconciliation/kau-r3/kau-r3-human-resolution-v1.json';
if (fs.existsSync(r3ResolutionPath)) {
  const r3Resolution = readJson(r3ResolutionPath);
  assert.equal(r3Resolution.status, 'HUMAN_RESOLVED');
  assert.equal(r3Resolution.acceptStraightforwardMappings, true);
  assert.equal(ksarBindings.records.length, 62, 'Only the human-accepted KAU-R3 Volume-I successor may populate the 62 approved primary bindings at this stage.');
  assert(ksarBindings.records.every(r => r.bookCode === 'BOOK-1' && r.status === 'APPROVED'));
} else {
  assert.equal(ksarBindings.records.length, 0, 'KAU-R2 candidates must not become KSAR approved bindings before later human acceptance.');
}

const pkg = readJson('package.json');
assert.equal(pkg.scripts['check:kau-r2'], 'node scripts/check-kau-r2-existing-canonical-node-match.mjs');

console.log('✓ KAU-R2 Existing Canonical Node Match candidate phase passed.');
console.log('  448 materialized manuscript segments remain accounted for with candidate-only R2 decisions.');
console.log('  245 existing P0-P7 Canonical Nodes remain accounted for in the R2 coverage ledger.');
console.log('  P8-P15 upgraded outline architecture remains a non-manuscript semantic constraint: 621 outline chapters vs 471 existing nodes.');
console.log(`  716 Canonical Nodes remain byte-identical; later human-accepted KSAR bindings recognized: ${ksarBindings.records.length}.`);
