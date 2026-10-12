import fs from 'node:fs';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {admittedManuscriptScopes, CURRENT_CHAPTER_ADMISSION_OWNER} from '../functions/_lib/manuscript-current-admission.js';

const results=[];
const test=(name,fn)=>{fn();results.push({name,status:'PASS_LOCAL'});};
const source={bookCode:'BOOK-1',sourceSha256:'source'},scope={bookCode:'BOOK-1',sectionCode:'QA-CHAPTER',sectionSha256:'section',wholeChapterCandidate:true};
const row={bookCode:'BOOK-1',sectionCode:'QA-CHAPTER',sourceSha256:'source',sectionSha256:'section',currentWholeChapterQualified:true,currentAdmission:'ACTIVATED'};
const metadata=r=>({[CURRENT_CHAPTER_ADMISSION_OWNER]:JSON.stringify({chapters:[r]})});
for(const state of [undefined,'UNKNOWN','NOT_ACTIVATED','WITHHELD'])test('whole chapter deny '+state,()=>assert.deepEqual(admittedManuscriptScopes([scope],source,metadata({...row,currentAdmission:state}),{textScopeEnabled:true}),[]));
test('missing ledger deny',()=>assert.deepEqual(admittedManuscriptScopes([scope],source,{}, {textScopeEnabled:true}),[]));
test('unqualified activated deny',()=>assert.deepEqual(admittedManuscriptScopes([scope],source,metadata({...row,currentWholeChapterQualified:false}),{textScopeEnabled:true}),[]));
test('flag OFF denies qualified activated',()=>assert.deepEqual(admittedManuscriptScopes([scope],source,metadata(row)),[]));
test('source identity mismatch deny',()=>assert.deepEqual(admittedManuscriptScopes([scope],source,metadata({...row,sourceSha256:'other'}),{textScopeEnabled:true}),[]));
test('duplicate authority deny',()=>assert.deepEqual(admittedManuscriptScopes([scope],source,{[CURRENT_CHAPTER_ADMISSION_OWNER]:JSON.stringify({chapters:[row,row]})},{textScopeEnabled:true}),[]));
test('QA-only qualified activated fixture admits',()=>assert.equal(admittedManuscriptScopes([scope],source,metadata(row),{textScopeEnabled:true}).length,1));

const generated=fs.readFileSync('functions/knowledge-runtime/current-manuscript-server-metadata.js','utf8');
const original={...JSON.parse(generated.match(/export const manuscriptMetadataRaw = ([\s\S]*);\s*$/)[1]),ACTIVE_MANUSCRIPT_SOURCE_REGISTRY:'content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v10.json'};
original[original.ACTIVE_MANUSCRIPT_SOURCE_REGISTRY]=fs.readFileSync(original.ACTIVE_MANUSCRIPT_SOURCE_REGISTRY,'utf8');
const registry=JSON.parse(original[original.ACTIVE_MANUSCRIPT_SOURCE_REGISTRY]);
for(const source of registry.records)for(const key of ['sourceAcceptancePath','acceptancePath','scopeAdmissionPath','sourceIdentityPath'])if(source[key]&&!original[source[key]])original[source[key]]=fs.readFileSync(source[key],'utf8');
// Isolate the two current whole-chapter candidates for the all-denied/fallback
// fixture. Other accepted bounded excerpts are deliberately not this fixture.
registry.records=registry.records.filter(r=>['BOOK-1','BOOK-5'].includes(r.bookCode));
for(const source of registry.records){const scope=JSON.parse(original[source.scopeAdmissionPath]);scope.records=scope.records.filter(r=>['B1V3-P1-S006','B5-S002'].includes(r.sectionCode));original[source.scopeAdmissionPath]=JSON.stringify(scope);source.scopeAdmissionSha256=createHash('sha256').update(original[source.scopeAdmissionPath]).digest('hex');}
original[original.ACTIVE_MANUSCRIPT_SOURCE_REGISTRY]=JSON.stringify(registry);
const ledger=JSON.parse(original[CURRENT_CHAPTER_ADMISSION_OWNER]);
let networkCalls=0;globalThis.fetch=()=>{networkCalls++;throw Error('NETWORK_FORBIDDEN');};
async function load(raw){const bundle=await build({entryPoints:['functions/_lib/knowledge-access-api.js','functions/api/customer-contextual-ask.js'],bundle:true,format:'esm',platform:'node',write:false,outdir:'.tmp/p9-r4-test',plugins:[{name:'qa-admission-authority',setup(b){b.onLoad({filter:/current-manuscript-server-metadata\.js$/},()=>({contents:'export const manuscriptMetadataRaw = '+JSON.stringify(raw)+';',loader:'js'}));}}]});return Object.fromEntries(await Promise.all(bundle.outputFiles.map(async f=>[f.path.endsWith('knowledge-access-api.js')?'api':'customer',await import('data:text/javascript;base64,'+Buffer.from(f.text).toString('base64'))])));}
const denied=await load(original);const corpusGets=[];
const env={PHIOS_ENVIRONMENT:'qa',PHIOS_MANUSCRIPT_RETRIEVAL_ENABLED:'true',PHIOS_MANUSCRIPT_TEXT_SCOPE_ENABLED:'true',MANUSCRIPTS:{async get(key){corpusGets.push(key);const source=registry.records.find(r=>r.r2ObjectKey===key);return source?.localPath&&fs.existsSync(source.localPath)?{body:fs.readFileSync(source.localPath)}:null;}},ASSETS:{async fetch(req){const p='.'+new URL(req.url).pathname;return fs.existsSync(p)?new Response(fs.readFileSync(p)):new Response('',{status:404});}}};
for(const book of ['BOOK-1','BOOK-5'])for(const locale of ['zh-Hans','en']){
 const q=book==='BOOK-1'?'结构如何持续存在':'文明不是国家';
 const response=await denied.api.handleKnowledgeAccessRequest(new Request('https://local.invalid/api/knowledge-access?'+new URLSearchParams({q,bookCode:book,source:'manuscript',locale})),env);
 const payload=await response.json();assert.equal(response.status,200);assert.equal(payload.manuscript.records.length,0);assert(!payload.groundedAnswer?.text);assert.equal((payload.answerGrounding?.sources||[]).length,0);
 const customer=await denied.customer.onRequestPost({request:new Request('https://local.invalid/api/customer-contextual-ask',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({task:'KNOWLEDGE_BASIC',question:q,locale,contexts:[{contextType:'KNOWLEDGE',contextRef:'BOOK:'+book}],guidedRouting:false,methodGuidanceRequested:false})}),env,data:{}});
 const view=await customer.json();assert.equal(customer.status,200);assert.equal(view.execution?.providerCalls,0);assert(!JSON.stringify(view.view).includes(book==='BOOK-1'?'B1V3-P1-S006':'B5-S002'));assert.equal(view.view?.state,'SOURCE_INSUFFICIENT');
 results.push({name:book+' '+locale+' denied before private read, grounding, composition/citation and projection',status:'PASS_LOCAL'});
}
test('fallback cannot admit denied whole chapter even in mixed corpus',()=>{for(const source of registry.records.filter(r=>['BOOK-1','BOOK-5'].includes(r.bookCode))){const scopes=JSON.parse(original[source.scopeAdmissionPath]).records.filter(r=>r.bookCode===source.bookCode);const admitted=admittedManuscriptScopes(scopes,source,original,{textScopeEnabled:true,declaredWholeSections:registry.activationScope?.wholeChapterCandidates||[]});assert(!admitted.some(r=>['B1V3-P1-S006','B5-S002'].includes(r.sectionCode)));}});
// Positive fixture changes only QA in-memory authority. Real ledger bytes are untouched.
const positive={...original,[CURRENT_CHAPTER_ADMISSION_OWNER]:JSON.stringify({...ledger,chapters:ledger.chapters.map(r=>({...r,currentWholeChapterQualified:true,currentAdmission:'ACTIVATED'}))})};
const admitted=await load(positive);const first=registry.records.find(r=>r.bookCode==='BOOK-1'&&r.locale==='zh-Hans');
const positiveEnv={...env,MANUSCRIPTS:{async get(key){assert.equal(key,first.r2ObjectKey);return {body:fs.readFileSync(first.localPath)};}}};
const positiveResponse=await admitted.api.handleKnowledgeAccessRequest(new Request('https://local.invalid/api/knowledge-access?'+new URLSearchParams({q:'结构如何持续存在',bookCode:'BOOK-1',source:'manuscript',locale:'zh-Hans'})),positiveEnv);
const positiveBody=await positiveResponse.json();assert(positiveBody.manuscript.records.length>0,'QA_ACTIVATED_FIXTURE_MUST_RETRIEVE');results.push({name:'QA-only positive real API retrieval',status:'PASS_LOCAL'});

const semantics=await build({entryPoints:['functions/_lib/client-knowledge-ask-b.js','functions/customer-projection/knowledge-customer-projection.js'],bundle:true,platform:'node',format:'esm',write:false,outdir:'.tmp/p9-r4-semantics'});
const modules={};for(const output of semantics.outputFiles)modules[output.path.split(/[\\/]/).pop()]=await import('data:text/javascript;base64,'+Buffer.from(output.text).toString('base64'));
const authority=modules['client-knowledge-ask-b.js'];
test('conceptual question retains reference routing',()=>assert.equal(authority.evaluateCkaExternalAuthority('为什么现实会持续存在').required,false));
test('current market question retains external authority boundary',()=>assert.equal(authority.evaluateCkaExternalAuthority('What is the current market price?').required,true));
for(const locale of ['zh-Hans','en'])test('customer citation label '+locale,()=>{const view=modules['knowledge-customer-projection.js'].projectKnowledgeAnswerForCustomer({answer:{directAnswer:locale==='en'?'Reference answer':'参考回答'},grounding:{sourceEvidence:[{bookCode:'BOOK-7',heading:locale==='en'?'Continuity':'持续',sectionCode:'QA-ACCEPTED-UNIT',sourceVersion:'QA',projectionKind:'ACCEPTED_KNOWLEDGE_UNIT_NOT_NATIVE_PDF_EXCERPT'}]}},{locale});const label=view.basedOn.sources[0].label;assert(label.includes(locale==='en'?'Accepted knowledge projection':'已接受知识投影'));assert(!label.includes(locale==='en'?'已接受知识投影':'Accepted knowledge projection'));assert.doesNotMatch(label,/NOT_ACTIVATED|UNQUALIFIED|CURRENT_SCOPE/);});

const tool=await import('./publish-verified-ask-preserving-cloud-config.mjs');let calls=0;
await assert.rejects(()=>tool.main({argv:[],run:async()=>calls++}),/EXPLICIT_PRODUCTION_PUBLICATION_INTENT_REQUIRED/);
await tool.main({argv:['--execute-production-deploy','--target=phios-github','--branch=main'],run:async()=>calls++});assert.equal(calls,1);
const noOptIn=spawnSync(process.execPath,['scripts/publish-verified-ask-preserving-cloud-config.mjs'],{encoding:'utf8'});assert.equal(noOptIn.status,1);assert.match(noOptIn.stderr,/EXPLICIT_PRODUCTION_PUBLICATION_INTENT_REQUIRED/);
const built=await build({entryPoints:['scripts/publish-verified-ask-preserving-cloud-config.mjs'],bundle:true,platform:'node',format:'esm',write:false});assert(built.outputFiles.length);
test('operator import/build/no-opt-in safe; explicit intent reaches stub only',()=>assert.equal(networkCalls,0));
test('current Book I/V authority not changed',()=>{const current=JSON.parse(fs.readFileSync(CURRENT_CHAPTER_ADMISSION_OWNER));for(const book of ['BOOK-1','BOOK-5']){const r=current.chapters.find(x=>x.bookCode===book);assert.equal(r.currentWholeChapterQualified,false);assert.equal(r.currentAdmission,'NOT_ACTIVATED');}});
const out={status:'PASS_LOCAL',results,providerCalls:0,providerCostUSD:0,networkCalls,productionDeployments:0,realPayments:0,realRefunds:0};fs.mkdirSync('tmp/p9-r4',{recursive:true});fs.writeFileSync('tmp/p9-r4/ADMISSION-EXECUTION-QA.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({status:out.status,checks:results.length,networkCalls}));
