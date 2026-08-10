import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const read = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const base = 'content/knowledge/authoring/extensions/legacy-supporting-source';

const d = await read(`${base}/review-resolution/decisions/legacy-human-review-wave-f-decisions-v1.json`);
const r = await read(`${base}/review-resolution/resolved/legacy-human-review-wave-f-resolution-v1.json`);
const a = await read(`${base}/acceptance/kau-e1r-wave-f-human-review-resolution-acceptance-v1.json`);
const c = await read(`${base}/acceptance/kau-e1r-human-review-completion-acceptance-v1.json`);
const q = await read(`${base}/review/legacy-unified-language-human-review-queue-v1.json`);
const v7 = await read(`${base}/review-resolution/batches/legacy-human-review-resolution-registry-v7.json`);

assert.equal(d.decisionCount, 31);
assert.equal(r.decisionCount, 31);
assert.equal(a.checks.decisionCount, 31);
assert.equal(a.checks.acceptedRelationshipCount, 28);
assert.equal(a.checks.deferredCount, 3);

const expected = {
  DEFER: 3,
  HISTORICAL_PRECURSOR: 5,
  PARTIAL_OVERLAP: 7,
  SUPERSEDED_BY: 3,
  SUPPORTS: 11,
  TERMINOLOGY_PREDECESSOR: 2
};
assert.deepEqual(a.checks.decisionCounts, expected);

const codes = new Set(q.entries.map(x => x.reviewCode));
for (const x of d.decisions) {
  assert.ok(codes.has(x.reviewCode), `Unknown reviewCode ${x.reviewCode}`);
  assert.equal(x.reviewedBy, 'TL');
  assert.ok(x.reviewedAt);
  assert.ok(x.humanReason);
  if (x.humanDecision === 'DEFER') {
    assert.equal(x.acceptedCanonicalNodeReferences.length, 0);
  } else {
    assert.ok(x.acceptedCanonicalNodeReferences.length > 0);
  }
}

assert.equal(v7.progress.humanReviewed, 185);
assert.equal(v7.progress.pendingHumanDecision, 0);
assert.equal(v7.progress.acceptedSupporting, 155);
assert.equal(v7.progress.deferred, 30);
assert.equal(v7.kauE2Ready, true);
assert.equal(v7.nextState, 'KAU_E2_EXTENSION_ACCEPTANCE_AND_FREEZE');

const statuses = Object.fromEntries(v7.batches.map(x => [x.batchCode, x.status]));
for (const wave of ['A','B','C','D','E','F']) {
  assert.equal(statuses[`KAU-E1R-WAVE-${wave}`], 'HUMAN_REVIEW_RESOLVED');
}

assert.equal(c.status, 'HUMAN_REVIEW_COMPLETE_READY_FOR_KAU_E2');
assert.equal(c.totals.humanReviewed, 185);
assert.equal(c.totals.pendingHumanDecision, 0);
assert.equal(c.totals.acceptedSupporting, 155);
assert.equal(c.totals.deferred, 30);
assert.equal(c.kauE2Ready, true);

assert.equal(a.checks.canonicalNodeRegistryMutated, false);
assert.equal(a.checks.meaningAuthorityMutated, false);
assert.equal(a.checks.civilizationAuthorityMutated, false);
assert.equal(a.checks.productionReadinessPromoted, false);
assert.equal(a.checks.kppHandoffCreated, false);
assert.equal(c.authorityBoundary.legacyRelationshipsCanonicalized, false);
assert.equal(c.authorityBoundary.deferredItemsAutoResolved, false);

console.log('✓ KAU-E1R Wave F: 31 explicit TL decisions recorded; 28 supporting relationships accepted, 3 deferred.');
console.log('✓ KAU-E1R Human Review complete: 185/185 reviewed; 155 accepted supporting relationships; 30 deferred; 0 pending.');
console.log('✓ Ready for KAU-E2 Extension Acceptance & Freeze; no Canonical/Meaning/Civilization/KPP mutation.');
