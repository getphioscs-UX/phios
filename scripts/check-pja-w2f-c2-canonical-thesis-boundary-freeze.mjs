import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { C2_CONTRACT, C2_INDEX, C2_REPORT, C2_WAVE1_HUMAN_RESOLUTION, contentHash, resolveCanonicalThesisBoundary, resolveHumanEditorialFreezeResolutions, validateC2 } from './lib/knowledge-readiness/canonical-thesis-boundary.mjs';

const root = process.cwd();
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const pkg = read('package.json');
assert.equal(pkg.scripts['check:pja-w2f-c2'], 'npm run check:pja-w2f-c1 && node scripts/check-pja-w2f-c2-canonical-thesis-boundary-freeze.mjs');
assert.equal(pkg.scripts['knowledge:plan-book-i-thesis'], 'node scripts/plan-pja-w2f-c2-canonical-thesis-boundary.mjs');
assert.equal(pkg.scripts['knowledge:apply-book-i-thesis'], 'node scripts/apply-pja-w2f-c2-canonical-thesis-boundary.mjs');
assert.equal(pkg.scripts['knowledge:validate-book-i-thesis'], 'node scripts/validate-pja-w2f-c2-canonical-thesis-boundary.mjs');

const registry = read('content/knowledge/registry/nodes.json');
const c1Index = read('content/knowledge/readiness/canonical-readiness-index.json');
const contract = read(C2_CONTRACT), index = read(C2_INDEX), queue = read(C2_REPORT);
const resolution = read(C2_WAVE1_HUMAN_RESOLUTION);
const approved = resolveHumanEditorialFreezeResolutions(root).approvedByNode;
const wave1Codes = [...approved.keys()];

assert.equal(c1Index.entries.length, 78); assert.equal(index.entries.length, 78);
assert.equal(new Set(index.entries.map(x => x.nodeCode)).size, 78);
assert.deepEqual(new Set(index.entries.map(x => x.nodeCode)), new Set(c1Index.entries.map(x => x.nodeCode)));
assert(c1Index.entries.every(entry => registry.nodes.some(node => node.nodeCode === entry.nodeCode)), 'Every Book I C1 identity must remain in the Universal Canonical Registry.');
assert.equal(contract.authorityRules.blueprintIdentityIsContentAuthority, false);
assert.equal(resolution.status, 'HUMAN_RESOLVED');
assert.equal(approved.size, 4);
assert.deepEqual(wave1Codes, ['KN-PREFACE-004','KN-B1-P1-003','KN-B1-P4-003','KN-B1-P4-004']);
assert.equal(index.entries.filter(x => x.status === 'frozen').length, 5);
assert.equal(index.entries.filter(x => x.status === 'human_review_required').length, 73);
assert.equal(queue.entries.length, 73); assert.equal(queue.stageStatus, 'conditional_passed');
assert.equal(queue.summary.frozen, 5); assert.equal(queue.summary.humanReviewRequired, 73);

for (const frozenEntry of index.entries.filter(entry => entry.status === 'frozen')) {
  const frozen = read(frozenEntry.record), freeze = read(frozenEntry.freezeRecord);
  for (const field of contract.requiredThesisFields) assert.notEqual(frozen.content.canonicalThesis[field], undefined, `${frozenEntry.nodeCode}:${field}`);
  for (const family of contract.requiredBoundaryFamilies) assert.notEqual(frozen.content.boundaries[family], undefined, `${frozenEntry.nodeCode}:${family}`);
  assert.equal(freeze.decision, 'approved');
  assert(freeze.reviewer && !['AI','system','automation','ChatGPT','Codex'].includes(freeze.reviewer));
  assert(!Number.isNaN(Date.parse(freeze.reviewedAt)));
  assert.equal(freeze.contentHash, frozen.contentHash);
  assert.equal(frozen.contentHash, contentHash(frozen.content));
  if (wave1Codes.includes(frozenEntry.nodeCode)) {
    assert.equal(frozen.authority.source, C2_WAVE1_HUMAN_RESOLUTION);
    assert.equal(frozen.authority.migration, 'human_editorial_freeze_resolution');
    assert.equal(freeze.reviewer, 'TL');
    assert.equal(freeze.reviewerRole, 'HUMAN_EDITORIAL_AUTHORITY');
    const approvedEntry = approved.get(frozenEntry.nodeCode);
    assert.equal(approvedEntry.proposalContentHash, frozen.contentHash);
    assert.equal(approvedEntry.humanDecision.contentHash, frozen.contentHash);
  }
}

for (const entry of index.entries.filter(x => x.status !== 'frozen')) {
  const candidate = read(entry.record);
  assert.equal(candidate.candidateThesis, null); assert.equal(candidate.candidateBoundaries, null);
  assert.equal(candidate.authorityAssessment.sufficientForCanonicalContent, false);
  assert.equal(candidate.protectedBoundary.generatedFromBlueprintTitle, false);
  assert.equal(candidate.protectedBoundary.productionEligible, false);
  assert.equal(entry.freezeRecord, null);
}
for (const c1 of c1Index.entries) { const record = read(c1.readinessFile); assert.equal(record.readinessStatus, 'skeleton'); assert.equal(record.review.humanFrozen, false); }
for (const code of ['KN-PREFACE-001', ...wave1Codes]) assert.equal(resolveCanonicalThesisBoundary(root, code).status, 'frozen');
assert.equal(resolveCanonicalThesisBoundary(root, 'KN-PREFACE-002').status, 'human_review_required');
assert.throws(() => resolveCanonicalThesisBoundary(root, 'KN-NOT-REGISTERED-999'), e => e.code === 'NODE_NOT_FOUND');
assert.equal(validateC2(root).valid, true);

const dry = run('scripts/plan-pja-w2f-c2-canonical-thesis-boundary.mjs');
assert.equal(dry.status, 0, dry.stderr); const dryReport = parse(dry.stdout);
assert.equal(dryReport.create, 0); assert.equal(dryReport.update, 0); assert.equal(dryReport.frozen, 5); assert.equal(dryReport.humanReviewRequired, 73); assert.deepEqual(dryReport.filesThatWouldChange, []);
const explicit = run('scripts/plan-pja-w2f-c2-canonical-thesis-boundary.mjs', '--dry-run'); assert.equal(explicit.status, 0);
const apply = run('scripts/apply-pja-w2f-c2-canonical-thesis-boundary.mjs'); assert.equal(apply.status, 0, apply.stderr); assert(apply.stdout.includes('apply no-op'));

const guards = [
  () => reject(index.entries.length !== 78),
  () => reject(new Set(index.entries.map(x => x.nodeCode)).size !== 78),
  () => reject(index.entries.filter(x => x.status === 'frozen').length !== 5),
  () => reject(queue.entries.length !== 73),
  () => reject(approved.size !== 4),
  () => reject(resolution.entries.some(entry => entry.approvalState !== 'human_approved')),
  () => reject(resolution.entries.some(entry => entry.humanDecision.actor !== 'TL')),
  () => reject(resolution.entries.some(entry => entry.humanDecision.contentHash !== entry.proposalContentHash)),
  () => reject(resolution.entries.some(entry => !entry.manuscriptMappingReview.humanVerified)),
  () => reject(resolution.entries.some(entry => entry.reviewDimensionProposals.some(item => item.state !== 'HUMAN_APPROVED' || !item.humanFinding))),
  () => reject(contract.authorityRules.candidateMayEnterProduction === true),
  () => reject(contract.authorityRules.candidateMayUpdateC1Projection === true)
];
for (const guard of guards) assert.throws(guard, /NEGATIVE_FIXTURE_REJECTED/);

console.log('✓ PJA-W2F-C2 Canonical Thesis and Boundary Freeze passed after Human reconciliation.');
console.log('✓ 78 assessed: 5 Human-frozen authorities; 73 Human-review-required candidates; no fabricated thesis/boundary records.');
console.log(`✓ Wave 1 Human approvals (${wave1Codes.join(', ')}) are exact-content-hash bound and byte-stable.`);
function reject(condition) { if (!condition) throw new Error('NEGATIVE_FIXTURE_REJECTED'); }
function run(script, ...args) { return spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' }); }
function parse(value) { return JSON.parse(value.slice(value.indexOf('{'), value.lastIndexOf('}') + 1)); }
