import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const read = p => JSON.parse(fs.readFileSync(p,'utf8'));
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const base = read('content/books/book-5/maintenance/book-v-pka-r1-baseline-v1.json');
const inventory = read('content/books/book-5/source/final-manuscript-structure-v1.json');
const source = read(inventory.sourcePath);
const map = read('content/books/book-5/articles/article-production-map-v1.json');
assert.equal(base.head,'8fa4a9111e5cbcc6583c1905545d4a352c13e982');
assert.equal(base.branch,'main');
assert.deepEqual(base.initialGitStatus,[]);
for(const paths of Object.values(base.systems)) for(const path of paths) assert.ok(fs.existsSync(path),path);
const architecture=read('content/registry/current-book-architecture.json');
const book=read(architecture.books.slice(1)).books.find(b=>b.book_id==='book-5');
assert.equal(book.title['zh-Hans'],'世界如何分化');
assert.deepEqual(book.parts,[12]);
assert.equal(source.canonicalAuthority,false);
assert.equal(source.rawDeliveryAllowed,false);
assert.equal(source.pageCount,source.pages.length);
assert.equal(source.sourcePdfSha256,inventory.sourcePdfSha256);
assert.equal(map.sourcePdfSha256,inventory.sourcePdfSha256);
source.pages.forEach((p,i)=>{assert.equal(p.pdfPage,i+1);assert.equal(sha(p.text),p.textSha256);});
assert.equal(inventory.sectionCount,inventory.sections.length);
assert.deepEqual(inventory.parts.map(p=>p.code),Array.from('ABCDEFGHIJK',c=>`12.${c}`));
assert.deepEqual(inventory.parts.flatMap(p=>p.sourceSections),inventory.sections.map(s=>s.sourceSectionId));
assert.equal(inventory.figures.length,6);
assert.ok(inventory.figures.every(f=>f.historicalDataTranscribed===false));
const sections=new Map(inventory.sections.map(s=>[s.sourceSectionId,s]));
assert.equal(sections.size,inventory.sectionCount);
for(const s of sections.values()){
  assert.ok(s.pdfPageStart<=s.pdfPageEnd && s.pdfPageEnd<=source.pageCount);
  assert.ok(source.pages[s.pdfPageStart-1].text.replace(/\s/g,'').includes(s.heading),s.sourceSectionId);
}
const registry=read(base.existingBookVKnowledge.source);
assert.deepEqual(registry.nodes.filter(n=>n.partCode==='P12').map(n=>n.nodeCode),base.existingBookVKnowledge.nodeCodes);
assert.equal(base.existingBookVKnowledge.count,base.existingBookVKnowledge.nodeCodes.length);
const atlas='content/civilization-atlas/';
const valid={relatedCases:new Set(read(atlas+'cases/civilization-case-registry-v1.json').cases.map(x=>x.caseId)),relatedSnapshots:new Set(read(atlas+'snapshots/world-snapshots-v1.json').snapshots.map(x=>x.snapshotId)),relatedTransitions:new Set(read(atlas+'transitions/transition-windows-v1.json').transitionWindows.map(x=>x.transitionWindowId)),relatedLossTypes:new Set(read(atlas+'loss/reversal-loss-atlas-v1.json').lossTypes.map(x=>x.lossTypeId)),relatedTrajectories:new Set(read(atlas+'trajectories/long-duration-trajectories-v1.json').trajectories.map(x=>x.trajectoryId)),relatedComparisonFamilies:new Set(read(atlas+'comparison/comparison-families-v1.json').families.map(x=>x.familyId))};
const visuals=read(base.existingBookVAssets.registry).assets;
assert.equal(visuals.length,base.existingBookVAssets.registeredCount);
assert.equal(read(base.systems.visualRegistry[1]).assets.length,base.existingBookVAssets.approvedBindingCount);
assert.equal(base.existingBookVAssets.actualR2BucketCount,null);
assert.equal(read(atlas+'freeze/book-v-civ-atlas-r1-production-freeze-v1.json').status,'PRODUCTION_ADMITTED_FROZEN');
const articleIds=new Set(map.records.map(r=>r.articleId));
assert.equal(new Set(map.records.map(r=>r.slug)).size,articleIds.size);
assert.equal(articleIds.size,map.articleCount);
assert.equal(map.records.length,map.articleCount*2);
const covered=new Set();
for(const id of articleIds){
  const pair=map.records.filter(r=>r.articleId===id);
  assert.deepEqual(pair.map(r=>r.locale).sort(),['en','zh-Hans']);
  for(const field of ['sourceSections','sourceHeadings','slug','relatedCases','relatedSnapshots','relatedTransitions','relatedLossTypes','visualCandidates','knowledgeRefs','askContext']) assert.deepEqual(pair[0][field],pair[1][field],`${id}:${field}`);
}
for(const r of map.records){
  assert.ok(r.title && r.summary && r.sourceSections.length);
  assert.equal(r.publicationStatus,'NOT_PUBLISHED');
  assert.equal(r.semanticParityStatus,'BODY_NOT_PRODUCED');
  assert.equal(r.askContext.book,'BOOK-5');
  assert.deepEqual(r.askContext.sourceSections,r.sourceSections);
  for(const id of r.knowledgeRefs)assert.ok(registry.nodes.some(n=>n.nodeCode===id && n.partCode==='P12' && n.registryStatus!=='superseded'),id);
  assert.deepEqual(r.sourceHeadings,r.sourceSections.map(id=>{assert.ok(sections.has(id),id);covered.add(id);return sections.get(id).heading;}));
  for(const [field,ids] of Object.entries(valid))for(const id of r[field])assert.ok(ids.has(id),`${field}:${id}`);
  for(const id of r.visualCandidates){const visual=visuals.find(a=>a.assetId===id);assert.ok(visual && r.relatedCases.includes(visual.subjectId),id);}
}
assert.equal(covered.size,sections.size);
assert.equal(base.humanDecision,'PENDING_HUMAN_REVIEW');
console.log(`PASS W0–W1: ${source.pageCount} source pages; ${sections.size} sections; ${articleIds.size} bilingual article candidates; valid source/Atlas/visual references.`);
console.log('NOT_RUN W2–W16: published bodies, route rendering, retrieval, remote visuals, browser review and production admission. This checker does not grant publication or human acceptance.');
