import assert from 'node:assert/strict';
import fs from 'node:fs';
import { searchManuscriptCorpus, MANUSCRIPT_SOURCE_LIMITS } from '../functions/knowledge-runtime/manuscript-source-runtime.js';

const json = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const nodes = json('content/knowledge/registry/nodes.json');
const nodeList = Array.isArray(nodes) ? nodes : (nodes.nodes || []);
const r5Path='content/knowledge/reconciliation/kau-r5/kau-r5-freeze-v1.json'; const r5Active=fs.existsSync(r5Path);
assert.equal(nodeList.length,r5Active?718:716,`Canonical Node count must match the active ${r5Active?'KAU-R5 successor':'predecessor'} authority in KSAR.`);
const nodeCodes = new Set(nodeList.map(n => n.nodeCode));

const boundary = json('content/knowledge/source-access/contracts/knowledge-source-access-boundary-v1.json');
assert.equal(boundary.rules.publishedArticleAuthorityUnchanged, true);
assert.equal(boundary.rules.unmappedSectionMayClaimCanonicalNode, false);
assert.equal(boundary.rules.rawFullBookDeliveryThroughKnowledgeApi, false);
assert.equal(boundary.exposure.rawFullManuscriptReturned, false);

const registry = json('content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v1.json');
assert.equal(registry.records.length, 2);
assert.deepEqual(registry.records.map(r => r.bookCode), ['BOOK-1', 'BOOK-2']);
assert(registry.records.every(r => r.r2ObjectKey.endsWith('/retrieval-corpus.json')));

const reviewedRegistry = json('content/knowledge/source-access/registries/manuscript-reviewed-corpus-registry-v1.json');
assert.equal(reviewedRegistry.recordCount, 448);
assert.equal(reviewedRegistry.records.length, 2);
assert(reviewedRegistry.records.every(r => r.humanReadabilityStatus === 'HUMAN_REVIEW_COMPLETE'));

const bindings = json('content/knowledge/source-access/registries/manuscript-section-canonical-binding-v1.json');
assert.equal(bindings.status,r5Active?'ACTIVE_VOLUME_I_II_APPROVED':'ACTIVE_PARTIAL_VOLUME_I_APPROVED');
assert.equal(bindings.records.length,r5Active?235:62);
assert.equal(bindings.records.filter(r=>r.bookCode==='BOOK-1').length,62);
if(r5Active){assert.equal(bindings.status,'ACTIVE_VOLUME_I_II_APPROVED');assert.equal(bindings.records.filter(r=>r.bookCode==='BOOK-2').length,173);assert(bindings.records.every(r=>nodeCodes.has(r.nodeCode)));}
assert.equal(bindings.policy.unmappedSectionMayClaimNodeCode, false);
assert(bindings.records.every(r => nodeCodes.has(r.nodeCode)));
assert(bindings.records.every(r=>r.status==='APPROVED'));
if(!r5Active) assert(bindings.records.every(r=>r.bookCode==='BOOK-1'));

const corrections = json('content/knowledge/source-access/registries/manuscript-editorial-correction-v1.json');
assert.equal(corrections.records.length, 1);
assert.equal(corrections.records[0].sectionCode, 'CM-B1V2-P3-S026');
assert.equal(corrections.records[0].correctedValue, 'Domain III Coexistence |');

const fixtureSource = registry.records[1];
const fixtureCorpus = {
  records: [
    { sectionCode:'CM-B2V1-P5-S002', segmentType:'SECTION', partCode:'P5', sequence:2, heading:'Runtime Visibility |', startPage:4, endPage:7, textSha256:'a'.repeat(64), text:'运行并不等于体验。现实可以持续影响生命，却未必进入明确觉察。意识更接近运行之中形成的一种可见层。' },
    { sectionCode:'CM-B2V1-P5-S003', segmentType:'SECTION', partCode:'P5', sequence:3, heading:'Experience Emergence | 现实如何形成体验', startPage:7, endPage:9, textSha256:'b'.repeat(64), text:'现实如何形成体验，需要区分运行、体验与觉察。' }
  ]
};
const pending = searchManuscriptCorpus({ corpus: fixtureCorpus, source: fixtureSource, bindings:{records:[]}, corrections, query:'为什么某些现实会进入意识' });
assert(pending.length > 0);
assert.equal(pending[0].canonicalBinding.status, 'PENDING');
assert.deepEqual(pending[0].canonicalBinding.nodeCodes, []);
assert.equal('text' in pending[0], false, 'Raw section body must not be returned.');
assert(pending[0].excerpt.length <= MANUSCRIPT_SOURCE_LIMITS.maximumExcerptCharsPerResult);

const approved = searchManuscriptCorpus({
  corpus: fixtureCorpus,
  source: fixtureSource,
  bindings: { records:[{ sectionCode:'CM-B2V1-P5-S002', nodeCode:'KN-B1-P5-001', mappingCode:'MAP-TEST', status:'APPROVED' }] },
  corrections,
  query:'运行 可见 意识'
});
assert(approved.some(row => row.canonicalBinding.status === 'APPROVED' && row.canonicalBinding.nodeCodes.includes('KN-B1-P5-001')));

const corrected = searchManuscriptCorpus({
  corpus: { records:[{ sectionCode:'CM-B1V2-P3-S026', segmentType:'SECTION', partCode:'P3', sequence:115, heading:'Domain II Coexistence |', startPage:188, endPage:188, textSha256:'c'.repeat(64), text:'Domain II Coexistence | 多个运行领域可以同时存在。' }] },
  source: registry.records[0],
  bindings,
  corrections,
  query:'Domain III Coexistence'
});
assert.equal(corrected.length, 1);
assert.equal(corrected[0].heading, 'Domain III Coexistence |');
assert(corrected[0].excerpt.includes('Domain III Coexistence |'));
assert.equal(corrected[0].editorialCorrections[0].correctionCode, 'KAU-R3-B1-P3-DOMAIN-NUMBERING-001');
assert.equal(corrected[0].sourceDigest, 'c'.repeat(64), 'Editorial projection must not rewrite raw source digest identity.');

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
console.log('  Human-reviewed Book I/II manuscript derivatives may ground client queries through private R2 corpora.');
console.log(r5Active ? '  62 Volume-I plus 173 Volume-II approved mapping records are active; only unmapped/supporting source-native sections remain without Canonical claim.' : '  62 human-accepted Volume-I primary bindings are active; Book II and unmapped sections remain source-native/PENDING.');
console.log('  Human-confirmed manuscript editorial corrections may be projected without mutating raw source provenance.');
console.log('  Question-scoped excerpts are bounded; raw full-book delivery remains blocked.');
