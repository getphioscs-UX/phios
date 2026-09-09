import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const BASE='6933bc29dba65d0f7744b24d8fdd68ff754290b4', SUCCESSOR='02d6313ddc365c1eb2ad7ce33d920ddcbf8028c3';
const PATH='content/knowledge/production-planning/visual-disposition/book3-b07-b09-w10-figure-media-requirement-v1.json';
const PROD='content/knowledge/production-planning/visual-production/book3-b09-a44-coordination-collapse-path-v1.json';
const REVIEW='content/knowledge/production-planning/review/book3-b09-a44-coordination-collapse-path-visual-review-v1.json';
const d=read(PATH),prod=read(PROD),review=read(REVIEW);
assert.equal(d.baselineCommit,BASE); assert.equal(d.successorBaselineCommit,SUCCESSOR); assert.equal(d.status,'DISPOSITION_COMPLETE_A44_ASSET_PRODUCED_HUMAN_VISUAL_PENDING');
assert.equal(d.records.length,16); assert.equal(d.counts.figureNotRequired,3); assert.equal(d.counts.figureRecommendedNonBlocking,12); assert.equal(d.counts.figureRequiredPublicationBlocking,1); assert.equal(d.counts.assetsProduced,1);
const a44=d.records.find(x=>x.articlePlanId==='B3-ART-044'); assert.ok(a44); assert.equal(a44.decision,'FIGURE_REQUIRED_PUBLICATION_BLOCKING'); assert.equal(a44.assetProductionStatus,'PRODUCED_MACHINE_BOUND_HUMAN_REVIEW_PENDING'); assert.equal(a44.requiredVisualProductionPath,PROD);
assert.equal(prod.status,'ASSET_PRODUCED_MACHINE_BOUND_HUMAN_VISUAL_REVIEW_PENDING'); assert.equal(prod.reviewGate.machineAssetBinding,'ACCEPTED'); assert.equal(prod.reviewGate.humanVisualApproval,'PENDING'); assert.equal(review.status,'PENDING_HUMAN_VISUAL_REVIEW'); assert.equal(review.decision,'PENDING');
for(const batch of ['b07','b08','b09']){const m=read(`content/knowledge/production-planning/production/book3-${batch}/manifest-v1.json`); assert.equal(m.gates.visualProduction,'W10_DISPOSITION_COMPLETE_A44_REQUIRED_ASSET_PRODUCED_HUMAN_VISUAL_PENDING');}
console.log('✓ BOOK-3 B07–B09 W10 successor passed: A44 required Coordination Collapse Path is produced and machine-bound; explicit visual human acceptance remains pending.');
console.log('✓ Recommended visuals remain non-blocking and no Article publication authority is inferred from visual production.');
