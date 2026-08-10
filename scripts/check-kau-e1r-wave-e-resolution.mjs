import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const read = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const base = 'content/knowledge/authoring/extensions/legacy-supporting-source';

const d = await read(`${base}/review-resolution/decisions/legacy-human-review-wave-e-decisions-v1.json`);
const r = await read(`${base}/review-resolution/resolved/legacy-human-review-wave-e-resolution-v1.json`);
const a = await read(`${base}/acceptance/kau-e1r-wave-e-human-review-resolution-acceptance-v1.json`);
const q = await read(`${base}/review/legacy-unified-language-human-review-queue-v1.json`);
const v6 = await read(`${base}/review-resolution/batches/legacy-human-review-resolution-registry-v6.json`);

assert.equal(d.decisionCount, 28);
assert.equal(r.decisionCount, 28);
assert.equal(a.checks.decisionCount, 28);
assert.equal(a.checks.acceptedRelationshipCount, 23);
assert.equal(a.checks.deferredCount, 5);

const expected = {
  DEFER: 5,
  HISTORICAL_PRECURSOR: 8,
  PARTIAL_OVERLAP: 7,
  SUPERSEDED_BY: 4,
  SUPPORTS: 3,
  TERMINOLOGY_PREDECESSOR: 1
};
assert.deepEqual(a.checks.decisionCounts, expected);

assert.equal(a.checks.learningPathLegacyClaimSuperseded, true);
assert.equal(a.checks.learningPathCurrentArchitectureReference, 'ALR-W11');
assert.equal(a.checks.canonicalNodeRegistryMutated, false);
assert.equal(a.checks.meaningAuthorityMutated, false);
assert.equal(a.checks.alrImplementationMutated, false);
assert.equal(a.checks.productionReadinessPromoted, false);
assert.equal(a.checks.kppHandoffCreated, false);

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

const learningPath = d.decisions.find(x => x.reviewCode === 'KAU-E1-REVIEW-0140');
assert.ok(learningPath);
assert.equal(learningPath.humanDecision, 'SUPERSEDED_BY');
assert.ok(learningPath.architectureReferences.includes('ALR-W11'));

assert.equal(v6.progress.humanReviewed, 154);
assert.equal(v6.progress.pendingHumanDecision, 31);
assert.equal(v6.progress.acceptedSupporting, 127);
assert.equal(v6.progress.deferred, 27);
assert.equal(v6.nextState, 'WAVE_F_HUMAN_REVIEW');

const statuses = Object.fromEntries(v6.batches.map(x => [x.batchCode, x.status]));
for (const wave of ['A','B','C','D','E']) {
  assert.equal(statuses[`KAU-E1R-WAVE-${wave}`], 'HUMAN_REVIEW_RESOLVED');
}

console.log('✓ KAU-E1R Wave E: 28 explicit TL decisions recorded; 23 supporting relationships accepted, 5 deferred. Legacy no-learning-path claim is superseded at architecture level by ALR-W11. Cumulative: 154/185 reviewed, 127 accepted, 27 deferred; no Canonical/Meaning/ALR implementation/KPP mutation.');
