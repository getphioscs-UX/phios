import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeArticleForRenderer} from '../assets/js/knowledge/article-blocks.js';
import {publicArticlePurityFindings} from './lib/bilingual-final-approval/bfa-runtime-v1.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const nodes=['KN-B1-P1-003','KN-B1-P4-003','KN-B1-P4-004'];
const review=read('content/production/bilingual-final-approval/BATCH-002/review-data.json');
assert.equal(review.summary.nodes,3);assert.equal(review.summary.localeCandidates,6);assert.equal(review.summary.blocked,0);assert.equal(review.summary.warnings,0);assert.equal(review.summary.pending,3);assert.equal(review.summary.finalApproved,0);assert.equal(review.summary.published,0);
for(const node of nodes){
  const entry=review.entries.find(x=>x.nodeCode===node);assert(entry?.package,`${node}:PACKAGE_REQUIRED`);assert.equal(entry.package.automaticEvidence.status,'PASS');assert.equal(entry.package.publicationReadiness.state,'READY_FOR_FINAL_APPROVAL');
  for(const locale of ['zh-Hans','en']){
    const c=read(`content/knowledge/production/candidates/${locale}/${node}/candidate.v1.json`);const publicText=`${c.article.title}\n${c.article.summary}\n${c.article.bodyMarkdown}`;
    assert.deepEqual(publicArticlePurityFindings(publicText),[],`${node}:${locale}:INTERNAL_GOVERNANCE_LEAKAGE`);
    assert.equal(/^(?:#{1,6}\s*)?(?:知识边界|knowledge boundary)(?:\s|$)/imu.test(c.article.bodyMarkdown),false,`${node}:${locale}:KNOWLEDGE_BOUNDARY_SECTION_FORBIDDEN`);
    const ev=entry.package.automaticEvidence.byLocale[locale];
    assert.equal(ev.checks.find(x=>x.code==='PUBLIC_ARTICLE_GOVERNANCE_LEAKAGE')?.status,'PASS');
    assert.equal(ev.checks.find(x=>x.code==='PUBLIC_ARTICLE_KNOWLEDGE_BOUNDARY_SECTION')?.status,'PASS');
  }
}
const historical=[
  'content/knowledge/articles/zh-Hans/why-phi-os-is-needed.json','content/knowledge/articles/en/why-phi-os-is-needed.json',
  'content/knowledge/articles/zh-Hans/why-explanation-does-not-equal-understanding.json','content/knowledge/articles/en/why-explanation-does-not-equal-understanding.json',
  'content/knowledge/articles/zh-Hans/why-navigation-begins-with-reality-position.json','content/knowledge/articles/en/why-navigation-begins-with-reality-position.json'
];
for(const p of historical){const source=read(p);assert.ok((source.knowledgeBoundary??[]).length>0,`${p}:HISTORICAL_INTERNAL_METADATA_EXPECTED`);const rendered=normalizeArticleForRenderer(source);assert.deepEqual(rendered.knowledgeBoundary,[],`${p}:PUBLIC_BOUNDARY_MUST_BE_SUPPRESSED`);}
const aiZh=read('content/knowledge/public/visual-articles/zh-Hans/ai-formation-from-civilizational-capability.json'),aiEn=read('content/knowledge/public/visual-articles/en/ai-formation-from-civilizational-capability.json');assert.ok(aiZh.knowledgeBoundary.length>0&&aiEn.knowledgeBoundary.length>0,'AI_HISTORICAL_BOUNDARY_METADATA_EXPECTED');
const projectionSource=fs.readFileSync('assets/js/knowledge/article-projection.js','utf8'),rendererNormalizationSource=fs.readFileSync('assets/js/knowledge/article-blocks.js','utf8');assert.ok(projectionSource.includes('knowledgeBoundary: Object.freeze([])'),'PUBLIC_PROJECTION_BOUNDARY_SUPPRESSION_REQUIRED');assert.ok(rendererNormalizationSource.includes('knowledgeBoundary: []'),'RENDERER_BOUNDARY_SUPPRESSION_REQUIRED');
const batch1Files=fs.readdirSync('content/knowledge/public/visual-articles/zh-Hans').filter(x=>x.endsWith('.json')&&!x.startsWith('ai-formation'));assert.ok(batch1Files.length>=6);for(const p of batch1Files){const a=read(`content/knowledge/public/visual-articles/zh-Hans/${p}`);if(a.nodeCode?.startsWith('KN-B1-'))assert.deepEqual(a.knowledgeBoundary??[],[],`${p}:BATCH1_BOUNDARY_SHOULD_ALREADY_BE_EMPTY`);}
console.log('✓ BATCH-002 six locale Candidates contain no internal governance leakage and no standalone Knowledge Boundary section.');
console.log('✓ BATCH-002 is 3/3 PASS, 3/3 READY_FOR_FINAL_APPROVAL, with zero synthetic TL approvals/publications.');
console.log('✓ Historical Batch-001/pre-Batch-001 knowledgeBoundary metadata remains internal while customer article rendering suppresses the boundary card globally.');
