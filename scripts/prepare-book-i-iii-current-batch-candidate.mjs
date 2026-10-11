import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),read=p=>JSON.parse(fs.readFileSync(p));
const root='tools/review/free-ask-manuscript-r1/';
const revision=read(root+'BOOK-I-V3-INCREMENTAL-CORPUS.json'),delivery=read(root+'BOOK-I-V3-INCREMENTAL-PRIVATE-RECEIPT.json'),corpus=read(revision.corpusPath);
assert.equal(sha(fs.readFileSync(revision.corpusPath)),delivery.readbackBytesSha256);
const firstOnly=process.argv.includes('--book-i-only');
const scopes=read('content/knowledge/source-access/registries/manuscript-text-scope-candidates-'+(firstOnly?'v3':'v4')+'.json');
scopes.schemaVersion='PHI-OS-MANUSCRIPT-TEXT-SCOPE-CANDIDATES-v5';scopes.successorOf='content/knowledge/source-access/registries/manuscript-text-scope-candidates-v4.json';
const structure=corpus.records.find(r=>r.sectionCode==='B1V3-P1-S003'),capacity=corpus.records.find(r=>r.sectionCode==='B1V3-P4-S032');
const rows=[['BOOK-I-V3-INTRODUCTION', 'B1V3-P0-S001',11139,12926,[13,14]],['BOOK-I-V3-STRUCTURE','B1V3-P1-S003',structure.text.indexOf('如果所有变'),1208,[57]],['BOOK-I-V3-CARRIER-CAPACITY','B1V3-P4-S032',0,capacity.text.indexOf('承载能力由此'),[341,342]]];
for(const[id,code,start,end,pages]of rows){const r=corpus.records.find(r=>r.sectionCode===code);assert(r);assert(end<=r.text.length);scopes.records.push({scopeId:id,bookCode:'BOOK-1',sourceSha256:corpus.sourceSha256,corpusSha256:corpus.corpusSha256,sectionCode:code,sectionSha256:r.textSha256,heading:r.heading,startOffset:start,endOffset:end,scopeState:'LOCAL_QA_VERIFIED_PROSE_CANDIDATE',answerAcceptance:'CURRENT_API_REGRESSION_AND_HOLDOUT_PENDING',sourceDependency:'SELECTED_TEXT_PROSE_NO_UNVERIFIED_OCR',locale:'zh-Hans',publicFullTextAllowed:false,answerProjectionPolicy:'QUESTION_ANCHORED_CONTIGUOUS',...(id.includes('INTRODUCTION')?{causalExplanationAvailable:false}:{}),validation:{visualPages:pages,visualScope:'PENDING',sourceAcceptance:revision.sourceAcceptancePath},productionActivationDefault:false});}
const scopePath='content/knowledge/source-access/registries/manuscript-text-scope-candidates-v5.json';fs.writeFileSync(scopePath,JSON.stringify(scopes,null,2)+'\n');
const registry=read('content/knowledge/source-access/registries/manuscript-knowledge-source-registry-'+(firstOnly?'v5.json':'v6-candidate.json'));registry.schemaVersion='PHI-OS-MANUSCRIPT-KNOWLEDGE-SOURCE-REGISTRY-v7-CANDIDATE';registry.successorOf='content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v5.json';registry.productionActivated=false;
const source=registry.records.find(r=>r.bookCode==='BOOK-1');
delete source.acceptancePath;delete source.acceptanceSha256;
Object.assign(source,{sourceCode:'MKS-BOOK-1-V3-REVISION-33C91CD6-ZH-HANS',version:corpus.sourceRevision,sourceSha256:corpus.sourceSha256,corpusSha256:corpus.corpusSha256,retrievalCorpusSha256:delivery.readbackBytesSha256,r2ObjectKey:delivery.objectKey,localPath:revision.corpusPath,recordCount:275,sourceAcceptancePath:revision.sourceAcceptancePath,sourceAcceptanceSha256:sha(fs.readFileSync(revision.sourceAcceptancePath)),scopeAdmissionPath:scopePath,scopeAdmissionSha256:sha(fs.readFileSync(scopePath)),runtimeAdmission:'SCOPED_TEXT_CANDIDATE_NOT_ACTIVATED',currentness:'CURRENT_V3_REVISION_BOUNDED_RANGE_CANDIDATE'});
if(!firstOnly){const third=registry.records.find(r=>r.bookCode==='BOOK-3');third.scopeAdmissionPath=scopePath;third.scopeAdmissionSha256=source.scopeAdmissionSha256;}
fs.writeFileSync('content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v7-candidate.json',JSON.stringify(registry,null,2)+'\n');
console.log('Versioned candidate: Book I three prose ranges plus Book III current six ranges; not activated.');
