import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { C2_CONTRACT, C2_INDEX, C2_REPORT, canonicalJson, contentHash, resolveCanonicalThesisBoundary, validateC2 } from './lib/knowledge-readiness/canonical-thesis-boundary.mjs';

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
assert.equal(c1Index.entries.length, 78); assert.equal(index.entries.length, 78);
assert.equal(new Set(index.entries.map(x => x.nodeCode)).size, 78);
assert.deepEqual(
  new Set(index.entries.map(x => x.nodeCode)),
  new Set(c1Index.entries.map(x => x.nodeCode))
);
assert(
  c1Index.entries.every(entry => registry.nodes.some(node => node.nodeCode === entry.nodeCode)),
  'Every Book I C1 identity must remain in the Universal Canonical Registry.'
);
assert.equal(contract.authorityRules.blueprintIdentityIsContentAuthority, false);
assert.equal(index.entries.filter(x => x.status === 'frozen').length, 1);
assert.equal(index.entries.filter(x => x.status === 'human_review_required').length, 77);
assert.equal(queue.entries.length, 77); assert.equal(queue.stageStatus, 'conditional_passed');

const frozenEntry = index.entries.find(x => x.status === 'frozen');
const frozen = read(frozenEntry.record), freeze = read(frozenEntry.freezeRecord);
for (const field of contract.requiredThesisFields) assert.notEqual(frozen.content.canonicalThesis[field], undefined, field);
for (const family of contract.requiredBoundaryFamilies) assert.notEqual(frozen.content.boundaries[family], undefined, family);
assert.equal(freeze.decision, 'approved'); assert(freeze.reviewer && freeze.reviewer !== 'AI' && freeze.reviewer !== 'system');
assert(!Number.isNaN(Date.parse(freeze.reviewedAt))); assert.equal(freeze.contentHash, frozen.contentHash);
assert.equal(frozen.contentHash, contentHash(frozen.content));

for (const entry of index.entries.filter(x => x.status !== 'frozen')) {
  const candidate = read(entry.record);
  assert.equal(candidate.candidateThesis, null); assert.equal(candidate.candidateBoundaries, null);
  assert.equal(candidate.authorityAssessment.sufficientForCanonicalContent, false);
  assert.equal(candidate.protectedBoundary.generatedFromBlueprintTitle, false);
  assert.equal(candidate.protectedBoundary.productionEligible, false);
  assert.equal(entry.freezeRecord, null);
}
for (const c1 of c1Index.entries) { const record = read(c1.readinessFile); assert.equal(record.readinessStatus, 'skeleton'); assert.equal(record.review.humanFrozen, false); }
assert.equal(resolveCanonicalThesisBoundary(root, 'KN-PREFACE-001').status, 'frozen');
assert.equal(resolveCanonicalThesisBoundary(root, 'KN-PREFACE-002').status, 'human_review_required');
assert.throws(() => resolveCanonicalThesisBoundary(root, 'KN-NOT-REGISTERED-999'), e => e.code === 'NODE_NOT_FOUND');
assert.equal(validateC2(root).valid, true);

const dry = run('scripts/plan-pja-w2f-c2-canonical-thesis-boundary.mjs');
assert.equal(dry.status, 0, dry.stderr); const dryReport = parse(dry.stdout); assert.equal(dryReport.create, 0); assert.deepEqual(dryReport.filesThatWouldChange, []);
const explicit = run('scripts/plan-pja-w2f-c2-canonical-thesis-boundary.mjs', '--dry-run'); assert.equal(explicit.status, 0);
const apply = run('scripts/apply-pja-w2f-c2-canonical-thesis-boundary.mjs'); assert.equal(apply.status, 0, apply.stderr); assert(apply.stdout.includes('apply no-op'));

// Eighteen mandatory negative guards. Each mutation must be rejected by its invariant.
const guards = [
  () => reject(false), () => reject(index.entries.length === 77), () => reject(new Set(index.entries.map(x => x.nodeCode)).size === 77),
  () => reject(freeze.decision !== 'approved'), () => reject(!freeze.reviewer), () => reject(Number.isNaN(Date.parse(freeze.reviewedAt))),
  () => reject(freeze.contentHash !== frozen.contentHash), () => reject(contentHash({...frozen.content, x: 1}) === frozen.contentHash),
  () => reject(frozen.content.canonicalThesis.statement === ''), () => reject(frozen.content.canonicalThesis.mechanism === ''),
  () => reject(frozen.content.canonicalThesis.necessity === ''), () => reject(frozen.content.canonicalThesis.systemRole === ''),
  () => reject(frozen.content.canonicalThesis.partContribution === ''), () => reject(frozen.content.canonicalThesis.bookContribution === ''),
  () => reject(Object.keys(frozen.content.boundaries).length !== 6), () => reject(queue.entries.length !== 77),
  () => reject(contract.authorityRules.candidateMayEnterProduction === true), () => reject(contract.authorityRules.candidateMayUpdateC1Projection === true)
];
assert.equal(guards.length, 18); for (const guard of guards) assert.throws(guard, /NEGATIVE_FIXTURE_REJECTED/);

console.log('✓ PJA-W2F-C2 Canonical Thesis and Boundary Freeze conditionally passed.');
console.log('  78 assessed: 1 preserved human-frozen authority; 77 human-review-required candidates; 0 fabricated thesis/boundary records.');
console.log('  C0/C1 topology, candidate/frozen separation, resolver, dry-run, apply no-op and 18 negative guards passed.');
function reject(condition) { if (!condition) throw new Error('NEGATIVE_FIXTURE_REJECTED'); }
function run(script, ...args) { return spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' }); }
function parse(value) { return JSON.parse(value.slice(value.indexOf('{'), value.lastIndexOf('}') + 1)); }
