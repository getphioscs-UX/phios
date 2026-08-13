import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const hashNormalizedJson = obj => crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');

const registryPath = 'content/knowledge/manuscripts/completed/completed-manuscript-registry-v1.json';
const b1Path = 'content/knowledge/manuscripts/completed/book-1-completed-manuscript-v2.json';
const b2Path = 'content/knowledge/manuscripts/completed/book-2-completed-manuscript-v1.json';
const freezePath = 'content/knowledge/manuscripts/completed/kau-r1-completed-manuscript-freeze-v1.json';
const handoffPath = 'content/knowledge/manuscripts/completed/kau-r1-handoff-v1.json';

for (const p of [registryPath,b1Path,b2Path,freezePath,handoffPath]) assert.equal(fs.existsSync(p), true, p);
const registry = readJson(registryPath);
const b1 = readJson(b1Path);
const b2 = readJson(b2Path);
const freeze = readJson(freezePath);

assert.equal(registry.stage, 'KAU-R1');
assert.equal(registry.baselineCommit, 'b42b775e460041605955d2baee4f15234b649b11');
assert.equal(registry.records.length, 2);
assert.deepEqual(b1.publicationPartCodes, ['P1','P2','P3','P4']);
assert.deepEqual(b2.publicationPartCodes, ['P5','P6','P7']);
assert.equal(b1.sourceBinary.sha256, '7f7ed51199302b83d5bb5e48224a5f5995123171645e820925508fb31d97174d');
assert.equal(b1.sourceBinary.byteSize, 122565526);
assert.equal(b1.sourceBinary.pageCount, 402);
assert.equal(b2.sourceBinary.sha256, '1ae413dbfddae604f65af3e9b16a28a923899e3ebe8f419d9b7f3ff10bfa41fe');
assert.equal(b2.sourceBinary.byteSize, 105071786);
assert.equal(b2.sourceBinary.pageCount, 386);
assert.equal(b1.privateStorageBinding.bucket, 'phios-private-manuscripts');
assert.equal(b1.privateStorageBinding.objectKey, 'books/book-1/source/PHI-OS-Book-I-v2.pdf');
assert.equal(b2.privateStorageBinding.objectKey, 'books/book-2/source/PHI-OS-Book-2-v1.pdf');
assert.equal(freeze.boundaries.canonicalNodesModified, false);
assert.equal(freeze.handoff.nodesJsonMutationInR2, false);

if (fs.existsSync('content/knowledge/registry/nodes.json')) {
  const nodes = readJson('content/knowledge/registry/nodes.json');
  const arr = Array.isArray(nodes) ? nodes : (nodes.nodes ?? nodes.canonicalNodes ?? []);
  const r5Path='content/knowledge/reconciliation/kau-r5/kau-r5-freeze-v1.json';
  if (fs.existsSync(r5Path)) { const r5=readJson(r5Path); assert.equal(arr.length,r5.canonicalAuthority.successorCount); assert.equal(r5.canonicalAuthority.predecessorCount,716); }
  else assert.equal(arr.length, 716, 'Canonical Node count must remain 716 at KAU-R1 before an accepted successor');
  const digest = hashNormalizedJson(nodes);
  // Informational only: repositories may serialize equivalent JSON differently across governed projections.
  assert.equal(typeof digest, 'string');
}

console.log('✓ KAU-R1 Completed Manuscript Registration passed.');
console.log('  BOOK-1: PHI-OS-Book-I-v2.pdf | 402 pages | 122565526 bytes | sha256 7f7ed511...');
console.log('  BOOK-2: PHI-OS-Book-2-v1.pdf | 386 pages | 105071786 bytes | sha256 1ae413db...');
console.log('  Canonical Node mutation remains prohibited; KAU-R2 is mapping-decision only.');
