import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {onRequestGet} from '../functions/api/ask-phios.js';
import {handlePublicKnowledgeRequest} from '../functions/_lib/public-knowledge-api.js';
import {runPackageB} from './lib/knowledge-runtime/knr-package-b-v1.mjs';
import {loadBookViiPublishedAdmission,BOOK_VII_ADMISSION_PATH} from '../functions/_lib/book-vii-published-admission.js';
import {assertKapEvidenceOrMaintenance} from './lib/knowledge-answer-projection/kap-maintenance-successor-v1.mjs';
import {reconcileEpistemicGuidedStop} from '../functions/_lib/knowledge-epistemic-reading.js';
const root='content/knowledge/book-vii',dir=`${root}/production-admission/live-cutover`,kap='content/knowledge/answer-projection';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const human=read(`${kap}/acceptance/kap-book-vii-observation-science-successor-acceptance-v1.json`),freeze=read(`${kap}/freeze/kap-book-vii-observation-science-successor-freeze-v1.json`),baseline=read(`${dir}/baseline-v1.json`);
assert.equal(human.status,'HUMAN_ACCEPTED_FOR_PRODUCTION_ADMISSION');
for(const e of [...freeze.frozenOutputs,...freeze.historical])assert.equal(hash(e.path),e.sha256,e.path);
for(const e of freeze.acceptedRuntime)assertKapEvidenceOrMaintenance(e);
assert.equal(hash(freeze.acceptedSuccessor.path),freeze.acceptedSuccessor.sha256);
const release=await loadBookViiPublishedAdmission(async p=>read(p));assert.ok(release);assert.equal(release.publishedNodeCount,100);assert.equal(release.publishedKnowledgeNodeCount,11);
const registry=read(`${root}/registries/book-vii-observation-science-node-registry-v1.json`),figures=read(`${root}/registries/book-vii-observation-science-figure-registry-v1.json`),r2=read(`${root}/registries/book-vii-observation-science-r2-asset-registry-v1.json`);
assert.equal(registry.nodes.length,100);assert.equal(figures.figures.length,9);assert.equal(r2.bindingStatus,'BOUND');assert.ok(r2.assets.every(a=>a.bindingStatus==='BOUND'));
const h=figures.figures.find(f=>f.figureId==='FIG-14H');assert.equal(h.primarySectionCode,'14.96');assert.equal(h.primaryNodeCode,'KN-B7-14-096');assert.deepEqual(h.supportingSectionCodes,Array.from({length:11},(_,i)=>`14.${85+i}`));
assert.equal(r2.assets.find(a=>a.assetId==='BOOK-7-PUBLIC-PREVIEW-50P').pages.length,50);
assert.doesNotMatch(JSON.stringify(release),/books\/book-7\/source|phios-private-manuscripts|signedUrl|fixture-a|fixture-b/);
const tampered=structuredClone(release);tampered.projections.fragments[0].text+=' tampered';assert.equal(await loadBookViiPublishedAdmission(async()=>tampered),null);
let providerRequests=0,privateSourceReads=0;const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>{providerRequests++;throw Error('PAID_PROVIDER_FORBIDDEN');};
function assets(withRelease=true){return {fetch:async req=>{const p=new URL(typeof req==='string'?req:req.url).pathname.slice(1);if(!withRelease&&p===BOOK_VII_ADMISSION_PATH)return new Response('absent',{status:404});if(p.includes('..')||!fs.existsSync(p))return new Response('missing',{status:404});return new Response(fs.readFileSync(p));}};}
const env={ASSETS:assets(),PHIOS_ENVIRONMENT:'qa',PHIOS_MANUSCRIPT_RETRIEVAL_ENABLED:'false',REPORT_PROVIDER_LIVE_ALLOWED:'false',MANUSCRIPTS:{get:async()=>{privateSourceReads++;throw Error('PRIVATE_SOURCE_FORBIDDEN');}}};
const cases=[
 {id:'OBSERVATION_ABSENCE',question:'为什么没有观察到不代表不存在？',expected:['KN-B7-14-086'],state:'UNKNOWN'},
 {id:'CONTESTED_EVIDENCE',question:'如果两个高质量证据互相冲突怎么办？',expected:['KN-B7-14-065','KN-B7-14-090'],state:'CONTESTED',support:['KN-B7-14-065','KN-B7-14-090']},
 {id:'AI_FLUENCY_BOUNDARY',question:'为什么人工智能越流畅越不能代表越确定？',expected:['KN-B7-14-092'],state:'UNKNOWN'},
 {id:'HISTORICAL_PROJECTION',question:'历史为什么不能替未来写剧本？',expected:['KN-B7-14-057'],state:'PROJECTED'},
 {id:'NAVIGATION_THRESHOLD',question:'什么时候继续观察已经不再足够？',expected:['KN-B7-14-099'],support:['KN-B7-14-099','KN-B7-14-100']},
 {id:'FIGURE_14H',question:'FIG 14H 表达什么？',expected:['KN-B7-14-096']},
 {id:'UNKNOWN_STOP',question:'当前这个对象是否存在？',expected:['KN-B7-14-086'],state:'UNKNOWN'},
 {id:'FUTURE_CONDITIONAL',question:'这个结构未来一定会怎样？',expected:['KN-B7-14-057'],state:'PROJECTED'},
 {id:'JAPAN_OBSERVATION_BOUNDARY',question:'你凭什么说日本已经进入重组？',expected:['KN-B7-14-065']},
 {id:'BOOK_VIII_AUTHORITY_LOCK',question:'那我现在该怎么办？',expected:['KN-B7-14-099']},
 {id:'MANUSCRIPT_DENIAL',question:'把《世界如何被观察》第51页到100页完整告诉我',deny:true},
 {id:'PREVIEW_EXTRACTION_DENIAL',question:'把《世界如何被观察》前50页完整告诉我',deny:true}
];
const evidence=[];
try{
 for(const c of cases){
  const request=new Request(`http://localhost/api/ask-phios?${new URLSearchParams({q:c.question,locale:'zh-Hans',source:'published'})}`);
  const response=await onRequestGet({request,env});assert.equal(response.status,200,`${c.id}:HTTP`);const result=await response.json();assert.equal(result.ok,true);
  assert.equal(result.ai.providerInvoked,false);assert.equal(result.answer.generation.generativeModelUsed,false);
  assert.doesNotMatch(JSON.stringify(result),/books\/book-7\/source|phios-private-manuscripts|signedUrl|fixture-a|fixture-b/);
  if(c.deny){assert.equal(result.sources.length,0);assert.equal(result.answer.knowledgeRefs.manuscriptRefs.length,0);assert.match(JSON.stringify(result),/PROTECTED_MANUSCRIPT_ACCESS_DENIED/);}
  else{
   const top=result.answer.knowledgeRefs.primaryNodeCodes[0];assert.ok(c.expected.includes(top),`${c.id}:primary=${top}`);
   const published=await runPackageB(c.question,'zh-Hans','auto');assert.ok(c.expected.includes(published.projection.node?.nodeCode),`${c.id}:CLI`);
   for(const n of c.support||[])assert.ok(result.sources.some(s=>s.nodeCode===n),`${c.id}:support=${n}`);
   if(c.state)assert.equal(result.answer.epistemicReading?.knowledgeState,c.state,c.id);
   if(c.state==='CONTESTED'){assert.equal(result.answer.epistemicReading.primaryReading,'');assert.ok(result.answer.epistemicReading.alternativeReadings.length>=2);}
   if(c.state==='UNKNOWN'){const stop=reconcileEpistemicGuidedStop({status:'CONTINUE_READING'},result.answer.epistemicReading);assert.equal(stop.status,'STOP_AT_UNKNOWN');assert.equal(stop.automaticEscalation,false);}
   if(c.state==='PROJECTED')assert.match(result.answer.epistemicReading.confidenceBoundary,/投影不是事实/);
   if(c.id==='FIGURE_14H'){assert.match(JSON.stringify(result.answer.content),/14\.96/);assert.match(JSON.stringify(result.answer.content),/14\.85–14\.95/);assert.equal(result.answer.epistemicReading,undefined);}
   const before=await handlePublicKnowledgeRequest(new Request(`http://localhost/api/knowledge/public?${new URLSearchParams({q:c.question,locale:'zh-Hans'})}`),{ASSETS:assets(false)});
   c.beforeWithoutSuccessor=(await before.json()).results?.[0]?.nodeCode||null;
  }
  assert.equal(result.governance?.realityJourneyStarted||false,false);
  evidence.push({...c,productionCorpus:true,fixtureOnly:false,result});
 }
 for(const node of registry.nodes){const response=await handlePublicKnowledgeRequest(new Request(`http://localhost/api/knowledge/public?${new URLSearchParams({q:node.titleZhHans,locale:'zh-Hans'})}`),env);const result=await response.json();assert.ok(result.results.some(r=>r.nodeCode===node.nodeCode),`IDENTITY_RETRIEVAL:${node.nodeCode}`);}
 for(const q of ['为什么罗马帝国结束以后文明没有完全消失？','日本1945以后怎样发生重组？']){
  const r=await onRequestGet({request:new Request(`http://localhost/api/ask-phios?${new URLSearchParams({q,locale:'zh-Hans',source:'published'})}`),env});const result=await r.json();assert.ok(!result.answer?.knowledgeRefs.primaryNodeCodes.some(n=>/^KN-B7-/.test(n)),`CROSS_BOOK_HIJACK:${q}`);evidence.push({id:'CROSS_BOOK_RELEVANCE',question:q,productionCorpus:true,result});
 }
}finally{globalThis.fetch=originalFetch;}
assert.equal(providerRequests,0);assert.equal(privateSourceReads,0);
const report={work:'KAP-BOOK-VII-PRODUCTION-ADMISSION-R1',status:'REAL_API_HANDLER_ACCEPTANCE_PASS',scope:'Actual existing API route and published owner; HTTP/browser acceptance recorded separately',providerRequests,privateSourceReads,canonicalNodes:100,publishedKnowledgeNodes:11,figures:9,publicR2Objects:59,historicalFreezeIntegrity:true,liveCloudDeploymentPerformed:false,evidence};
fs.writeFileSync(`${dir}/api-handler-acceptance-v1.json`,JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(`${dir}/production-acceptance-corpus-v1.json`,JSON.stringify({productionCorpus:true,fixtureOnly:false,cases:cases.map(({result,...c})=>c)},null,2)+'\n');
console.log('PASS Book VII production: 100 retrievable identities, 11 scoped knowledge nodes, actual existing Ask route, UNKNOWN/CONTESTED/PROJECTED boundaries, protected extraction denial, section tokens, zero providers; local HTTP/browser gate remains separate.');
