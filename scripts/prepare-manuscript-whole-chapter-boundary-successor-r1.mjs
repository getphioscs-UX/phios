import fs from'node:fs';import{createHash}from'node:crypto';import assert from'node:assert/strict';
const dir='content/knowledge/source-access/registries/',read=p=>JSON.parse(fs.readFileSync(p)),sha=b=>createHash('sha256').update(b).digest('hex'),write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');
const scope=read(dir+'manuscript-text-scope-candidates-v6.json');
scope.successorOf=dir+'manuscript-text-scope-candidates-v6.json';
const fifth=scope.records.find(r=>r.sectionCode==='B5-S002');
const concept={conceptId:'SOURCE-STATE-INTERNAL-DIVERSITY',aliases:['行政统一','内部差异','政治统一'],termSets:[['国家','语言','记忆']],supportAnchor:'统一法律和行政机构能够建立政治共同体,却不会自动抹除内部差异'};
const corpus=read('.tmp/knowledge-manuscripts/book-5-v1/positioned-candidate-r2/retrieval-corpus.json');
const normalize=s=>s.normalize('NFKC').replace(/\s+/gu,'');
assert(normalize(corpus.records.find(r=>r.sectionCode==='B5-S002').text).includes(normalize(concept.supportAnchor)));
fifth.retrievalConcepts.push(concept);
const scopePath=dir+'manuscript-text-scope-candidates-v7.json';write(scopePath,scope);
for(const kind of ['candidate','production']){
 const old=dir+'manuscript-knowledge-source-registry-v9'+(kind==='candidate'?'-candidate':'')+'.json',r=read(old);
 for(const source of r.records)if(source.scopeAdmissionPath===dir+'manuscript-text-scope-candidates-v6.json'){source.scopeAdmissionPath=scopePath;source.scopeAdmissionSha256=sha(fs.readFileSync(scopePath));}
 r.schemaVersion='PHI-OS-MANUSCRIPT-KNOWLEDGE-SOURCE-REGISTRY-v10'+(kind==='candidate'?'-CANDIDATE':'');r.successorOf=old;
 r.boundaryCorrection={failureEvidence:'tools/review/free-ask-manuscript-r1/whole-chapter-batch-r1/LIVE-ANSWERS.json',change:'Source-anchored internal diversity concept; explicit manuscript no-match no longer enters optional article fallback',scopeExpansion:false};
 write(dir+'manuscript-knowledge-source-registry-v10'+(kind==='candidate'?'-candidate':'')+'.json',r);
}
console.log(JSON.stringify({registrySuccessor:'v10',scopeSuccessor:'v7',sourceBodiesChanged:false,providerCalls:0}));
