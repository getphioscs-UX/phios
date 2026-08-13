import assert from 'node:assert/strict';
import fs from 'node:fs';
import { searchManuscriptCorpus, MANUSCRIPT_SOURCE_LIMITS } from '../functions/knowledge-runtime/manuscript-source-runtime.js';

const json = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const nodes = json('content/knowledge/registry/nodes.json');
const nodeList = Array.isArray(nodes) ? nodes : (nodes.nodes || []);
assert.equal(nodeList.length, 716, 'Canonical Node count must remain 716 in KSAR.');

const boundary = json('content/knowledge/source-access/contracts/knowledge-source-access-boundary-v1.json');
assert.equal(boundary.rules.publishedArticleAuthorityUnchanged, true);
assert.equal(boundary.rules.unmappedSectionMayClaimCanonicalNode, false);
assert.equal(boundary.rules.rawFullBookDeliveryThroughKnowledgeApi, false);
assert.equal(boundary.exposure.rawFullManuscriptReturned, false);

const registry = json('content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v1.json');
assert.equal(registry.records.length, 2);
assert.deepEqual(registry.records.map(r => r.bookCode), ['BOOK-1', 'BOOK-2']);
assert(registry.records.every(r => r.r2ObjectKey.endsWith('/retrieval-corpus.json')));

const bindings = json('content/knowledge/source-access/registries/manuscript-section-canonical-binding-v1.json');
assert.equal(bindings.records.length, 0);
assert.equal(bindings.policy.unmappedSectionMayClaimNodeCode, false);

const fixtureSource = registry.records[1];
const fixtureCorpus = {
  records: [
    { sectionCode:'CM-B2V1-P5-S002', segmentType:'SECTION', partCode:'P5', sequence:2, heading:'Runtime Visibility |', startPage:4, endPage:7, textSha256:'a'.repeat(64), text:'运行并不等于体验。现实可以持续影响生命，却未必进入明确觉察。意识更接近运行之中形成的一种可见层。' },
    { sectionCode:'CM-B2V1-P5-S003', segmentType:'SECTION', partCode:'P5', sequence:3, heading:'Experience Emergence | 现实如何形成体验', startPage:7, endPage:9, textSha256:'b'.repeat(64), text:'现实如何形成体验，需要区分运行、体验与觉察。' }
  ]
};
const pending = searchManuscriptCorpus({ corpus: fixtureCorpus, source: fixtureSource, bindings, query:'为什么某些现实会进入意识' });
assert(pending.length > 0);
assert.equal(pending[0].canonicalBinding.status, 'PENDING');
assert.deepEqual(pending[0].canonicalBinding.nodeCodes, []);
assert.equal('text' in pending[0], false, 'Raw section body must not be returned.');
assert(pending[0].excerpt.length <= MANUSCRIPT_SOURCE_LIMITS.maximumExcerptCharsPerResult);

const approved = searchManuscriptCorpus({
  corpus: fixtureCorpus,
  source: fixtureSource,
  bindings: { records:[{ sectionCode:'CM-B2V1-P5-S002', nodeCode:'KN-B1-P5-001', mappingCode:'MAP-TEST', status:'APPROVED' }] },
  query:'运行 可见 意识'
});
assert(approved.some(row => row.canonicalBinding.status === 'APPROVED' && row.canonicalBinding.nodeCodes.includes('KN-B1-P5-001')));

const wrangler = json('wrangler.jsonc');
assert(wrangler.r2_buckets.some(binding => binding.binding === 'MANUSCRIPTS' && binding.bucket_name === 'phios-private-manuscripts'));
const pkg = json('package.json');
assert.equal(pkg.scripts['check:ksar'], 'node scripts/check-ksar-manuscript-knowledge-access.mjs');

for (const forbidden of [
  'content/knowledge/source-access/retrieval-corpus.json',
  'content/knowledge/source-access/full-manuscript.md',
  'content/knowledge/source-access/pages.ndjson'
]) assert.equal(fs.existsSync(forbidden), false, `Full manuscript body must remain outside public source-access projection: ${forbidden}`);

console.log('✓ KSAR Knowledge Source Access Runtime passed.');
console.log('  Published Canonical Article remains primary publication authority.');
console.log('  Completed Book I/II manuscripts may ground client queries through private R2 corpora.');
console.log('  Unmapped manuscript sections remain source-native and cannot claim Canonical Node identity.');
console.log('  Question-scoped excerpts are bounded; raw full-book delivery remains blocked.');
