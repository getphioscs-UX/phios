import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const a3=read('content/knowledge/production-planning/plans/book4-a3-final-article-map-v1.json');
const audit=read('content/knowledge/production-planning/audits/book4-article-production-completion-audit-v1.json');
const bindings=read('content/knowledge/knowledge-intelligence-r2/registries/kir-r2-published-article-binding-registry-v2.json');
assert.equal(a3.articles.length,53);
const nodeCodes=a3.articles.flatMap(x=>x.nodeCodes);
assert.equal(nodeCodes.length,125);assert.equal(new Set(nodeCodes).size,125);
assert.equal(audit.status,'BOOK_IV_BILINGUAL_ARTICLE_PRODUCTION_COMPLETE_53_OF_53_PUBLICATION_CLOSED');
assert.deepEqual(audit.counts,{batchCount:11,articleIdentityCount:53,canonicalNodeCoverageCount:125,zhHansArticleVersions:53,zhHansHumanAccepted:53,englishArticleVersions:53,englishMachineParityAccepted:53,totalLocaleVersions:106,publishedArticleBindings:0});
const expected={B01:8,B02:4,B03:5,B04:5,B05:3,B06:4,B07:4,B08:4,B09:5,B10:6,B11:5};
let zhAccepted=0,enGenerated=0,enParity=0;
for(const [code,count] of Object.entries(expected)){
  if(code==='B01'){
    const h=read('content/knowledge/production-planning/acceptance/book4-pja-wave1-human-acceptance-v1.json');
    const p=read('content/knowledge/production-planning/acceptance/book4-b01-english-semantic-parity-v1.json');
    assert.equal(h.acceptedArticleCount,count);assert.equal(p.counts.englishArticles,count);assert.equal(p.counts.machineParityAccepted,count);assert.equal(p.records.length,count);
    for(const r of p.records){assert.ok(fs.existsSync(r.zhHansPath));assert.ok(fs.existsSync(r.enPath));}
    zhAccepted+=count;enGenerated+=count;enParity+=count;continue;
  }
  const key=code.toLowerCase();
  const m=read(`content/knowledge/production-planning/production/book4-${key}/manifest-v1.json`);
  const p=read(`content/knowledge/production-planning/acceptance/book4-${key}-english-semantic-parity-v1.json`);
  assert.equal(m.counts.articleCandidates,count);assert.equal(m.counts.humanAcceptedArticles,count);assert.equal(m.counts.englishCandidates,count);assert.equal(m.counts.publishedArticles,0);assert.equal(m.counts.localesProduced,2);
  assert.equal(p.counts.englishArticles,count);assert.equal(p.counts.machineParityAccepted,count);assert.equal(p.counts.failed,0);assert.equal(p.records.length,count);
  for(const r of m.records){assert.ok(fs.existsSync(r.path));assert.ok(fs.existsSync(r.englishCandidatePath));}
  zhAccepted+=count;enGenerated+=count;enParity+=count;
}
assert.equal(zhAccepted,53);assert.equal(enGenerated,53);assert.equal(enParity,53);
assert.equal(audit.batches.length,11);assert.equal(audit.batches.reduce((n,x)=>n+x.articleIdentities,0),53);assert.equal(audit.batches.reduce((n,x)=>n+x.canonicalNodeCoverage,0),125);assert.ok(audit.batches.every(x=>x.zhHansHumanAccepted===x.articleIdentities&&x.englishGenerated===x.articleIdentities&&x.englishMachineParityAccepted===x.articleIdentities&&x.publication==='CLOSED'));
assert.equal(bindings.records.some(x=>x.bookCode==='BOOK-4'),false);
console.log('✓ BOOK IV Article Production Completion Audit passed: 11 batches / 53 Article identities / 125 canonical nodes / 106 bilingual locale versions.');
console.log('✓ Underlying production assets verified: zh-Hans human acceptance 53/53; English production 53/53; machine semantic parity 53/53.');
console.log('✓ Production completion does not equal publication: BOOK-4 published Article bindings remain 0 and publication is closed.');
