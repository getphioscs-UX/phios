import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { loadKnrRegistryAuthority } from './lib/knowledge-runtime/registry-consumer.mjs';
import { buildPublishedKnowledgeProjection } from './lib/knowledge-public/public-projection.mjs';

const read = path => fs.readFile(path, 'utf8');
const json = async path => JSON.parse(await read(path));
const [compatibility, wprSuccessor, packageJson, routeRegistry, authorityContract, successorNodes, historicalBookW0, redirects] = await Promise.all([
  json('content/knowledge/migrations/book-w1f/book-w1f-compatibility-reconciliation-v1.json'),
  json('content/knowledge/migrations/book-w1f/wpr-book-w1-successor-compatibility-v1.json'),
  json('package.json'),
  json('content/web-production/registries/wpr-route-registry-v1.json'),
  json('content/knowledge/contracts/knowledge-registry-authority-book-w1d-v1.json'),
  json('content/knowledge/registry/successors/book-w1d/canonical-nodes-v1.json'),
  read('scripts/check-book-w0-four-volume-migration.mjs'),
  read('_redirects')
]);

assert.equal(compatibility.status, 'accepted-successor-compatibility-active');
assert.equal(wprSuccessor.status, 'accepted-successor-web-production-runtime-active');
assert.equal(compatibility.consumers.length, 17);
assert(compatibility.consumers.every(record => record.covered === true));
assert.equal(compatibility.acceptance.coveredConsumerCount, 17);
assert.equal(compatibility.acceptance.uncoveredConsumerCount, 0);
assert.equal(compatibility.authorityRules.canonicalNodeCodePrefixIsPublicationAuthority, false);
assert.equal(authorityContract.authorities.canonicalKnowledge.path, 'content/knowledge/registry/successors/book-w1d/canonical-nodes-v1.json');
assert.equal(successorNodes.nodes.length, 931);

const requiredScripts = [
  'check:book-w1', 'check:book-w1-ownership', 'check:book-w1-outline', 'check:book-w1-blueprints',
  'check:book-w1-canonical', 'check:book-w1-public-projection', 'check:book-w1-compatibility', 'check:book-w1-freeze'
];
for (const command of requiredScripts) assert(packageJson.scripts[command], `Missing successor checker: ${command}`);
assert.equal(packageJson.scripts['check:book-w1-web-production-runtime'], 'node scripts/check-book-w1f-wpr-successor-current.mjs');
assert(String(packageJson.scripts.postcheck).includes('npm run check:web-production-runtime'));
assert.equal(packageJson.scripts['check:web-production-runtime'], 'npm run check:book-w1-web-production-runtime');
assert.deepEqual(compatibility.successorCheckers, requiredScripts);
assert.deepEqual(compatibility.historicalCheckers.map(record => record.command), [
  'check:book-w0', 'check:kh-w4b.5-book-2', 'check:kh-w4b.5-book-3', 'check:kh-w4b.5-book-4'
]);
assert(compatibility.historicalCheckers.every(record => record.disposition === 'KEEP' && record.mutatedToFiveVolume === false));
assert(historicalBookW0.includes('Expected exactly four books.'));
assert(!historicalBookW0.includes('Expected exactly five books.'));

const authority = loadKnrRegistryAuthority(process.cwd());
assert.equal(authority.nodes.size, 931);
assert.equal(authority.books.size, 5);
assert.equal(authority.sourcePaths.nodeRegistryPath, 'content/knowledge/registry/successors/book-w1d/canonical-nodes-v1.json');
assert.equal(authority.sourcePaths.freezePath, 'content/knowledge/blueprints/successors/book-w1d/knowledge-blueprint-freeze-v1.json');
for (const [nodeCode, bookCode, partCode] of [
  ['KN-B2-P8-001', 'BOOK-3', 'P8'],
  ['KN-B3-P10-001', 'BOOK-4', 'P10'],
  ['KN-B4-P13-001', 'BOOK-5', 'P13'],
  ['KN-B2-P7-052', 'BOOK-4', 'P11'],
  ['KN-B2-P7-057', 'BOOK-4', 'P10']
]) {
  const context = authority.resolvePublicationContext(nodeCode);
  assert.equal(context.publicationBookCode, bookCode, `${nodeCode} publication Book must come from governed ownership.`);
  assert.equal(context.publicationPartCode, partCode, `${nodeCode} publication Part must come from governed ownership.`);
}

const publishedProjection = buildPublishedKnowledgeProjection(process.cwd());
const rebuiltBookMetadata = `${JSON.stringify(publishedProjection['public-book-metadata.json'], null, 2)}\n`;
assert.equal(
  await read('content/knowledge/public/public-book-metadata.json'),
  rebuiltBookMetadata,
  'Published Knowledge must deterministically rebuild the active five-volume public Book metadata.'
);

const maintenance = routeRegistry.legacyCompatibility.find(record => record.legacyPath === '/books/reality-maintenance/');
assert.equal(maintenance.targetRouteCode, 'BOOK_REALITY_CONTINUITY');
assert.equal(maintenance.redirectStatus, 308);
assert.equal(maintenance.canonicalAuthority, false);
assert(redirects.includes('/books/reality-maintenance/ /books/reality-continuity/ 308'));
assert(routeRegistry.legacyCompatibility.some(record => record.legacyPath === '/book-one'));
assert(routeRegistry.legacyCompatibility.some(record => record.legacyPath === '/book-one-preview'));

for (const record of compatibility.consumers) {
  await fs.access(record.authorityBinding);
}

console.log('✓ BOOK-W1F current Compatibility + Checker successor reconciliation passed.');
console.log('  17/17 required consumers bind governed five-volume authority without KN-B prefix inference.');
console.log('  Historical Four-Volume checkers remain historical; successor checks are independently registered.');
