import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildKnowledgeRuntimeIndex } from './knowledge-runtime.mjs';
import { loadKnrRegistryAuthority } from './lib/knowledge-runtime/registry-consumer.mjs';

const root = process.cwd();
const authority = loadKnrRegistryAuthority(root);
const output = buildKnowledgeRuntimeIndex();
const records = name => output[name].records;

assert.equal(authority.books.size, 4);
assert.equal(authority.nodes.size, 716);
assert.equal(authority.parts.size, 16);
assert.equal(authority.resolvePublicationContext('KN-B1-P5-001').sourceBookCode, 'BOOK-1');
assert.equal(authority.resolvePublicationContext('KN-B1-P5-001').publicationBookCode, 'BOOK-2');
assert.equal(authority.resolvePublicationContext('KN-B1-P5-001').publicationPartCode, 'P5');
assert.equal(records('nodes-index.json').length, 6);
assert.equal(records('publications-index.json').length, 6);
assert.ok(records('nodes-index.json').every(record => record.publicationBookCode && record.publicationPartCode));
assert.ok(records('publications-index.json').every(record => record.publicationStatus === 'published'));
assert.ok(records('questions-index.json').every(record => record.publicStatus.startsWith('published')));
assert.ok(records('aliases-index.json').every(record => record.publicStatus === 'published'));
const serialized = JSON.stringify(output);
for (const forbidden of ['content/knowledge/production', 'content/knowledge/editorial', 'Private Manuscript', 'candidateStatus']) {
  assert.equal(serialized.includes(forbidden), false, `Public KNR leaked forbidden source: ${forbidden}`);
}
assert.equal(serialized.includes('KN-B1-P5-001'), false, 'Unpublished P5 node must not enter public KNR index.');
assert.equal(fs.readFileSync(path.join(root, 'scripts/knowledge-runtime.mjs'), 'utf8').includes('book-1-knowledge-blueprint.json'), false);

const original = fs.readFileSync(path.join(root, 'content/knowledge/blueprints/blueprint-registry.json'), 'utf8');
const tampered = original.replace('PHI-OS-KNOWLEDGE-BLUEPRINT-REGISTRY-v2.0.0', 'PHI-OS-KNOWLEDGE-BLUEPRINT-REGISTRY-v2.0.X');
const tempRoot = fs.mkdtempSync(path.join(root, '.tmp-kh-w4g-'));
try {
  fs.cpSync(path.join(root, 'content'), path.join(tempRoot, 'content'), { recursive: true });
  fs.writeFileSync(path.join(tempRoot, 'content/knowledge/blueprints/blueprint-registry.json'), tampered);
  assert.throws(() => loadKnrRegistryAuthority(tempRoot), /digest mismatch/);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('KH-W4G KNR Registry Consumption Migration checks passed.');
console.log('Validated: 4 Books, 16 Parts, 716 Nodes, P5 -> BOOK-2, published-only projection, registry-led filters, digest fail-closed.');
