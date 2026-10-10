import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const read = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const base = 'content/knowledge/authoring/extensions/legacy-supporting-source';
const d = await read(`${base}/review-resolution/decisions/legacy-human-review-wave-d-decisions-v1.json`);
const r = await read(`${base}/review-resolution/resolved/legacy-human-review-wave-d-resolution-v1.json`);
const a = await read(`${base}/acceptance/kau-e1r-wave-d-human-review-resolution-acceptance-v1.json`);
const q = await read(`${base}/review/legacy-unified-language-human-review-queue-v1.json`);
const v5 = await read(`${base}/review-resolution/batches/legacy-human-review-resolution-registry-v5.json`);

assert.equal(d.decisionCount, 27);
assert.equal(r.decisionCount, 27);
assert.equal(a.checks.decisionCount, 27);
assert.equal(a.checks.acceptedRelationshipCount, 23);
assert.equal(a.checks.deferredCount, 4);
assert.equal(a.checks.canonicalNodeRegistryMutated, false);
assert.equal(a.checks.meaningAuthorityMutated, false);
assert.equal(a.checks.productionReadinessPromoted, false);
assert.equal(a.checks.kppHandoffCreated, false);

const expected = {
  DEFER: 4,
  HISTORICAL_PRECURSOR: 5,
  PARTIAL_OVERLAP: 3,
  SUPPORTS: 12,
  TERMINOLOGY_PREDECESSOR: 3
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

assert.equal(v5.progress.humanReviewed, 126);
assert.equal(v5.progress.pendingHumanDecision, 59);
assert.equal(v5.progress.acceptedSupporting, 104);
assert.equal(v5.progress.deferred, 22);
assert.equal(v5.nextState, 'WAVE_E_HUMAN_REVIEW');

const statuses = Object.fromEntries(v5.batches.map(x => [x.batchCode, x.status]));
for (const wave of ['A','B','C','D']) {
  assert.equal(statuses[`KAU-E1R-WAVE-${wave}`], 'HUMAN_REVIEW_RESOLVED');
}

console.log('✓ KAU-E1R Wave D: 27 explicit TL decisions recorded; 23 supporting relationships accepted, 4 deferred. Cumulative: 126/185 reviewed, 104 accepted, 22 deferred; no Canonical/Meaning/KPP mutation.');
