import fs from 'node:fs';
import assert from 'node:assert/strict';
import {freezeArtifacts,base} from './build-b14-sks-freeze.mjs';
import {assertFreezeSuccessor} from './lib/ca-r1-freeze-successor.mjs';
import './check-b14-sks-source-material.mjs';
import './check-b14-sks-authority.mjs';
import './check-b14-sks-books.mjs';
import './check-b14-sks-cross-book-current.mjs';
import './check-b14-sks-relationships.mjs';
import './check-b14-sks-ask-current.mjs';
import './check-b14-sks-w73-w77.mjs';
const artifacts=freezeArtifacts();assertFreezeSuccessor(artifacts);
const runtime=artifacts[base+'b14-sks-r1-runtime-freeze-v1.json'];
for(const file of ['functions/_lib/structured-ask-policy.js','functions/contextual-ask/contextual-ask-runtime.js','assets/js/knowledge/progressive-explorer.js'])assert.ok(runtime.digests[file],'RUNTIME_BINDING_MISSING:'+file);
assert.ok(Object.keys(runtime.digests).every(p=>!p.includes('/_source-material/')),'SOURCE_ARCHIVE_IMPORTED_INTO_RUNTIME');
const production=artifacts[base+'b14-sks-r1-production-freeze-v1.json'];
function validateActivation(p){assert.equal(p.productionFreezeComplete,false,'UNAPPROVED_PRODUCTION_FREEZE');assert.equal(p.customerAcceptance.complete,false,'UNRECORDED_CUSTOMER_ACCEPTANCE');assert.ok(p.blockers.length>0,'HIDDEN_FREEZE_GAPS');}
validateActivation(production);for(const mutate of [p=>p.productionFreezeComplete=true,p=>p.customerAcceptance.complete=true,p=>p.blockers=[]]){const p=structuredClone(production);mutate(p);assert.throws(()=>validateActivation(p));}
if(process.argv.includes('--require-production'))assert.equal(production.productionFreezeComplete,true,'PRODUCTION_FREEZE_NOT_READY:'+production.blockers.join(','));
console.log('✓ W78/W79 snapshot integrity and W80 no-false-activation guards passed. W80 production freeze remains pending the listed gates.');
