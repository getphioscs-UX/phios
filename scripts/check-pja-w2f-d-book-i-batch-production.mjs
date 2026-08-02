import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import { D_CONTRACT, D_STATE, BATCH_OUTPUT_ROOT, buildBatchPlan, findBatchConflicts, groupEligible, selectEligible, validateBatchSystem } from './lib/knowledge-production/book-i-batch-production.mjs';

const root = process.cwd(), read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const pkg = read('package.json'), contract = read(D_CONTRACT), state = read(D_STATE);
assert.equal(pkg.scripts['check:pja-w2f-d'], 'npm run check:pja-w2f-c3 && node scripts/check-pja-w2f-d-book-i-batch-production.mjs');
assert.equal(pkg.scripts['knowledge:plan-book-i-production'], 'node scripts/plan-book-i-batch-production.mjs');
assert.equal(pkg.scripts['knowledge:produce-book-i-batch'], 'node scripts/produce-book-i-batch.mjs');
assert.equal(pkg.scripts['knowledge:validate-book-i-batch'], 'node scripts/validate-book-i-batch.mjs');
assert(pkg.scripts['check:pja-w2f-c2-batch-historical']); assert(pkg.scripts['check:pja-w2f-c3-production-historical']);

const plan = buildBatchPlan(root), c3 = read('content/knowledge/editorial/c3/universal-production-readiness-index.json');
assert.equal(plan.bookINodes, c3.entries.length); assert.equal(plan.productionReadyNodes, c3.entries.filter(entry => entry.productionReady).length);
assert.equal(plan.productionBlockedNodes, c3.entries.filter(entry => !entry.productionReady).length);
assert.equal(plan.status, plan.eligibleNodes.length ? 'planned' : 'no_eligible_nodes');
assert.equal(plan.plannedBatches.reduce((total, batch) => total + batch.nodeCount, 0), plan.eligibleNodes.length);
assert.equal(contract.systemStatus, 'frozen'); assert.equal(contract.freezeLabel, 'PJA-W2F-D-v1.0.0-Frozen');
assert.equal(state.bookIBatchState, 'empty'); assert.equal(state.eligibleNodes.length, 0); assert.equal(state.plannedBatches.length, 0);
assert.equal(state.generatedProductionPackages, 0); assert.equal(state.generatedArticles, 0); assert.equal(state.generatedProductionExports, 0); assert.equal(state.published, 0);
assert.equal(validateBatchSystem(root).valid, true);

const protectedPaths = ['content/knowledge/registry', 'content/knowledge/readiness', 'content/knowledge/editorial/c2', 'content/knowledge/editorial/c3', 'content/knowledge/articles', 'content/knowledge/production/articles'];
const before = protectedPaths.map(treeDigest);
const planned = run('scripts/plan-book-i-batch-production.mjs'); assert.equal(planned.status, 0, planned.stderr); assert.equal(JSON.parse(planned.stdout).status, plan.status);
const dry = run('scripts/produce-book-i-batch.mjs'); assert.equal(dry.status, 0, dry.stderr); assert.equal(JSON.parse(dry.stdout).status, plan.status);
const explicitDry = run('scripts/produce-book-i-batch.mjs', '--dry-run'); assert.equal(explicitDry.status, 0, explicitDry.stderr);
if (!plan.eligibleNodes.length) { const apply = run('scripts/produce-book-i-batch.mjs', '--apply'); assert.equal(apply.status, 0, apply.stderr); assert(apply.stdout.includes('0 writes')); }
const validate = run('scripts/validate-book-i-batch.mjs'); assert.equal(validate.status, 0, validate.stderr);
assert.deepEqual(protectedPaths.map(treeDigest), before, 'zero-node commands mutated protected content');

// Future-ready fixture proves selection uses all C3 gates and grouping preserves canonical order.
const nodes = [
  { nodeCode: 'KN-B1-P2-002', primaryAssetType: 'article', canonicalLanguage: 'zh-Hans' },
  { nodeCode: 'KN-B1-P1-001', primaryAssetType: 'article', canonicalLanguage: 'zh-Hans' },
  { nodeCode: 'KN-B1-P2-001', primaryAssetType: 'article', canonicalLanguage: 'zh-Hans' }
];
const ready = nodeCode => ({ nodeCode, status: 'production_ready', productionReady: true, exportability: 'allowed', blocking: [], assessmentFile: `${nodeCode}.json` });
const assessment = nodeCode => ({ productionReady: true, exportability: 'allowed', gates: { humanProductionApproval: { status: 'passed' }, c2FrozenThesisBoundary: { status: 'passed' } }, authority: { c2FreezeHashMatched: true, c2ContentHash: `sha256:${nodeCode}` } });
const entries = nodes.map(node => ready(node.nodeCode)), assessments = new Map(nodes.map(node => [node.nodeCode, assessment(node.nodeCode)]));
const selected = selectEligible(nodes, entries, assessments); assert.deepEqual(selected.map(item => item.nodeCode), nodes.map(node => node.nodeCode));
const grouped = groupEligible(selected, 1); assert.deepEqual(grouped.map(batch => batch.nodeCodes[0]), nodes.map(node => node.nodeCode));
const denied = structuredClone(assessment(nodes[0].nodeCode)); denied.gates.humanProductionApproval.status = 'failed'; assessments.set(nodes[0].nodeCode, denied);
assert(!selectEligible(nodes, entries, assessments).some(item => item.nodeCode === nodes[0].nodeCode));
const conflictRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pja-w2f-d-conflict-'));
try {
  const conflictFile = path.join(conflictRoot, BATCH_OUTPUT_ROOT, grouped[0].batchId, 'production-manifest.json');
  fs.mkdirSync(path.dirname(conflictFile), { recursive: true }); fs.writeFileSync(conflictFile, '{}\n');
  assert.deepEqual(findBatchConflicts(conflictRoot, grouped), [grouped[0].batchId]);
} finally { fs.rmSync(conflictRoot, { recursive: true, force: true }); }

const negativeGuards = [
  () => reject(plan.eligibleNodes.length !== plan.productionReadyNodes), () => reject(plan.plannedBatches.some(batch => batch.nodeCount < 1)),
  () => reject(state.generatedProductionPackages > 0), () => reject(state.generatedArticles > 0), () => reject(state.generatedProductionExports > 0), () => reject(state.published > 0),
  () => reject(contract.zeroEligibleNodes.success !== true), () => reject(contract.zeroEligibleNodes.applyWrites !== 0), () => reject(contract.packageContract.forbidden.includes('Article body generation') === false),
  () => reject(contract.selectionAuthority !== 'PJA-W2F-C3'), () => reject(contract.grouping.canonicalOrderRequired !== true),
  () => reject(contract.grouping.forbiddenOrderingInputs.includes('marketing priority') === false), () => reject(c3.entries.some(entry => entry.productionReady && entry.exportability !== 'allowed')),
  () => reject(c3.entries.some(entry => entry.productionReady && entry.blocking.length)), () => reject(fs.existsSync(path.join(root, 'content/knowledge/production/batches')))
];
for (const guard of negativeGuards) assert.throws(guard, /NEGATIVE_FIXTURE_REJECTED/);

console.log('✓ PJA-W2F-D Book I Batch Production System frozen.');
console.log(`  ${plan.bookINodes} Book I Nodes; ${plan.eligibleNodes.length} eligible; ${plan.plannedBatches.length} batches; 0 packages, Articles, Production Exports or publications.`);
console.log(`  Zero-ready-node handling, C3-only selection, canonical grouping, dry-run safety and ${negativeGuards.length} negative guards passed.`);
function reject(condition) { if (!condition) throw new Error('NEGATIVE_FIXTURE_REJECTED'); }
function run(script, ...args) { return spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' }); }
function treeDigest(relative) { const base = path.join(root, relative), rows = []; function walk(current) { if (!fs.existsSync(current)) return; for (const entry of fs.readdirSync(current, { withFileTypes: true })) { const absolute = path.join(current, entry.name); if (entry.isDirectory()) walk(absolute); else rows.push(`${path.relative(base, absolute)}:${crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex')}`); } } walk(base); return crypto.createHash('sha256').update(rows.sort().join('\n')).digest('hex'); }
