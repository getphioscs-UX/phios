import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { loadPjaBlueprintContext } from './lib/knowledge-production/blueprint-context.mjs';
import { loadKnowledgeBlueprintRegistry } from './lib/knowledge-blueprint/blueprint-registry-loader.mjs';
import { loadKnowledgeInventory, resolveKnowledgeScope } from './lib/knowledge-production/readiness-system.mjs';
import { loadCanonicalContext } from './lib/knowledge-production/repository-loader.mjs';
import { isProductionEligible } from './lib/knowledge-production/production-resolver.mjs';

const root = process.cwd();
const execFileAsync = promisify(execFile);
const read = relative => fs.readFile(path.join(root, relative), 'utf8');
const readJson = async relative => JSON.parse(await read(relative));
const contract = await readJson('docs/pja/pja-r4a-blueprint-binding-foundation-v1.json');
const context = await loadPjaBlueprintContext(root);
const knowledge = await loadKnowledgeBlueprintRegistry(root);
const inventory = await loadKnowledgeInventory(root);

assert.equal(contract.status, 'accepted');
assert.equal(context.books.length, 4);
assert.equal(context.plannedCanonicalNodes, 716);
assert.equal(context.nodeBindings.size, 716);
assert.equal(knowledge.authorities.byNodeCode.size, 716);
assert.equal(resolveKnowledgeScope(inventory, { scope: 'ALL' }).length, 716);
assert.equal(resolveKnowledgeScope(inventory, { scope: 'BOOK-1' }).length, 65);
assert.equal(resolveKnowledgeScope(inventory, { scope: 'BOOK-2' }).length, 266);
assert.equal(resolveKnowledgeScope(inventory, { scope: 'BOOK-3' }).length, 187);
assert.equal(resolveKnowledgeScope(inventory, { scope: 'BOOK-4' }).length, 198);

const p5 = context.resolveNode('KN-B1-P5-001');
assert.equal(p5.sourceLineage.sourceBookCode, 'BOOK-1');
assert.equal(p5.publicationContext.publicationBookCode, 'BOOK-2');
assert.equal(p5.publicationContext.publicationPartCode, 'P5');
assert.equal(p5.blueprintNode.bookCode, 'BOOK-2');
assert.equal(p5.productionState.productionReady, false);
assert.equal(isProductionEligible(p5), false);
const canonicalP5 = await loadCanonicalContext(root, 'KN-B1-P5-001', 'zh-Hans', { requireReadiness: false });
assert.equal(canonicalP5.publicationContext.publicationBookCode, 'BOOK-2');
assert.equal(canonicalP5.sourceLineage.sourceBookCode, 'BOOK-1');

for (const entry of knowledge.registry.books) {
  const book = knowledge.byBookCode.get(entry.bookCode);
  assert(book, `Registry Loader did not resolve ${entry.bookCode}`);
  if (entry.productionEligibility === 'architecture_only') {
    for (const node of book.nodes) {
      assert.equal(context.resolveNode(node.nodeCode).productionState.productionReady, false);
      assert.equal(isProductionEligible(context.resolveNode(node.nodeCode)), false);
    }
  }
}

const authorityPaths = [
  'content/registry/books.json',
  'content/registry/parts.json',
  'content/knowledge/registry/nodes.json',
  'content/knowledge/migrations/node-publication-ownership-v2.json',
  'content/knowledge/editorial/c3/universal-production-readiness-index.json',
  'content/knowledge/production/orchestration/wave-registry.json'
];
for (const relative of authorityPaths) {
  const current = await read(relative);
  const { stdout } = await execFileAsync('git', ['show', `HEAD:${relative}`], { cwd: root, maxBuffer: 32 * 1024 * 1024 });
  assert.equal(current.replace(/\r\n?/g, '\n'), stdout.replace(/\r\n?/g, '\n'), `${relative} changed`);
}

const runtimeFiles = [
  'scripts/lib/knowledge-production/blueprint-context.mjs',
  'scripts/lib/knowledge-production/repository-loader.mjs',
  'scripts/lib/knowledge-production/readiness-system.mjs',
  'scripts/lib/knowledge-production/production-resolver.mjs'
];
for (const relative of runtimeFiles) {
  const source = await read(relative);
  assert(source.includes('blueprint-registry') || source.includes('loadPjaBlueprintContext') || source.includes('resolvePublicationContext'));
  assert(!source.includes("book-1-knowledge-blueprint.json"), `${relative} directly depends on Book I Blueprint`);
  assert(!/nodeCode\.(?:startsWith|match).*KN-B1/.test(source), `${relative} infers publication ownership from prefix`);
}

const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'pja-r4a-digest-'));
try {
  for (const relative of [
    'content/knowledge/blueprints',
    'content/knowledge/contracts',
    'content/knowledge/registry',
    'content/registry'
  ]) {
    await fs.cp(path.join(root, relative), path.join(temp, relative), { recursive: true });
  }
  const target = path.join(temp, 'content/knowledge/blueprints/book-2-knowledge-blueprint.json');
  await fs.appendFile(target, '\n');
  await assert.rejects(() => loadKnowledgeBlueprintRegistry(temp), /digest mismatch/);
} finally {
  await fs.rm(temp, { recursive: true, force: true });
}

console.log('✓ PJA-R4A Blueprint Binding Foundation passed.');
console.log('✓ 4 Blueprints and 716 Canonical Nodes resolve through universal Registry Authority.');
console.log('✓ P5 resolves source BOOK-1 / publication BOOK-2 only through resolvePublicationContext().');
console.log('✓ Optional Book scope does not create eligibility; readiness, review, approval and publication remain unchanged.');
console.log('✓ Digest mismatch fails closed and current Runtime has no direct Book I Blueprint authority.');
