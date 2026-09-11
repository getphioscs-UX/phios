import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const shaText=s=>crypto.createHash('sha256').update(s).digest('hex');
const shaFile=p=>shaText(fs.readFileSync(p,'utf8'));
const base='content/knowledge/public/successors/book4-discovery-v1';
const authority=read(`${base}/authority.json`),index=read(`${base}/public-search-index.json`),catalog=read(`${base}/knowledge-catalog.json`),cross=read(`${base}/cross-book-discovery.json`);
assert.equal(authority.status,'PUBLIC_DISCOVERY_ADMITTED');
assert.equal(index.status,'ACTIVE_PUBLIC_SEARCH_SUCCESSOR');
assert.equal(catalog.status,'ACTIVE_KNOWLEDGE_CATALOG_SUCCESSOR');
assert.equal(cross.status,'ACTIVE_CROSS_BOOK_DISCOVERY_SUCCESSOR');
assert.equal(index.recordCount,index.records.length);assert.equal(index.recordCount,320);
assert.deepEqual(index.locales,['en','zh-Hans']);assert.deepEqual(index.publishedBookCodes,['BOOK-1','BOOK-2','BOOK-3','BOOK-4']);
const keys=new Set(),paths=new Set();
for(const r of index.records){
 assert.ok(r.discoveryCode&&r.nodeCode&&r.locale&&r.slug&&r.href&&r.title&&r.summary&&r.searchText);
 assert.ok(['en','zh-Hans'].includes(r.locale));assert.ok(/^BOOK-[1-4]$/.test(r.bookCode));assert.ok(/^P\d+$/.test(r.partCode));
 const key=`${r.nodeCode}:${r.locale}`;assert.ok(!keys.has(key),`duplicate ${key}`);keys.add(key);
 assert.ok(fs.existsSync(r.sourcePath),`missing source ${r.sourcePath}`);assert.equal(shaFile(r.sourcePath),r.sourceDigest,`source digest drift ${r.sourcePath}`);paths.add(r.sourcePath);
 assert.ok(Array.isArray(r.crossBookNeighbors));assert.ok(r.crossBookNeighbors.length<=3);
}
const book4=index.records.filter(r=>r.bookCode==='BOOK-4');assert.equal(book4.length,106);assert.equal(new Set(book4.map(r=>r.slug)).size,53);assert.equal(new Set(book4.flatMap(r=>r.coveredNodeCodes)).size,125);
assert.equal(catalog.bookCount,7);assert.equal(catalog.publishedBookCount,4);assert.equal(catalog.publishedLocaleArticleCount,320);
const b4=catalog.books.find(b=>b.bookCode==='BOOK-4');assert.ok(b4?.hasPublishedKnowledge);assert.equal(b4.publishedArticleCount,53);assert.equal(b4.publishedLocaleArticleCount,106);assert.equal(b4.publishedCoveredNodeCount,125);assert.equal(b4.canonicalRoute,'/books/reality-expansion/');
for(const code of ['BOOK-5','BOOK-6','BOOK-7'])assert.equal(catalog.books.find(b=>b.bookCode===code)?.hasPublishedKnowledge,false);
const recordByCode=new Map(index.records.map(r=>[r.discoveryCode,r]));assert.equal(cross.recordCount,cross.records.length);assert.ok(cross.records.length>=book4.length);
for(const rel of cross.records){
 const s=recordByCode.get(rel.sourceDiscoveryCode),t=recordByCode.get(rel.targetDiscoveryCode);assert.ok(s&&t);assert.equal(s.locale,t.locale);assert.notEqual(s.bookCode,t.bookCode);assert.equal(rel.relationshipClass,'DISCOVERY_HEURISTIC_NOT_CANONICAL_RELATIONSHIP');assert.equal(rel.targetHref,t.href);assert.equal(rel.targetTitle,t.title);
}
assert.equal(cross.authorityBoundary.canonicalRelationshipAuthority,false);assert.equal(cross.authorityBoundary.doesNotMutateNodeRelationships,true);
for(const [p,d] of Object.entries(authority.predecessorDigests))assert.equal(shaFile(p),d,`predecessor mutated ${p}`);
for(const [p,d] of Object.entries(authority.protectedDigests))assert.equal(shaFile(p),d,`protected authority drift ${p}`);
const loader=fs.readFileSync('assets/js/knowledge/public-discovery.js','utf8');assert.match(loader,/book4-discovery-v1/);assert.match(loader,/loadPublicSearchIndex/);assert.match(loader,/loadPublicKnowledgeCatalog/);
const ui=fs.readFileSync('assets/customer-ui/js/surfaces/knowledge.js','utf8');assert.match(ui,/loadPublicSearchIndex/);assert.match(ui,/record\.searchText/);assert.match(ui,/crossBookNeighbors/);assert.match(ui,/Across other volumes/);assert.match(ui,/跨册发现/);
const html=fs.readFileSync('search/index.html','utf8');assert.match(html,/seven-volume system/);assert.doesNotMatch(html,/five books/);
const pkg=read('package.json');assert.equal(pkg.scripts['book4:public-discovery:build'],'node scripts/build-book4-public-discovery-successor.mjs');assert.equal(pkg.scripts['check:book4:public-discovery'],'node scripts/check-book4-public-search-catalog-cross-book-discovery.mjs');
console.log('✓ Book IV Public Search / Knowledge Catalog / Cross-Book Discovery successor passed.');
console.log(`  ${index.recordCount} published locale articles across ${catalog.publishedBookCount} books; Book IV ${book4.length} locale projections / 53 routes / 125 covered nodes.`);
console.log(`  ${cross.recordCount} bounded cross-book discovery links remain heuristic discovery, never Canonical relationships.`);
