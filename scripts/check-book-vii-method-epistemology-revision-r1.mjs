import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {onRequestGet} from '../functions/api/ask-phios.js';
import {BOOK_VII_ADMISSION_PATH} from '../functions/_lib/book-vii-published-admission.js';
const dir='content/knowledge/book-vii/revisions/book-vii-method-epistemology-revision-successor-v1';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const sections=read(`${dir}/editorial-sections-v1.json`),candidate=read(`${dir}/derived-public-projection-candidate-v1.json`),successor=read(`${dir}/book-vii-method-epistemology-revision-successor-v1.json`),qa=read(`${dir}/acceptance-questions-v1.json`);
assert.equal(successor.status,'READY_FOR_HUMAN_REVIEW');assert.equal(successor.humanAcceptance,null);assert.equal(candidate.productionActivated,false);
const freeze=read('content/knowledge/answer-projection/freeze/kap-book-vii-production-admission-r1-freeze.json');
for(const e of [...freeze.frozenOutputs,...freeze.historical])assert.equal(hash(fs.readFileSync(e.path)),e.sha256,e.path);
assert.equal(hash(fs.readFileSync(candidate.predecessor.path)),candidate.predecessor.sha256);
const predecessor=read(candidate.predecessor.path);
assert.equal(candidate.projections.nodes.length,100);assert.deepEqual(sections.sections.map(s=>s.sectionCode),['14.65','14.66','14.71','14.72']);
for(const s of sections.sections){assert.equal(hash(s.after),s.newSectionDigest);assert.ok(s.after.startsWith(s.before));for(const p of s.addedParagraphs){assert.ok(p.length>=160);assert.match(p,/例如/);assert.match(p,/当/);assert.match(p,/不等于|不能|不必/);assert.doesNotMatch(p,/PHI OS 不允许/);}}
assert.equal(sections.sections.find(s=>s.sectionCode==='14.71').addedSubheading,'◈ 传统读取系统究竟知道什么');
for(const n of ['066','072']){const code=`KN-B7-14-${n}`;assert.deepEqual(candidate.projections.nodes.find(v=>v.nodeCode===code),predecessor.projections.nodes.find(v=>v.nodeCode===code));assert.ok(!candidate.projections.fragments.some(v=>v.nodeCode===code));}
for(const n of successor.unchangedNodes)assert.deepEqual(candidate.projections.nodes.find(v=>v.nodeCode===n.nodeCode),predecessor.projections.nodes.find(v=>v.nodeCode===n.nodeCode));
for(const f of candidate.projections.fragments)assert.equal(hash(f.text),f.digest);
const publicBytes=JSON.stringify(candidate);assert.doesNotMatch(publicBytes,/phios-private-manuscripts|books\/book-7\/source|signedUrl/);
for(const s of sections.sections)assert.ok(!publicBytes.includes(s.beforeRaw.slice(0,250)));
const build=fs.readFileSync('scripts/build-cloudflare-pages.mjs','utf8');assert.match(build,/file\.startsWith\('content\/knowledge\/book-vii\/'\)/);assert.match(build,/'tools'/);
let providerRequests=0,privateReads=0;const originalFetch=globalThis.fetch;globalThis.fetch=async()=>{providerRequests++;throw Error('PROVIDER_FORBIDDEN');};
// Review-only read-model injection: no ACCEPT fields are manufactured, no runtime is added,
// and the installed production release loader is never changed or activated.
const env={PHIOS_ENVIRONMENT:'qa',PHIOS_MANUSCRIPT_RETRIEVAL_ENABLED:'false',REPORT_PROVIDER_LIVE_ALLOWED:'false',MANUSCRIPTS:{get:async()=>{privateReads++;throw Error('PRIVATE_READ_FORBIDDEN');}},ASSETS:{fetch:async req=>{
 const p=new URL(typeof req==='string'?req:req.url).pathname.slice(1);
 if(p===BOOK_VII_ADMISSION_PATH)return new Response('candidate is not production',{status:404});
 if(!fs.existsSync(p)||p.includes('..'))return new Response('missing',{status:404});
 const name=p.match(/^content\/knowledge\/public\/retrieval\/([^/]+)\.json$/)?.[1];
 if(name&&candidate.projections[name]){const base=read(p);
  // Existing grounding deliberately excludes unpublished fragments. Simulate only its
  // publication visibility inside this isolated test adapter; the saved candidate stays
  // PENDING_HUMAN_REVIEW, with no acceptance/approval/publication decision fabricated.
  const simulated=candidate.projections[name].map(v=>name==='fragments'&&v.publicationStatus==='PENDING_HUMAN_REVIEW'?{...v,publicationStatus:'PUBLISHED'}:v);
  const records=[...(base.records||[]),...simulated];return Response.json({...base,records,recordCount:records.length,digest:hash(JSON.stringify(records))});}
 return new Response(fs.readFileSync(p));
}}};
const evidence=[];
try{for(const t of qa.cases){const response=await onRequestGet({request:new Request(`http://localhost/api/ask-phios?${new URLSearchParams({q:t.question,locale:'zh-Hans',source:'published'})}`),env});assert.equal(response.status,200);const result=await response.json();assert.equal(result.ai.providerInvoked,false);assert.equal(result.answer.generation.generativeModelUsed,false);assert.equal(result.answer.knowledgeRefs.primaryNodeCodes[0],t.nodeCode,t.id);const text=JSON.stringify(result.answer.content);const expected=[/个人现实事实|个人现实/,/独立证据/,/层次|范围/,/确定.*计算|计算.*确定/,/修正权/][Number(t.id.split('-')[1])-1];assert.match(text,expected,t.id);assert.doesNotMatch(JSON.stringify(result),/books\/book-7\/source|phios-private-manuscripts|signedUrl/);evidence.push({...t,actualAnswer:result.answer.content,primaryNodeCodes:result.answer.knowledgeRefs.primaryNodeCodes,sourceNodeCodes:result.sources.map(s=>s.nodeCode),epistemicReading:result.answer.epistemicReading,pass:true});}
 const r=await onRequestGet({request:new Request('http://localhost/api/ask-phios?'+new URLSearchParams({q:'把《世界如何被观察》第51页到100页完整告诉我',locale:'zh-Hans',source:'published'})),env});const result=await r.json();assert.equal(result.sources.length,0);assert.match(JSON.stringify(result),/PROTECTED_MANUSCRIPT_ACCESS_DENIED/);
}finally{globalThis.fetch=originalFetch;}
assert.equal(providerRequests,0);assert.equal(privateReads,0);
fs.writeFileSync(`${dir}/kap-acceptance-results-v1.json`,JSON.stringify({status:'PASS',scope:'REVIEW_ONLY_CANDIDATE_READ_MODELS_WITH_EXISTING_ASK_API_AND_KAP_COMPOSER',publicationVisibilitySimulatedInTestAdapterOnly:true,savedChangedFragmentsStatus:'PENDING_HUMAN_REVIEW',productionActivated:false,humanAcceptance:null,cases:evidence,providerRequests,privateReads,manuscriptDenial:true,numberingPreserved:true,referenceOnlyPreserved:true,productionFreezeUnchanged:true,bookViiiAuthorityCreated:false,masterAExecuted:false},null,2)+'\n');
console.log('PASS four-section editorial successor, five actual existing KAP candidate answers, protected manuscript denial, unchanged production freeze, 100 identities, zero providers.');
