import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  loadKnowledgeBlueprintRegistry,
  loadKnowledgeBlueprintByBook,
  resolveKnowledgeBlueprintForNode,
  resolveKnowledgeBlueprintForPart
} from './lib/knowledge-blueprint/blueprint-registry-loader.mjs';
import {
  KNOWLEDGE_REGISTRY_AUTHORITY_VERSION,
  loadKnowledgeRegistryAuthorities,
  normalizeBookCode,
  normalizePartCode
} from './lib/knowledge-blueprint/registry-authority.mjs';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));
const [authority, knowledge, governance, controller] = await Promise.all([
  loadKnowledgeRegistryAuthorities(root),
  loadKnowledgeBlueprintRegistry(root),
  readJson('content/registry/master-governance.json'),
  read('assets/js/pages/free-explore.js')
]);
assert.equal(authority.contract.contract, KNOWLEDGE_REGISTRY_AUTHORITY_VERSION);
assert.deepEqual(authority.totals, { books: 4, parts: 16, nodes: 78 });
assert.deepEqual(knowledge.totals, authority.totals);
assert.equal(normalizeBookCode('book-2'), 'BOOK-2');
assert.equal(normalizeBookCode('Book II'), 'BOOK-2');
assert.equal(normalizePartCode('part-5'), 'P5');
assert.equal(normalizePartCode(13), 'P13');
assert.equal((await loadKnowledgeBlueprintByBook(root, 'book-2', { knowledge })).bookCode, 'BOOK-2');
assert.equal((await resolveKnowledgeBlueprintForPart(root, 'part-5', { knowledge })).bookCode, 'BOOK-2');
assert.equal((await resolveKnowledgeBlueprintForNode(root, 'KN-B1-P5-001', { knowledge })).bookCode, 'BOOK-2');
assert.equal(knowledge.registry.authority.publicationOwnership, 'content/registry/parts.json');
assert.equal(knowledge.registry.authorityContract, 'content/knowledge/contracts/knowledge-registry-authority-v2.json');
assert(controller.includes('/content/knowledge/blueprints/blueprint-registry.json'));
assert(!controller.includes("blueprint:\n      '/content/knowledge/blueprints/book-1-knowledge-blueprint.json'"));
const governanceEntry = governance.writeSourceRule.writeSourceMap.find(entry => entry.owner === 'KH-W4B Canonical Registry Authority');
assert(governanceEntry);
assert(governanceEntry.canonicalPaths.includes('content/knowledge/contracts/knowledge-registry-authority-v2.json'));

const allowedDirectRead = [
  /^scripts\/check-/, /^scripts\/book-i-manuscript/, /^scripts\/sync-pja-w2f-c0-book-i-registry\.mjs$/, /^scripts\/lib\/knowledge-manuscripts\//,
  /^content\/knowledge\/editorial\//, /^content\/knowledge\/manuscripts\//,
  /^docs\//, /^INSTALL\.md$/, /^content\/knowledge\/blueprints\/blueprint-registry\.json$/
];
const roots = ['assets', 'functions', 'scripts', 'content'];
const violations = [];
async function walk(directory) {
  for (const entry of await fs.readdir(path.join(root, directory), { withFileTypes: true })) {
    const relative = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) await walk(relative);
    else if (/\.(?:js|mjs|cjs|json|md)$/u.test(entry.name)) {
      const source = await read(relative);
      const directReadPattern = /(?:readJson|read|fetch|fs\.readFileSync|fs\.readFile)\s*\(\s*['"][^'"]*book-[1-4]-knowledge-blueprint\.json/u;
      if (directReadPattern.test(source) &&
          !allowedDirectRead.some(pattern => pattern.test(relative))) violations.push(relative);
    }
  }
}
for (const directory of roots) await walk(directory);
assert.deepEqual(violations, []);
console.log('✓ KH-W4B/W4C Canonical Registry Authority and Universal Consumption passed.');
console.log('  Book, Part, Canonical Node and Blueprint authorities are unique and fail closed.');
console.log('  Current public runtime consumes the Blueprint Registry; legacy direct reads are allowlisted for later migration.');
