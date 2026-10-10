import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {renderMaintenanceExplorer} from '../assets/js/knowledge/maintenance-explorer.js';
const dir='content/knowledge/structured/book-3/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read(dir+'book-3-maintenance-signal-registry-v1.json');
for(const [key,p] of Object.entries(data.sourcePaths))assert.equal(createHash('sha256').update(fs.readFileSync(p)).digest('hex'),data.sourceDigests[key]);
const nodes=read(data.sourcePaths.nodes).nodes,semantics=read(data.sourcePaths.semantics).records;
assert.equal(data.entries.length,28);assert.equal(new Set(data.entries.map(e=>e.objectId)).size,28);
for(const e of data.entries){const node=nodes.find(n=>n.nodeCode===e.nodeCode);assert.equal(node.publicationBookCode,'BOOK-3');assert.equal(e.definition,null);assert.equal(e.humanAcceptanceComplete,false);for(const source of e.sourceSections){assert.equal(semantics.find(s=>s.sectionCode===source.sectionCode).sourceTextSha256,source.textSha256);assert.equal(node.canonicalSourceBinding.sectionCode,source.sectionCode);}}
assert.deepEqual(read(dir+'book-3-continuity-state-model-v1.json').transitions,[]);
const binding=read(dir+'book-3-reality-runtime-binding-v1.json');for(const key of ['mayWriteRealityState','mayInferObservedSignals','mayOverrideProfessionalJudgment','automaticRecoveryRecommendation'])assert.equal(binding[key],false);
const types=read('content/knowledge/structured/schema/structured-knowledge-types-v1.json').objectTypes;for(const t of Object.values(read(dir+'book-3-structured-taxonomy-v1.json').specializations))assert.ok(types.includes(t));
for(const locale of ['en','zh-Hans']){const {document,window}=parseHTML('<section></section>');const host=document.querySelector('section');const dispose=renderMaintenanceExplorer(host,{entries:data.entries,locale});assert.equal(host.querySelectorAll('details').length,28);const input=host.querySelector('input');input.value='负荷释放';input.dispatchEvent(new window.Event('input'));assert.equal(host.querySelectorAll('details').length,1);input.value='no-such-topic';input.dispatchEvent(new window.Event('input'));assert.ok(host.querySelector('[role=status]'));dispose();}
if(process.argv.includes('--record')){const p='docs/knowledge/structured-successor/b14-sks-execution-ledger-v1.json',ledger=read(p);for(const entry of ledger.stages){const week=Number(entry.stage.split('-W')[1]);if(week>=19&&week<=26)Object.assign(entry,{status:week===19?'MACHINE_ACCEPTED_PREVIEW':'IMPLEMENTED_SOURCE_INDEX_PENDING_EXTRACTION',evidence:'scripts/check-b14-sks-book3.mjs',humanAcceptanceComplete:false});}ledger.nextStage='B14-SKS-W27';fs.writeFileSync(p,JSON.stringify(ledger,null,2)+'\n');}
console.log('✓ W19–W26: 28 final Book III node/section bindings, taxonomy, search and no automatic Reality-state mutation verified. Semantic extraction/review remains open.');
