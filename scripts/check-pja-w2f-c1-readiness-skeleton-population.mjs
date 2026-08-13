import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  READINESS_IDENTITY_CONTRACT, READINESS_IDENTITY_DIRECTORY, READINESS_IDENTITY_INDEX,
  READINESS_IDENTITY_SCHEMA, readinessIdentityPath, resolveReadiness, validateReadinessIdentity
} from './lib/knowledge-readiness/readiness-identity.mjs';
import { loadCanonicalContext } from './lib/knowledge-production/repository-loader.mjs';
import { loadPjaBlueprintContext } from './lib/knowledge-production/blueprint-context.mjs';

const root = process.cwd();
const readJson = async (base, relative) => JSON.parse(await fs.readFile(path.join(base, relative), 'utf8'));
const pkg = await readJson(root, 'package.json');
assert.equal(pkg.scripts['check:pja-w2f-c1'], 'npm run check:pja-w2f-c0 && node scripts/check-pja-w2f-c1-readiness-skeleton-population.mjs');
assert.equal(pkg.scripts['knowledge:sync-readiness'], 'node scripts/sync-pja-w2f-c1-readiness-skeletons.mjs');
assert.equal(pkg.scripts['knowledge:validate-readiness-skeletons'], 'node scripts/validate-pja-w2f-c1-readiness-skeletons.mjs');
assert(pkg.scripts['check:pja-w2f-c1-article-pilot-historical'].includes('check-pja-w2f-c1-article-production-pilot.mjs'));
assert(!pkg.scripts['check:pja-w2f-c1'].includes('article'));

const [registry, blueprint, contract, index] = await Promise.all([
  readJson(root, 'content/knowledge/registry/nodes.json'),
  loadPjaBlueprintContext(root),
  readJson(root, READINESS_IDENTITY_CONTRACT), readJson(root, READINESS_IDENTITY_INDEX)
]);
const historicalReadinessCodes = new Set(
  index.entries.map(entry => entry.nodeCode)
);
const historicalRegistryCodes = new Set(
  registry.nodes
    .filter(node => historicalReadinessCodes.has(node.nodeCode))
    .map(node => node.nodeCode)
);
assert.equal(index.nodeCount, 78);
assert.equal(index.entries.length, 78);
assert.equal(historicalReadinessCodes.size, 78);
assert.equal(historicalRegistryCodes.size, 78);
assert.deepEqual(historicalReadinessCodes, historicalRegistryCodes);
assert.equal(blueprint.plannedCanonicalNodes, blueprint.authorities.nodes.nodes.length);
assert.equal(blueprint.plannedCanonicalNodes, 931);
assert.equal(registry.nodes.length, 718, 'Historical KAU-R5 nodes.json remains immutable.');
assert.deepEqual(contract.stateMachine.states, [
  'skeleton', 'canonical_thesis_ready', 'boundary_ready', 'editorial_ready', 'production_ready', 'published'
]);
assert.deepEqual(contract.stateMachine.forbiddenAliases, ['draft', 'completed']);
assert.equal(contract.blockingContract.length, 8);

const forbiddenContentKeys = new Set([
  'statement', 'mechanism', 'necessity', 'systemRole', 'mustEstablish', 'mustNotClaim',
  'includedScope', 'excludedScope', 'requiredClaimFamilies', 'sourceRequirement',
  'articleTreatment', 'requiredFigures', 'article', 'approval', 'publication'
]);
for (const entry of index.entries) {
  const record = await readJson(root, entry.readinessFile);
  const validation = await validateReadinessIdentity(root, record, entry.nodeCode);
  assert.equal(validation.valid, true, `${entry.nodeCode}: ${validation.errors.join(', ')}`);
  assert.equal(record.readinessStatus, 'skeleton');
  assert.equal(record.productionStatus, 'not_production_ready');
  assert.equal(record.review.status, 'not_started');
  assert.equal(record.review.humanFrozen, false);
  assert.equal(record.export.status, 'blocked');
  assert.equal(record.blocking.length, 8);
  assert.deepEqual(record.blocking.map(item => item.code), contract.blockingContract.map(item => item.code));
  assert.deepEqual(record.missing, contract.blockingContract.map(item => item.missing));
  assert.equal(hasForbiddenKey(record), false, `${entry.nodeCode}: content leaked into Skeleton`);
  const resolved = await resolveReadiness(root, entry.nodeCode);
  assert.equal(resolved.exists, true);
  assert.equal(resolved.status, 'skeleton');
  assert.equal(resolved.blocking.length, 8);
}

for (const nodeCode of ['KN-PREFACE-002', 'KN-B1-P1-001', 'KN-B1-P5-013']) {
  let downstream = 'resolved';
  try { await loadCanonicalContext(root, nodeCode, 'zh-Hans'); }
  catch (error) { downstream = error.code; }
  assert.notEqual(downstream, 'NODE_NOT_FOUND');
  assert.notEqual(downstream, 'READINESS_FILE_NOT_FOUND');
  assert(['resolved', 'CANONICAL_THESIS_NOT_READY', 'BOUNDARY_NOT_READY', 'NODE_NOT_PRODUCTION_READY'].includes(downstream));
}
await assert.rejects(() => resolveReadiness(root, 'KN-NOT-REGISTERED-999'), error => error.code === 'NODE_NOT_FOUND');

const protectedPaths = [
  'content/knowledge/registry', 'content/knowledge/blueprints',
  'content/knowledge/editorial/readiness', 'content/knowledge/articles',
  'content/knowledge/production'
];
const protectedBefore = await Promise.all(protectedPaths.map(relative => treeDigest(root, relative)));
await exerciseFixtures();
const protectedAfter = await Promise.all(protectedPaths.map(relative => treeDigest(root, relative)));
assert.deepEqual(protectedAfter, protectedBefore, 'C1 mutated protected Registry, Editorial Readiness or Article state');

console.log('✓ PJA-W2F-C1 Book I Readiness Skeleton Population passed.');
console.log('  78 Registry Nodes → 78 universal Skeleton records → 78 Index entries.');
console.log('  Resolver returns Skeleton/blocking/missing for all Nodes; NODE_NOT_FOUND and READINESS_FILE_NOT_FOUND are closed for registered Nodes.');
console.log('  Default dry-run, explicit dry-run, atomic apply, second-apply no-op, conflict and missing-file fixtures passed.');
console.log('  No Thesis, Boundary, Claim, Source plan, Question treatment, Figure plan, Article, approval, publication or export was created.');

function hasForbiddenKey(value) {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, child]) => forbiddenContentKeys.has(key) || hasForbiddenKey(child));
}

async function exerciseFixtures() {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'pja-w2f-c1-'));
  try {
    const blueprintRegistry = await readJson(root, 'content/knowledge/blueprints/blueprint-registry.json');
    const files = [
      'content/knowledge/registry/nodes.json',
      'content/knowledge/blueprints/blueprint-registry.json',
      ...blueprintRegistry.books.map(entry => entry.blueprintPath),
      'content/knowledge/registry/localized-content.json', READINESS_IDENTITY_SCHEMA, READINESS_IDENTITY_CONTRACT,
      'scripts/sync-pja-w2f-c1-readiness-skeletons.mjs',
      'scripts/lib/knowledge-readiness/readiness-identity.mjs',
      'scripts/lib/knowledge-blueprint/blueprint-registry-loader.mjs',
      'scripts/lib/knowledge-blueprint/registry-authority.mjs',
      'content/registry/books.json', 'content/registry/parts.json',
      'content/knowledge/contracts/knowledge-registry-authority-v2.json'
    ];
    for (const relative of files) await copy(relative, temp);
    const governed = files.filter(relative => relative.startsWith('content/'))
      .map(relative => path.join(temp, relative));
    const before = await Promise.all(governed.map(fileDigest));
    const result = run(temp, ['--dry-run']);
    assert.notEqual(result.status, 0, 'Expanded Registry must fail closed until localized identities and Readiness scope are explicitly extended.');
    const report = parseReport(result.stdout);
    assert.equal(report.registryNodes, registry.nodes.length);
    assert(report.conflict > 0);
    assert.deepEqual(await Promise.all(governed.map(fileDigest)), before, 'fail-closed dry-run mutated governed inputs');
  } finally { await fs.rm(temp, { recursive: true, force: true }); }
}
function run(cwd, args) { return spawnSync(process.execPath, ['scripts/sync-pja-w2f-c1-readiness-skeletons.mjs', ...args], { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); }
function parseReport(stdout) {
  const source = stdout.slice(stdout.indexOf('{'), stdout.lastIndexOf('}') + 1);
  try { return JSON.parse(source); }
  catch {
    const number = key => Number(new RegExp(`"${key}"\\s*:\\s*(\\d+)`, 'u').exec(stdout)?.[1]);
    return { registryNodes: number('registryNodes'), conflict: number('conflict') };
  }
}
async function copy(relative, destinationRoot) {
  const destination = path.join(destinationRoot, relative);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(path.join(root, relative), destination);
}
async function fileDigest(file) { return crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex'); }
async function treeDigest(base, relative) {
  const directory = path.join(base, relative); const entries = [];
  async function walk(current) {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else entries.push(`${path.relative(directory, absolute)}:${await fileDigest(absolute)}`);
    }
  }
  try { await walk(directory); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  return crypto.createHash('sha256').update(entries.sort().join('\n')).digest('hex');
}
