import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {renderRuntimeAtlas} from '../assets/js/knowledge/runtime-interaction-atlas.js';
const base='content/knowledge/structured/book-2/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read(base+'book-2-runtime-pattern-registry-v1.json');
const nodes=read(data.sourcePaths.nodes).nodes,bindings=read(data.sourcePaths.bindings).records;
for(const [key,p] of Object.entries(data.sourcePaths))assert.equal(createHash('sha256').update(fs.readFileSync(p)).digest('hex'),data.sourceDigests[key]);
assert.equal(data.patterns.length,12);assert.equal(new Set(data.patterns.map(o=>o.objectId)).size,12);
for(const o of data.patterns){assert.equal(nodes.find(n=>n.nodeCode===o.nodeCode).publicationBookCode,'BOOK-2');assert.equal(o.definition,null);for(const section of o.sourceRefs.manuscriptSectionRefs)assert.ok(bindings.some(b=>b.sectionCode===section&&b.nodeCode===o.nodeCode&&b.bookCode==='BOOK-2'&&b.status==='APPROVED'));}
const taxonomy=read(base+'book-2-structured-taxonomy-v1.json'),types=read('content/knowledge/structured/schema/structured-knowledge-types-v1.json').objectTypes;
for(const mapped of Object.values(taxonomy.specializations))assert.ok(types.includes(mapped));
for(const file of ['book-2-interaction-pattern-registry-v1.json','book-2-relationship-dynamics-v1.json','book-2-collective-runtime-registry-v1.json'])assert.equal(read(base+file).humanAcceptanceComplete,false);
for(const locale of ['en','zh-Hans']){
 const {document,window}=parseHTML('<main></main>'),host=document.querySelector('main'),events=new EventTarget();
 const locationRef={href:'https://phios.test/books/reality-runtime/?lang=en'};
 const dispose=renderRuntimeAtlas(host,{patterns:data.patterns,locale,locationRef,historyRef:{pushState:(_,__,url)=>{locationRef.href=String(url);}},eventTarget:events});
 assert.equal(host.querySelectorAll('[data-runtime-object]').length,12);
 const id=data.patterns[4].objectId;host.querySelector(`[data-runtime-object="${id}"]`).click();assert.equal(new URL(locationRef.href).searchParams.get('pattern'),id);
 const compare=host.querySelector('[data-runtime-compare]');compare.querySelector(`option[value="${data.patterns[1].objectId}"]`).selected=true;compare.dispatchEvent(new window.Event('change'));assert.equal(host.querySelectorAll('[data-runtime-comparison] article').length,2);
 const search=host.querySelector('input');search.value='not-found';search.dispatchEvent(new window.Event('input'));assert.equal(host.querySelectorAll('[data-runtime-object]').length,0);
 locationRef.href='https://phios.test/books/reality-runtime/?pattern=INVALID';events.dispatchEvent(new Event('popstate'));assert.ok(host.querySelector('[data-runtime-inspector]').textContent.includes(locale==='en'?'unavailable':'不可用'));
 dispose();
}
const binding=read(base+'book-2-perspectives-binding-v1.json');assert.equal(binding.maySupplyUserEvidence,false);
for(const route of binding.surfaces)assert.ok(fs.readFileSync('.'+route+'index.html','utf8').includes(binding.target));
if(process.argv.includes('--record')){
 const path='docs/knowledge/structured-successor/b14-sks-execution-ledger-v1.json';const ledger=read(path);
 for(const entry of ledger.stages){const week=Number(entry.stage.split('-W')[1]);if(week>=12&&week<=18)Object.assign(entry,{status:[12,18].includes(week)?'MACHINE_ACCEPTED_PREVIEW':'IMPLEMENTED_SOURCE_INDEX_PENDING_EXTRACTION',evidence:'scripts/check-b14-sks-book2.mjs',humanAcceptanceComplete:false});}
 fs.writeFileSync(path,JSON.stringify(ledger,null,2)+'\n');
}
console.log('✓ W12–W18 source-index preview: 12 approved mappings, explicit missing definitions, bilingual selection/comparison/history and Perspectives boundaries passed.');
