import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { APS3_BASELINE, APS3_CONTRACT, buildBatchPlan } from './lib/article-simplification/batch-orchestrator-v1.mjs';

const root = process.cwd();
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const expectedReady = [
  'KN-B1-P1-006',
  'KN-B1-P2-001',
  'KN-B1-P2-009',
  'KN-B1-P3-005',
  'KN-B1-P3-015',
  'KN-B1-P4-006'
];

const contract = readJson(APS3_CONTRACT);
assert.equal(contract.work, 'APS-3');
assert.equal(contract.status, 'ACTIVE');
assert.equal(contract.baselineCommit, APS3_BASELINE);
assert.equal(contract.command, 'npm run article:batch -- --book BOOK-1 --count 30');
assert.equal(contract.inputContract.requiredReadyState, 'ARTICLE_READY');
assert.equal(contract.inputContract.mayInspectUnderlyingC2C3KppVapGateInternals, false);
assert.equal(contract.governance.selectionMayCreateCandidate, false);
assert.equal(contract.governance.selectionMayPublish, false);

const pkg = readJson('package.json');
assert.equal(pkg.scripts?.['article:batch'], 'node scripts/article-batch.mjs');
const aps7SuccessorPresent = fs.existsSync(path.join(root, 'content/production/article-simplification/contracts/aps-7-one-command-publication-contract-v1.json'));
if (aps7SuccessorPresent) assert.equal(pkg.scripts?.['article:publish'], 'node scripts/article-publish.mjs', 'APS-7 successor may add article:publish; APS-3 itself remains selection-only.');
else assert.equal(Boolean(pkg.scripts?.['article:publish']), false, 'APS-3 must not add article:publish before the publication bridge exists');

const source = fs.readFileSync(path.join(root, 'scripts/lib/article-simplification/batch-orchestrator-v1.mjs'), 'utf8');
assert.match(source, /buildArticleReadiness/);
for (const forbidden of [
  'content/knowledge/editorial/c2',
  'content/knowledge/editorial/c3',
  'vap-w6a-batch-',
  'execution-authority-v1.json',
  'multilingual-node-projection-registry.json'
]) assert.equal(source.includes(forbidden), false, `APS-3 must not duplicate APS-2 gate internals: ${forbidden}`);

const committedPath = 'content/production/article-simplification/batches/BATCH-001/batch-plan.v1.json';
assert.equal(fs.existsSync(path.join(root, committedPath)), true, `${committedPath} must exist`);
const committed = readJson(committedPath);
const aps7RunPath = 'content/production/article-simplification/batches/BATCH-001/publication-run.v1.json';
const aps7RunPresent = fs.existsSync(path.join(root, aps7RunPath));
const plan = aps7RunPresent ? committed : buildBatchPlan(root, {
  bookCode: 'BOOK-1',
  locale: 'zh-Hans',
  count: 30,
  batchCode: 'BATCH-001',
  createdAt: '2026-08-14T02:15:00.000Z'
}).plan;
assert.equal(plan.request.requestedCountMeaning, 'maximum_not_quota');
assert.equal(plan.sourceReadiness.readyStateConsumed, 'ARTICLE_READY');
assert.equal(plan.selection.availableReadyCount, 6);
assert.equal(plan.selection.selectedCount, 6);
assert.equal(plan.selection.shortfallCount, 24);
assert.equal(plan.selection.unselectedReadyCount, 0);
assert.equal(plan.selection.downstreamPjaWaveMaximum, 24);
assert.deepEqual(plan.entries.map(entry => entry.nodeCode), expectedReady);
assert.deepEqual(plan.selection.chunks.map(chunk => chunk.nodeCodes).flat(), expectedReady);
assert.equal(plan.governance.consumesSingleReadinessOnly, true);
assert.equal(plan.governance.reinterpretsUnderlyingGateInternals, false);
assert.equal(plan.governance.createsHumanDecisionAuthority, false);
assert.equal(plan.governance.createsCandidate, false);
assert.equal(plan.governance.invokesProvider, false);
assert.equal(plan.governance.createsPublication, false);
if (aps7RunPresent) {
  const run = readJson(aps7RunPath);
  assert.deepEqual(run.outcomes.map(entry => entry.nodeCode).sort(), [...expectedReady].sort(), 'APS-7 successor must consume the frozen APS-3 batch scope instead of rebuilding it from post-publication readiness.');
}
assert.equal(committed.batchCode, 'BATCH-001');
assert.deepEqual(committed.entries.map(entry => entry.nodeCode), expectedReady);
assert.equal(committed.selection.selectedCount, 6);
assert.equal(committed.selection.shortfallCount, 24);
assert.equal(committed.nextWork, 'APS-4_CANDIDATE_ORCHESTRATION');

console.log('✓ APS-3 Batch Orchestrator passed.');
console.log('✓ article:batch consumes APS-2 ARTICLE_READY only; it does not duplicate C2/C3/KPP/VAP gate interpretation.');
console.log('✓ BOOK-1 --count 30 deterministically selects the 6 currently ready nodes and treats 24 as a valid shortfall.');
console.log('✓ No Candidate, Human Decision, Provider or Publication authority is created by APS-3.');
console.log('→ Next: APS-4 Candidate Orchestration extends the same article:batch command.');
