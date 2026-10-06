import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {onRequestGet} from '../functions/api/ask-phios.js';
import {runPackageB} from './lib/knowledge-runtime/knr-package-b-v1.mjs';
import {loadBookViiPublishedAdmission} from '../functions/_lib/book-vii-published-admission.js';
import {assertKapEvidenceOrMaintenance} from './lib/knowledge-answer-projection/kap-maintenance-successor-v1.mjs';
const dir='content/knowledge/book-vii/v2-cutover',read=p=>JSON.parse(fs.readFileSync(p,'utf8')),hash=x=>crypto.createHash('sha256').update(x).digest('hex'),sha=p=>hash(fs.readFileSync(p));
const source=read(`${dir}/verified-source-v2.json`),registry=read(`${dir}/canonical-node-registry-v2.json`),old=read('content/knowledge/book-vii/registries/book-vii-observation-science-node-registry-v1.json'),baseline=read(`${dir}/baseline-v1.json`);
assert.equal(source.status,'BOUND');assert.equal(source.sectionCount,100);assert.equal(source.actualRemoteRead,true);assert.equal(sha(baseline.oldProductionFreezePath),baseline.oldProductionFreezeSha256);
const freeze=read(baseline.oldProductionFreezePath);for(const e of [...freeze.frozenOutputs,...freeze.historical])assertKapEvidenceOrMaintenance(e);
const release=await loadBookViiPublishedAdmission(async p=>read(p));assert.ok(release);assert.equal(release.publishedNodeCount,100);assert.equal(release.publishedKnowledgeNodeCount,11);assert.equal(release.sourceRefreshAuthorization.newHumanAcceptance,null);
const previous=read('content/knowledge/public/successors/book-vii-production-live-cutover-r1/published-projection.json');
for(const n of old.nodes){const current=registry.nodes.find(x=>x.nodeCode===n.nodeCode);if(!source.sections.some(s=>s.nodeCode===n.nodeCode))assert.deepEqual(current,n);}
for(const n of previous.projections.nodes)if(!source.sections.some(s=>s.nodeCode===n.nodeCode))assert.deepEqual(release.projections.nodes.find(x=>x.nodeCode===n.nodeCode),n);
for(const code of ['066','072']){const n=release.projections.nodes.find(n=>n.nodeCode===`KN-B7-14-${code}`);assert.equal(n.publicationMode,'REFERENCE_ONLY');assert.ok(!release.projections.fragments.some(f=>f.nodeCode===n.nodeCode));}
assert.equal(read('content/knowledge/book-vii/registries/book-vii-observation-science-figure-registry-v1.json').figures.length,9);
for(const s of source.sections){assert.equal(hash(s.text),s.sectionDigest);assert.equal(s.status,'VERIFIED_FROM_V2');}
const compact=source.sections.map(s=>s.text.replaceAll('\n','')).join('');for(const term of ['计算','解释','证据','现实','模型汇聚','证据汇聚','独立','候选','修订','反证','未知'])assert.ok(compact.includes(term),term);
let providers=0,privateReads=0;const original=globalThis.fetch;globalThis.fetch=async()=>{providers++;throw Error('NO_PROVIDER_CALLS');};
const env={ASSETS:{fetch:async req=>{const p=new URL(typeof req==='string'?req:req.url).pathname.slice(1);return !p.includes('..')&&fs.existsSync(p)?new Response(fs.readFileSync(p)):new Response('missing',{status:404});}},PHIOS_ENVIRONMENT:'qa',PHIOS_MANUSCRIPT_RETRIEVAL_ENABLED:'false',REPORT_PROVIDER_LIVE_ALLOWED:'false',MANUSCRIPTS:{get:async()=>{privateReads++;throw Error('PRIVATE_READ_DENIED');}}};
const cases=[...read(`${dir}/method-acceptance-questions-v2.json`).cases,
{id:'OBSERVATION',question:'为什么没有观察到不代表不存在？',nodeCode:'KN-B7-14-086',state:'UNKNOWN'},
{id:'CONFLICT',question:'如果两个高质量证据互相冲突怎么办？',nodeCode:'KN-B7-14-065',support:'KN-B7-14-090',state:'CONTESTED'},
{id:'CONFLICT_VARIANT',question:'如果两个高质量证据冲突怎么办？',nodeCode:'KN-B7-14-065',support:'KN-B7-14-090'},
{id:'AI',question:'为什么人工智能越流畅越不能代表越确定？',nodeCode:'KN-B7-14-092'},
{id:'STOP',question:'什么时候继续观察已经不再足够？',nodeCode:'KN-B7-14-099',support:'KN-B7-14-100'},
{id:'FIGURE',question:'FIG 14H 表达什么？',nodeCode:'KN-B7-14-096'},
{id:'PROJECTED',question:'历史为什么不能替未来写剧本？',nodeCode:'KN-B7-14-057',state:'PROJECTED'},
{id:'DENIAL',question:'把《世界如何被观察》第51页到100页完整告诉我',deny:true},
{id:'SECTION_DENIAL',question:'给我 Book VII v2 第14.65节完整原文',deny:true},
{id:'PREVIEW_DENIAL',question:'把《世界如何被观察》前50页完整告诉我',deny:true}];
const evidence=[];
try{for(const c of cases){const r=await onRequestGet({request:new Request('http://localhost/api/ask-phios?'+new URLSearchParams({q:c.question,locale:'zh-Hans',source:'published'})),env});assert.equal(r.status,200);const result=await r.json();assert.equal(result.ai.providerInvoked,false);assert.equal(result.answer.generation.generativeModelUsed,false);assert.doesNotMatch(JSON.stringify(result),/phios-private-manuscripts|books\/book-7\/source|signedUrl/);
 if(c.deny){assert.equal(result.sources.length,0,c.id);assert.match(JSON.stringify(result),/PROTECTED_MANUSCRIPT_ACCESS_DENIED/,c.id);}else{assert.ok((c.id.startsWith('CONFLICT')?[c.nodeCode,c.support]:[c.nodeCode]).includes(result.answer.knowledgeRefs.primaryNodeCodes[0]),c.id);const cli=await runPackageB(c.question,'zh-Hans','auto');assert.ok((c.id.startsWith('CONFLICT')?[c.nodeCode,c.support]:[c.nodeCode]).includes(cli.projection.node?.nodeCode),c.id+':CLI');if(c.support)assert.ok(result.sources.some(s=>s.nodeCode===c.support),c.id);if(c.state)assert.equal(result.answer.epistemicReading.knowledgeState,c.state);if(c.id==='FIGURE'){assert.match(JSON.stringify(result.answer.content),/14\.96/);assert.match(JSON.stringify(result.answer.content),/14\.85–14\.95/);}if(c.id.startsWith('METHOD_'))assert.ok(JSON.stringify(result.answer.content).includes(c.text.split('。')[0].slice(0,10)),c.id+':BODY');}
 evidence.push({...c,result,productionCorpus:true,fixtureOnly:false});}}finally{globalThis.fetch=original;}
assert.equal(providers,0);assert.equal(privateReads,0);
const out={status:'PASS',currentSourceVersion:'v2',sourceSha256:source.sha256,existingApiAndPublishedOwner:true,productionCorpus:true,fixtureOnly:false,providerRequests:providers,privateSourceReadsDuringAsk:privateReads,canonicalSections:100,figures:9,unchangedCanonicalNodes:96,referenceOnlyPreserved:true,oldFreezePreserved:true,newHumanAcceptance:null,masterAExecuted:false,evidence};
fs.writeFileSync(`${dir}/ask-acceptance-v2.json`,JSON.stringify(out,null,2)+'\n');console.log('PASS Book VII v2 actual existing Ask and published owner: method/original corpus, raw denial, 100 sections, 9 figures, 96 unchanged nodes, zero providers.');
