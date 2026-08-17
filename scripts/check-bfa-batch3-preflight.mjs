import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { buildBfaArticleActivationReadiness } from './lib/bilingual-final-approval/bfa-article-activation-v1.mjs';

const root=process.cwd();
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const sha=rel=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,rel))).digest('hex');
const pre=read('content/production/bilingual-final-approval/BATCH-003-preflight/readiness.v1.json');
const review=read('content/knowledge/production-planning/review/batch3-c2-human-review-candidates-v1.json');
const nodes=read('content/knowledge/registry/nodes.json').nodes;
const bindings=read('content/knowledge/source-access/registries/manuscript-section-canonical-binding-v1.json').records;
const completed=read('content/knowledge/manuscripts/completed/book-1-completed-manuscript-v2.json');
const readiness=buildBfaArticleActivationReadiness(root,{bookCode:'BOOK-1',locale:'zh-Hans'});

assert.equal(pre.status,'BLOCKED_PENDING_UPSTREAM_C2_HUMAN_REVIEW');
assert.equal(pre.batchCodeReserved,false);
assert.equal(pre.articleBatchArtifactsWritten,false);
assert.equal(readiness.summary.readyCount,0,'BATCH-003 must not be created while successor ARTICLE_READY is zero.');
assert.equal(review.status,'PENDING_TL_C2_REVIEW');
assert.equal(review.authorityBoundary.aiActsAsHumanReviewer,false);
assert.equal(review.authorityBoundary.thisFileCreatesC2Freeze,false);
assert.equal(review.authorityBoundary.thisFileCreatesC3ProductionReadiness,false);
assert.equal(review.sourceManuscript.sha256,completed.sourceBinary.sha256);
assert.equal(review.sourceManuscript.pageCount,completed.sourceBinary.pageCount);
assert.equal(review.entries.length,3);
assert.deepEqual(review.entries.map(x=>x.nodeCode),pre.nextReviewScope);

for(const entry of review.entries){
  const node=nodes.find(x=>x.nodeCode===entry.nodeCode);
  assert.ok(node,`${entry.nodeCode}: canonical node missing`);
  assert.equal(node.primaryAssetType,'article',`${entry.nodeCode}: not ARTICLE primary asset`);
  const binding=bindings.find(x=>x.nodeCode===entry.nodeCode&&x.mappingRole==='PRIMARY'&&x.sectionCode===entry.sourceBinding.sectionCode);
  assert.ok(binding,`${entry.nodeCode}: approved primary manuscript binding missing`);
  assert.equal(binding.status,'APPROVED');
  assert.equal(binding.authorityStatus,'APPROVED');
  assert.equal(binding.authority,'KAU-R3_HUMAN_ACCEPTED_VOLUME_I_RECONCILIATION');
  assert.equal(binding.sectionTextSha256,entry.sourceBinding.sectionTextSha256);
  assert.equal(entry.reviewState,'PENDING_TL_C2_REVIEW');
  assert.deepEqual(entry.allowedHumanDecisions,['freeze_approved','revise','defer']);
  assert.ok(entry.proposedContent.canonicalThesis.statement.length>20);
  assert.ok(entry.proposedContent.boundaries.article.mustEstablish.length>=3);
  assert.ok(entry.proposedContent.boundaries.article.requiredDistinctions.length>=3);
}

const batchDir=path.join(root,'content/production/bilingual-final-approval/BATCH-003');
assert.equal(fs.existsSync(batchDir),false,'Empty/unauthorized BATCH-003 artifacts must not be written.');
const publication=read('content/knowledge/production/registry/publication-registry.json');
for(const code of pre.nextReviewScope){
  assert.equal((publication.records??publication.publications??[]).some(x=>x.nodeCode===code),false,`${code}: must remain unpublished before C2 review`);
}

console.log('✓ BATCH-003 preflight is fail-closed: 0 current successor ARTICLE_READY nodes and no BATCH-003 artifacts reserved.');
console.log('✓ Three next ARTICLE nodes have KAU-R3 Human Accepted PRIMARY manuscript bindings and source-bound C2 review candidates.');
console.log('✓ C2 freeze, C3 production readiness, BFA package, TL Final Approval and publication remain uncreated pending TL C2 review.');
