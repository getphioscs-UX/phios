import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
const dir='content/production/symbolic-method/reconciliation',path='assets/customer-ui/js/surfaces/ritual-sequence.js';
const base=execFileSync('git',['show',`295dec1c^:${path}`],{encoding:'utf8'}),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
assert.equal(sha(base),'edae75008b0139a0eda8b5833fc7c5dd90ba3961bb135be672de863bf7255159');
const boundedReplacements=[
 ['export const RITUAL_DURATION_MS=120000;','export const RITUAL_DURATION_MS=1800;'],
 [' panel.append(label,canvas,progress,cancel);host.before(panel);'," const proceed=document.createElement('button');proceed.type='button';proceed.textContent=zh?'立即继续':'Continue now';\n panel.append(label,canvas,progress,proceed,cancel);host.before(panel);"],
 [" function hidden(){if(document.hidden)stop(false);}"," function hidden(){if(document.hidden)stop(kind==='tarot');}"],
 [' cancel.onclick=()=>stop(false);',' cancel.onclick=()=>stop(false);\n proceed.onclick=()=>stop(true);'],
 ["  const cycle=kind==='tarot'?8000:20000,phase=(elapsed%cycle)/cycle,round=Math.min(kind==='tarot'?14:5,Math.floor(elapsed/cycle));","  const cycle=kind==='tarot'?RITUAL_DURATION_MS:RITUAL_DURATION_MS/6,phase=(elapsed%cycle)/cycle,round=Math.min(kind==='tarot'?0:5,Math.floor(elapsed/cycle));"]
].map(([before,after])=>({before,after}));
let expected=base;for(const r of boundedReplacements){assert.equal(expected.split(r.before).length,2);expected=expected.replace(r.before,r.after);}
assert.equal(fs.readFileSync(path,'utf8'),expected,'Unexpected changes require a new reviewed migration; do not regenerate against arbitrary current source.');
const predecessorSource={path:dir+'/iching-ritual-dependency-predecessor-v1.txt',sha256:sha(base)};
if(fs.existsSync(predecessorSource.path))assert.equal(fs.readFileSync(predecessorSource.path,'utf8'),base);else fs.writeFileSync(predecessorSource.path,base);
const record={id:'ICHING-RITUAL-DEPENDENCY-MAINTENANCE-v2',status:'LOCAL_SOURCE_MAINTENANCE_NOT_HUMAN_ACCEPTED',changeCategory:'BOUNDED_CX_INTERACTION_MAINTENANCE',authorization:'Current owner explicitly requests resolving RITUAL_DEPENDENCY_DRIFT by source/QA; no sensory acceptance, deployment or production activation is inferred.',implementationCommit:'295dec1c968721d714f469376f7e182a5f38d58d',predecessorReceipt:dir+'/iching-ritual-interaction-successor-v1.json',predecessorDependency:{path,sha256:sha(base)},predecessorSource,currentDependency:{path,sha256:sha(expected)},boundedReplacements,authorityChanges:{calculation:false,corpus:false,guestPersistence:false,payment:false,provider:false},humanSensoryAcceptance:'PENDING',deployed:false,productionActivated:false,impact:'Both shared animations are 1.8 seconds with explicit continue; six I Ching visual rounds remain cosmetic. Tarot background completion differs from I Ching cancellation; actual casting still owned by the deterministic server.',rollback:'After source rollback authorization, restore only the listed interaction hunks to the retained predecessor. Do not rewrite release freeze or delete acceptance records.'};
fs.writeFileSync(dir+'/iching-ritual-dependency-maintenance-v2.json',JSON.stringify(record,null,2)+'\n');
console.log('Prepared bounded local maintenance; predecessor frozen hashes unchanged; human sensory QA pending.');
