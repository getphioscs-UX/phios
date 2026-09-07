import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const manifest=read('content/knowledge/production-planning/production/book3-wave1/manifest-v1.json');
const inv=read('content/knowledge/manuscripts/extraction/book-3-full-section-inventory-v1.json');
const readability=read('content/knowledge/manuscripts/review/kau-r6d-book3-readability-human-acceptance-v1.json');
const acc=read('content/knowledge/production-planning/acceptance/book3-pja-wave1-acceptance-v1.json');
const decisions=read('content/knowledge/production-planning/acceptance/book3-pja-wave1-human-decisions-v1.json');
const reg=read('content/knowledge/registry/successors/kau-r6e-book3-final/canonical-nodes-v1.json');
const sections=new Map(inv.sections.filter(x=>x.segmentType==='SECTION').map(x=>[x.sectionCode,x]));const nodes=new Map(reg.nodes.map(x=>[x.nodeCode,x]));
assert.equal(readability.status,'HUMAN_READABILITY_ACCEPTED');assert.equal(readability.allRecordsHumanAccepted,true);assert.equal(readability.recordCount,106);
assert.equal(manifest.baselineCommit,'f3811673588eef38814c26fbbd1c52cbf2405f6a');assert.equal(manifest.articleConceptCount,8);assert.equal(manifest.localeCandidateCount,16);assert.equal(manifest.records.length,16);
assert.equal(decisions.status,'8_OF_8_HUMAN_ACCEPTED');assert.equal(decisions.recordCount,8);assert.ok(decisions.records.every(x=>x.decision==='ACCEPT'));
const concepts=new Set();const locales=new Map();
for(const r of manifest.records){assert.ok(fs.existsSync(r.path),r.path);const a=read(r.path);concepts.add(a.candidateId);if(!locales.has(a.candidateId))locales.set(a.candidateId,new Set());locales.get(a.candidateId).add(a.locale);assert.equal(a.productionRole,'ARTICLE');assert.equal(a.dispatchTarget,'PJA');assert.equal(a.review.customerPublishable,false);assert.equal(a.review.publicationStatus,'not_published');assert.equal(a.canonicalNodeBinding.status,'FINAL_COMPLETED_MANUSCRIPT_CANONICAL_RECONCILED');assert.equal(a.canonicalNodeBinding.nodeCodes.length,a.sourceBindings.length);for(let i=0;i<a.sourceBindings.length;i++){const b=a.sourceBindings[i];const s=sections.get(b.sourceSectionCode);assert.ok(s,b.sourceSectionCode);assert.equal(s.textSha256,b.sourceTextSha256);assert.deepEqual([s.startPage,s.endPage],b.sourcePages);const n=nodes.get(a.canonicalNodeBinding.nodeCodes[i]);assert.ok(n,a.canonicalNodeBinding.nodeCodes[i]);assert.equal(n.canonicalSourceBinding.sectionCode,b.sourceSectionCode);}if(a.locale==='zh-Hans'){assert.equal(a.review.humanEditorialApproved,true);assert.equal(a.status,'HUMAN_EDITORIAL_ACCEPTED_FINAL_CANONICAL_RECONCILED');}else{assert.equal(a.review.humanEditorialApproved,false);assert.equal(a.review.semanticParityStatus,'PENDING_HUMAN_SEMANTIC_PARITY_REVIEW');assert.equal(a.status,'FINAL_CANONICAL_RECONCILED_ENGLISH_PARITY_PENDING');}}
assert.equal(concepts.size,8);for(const [id,set] of locales)assert.deepEqual([...set].sort(),['en','zh-Hans'],`${id} must have both locales`);
assert.equal(acc.human.zhHansEditorialAccepted,true);assert.equal(acc.human.zhHansAcceptedArticleCount,8);assert.equal(acc.human.englishSemanticParityAccepted,false);assert.equal(acc.human.canonicalAssetReconciliationAccepted,true);assert.equal(acc.publication.published,false);assert.equal(acc.canonicalAuthority.finalBook3NodeCount,103);
console.log('✓ BOOK-3 PJA Wave 1 successor passed: 8/8 zh-Hans Articles human-accepted and all 16 locale candidates rebound to the 103-node completed-manuscript final authority.');
console.log('✓ English semantic parity and publication remain fail-closed.');
