import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const BASE='db794e5a22d8d0ecc36ebaab6420b3bca804a7ce';
const PLAN='content/knowledge/production-planning/plans/book3-w5-final-article-production-map-v1.json';
const DISPOSITION='content/knowledge/production-planning/visual-disposition/book3-b02-w10-figure-media-requirement-v1.json';
const MANIFEST='content/knowledge/production-planning/production/book3-b02/manifest-v1.json';
const HUMAN='content/knowledge/production-planning/acceptance/book3-b02-human-decisions-v1.json';
const PARITY='content/knowledge/production-planning/acceptance/book3-b02-english-semantic-parity-v1.json';

const plan=read(PLAN), d=read(DISPOSITION), manifest=read(MANIFEST), human=read(HUMAN), parity=read(PARITY);
const b02=plan.articles.filter(x=>x.batchCode==='B3-B02');
assert.equal(d.baselineCommit,BASE); assert.equal(d.status,'DISPOSITION_COMPLETE_MEDIA_PRODUCTION_NOT_STARTED'); assert.equal(d.articleCount,5);
assert.deepEqual(d.counts,{figureNotRequired:1,figureRecommendedNonBlocking:3,figureRequiredPublicationBlocking:1,assetsProduced:0});
assert.equal(human.status,'HUMAN_ACCEPTED_5_OF_5'); assert.equal(parity.status,'MACHINE_SEMANTIC_PARITY_ACCEPTED_5_OF_5');
assert.equal(manifest.visualSuccessorBaselineCommit,BASE); assert.equal(manifest.visualDispositionPath,DISPOSITION); assert.equal(manifest.gates.visualProduction,'W10_DISPOSITION_COMPLETE_MEDIA_PRODUCTION_NOT_STARTED');
assert.equal(manifest.gates.publication,'CLOSED'); assert.equal(manifest.gates.customerProjection,'CLOSED');
const planById=new Map(b02.map(x=>[x.articlePlanId,x]));
for(const r of d.records){
 const p=planById.get(r.articlePlanId); assert.ok(p,r.articlePlanId); assert.equal(r.w5VisualDisposition,p.visualDisposition); assert.equal(r.assetProductionStatus,'NOT_STARTED');
 assert.equal(r.mayCreateNewCanonicalMeaning,false); assert.equal(typeof r.publicationBlocking,'boolean');
 if(r.decision==='FIGURE_REQUIRED_PUBLICATION_BLOCKING'){assert.equal(r.articlePlanId,'B3-ART-013');assert.equal(r.mediaKind,'CAPACITY_MAP');assert.equal(r.publicationBlocking,true);assert.ok(r.briefTitle);assert.equal(p.visualDisposition,'VISUAL_BRIEF_CANDIDATE_W10');}
 if(r.decision==='FIGURE_RECOMMENDED_NON_BLOCKING'){assert.equal(r.publicationBlocking,false);assert.ok(r.briefTitle);}
 if(r.decision==='FIGURE_NOT_REQUIRED'){assert.equal(r.publicationBlocking,false);assert.equal(r.mediaKind,'NONE');assert.equal(r.briefTitle,null);}
}
assert.deepEqual(d.batchPublicationEffect.blockingArticlePlanIds,['B3-ART-013']);
assert.equal(d.batchPublicationEffect.articleProductionMayContinue,true); assert.equal(d.batchPublicationEffect.englishWorkMayContinue,true); assert.equal(d.batchPublicationEffect.publicationAuthorityStillClosed,true);
for(const v of Object.values(d.authorityBoundary)) assert.equal(v,false,'B02 W10 authority boundary drift');
console.log('✓ BOOK-3 B02 W10 Figure / Media Requirement disposition passed: 1 not required, 3 recommended non-blocking, 1 required before publication.');
console.log('✓ No media asset, canonical meaning or publication authority is created; B3-ART-013 is the only publication-blocking figure requirement.');
