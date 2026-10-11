import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const root='tools/review/free-ask-manuscript-r1/',sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const sixScopes=process.argv.includes('--six-scopes');
const receipt=JSON.parse(fs.readFileSync(root+'BOOK-III-CURRENT-PRIVATE-CANDIDATE-RECEIPT.json'));
const comparison=JSON.parse(fs.readFileSync(root+'BOOK-III-CURRENT-COMPLETE-CORPUS-COMPARISON.json'));
const bytes=fs.readFileSync(comparison.corpusPath),corpus=JSON.parse(bytes);
assert.equal(sha(bytes),receipt.readbackBytesSha256);
const acceptanceBytes=fs.readFileSync(receipt.sourceAcceptancePath),acceptance=JSON.parse(acceptanceBytes);
assert.equal(sha(acceptanceBytes),receipt.sourceAcceptanceSha256);assert.equal(corpus.sourceSha256,acceptance.sourceSha256);
const registryPath='content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v5.json';
const registry=JSON.parse(fs.readFileSync(registryPath));
const source=registry.records.find(r=>r.bookCode==='BOOK-3');
for(const key of ['acceptancePath','acceptanceSha256','scopeAdmissionPath','scopeAdmissionSha256'])delete source[key];
Object.assign(source,{sourceCode:'MKS-BOOK-3-OWNER-FINAL-EFBFDD21-ZH-HANS-QA',version:acceptance.version,sourceSha256:corpus.sourceSha256,corpusSha256:corpus.corpusSha256,retrievalCorpusSha256:sha(bytes),r2ObjectKey:receipt.objectKey,recordCount:106,runtimeAdmission:'QA_SOURCE_IDENTITY_ONLY_NOT_PRODUCTION',sourceAcceptancePath:receipt.sourceAcceptancePath,sourceAcceptanceSha256:sha(acceptanceBytes),humanReadabilityStatus:'CURRENT_DERIVATIVE_QUALITY_QA_PENDING'});
const metadataText=fs.readFileSync('functions/knowledge-runtime/current-manuscript-server-metadata.js','utf8');
const originalRaw=JSON.parse(metadataText.match(/export const manuscriptMetadataRaw = ([\s\S]*);\s*$/)[1]);
const raw={...originalRaw,[registryPath]:JSON.stringify(registry),[receipt.sourceAcceptancePath]:acceptanceBytes.toString('utf8')};
if(sixScopes){
 const candidate=JSON.parse(fs.readFileSync('content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v6-candidate.json'));
 raw[registryPath]=JSON.stringify(candidate);
 const active=candidate.records.find(r=>r.bookCode==='BOOK-3');
 raw[active.scopeAdmissionPath]=fs.readFileSync(active.scopeAdmissionPath,'utf8');
}
const compiled=await build({entryPoints:['functions/api/customer-contextual-ask.js','functions/_lib/knowledge-access-api.js'],bundle:true,platform:'node',format:'esm',outdir:'.tmp/book3-complete-chapter-qa',write:false,plugins:[{name:'isolated-current-source-qa-metadata',setup(build){build.onLoad({filter:/current-manuscript-server-metadata\.js$/},()=>({contents:'export const manuscriptMetadataRaw = '+JSON.stringify(raw)+';',loader:'js'}));}}]});
const load=name=>import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles.find(f=>f.path.endsWith(name+'.js')).text).toString('base64'));
const customer=await load('customer-contextual-ask'),knowledge=await load('knowledge-access-api');
let providerCalls=0;globalThis.fetch=()=>{providerCalls++;throw Error('PROVIDER_FORBIDDEN');};
const env={PHIOS_ENVIRONMENT:'qa',PHIOS_MANUSCRIPT_RETRIEVAL_ENABLED:'true',PHIOS_MANUSCRIPT_DERIVATIVE_QA:'true',PHIOS_MANUSCRIPT_TEXT_SCOPE_QA:'false',PHIOS_MANUSCRIPT_TEXT_SCOPE_ENABLED:'false',MANUSCRIPTS:{async get(key){return key===receipt.objectKey?{body:bytes}:null;}},ASSETS:{async fetch(req){const path='.'+new URL(req.url).pathname;return fs.existsSync(path)?new Response(fs.readFileSync(path)):new Response('',{status:404});}}};
const results=[];
if(sixScopes){env.PHIOS_MANUSCRIPT_DERIVATIVE_QA='false';env.PHIOS_MANUSCRIPT_TEXT_SCOPE_ENABLED='true';}
const allowed=sixScopes?JSON.parse(raw['content/knowledge/source-access/registries/manuscript-text-scope-candidates-v4.json']).records.filter(r=>r.bookCode==='BOOK-3').map(r=>r.sectionCode):null;
for(const record of corpus.records.filter(r=>r.segmentType==='SECTION'&&(!allowed||allowed.includes(r.sectionCode)))){
 const label=record.heading.split(/[|｜]/)[0].trim(),subtitle=record.heading.split(/[|｜]/).slice(1).join('｜').trim();
 const questions=[{kind:'DEFINITION',q:`第三册的“${label}”具体指什么？`},...(subtitle?[{kind:'CHAPTER_NATIVE_MECHANISM',q:subtitle}]:[])];
 for(const question of questions){
  const url=new URL('https://isolated.qa/api/knowledge-access');url.search=new URLSearchParams({q:question.q,bookCode:'BOOK-3',source:'manuscript',locale:'zh-Hans'});
  const retrieval=await(await knowledge.handleKnowledgeAccessRequest(new Request(url),env)).json();
  const response=await customer.onRequestPost({request:new Request('https://isolated.qa/api/customer-contextual-ask',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({task:'KNOWLEDGE_BASIC',question:question.q,locale:'zh-Hans',contexts:[{contextType:'KNOWLEDGE',contextRef:'BOOK:BOOK-3'}],guidedRouting:false,methodGuidanceRequested:false})}),env,data:{}});
  const body=await response.json(),answer=body.view?.answer?.text||'',sources=(body.view?.basedOn?.sources||[]).filter(s=>s.sectionCode);
  const top=retrieval.manuscript?.records?.[0];
  results.push({sectionCode:record.sectionCode,heading:record.heading,questionType:question.kind,question:question.q,retrievalCorrect:top?.sectionCode===record.sectionCode,retrievedSection:top?.sectionCode,sourceVersion:top?.sourceVersion,sourceSha256:top?.sourceBinaryDigest,sourcePosition:top?.pageRange,actualAnswer:answer,customerState:body.view?.state,sourceReferences:sources,providerCalls:body.execution?.providerCalls,answerPresent:!!answer&&sources.some(s=>s.sectionCode===record.sectionCode),semanticAnswerAcceptance:'PENDING_PER_CHAPTER_REVIEW',testRole:'CORPUS_NATIVE_COVERAGE_NOT_INDEPENDENT_HELDOUT'});
 }
}
assert.equal(providerCalls,0);assert(results.every(r=>r.providerCalls===0));
const result={at:new Date().toISOString(),environment:'ISOLATED_SERVER_QA_SOURCE_ADAPTER_NOT_PRODUCTION',sourceSha256:corpus.sourceSha256,sourceVersion:acceptance.version,corpusBytesSha256:sha(bytes),privateCandidateObject:receipt.objectKey,chapters:103,cases:results.length,retrievalCorrect:results.filter(r=>r.retrievalCorrect).length,answerPresent:results.filter(r=>r.answerPresent).length,semanticAcceptedChapters:0,productionAdmission:false,providerCalls,results};
result.chapters=sixScopes?6:103;
result.productionEquivalentFlags=sixScopes;
fs.writeFileSync(root+(sixScopes?'BOOK-III-CURRENT-SIX-SCOPE-QA.json':'BOOK-III-CURRENT-WHOLE-CHAPTER-QA.json'),JSON.stringify(result,null,2)+'\n');
console.log({chapters:result.chapters,cases:results.length,retrievalCorrect:result.retrievalCorrect,answerPresent:result.answerPresent,semanticAcceptedChapters:0,providerCalls});
