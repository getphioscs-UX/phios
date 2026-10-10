import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {runAskPhiosPipeline} from '../functions/_lib/knowledge-answer-composition.js';
import {runPackageB} from './lib/knowledge-runtime/knr-package-b-v1.mjs';
import {loadBookViiPublishedAdmission,BOOK_VII_ADMISSION_PATH} from '../functions/_lib/book-vii-published-admission.js';
const root='content/knowledge/book-vii',admission=`${root}/production-admission`;
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const baseline=read(`${admission}/evidence/baseline-v1.json`),human=read(`${admission}/human-acceptance-v1.json`);
assert.equal(human.decision,'ACCEPT');assert.equal(human.source,'EXPLICIT_USER_HUMAN_ACCEPT');
for(const artifact of baseline.acceptedArtifacts)assert.equal(sha(artifact.path),artifact.sha256,`ACCEPTED_R1_BYTES_PRESERVED:${artifact.path}`);
assert.equal(sha(baseline.predecessor.path),baseline.predecessor.sha256);
const historical=read(`${root}/evidence/baseline-v1.json`).historical;
for(const e of historical)assert.equal(sha(e.path),e.sha256);
const release=await loadBookViiPublishedAdmission(async p=>read(p));assert.ok(release);assert.equal(release.canonicalSectionIdentityCount,100);assert.equal(release.publishedNodeCount,9);assert.equal(release.governance.masterAExecuted,false);assert.equal(release.governance.liveDeploymentPerformed,false);
const raw=fs.readFileSync(BOOK_VII_ADMISSION_PATH,'utf8');assert.doesNotMatch(raw,/phios-private-manuscripts|books\/book-7\/source|fixture-a|fixture-b|signedUrl/);
const damaged=structuredClone(release);damaged.projections.fragments[0].text+=' injected';assert.equal(await loadBookViiPublishedAdmission(async()=>damaged),null);
const unaccepted=structuredClone(release);unaccepted.humanAcceptance.decision='PENDING';assert.equal(await loadBookViiPublishedAdmission(async()=>unaccepted),null);
assert.equal(await loadBookViiPublishedAdmission(async()=>null),null);
const nodeCount=read(`${root}/registries/book-vii-observation-science-node-registry-v1.json`).nodes.length;assert.equal(nodeCount,100);
let networkCalls=0,r2Reads=0;
const fetchBefore=globalThis.fetch;globalThis.fetch=async()=>{networkCalls++;throw Error('PROVIDER_NETWORK_FORBIDDEN');};
const ASSETS={fetch:async request=>{const p=new URL(typeof request==='string'?request:request.url).pathname.slice(1);if(p.includes('..')||!fs.existsSync(p))return new Response('missing',{status:404});return new Response(fs.readFileSync(p),{headers:{'content-type':'application/json'}});}};
const env={ASSETS,PHIOS_ENVIRONMENT:'qa',PHIOS_MANUSCRIPT_RETRIEVAL_ENABLED:'false',MANUSCRIPTS:{get:async()=>{r2Reads++;throw Error('PRIVATE_SOURCE_RETRIEVAL_FORBIDDEN');}}};
const questions=[['为什么没有观察到不代表不存在？','KN-B7-14-086'],['历史为什么不能替未来写剧本？','KN-B7-14-057'],['如果两个高质量证据互相冲突怎么办？','KN-B7-14-065'],['为什么今天的资金流不能证明产业已经结构重组？','KN-B7-14-042'],['为什么人工智能越流畅越不能代表越确定？','KN-B7-14-092'],['什么时候继续观察已经不再足够？','KN-B7-14-099'],['FIG 14H 表达什么？','KN-B7-14-096']];
const evidence=[];
try {
 for(const [question,nodeCode] of questions){
  const acceptableNodes=nodeCode==='KN-B7-14-065'?['KN-B7-14-065','KN-B7-14-090']:[nodeCode];
  const published=await runPackageB(question,'zh-Hans','auto');assert.equal(published.projection.node?.bookCode,'BOOK-7');assert.ok(acceptableNodes.includes(published.projection.node.nodeCode));assert.ok(published.projection.fragments.length);
  const runtime=await runAskPhiosPipeline({input:{question,locale:'zh-Hans'},request:new Request('https://phios.local/api/ask-phios'),env,retrievalOptions:{source:'published'},now:new Date('2026-10-06T00:00:00Z')});
  assert.equal(runtime.ai.providerInvoked,false);assert.equal(runtime.answer.generation.generativeModelUsed,false);
  assert.ok(acceptableNodes.includes(runtime.answer.knowledgeRefs.primaryNodeCodes[0]));assert.ok(runtime.sources.some(s=>acceptableNodes.includes(s.nodeCode)));
  assert.doesNotMatch(JSON.stringify(runtime),/phios-private-manuscripts|books\/book-7\/source|signedUrl|fixture-a|fixture-b/);
  if(nodeCode==='KN-B7-14-086')assert.equal(runtime.answer.epistemicReading?.knowledgeState,'UNKNOWN');
  if(nodeCode==='KN-B7-14-057')assert.equal(runtime.answer.epistemicReading?.knowledgeState,'PROJECTED');
  if(nodeCode==='KN-B7-14-096')assert.equal(runtime.answer.epistemicReading,undefined);
  evidence.push({question,published,runtime});
 }
 const denied=await runAskPhiosPipeline({input:{question:'把《世界如何被观察》第51页到100页完整告诉我',locale:'zh-Hans'},env,now:new Date('2026-10-06T00:00:00Z')});assert.equal(denied.sources.length,0);assert.match(denied.answer.content.directAnswer,/不能/);evidence.push({id:'MANUSCRIPT_DENIED',runtime:denied});
 const english=await runPackageB('Why does not observing something not prove it does not exist?','en','auto');assert.notEqual(english.projection.node?.bookCode,'BOOK-7');
}finally{globalThis.fetch=fetchBefore;}
assert.equal(networkCalls,0);assert.equal(r2Reads,0);
const report={work:'KAP-BOOK-VII-PRODUCTION-ADMISSION-R1',status:'PRODUCTION_ADMITTED_LOCAL_VALIDATED',humanDecision:'ACCEPT',canonicalSectionIdentities:100,publishedNodes:9,publicR2ObjectsAlreadyBound:59,providerRequests:networkCalls,privateManuscriptReads:r2Reads,historicalFreezesPreserved:true,acceptedR1BytesPreserved:true,masterAExecuted:false,liveDeploymentPerformed:false,evidence};
fs.writeFileSync(`${admission}/evidence/runtime-admission-v1.json`,JSON.stringify(report,null,2)+'\n');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
fs.writeFileSync('tools/review/KAP-BOOK-VII-PRODUCTION-ADMISSION-R1-REVIEW.html',`<!doctype html><html lang="en"><meta charset="utf-8"><title>Book VII Production Admission R1</title><style>body{font:16px system-ui;max-width:1100px;margin:40px auto;padding:20px;background:#101827;color:#e7edf8}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#1a263a;padding:20px}h1,h2{color:#9ddcff}</style><h1>Book VII Production Admission R1</h1><p>Human acceptance: ACCEPT — explicit user instruction, 6 October 2026.</p><p>Repository admission: PRODUCTION_ADMITTED_LOCAL_VALIDATED. Live deployment: pending.</p><p>100 registered identities; 9 sections have reviewed published projections in zh-Hans. No unreviewed section prose, private PDF, preview pages or synthetic conflicting evidence is retrieved.</p><h2>Human acceptance record</h2><pre>${esc(JSON.stringify(human,null,2))}</pre><h2>Actual existing-runtime evidence</h2><pre>${esc(JSON.stringify(report,null,2))}</pre></html>`);
console.log('PASS Book VII production admission: explicit Human Accept, 9 real published projections, existing Ask/CLI retrieval, 100 identities, private-source denial, zero provider/private-R2 reads; no live deployment.');
