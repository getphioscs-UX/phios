import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const sha256 = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const recon = read('content/knowledge/reconciliation/kau-r3/book-1-semantic-reconciliation-v1.json');
const coverage = read('content/knowledge/reconciliation/kau-r3/book-1-canonical-coverage-v1.json');
const meta = read('content/knowledge/reconciliation/kau-r3/book-1-metadata-revision-candidates-v1.json');
const notices = read('content/knowledge/reconciliation/kau-r3/book-1-source-editorial-notices-v1.json');
const queue = read('content/knowledge/reconciliation/kau-r3/kau-r3-human-review-queue-v1.json');
const acceptance = read('content/knowledge/reconciliation/kau-r3/kau-r3-acceptance-v1.json');
const resolution = read('content/knowledge/reconciliation/kau-r3/kau-r3-human-resolution-v1.json');
const freeze = read('content/knowledge/reconciliation/kau-r3/kau-r3-freeze-v1.json');
const approved = read('content/knowledge/reconciliation/kau-r3/book-1-approved-primary-bindings-v1.json');
const inventory = read('content/knowledge/manuscripts/extraction/book-1-full-section-inventory-v1.json');
const blueprint = read('content/knowledge/blueprints/book-1-knowledge-blueprint.json');
const nodes = read('content/knowledge/registry/nodes.json');
const bindings = read('content/knowledge/source-access/registries/manuscript-section-canonical-binding-v1.json');
const corrections = read('content/knowledge/source-access/registries/manuscript-editorial-correction-v1.json');

assert.equal(recon.stage, 'KAU-R3');
assert.equal(recon.bookCode, 'BOOK-1');
assert.equal(recon.baselineCommit, '5f6c3f07ef86164ba3ab0655286ec349e9901156');
assert.equal(recon.status, 'HUMAN_ACCEPTED_VOLUME_I_RECONCILIATION');
assert.equal(recon.sectionCount, 275);
assert.equal(recon.records.length, 275);
assert.equal(recon.automaticAcceptanceAllowed, false);
assert.equal(recon.nodesJsonMutationAllowed, false);

const invByCode = new Map(inventory.sections.map(s => [s.sectionCode, s]));
assert.equal(invByCode.size, 275);
const seenSections = new Set();
const allowed = new Set(['EXACT_MATCH','EXPANDED_MATCH','SUPPORTING_ONLY']);
const decisionCounts = {};
const referencedNodes = new Set();
let primaryBindingCount = 0;
for (const r of recon.records) {
  assert.equal(seenSections.has(r.sectionCode), false, `Duplicate KAU-R3 section: ${r.sectionCode}`);
  seenSections.add(r.sectionCode);
  const src = invByCode.get(r.sectionCode);
  assert.ok(src, `Unknown source section: ${r.sectionCode}`);
  assert.equal(r.sectionTextSha256, src.textSha256);
  assert.equal(r.heading, src.heading);
  assert.equal(r.pageRange.start, src.startPage);
  assert.equal(r.pageRange.end, src.endPage);
  assert.ok(allowed.has(r.r3ProposedDecision), `Invalid KAU-R3 decision ${r.r3ProposedDecision}`);
  assert.equal(r.humanAcceptance, 'ACCEPTED');
  assert.equal(r.canonicalBindingEligibleAfterHumanAcceptance, r.primaryNodeCodes.length > 0);
  primaryBindingCount += r.primaryNodeCodes.length;
  for (const n of [...r.primaryNodeCodes, ...r.supportingNodeCodes]) referencedNodes.add(n);
  decisionCounts[r.r3ProposedDecision] = (decisionCounts[r.r3ProposedDecision] ?? 0) + 1;
}
assert.deepEqual(decisionCounts, { SUPPORTING_ONLY: 213, EXACT_MATCH: 4, EXPANDED_MATCH: 58 });
assert.deepEqual(recon.decisionStats, decisionCounts);
assert.equal(primaryBindingCount, 62);
assert.equal(seenSections.size, inventory.sections.length);

const book1NodeCodes = blueprint.nodes
  .filter(n => ['P0','P1','P2','P3','P4'].includes(n.partCode))
  .map(n => n.nodeCode);
assert.equal(book1NodeCodes.length, 65);
assert.equal(coverage.status, 'HUMAN_ACCEPTED_VOLUME_I_SOURCE_COVERAGE');
assert.equal(coverage.existingCanonicalNodeCount, 65);
assert.equal(coverage.coveredCanonicalNodeCount, 65);
assert.deepEqual(coverage.uncoveredCanonicalNodeCodes, []);
assert.equal(coverage.records.length, 65);
assert.equal(coverage.primarySourceNodeCount, 61);
assert.equal(coverage.compositeOnlyNodeCount, 4);

const nodeRegistryCodes = new Set(nodes.nodes.map(n => n.nodeCode));
for (const code of book1NodeCodes) {
  assert.ok(nodeRegistryCodes.has(code), `Blueprint node missing from registry: ${code}`);
  assert.ok(referencedNodes.has(code), `Existing Volume-I Canonical node has no KAU-R3 source coverage: ${code}`);
}
for (const r of coverage.records) assert.equal(r.humanAcceptance, 'ACCEPTED');

assert.equal(meta.status, 'HUMAN_ACCEPTED_APPLICATION_DEFERRED_TO_KAU_R5');
assert.equal(meta.records.length, 2);
assert.deepEqual(meta.records.map(r => r.nodeCode).sort(), ['KN-B1-P1-002','KN-B1-P1-005']);
for (const r of meta.records) {
  assert.equal(r.canonicalIdentityChanged, false);
  assert.equal(r.humanAcceptance, 'ACCEPTED');
  assert.equal(r.applicationStatus, 'DEFERRED_TO_KAU_R5');
  assert.equal(nodes.nodes.find(n => n.nodeCode === r.nodeCode)?.canonicalQuestionKey, r.canonicalQuestionKey);
}
// Frozen blueprint is intentionally not mutated until KAU-R5 successor reconciliation.
assert.equal(blueprint.nodes.find(n => n.nodeCode === 'KN-B1-P1-002').titleZhHans, '为什么差异会持续扩大');
assert.equal(blueprint.nodes.find(n => n.nodeCode === 'KN-B1-P1-005').titleZhHans, '为什么现实会不断演化');

assert.equal(notices.status, 'RESOLVED_BY_HUMAN_SOURCE_CORRECTION');
assert.equal(notices.records.length, 1);
assert.equal(notices.records[0].sectionCode, 'CM-B1V2-P3-S026');
assert.equal(notices.records[0].humanDisposition, 'CONFIRMED_CORRECTION');
assert.equal(notices.records[0].confirmedCorrection.correctedHeading, 'Domain III Coexistence |');
const correctedInventorySection = invByCode.get('CM-B1V2-P3-S026');
assert.equal(correctedInventorySection.heading, 'Domain II Coexistence |');
assert.equal(correctedInventorySection.editorialCorrection.status, 'HUMAN_CONFIRMED');
assert.equal(correctedInventorySection.editorialCorrection.correctedHeading, 'Domain III Coexistence |');

assert.equal(queue.status, 'RESOLVED');
assert.equal(queue.attentionItemCount, 7);
assert.equal(queue.attentionItems.length, 7);
assert.equal(queue.humanAcceptance, 'ACCEPTED');

assert.equal(resolution.status, 'HUMAN_RESOLVED');
assert.equal(resolution.decision, 'ACCEPT_WITH_CHANGES');
assert.equal(resolution.acceptStraightforwardMappings, true);
assert.equal(resolution.sourceEditorialNoticeDecisions[0].to, 'Domain III Coexistence |');

assert.equal(acceptance.status, 'HUMAN_ACCEPTED_VOLUME_I_RECONCILIATION_FROZEN');
assert.equal(acceptance.summary.materializedSectionsAccountedFor, 275);
assert.equal(acceptance.summary.existingCanonicalNodesAccountedFor, 65);
assert.equal(acceptance.summary.ksarApprovedBindingsWritten, 62);
assert.equal(acceptance.acceptanceBoundaries.nodesJsonUnchanged, true);
assert.equal(acceptance.acceptanceBoundaries.metadataRevisionApplicationDeferredTo, 'KAU-R5');

assert.equal(freeze.status, 'FROZEN_HUMAN_ACCEPTED');
assert.equal(freeze.acceptedReconciliation.primaryApprovedKsarbBindings, 62);
assert.equal(freeze.sourceCorrection.correctedHeading, 'Domain III Coexistence |');
assert.equal(freeze.metadataRevisions.deferredTo, 'KAU-R5');

assert.equal(approved.recordCount, 62);
assert.equal(approved.records.length, 62);
assert.equal(bindings.records.length, 62);
assert.deepEqual(bindings.records, approved.records);
assert(bindings.records.every(r => r.bookCode === 'BOOK-1' && r.status === 'APPROVED'));
assert.equal(new Set(bindings.records.map(r => r.sectionCode)).size, 62);
assert.equal(new Set(bindings.records.map(r => r.nodeCode)).size, 61);

assert.equal(corrections.records.length, 1);
assert.equal(corrections.records[0].correctedValue, 'Domain III Coexistence |');
assert.equal(corrections.records[0].rawSourcePreserved, true);

assert.equal(sha256('content/knowledge/registry/nodes.json'), '61c1d8bd00a13af5fa3d41e802fa3a787c97750c60b04e037377b585a3d01431');

console.log('✓ KAU-R3 Volume I Human-Accepted Reconciliation passed.');
console.log('  275/275 final Book-I materialized sections are human accepted.');
console.log('  65/65 existing Volume-I Canonical Nodes retain accepted source coverage.');
console.log('  62 primary Book-I section→node bindings are now APPROVED for KSAR; supporting-only sections remain source-native.');
console.log('  Domain III Coexistence is human-confirmed through a governed editorial projection while raw source provenance remains unchanged.');
console.log('  2 accepted Blueprint display-title revisions are deferred to KAU-R5; nodes.json remains byte-identical.');
