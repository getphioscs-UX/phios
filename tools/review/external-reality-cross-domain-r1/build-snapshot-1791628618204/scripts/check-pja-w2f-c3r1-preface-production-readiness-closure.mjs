import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildBatchPlan } from './lib/knowledge-production/book-i-batch-production.mjs';
import { resolveProductionReadiness } from './lib/knowledge-readiness/universal-production-readiness.mjs';
import { C3R1_PATHS, resolveProductionReadinessClosure } from './lib/knowledge-readiness/preface-production-readiness-closure.mjs';

const root = process.cwd();
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const pkg = read('package.json');
assert.equal(pkg.scripts['check:pja-w2f-c3r1'], 'npm run check:pja-w2f-d && node scripts/check-pja-w2f-c3r1-preface-production-readiness-closure.mjs');

const closure = resolveProductionReadinessClosure(root);
assert.equal(closure.node, 'KN-PREFACE-001');
assert.equal(closure.status, 'production_ready');
assert.deepEqual(closure.blocking, []);
assert.equal(closure.source.status, 'verified');
assert.equal(closure.claims.status, 'covered');
assert.equal(closure.claims.total, 5);
assert.equal(closure.review.traceability, 'closed');
assert.equal(closure.approval.reviewer, 'TL');
assert.equal(closure.approval.decision, 'approved');
assert.equal(closure.approval.contentHash, closure.review.evidenceBundleHash);
assert.equal(closure.exportability.exportAllowed, true);
assert.deepEqual(closure.exportability.blockingReasons, []);

const resolved = resolveProductionReadiness(root, 'KN-PREFACE-001');
assert.equal(resolved.status, 'production_ready');
assert.equal(resolved.productionReady, true);
assert.deepEqual(resolved.blocking, []);
assert.equal(resolved.source.status, 'passed');
assert.equal(resolved.claims.status, 'passed');
assert.equal(resolved.approval.status, 'passed');

const c3 = read('content/knowledge/editorial/c3/universal-production-readiness-index.json');
assert.equal(c3.productionReadyCount, 1);
assert.equal(c3.productionBlockedCount, 77);
assert.deepEqual(c3.entries.filter(entry => entry.productionReady).map(entry => entry.nodeCode), ['KN-PREFACE-001']);
const plan = buildBatchPlan(root);
assert.equal(plan.status, 'planned');
assert.deepEqual(plan.eligibleNodes, ['KN-PREFACE-001']);
assert.equal(plan.plannedBatches.length, 1);
assert.equal(plan.generatedArticles, 0);
assert.equal(plan.generatedProductionExports, 0);
assert.equal(plan.published, 0);
assert.equal(fs.existsSync(path.join(root, 'content/knowledge/production/batches')), false);

const base = Object.fromEntries(Object.entries(C3R1_PATHS).filter(([key]) => key !== 'contract').map(([key, relative]) => [key, read(relative)]));
const mutation = (key, alter) => { const records = structuredClone(base); alter(records[key], records); return resolveProductionReadinessClosure(root, records).blocking; };
const negativeGuards = [
  ['approval without reviewer', mutation('approval', value => { value.reviewer = null; }), 'APPROVAL_REVIEWER_REQUIRED'],
  ['approval without hash', mutation('approval', value => { value.contentHash = null; }), 'APPROVAL_HASH_REQUIRED'],
  ['approval by AI', mutation('approval', value => { value.reviewer = 'AI'; }), 'NON_HUMAN_APPROVER'],
  ['export without approval', mutation('approval', value => { value.decision = 'changes_required'; }), 'EXPORT_WITHOUT_APPROVAL'],
  ['missing source', mutation('source', value => { value.registrySourceKnown = false; }), 'UNKNOWN_SOURCE'],
  ['unsupported claim', mutation('claims', value => { value.claimCoverage[0].coverage = 'unsupported'; }), 'UNSUPPORTED_CLAIM'],
  ['broken reference', mutation('claims', value => { value.claimCoverage[0].registrySourceCodes = ['SRC-UNKNOWN']; }), 'BROKEN_SOURCE_REFERENCE'],
  ['unknown source', mutation('source', value => { value.registrySourceCode = 'SRC-UNKNOWN'; }), 'UNKNOWN_SOURCE'],
  ['unknown reviewer', mutation('approval', value => { value.reviewer = 'UNKNOWN'; }), 'UNKNOWN_REVIEWER'],
  ['hash mismatch', mutation('approval', value => { value.contentHash = 'sha256:invalid'; }), 'APPROVAL_HASH_MISMATCH'],
  ['unknown verification authority', mutation('claims', value => { value.claimCoverage[0].verificationAuthorityIds.push('VERIFY-UNKNOWN'); }), 'UNKNOWN_VERIFICATION_AUTHORITY'],
  ['exportability hash mismatch', mutation('exportability', value => { value.approvalContentHash = 'sha256:invalid'; }), 'EXPORTABILITY_HASH_MISMATCH']
];
for (const [name, blocking, expected] of negativeGuards) assert(blocking.includes(expected), `${name}:${expected}`);

console.log('✓ PJA-W2F-C3R1 KN-PREFACE-001 Production Readiness Closure passed.');
console.log(`  Evidence ${closure.review.evidenceBundleHash}; 5/5 claims covered; TL approval valid; exportability allowed; ${negativeGuards.length} negative guards passed.`);
console.log('  C3: 1 production ready / 77 blocked. D dry-run: 1 eligible / 1 planned batch / 0 packages, Articles, exports or publications.');
