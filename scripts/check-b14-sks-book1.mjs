import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import Ajv from 'ajv';
import {parseHTML} from 'linkedom';
import {renderFormationExplorer,formationAskHref} from '../assets/js/knowledge/formation-explorer.js';
import {resolveFormationEntry,retrieveFormationScope,normalizeFormationScope} from '../functions/_lib/formation-retrieval-scope.js';
import {createPtrcAskRequestContract} from '../functions/_lib/ptrc-ask-contract.js';
import {createKapQuestionIntake,normalizeKapQuestion,retrieveKapKnowledge} from '../functions/_lib/knowledge-answer-grounding.js';
const root=path.resolve(import.meta.dirname,'..'),base='content/knowledge/structured/book-1/';
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const registry=read(base+'book-1-mechanism-registry-v1.json'),chains=read(base+'book-1-formation-chain-registry-v1.json'),comparisons=read(base+'book-1-mechanism-comparison-families-v1.json');
const validate=new Ajv({allErrors:true}).compile(read('content/knowledge/structured/schema/structured-knowledge-object-v1.schema.json'));
const concepts=read(registry.sourcePaths.concepts).concepts,bindings=read(registry.sourcePaths.bindings).records;
for(const [key,p] of Object.entries(registry.sourcePaths))assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex'),registry.sourceDigests[key]);
assert.equal(new Set(registry.objects.map(o=>o.objectId)).size,registry.objects.length);
for(const o of registry.objects){
 assert.ok(validate(o),JSON.stringify(validate.errors));
 assert.equal(o.canonicalMeaning,concepts.find(c=>c.id===registry.details[o.objectId].conceptId).definition);
 for(const section of o.sourceRefs.manuscriptSectionRefs)assert.ok(bindings.some(b=>b.sectionCode===section&&b.nodeCode===o.nodeCode&&b.status==='APPROVED'));
 assert.equal(o.status,'IN_REVIEW');
 assert.ok(new URL(formationAskHref(o,registry.details[o.objectId]),'https://phios.test').searchParams.get('contextRef').startsWith('CONCEPT:'));
}
assert.equal(chains.chains[0].stageSequence.length,4);assert.equal(chains.withheldChains.length,1);
for(const f of comparisons.families)for(const id of f.memberIds)assert.ok(registry.objects.some(o=>o.objectId===id));
const env={ASSETS:{fetch:async request=>{const p=path.join(root,new URL(request.url).pathname);return fs.existsSync(p)?new Response(fs.readFileSync(p),{headers:{'content-type':'application/json'}}):new Response('Not found',{status:404});}}};
const entry=await resolveFormationEntry('CONCEPT:constraint',env);
assert.equal(entry.retrievalScope.objectId,'SK-B1-CONSTRAINT');
assert.equal(await resolveFormationEntry('CONCEPT:invented',env),null);
assert.equal(normalizeFormationScope({...entry.retrievalScope,objectId:'../../secret'}),null);
assert.deepEqual((await retrieveFormationScope({env,scope:{...entry.retrievalScope,objectId:'SK-B1-UNKNOWN'}})).sources,[]);
const grounding=await retrieveFormationScope({env,scope:entry.retrievalScope});
assert.equal(grounding.sources[0].nodeCode,'KN-B1-P1-002');
const contract=createPtrcAskRequestContract({q:'What does constraint mean?',locale:'en',entryContext:entry});
const intake=createKapQuestionIntake({question:contract.question,locale:'en',requestContract:contract});
assert.equal(intake.retrievalScope.objectId,'SK-B1-CONSTRAINT');
const retrieval=await retrieveKapKnowledge({env,normalized:normalizeKapQuestion(intake),options:{retrievalScope:intake.retrievalScope},request:new Request('https://phios.test/api/knowledge-access')});
assert.equal(retrieval.ok,true,JSON.stringify(retrieval.error));
assert.equal(retrieval.groundingSources[0].sourceId,'STRUCTURED:SK-B1-CONSTRAINT');
for(const locale of ['en','zh-Hans']){
 const {document,window}=parseHTML('<html><body><section id="explorer"></section></body></html>');
 const host=document.querySelector('section'),locationRef={href:'https://phios.test/books/reality-formation/?lang=en&mechanism=SK-B1-CONSTRAINT#explorer'};
 const historyRef={pushState:(_,__,url)=>{locationRef.href=String(url);}},events=new EventTarget();
 const dispose=renderFormationExplorer(host,{registry,chains,comparisons,locale,locationRef,historyRef,eventTarget:events});
 assert.match(host.querySelector('[data-formation-ask]').getAttribute('href'),/CONCEPT%3Aconstraint/);
 host.querySelector('[data-object="SK-B1-CARRIER"]').dispatchEvent(new window.Event('click',{bubbles:true}));
 assert.equal(new URL(locationRef.href).searchParams.get('mechanism'),'SK-B1-CARRIER');
 assert.equal(new URL(locationRef.href).searchParams.get('lang'),'en');
 const search=host.querySelector('input');search.value='nothing-matches';search.dispatchEvent(new window.Event('input'));
 assert.equal(host.querySelectorAll('[data-formation-list] button').length,0);
 locationRef.href='https://phios.test/books/reality-formation/?mechanism=SK-B1-FEEDBACK';events.dispatchEvent(new Event('popstate'));
 assert.match(host.querySelector('[data-formation-ask]').getAttribute('href'),/CONCEPT%3Afeedback/);
 dispose();
}
if(process.argv.includes('--record')){
 const ledgerPath=path.join(root,'docs/knowledge/structured-successor/b14-sks-execution-ledger-v1.json');
 const ledger=JSON.parse(fs.readFileSync(ledgerPath,'utf8'));
 for(const entry of ledger.stages){
  const week=Number(entry.stage.split('-W')[1]);
  if(week>=5&&week<=11)Object.assign(entry,{status:[8,9].includes(week)?'PARTIAL_SOURCE_GAPS':'MACHINE_ACCEPTED_PREVIEW',evidence:'scripts/check-b14-sks-book1.mjs',humanAcceptanceComplete:false});
 }
 ledger.nextStage='B14-SKS-W8-W9-SOURCE-CLOSURE';
 fs.writeFileSync(ledgerPath,JSON.stringify(ledger,null,2)+'\n');
}
console.log(`✓ W5–W11: ${registry.objects.length} source-bound objects, schemas, partial chain/comparison, bilingual Explorer selection/search/history, server-derived context and actual KAP retrieval priority passed. Human review remains pending.`);
