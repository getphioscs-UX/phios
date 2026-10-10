import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildPublishedKnowledgeProjection } from './lib/knowledge-public/public-projection.mjs';
import { loadKnrRegistryAuthority } from './lib/knowledge-runtime/registry-consumer.mjs';

const root = process.cwd();
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));
const stable = value => JSON.stringify(value, null, 2) + '\n';
const sha = source => crypto.createHash('sha256').update(source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8').digest('hex');
const manifest = json('content/knowledge/contracts/knowledge-checker-manifest-v1.json');
const freeze = json('content/knowledge/contracts/kh-w4k-acceptance-freeze-v1.json');
const authority = loadKnrRegistryAuthority(root);
const expectedProjection = buildPublishedKnowledgeProjection(root);

assert.deepEqual(manifest.allowedCapabilities, ['read','validate','compare','fail','report']);
assert.equal(manifest.writeBoundary.repositoryWritesAllowed, false);
for (const forbidden of manifest.forbiddenCapabilities) assert.ok(!manifest.allowedCapabilities.includes(forbidden));
for (const checker of manifest.checkers) {
  assert.match(checker.command, /^node scripts\/check-[a-z0-9.-]+\.mjs$/i);
  assert.equal(/knowledge:(freeze|publish|promote)|scripts\/(build|complete|finalize|produce|apply|upload)-/i.test(checker.command), false);
  assert.ok(fs.existsSync(path.join(root, checker.command.replace(/^node /, ''))));
}

for (const [name, value] of Object.entries(expectedProjection)) {
  const rel = `content/knowledge/public/${name}`;
  assert.equal(read(rel), stable(value), `Deterministic public projection mismatch: ${name}`);
  assert.equal(sha(read(rel)), freeze.digests.publicProjection[name]);
}
const catalog = expectedProjection['public-knowledge-catalog.json'].records[0];
assert.equal(catalog.registeredNodeCount, authority.blueprintRegistry.totals.canonicalNodes);
assert.equal(catalog.registeredNodeCount, freeze.acceptance.canonicalNodeCount);
assert.equal(catalog.publishedNodeCount, 3);
assert.equal(catalog.publishedArticleCount, 6);
assert.equal(catalog.policy.registryPresenceEqualsPublication, false);
assert.equal(authority.books.size, freeze.acceptance.registeredBookCount);
assert.equal(authority.parts.size - 1, freeze.acceptance.numberedPartCount);

const expectedOwnership = { P5:'BOOK-2', P10:'BOOK-3', P11:'BOOK-3', P12:'BOOK-3', P13:'BOOK-4', P14:'BOOK-4', P15:'BOOK-4' };
for (const [partCode, owner] of Object.entries(expectedOwnership)) {
  const part = authority.parts.get(partCode);
  assert.equal(String(part.book).replace(/^book-/i,'BOOK-').toUpperCase(), owner);
}
const nodeCodes = [...authority.nodes.keys()];
assert.equal(new Set(nodeCodes).size, nodeCodes.length, 'Node Identity must remain unique and stable.');
assert.equal(authority.blueprintRegistry.policies.nodeIdentityChangesWithPublication, false);

const publicSerialized = JSON.stringify(expectedProjection);
for (const forbidden of ['content/knowledge/manuscripts','content/knowledge/editorial','candidateStatus','approvalStatus','reviewStatus']) assert.equal(publicSerialized.includes(forbidden), false);
for (const record of expectedProjection['published-articles.json'].records) assert.equal(record.publicationStatus, 'published');
assert.equal(sha(read('content/knowledge/blueprints/blueprint-registry.json')), freeze.digests.blueprintRegistry);
assert.equal(sha(read('content/knowledge/blueprints/knowledge-blueprint-freeze-v2.json')), freeze.digests.blueprintFreeze);
assert.equal(sha(read('content/knowledge/registry/nodes.json')), freeze.digests.nodeRegistry);
assert.equal(sha(read('content/knowledge/contracts/knowledge-checker-manifest-v1.json')), freeze.digests.checkerManifest);
assert.equal(freeze.acceptance.humanReviewAuthority, 'unchanged');
assert.equal(freeze.acceptance.approvalAuthority, 'unchanged');
assert.equal(freeze.acceptance.publicationAuthority, 'unchanged');

console.log('✓ KH-W4I Published Knowledge Projection Foundation passed.');
console.log(`  ${catalog.publishedNodeCount} published nodes / ${catalog.publishedArticleCount} published articles projected from ${catalog.registeredNodeCount} registered nodes.`);
console.log('✓ KH-W4J Checker, Compatibility and Deprecation passed.');
console.log('  Checker capabilities are validation-only; repository mutation remains forbidden.');
console.log('✓ KH-W4K Full Acceptance and Freeze passed.');
console.log(`  ${authority.books.size} Books, ${authority.parts.size - 1} numbered Parts, ${authority.nodes.size} Canonical Nodes; ownership, digests, private boundary and deterministic rebuild valid.`);
