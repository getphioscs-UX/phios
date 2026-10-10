import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const successorPath='docs/customer-activation-r1/structured-freeze-successor-v1.json';
export const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export function assertFreezeSuccessor(current){
 if(!fs.existsSync(successorPath)){for(const [p,data] of Object.entries(current))assert.deepEqual(JSON.parse(fs.readFileSync(p)),data,'FREEZE_DRIFT:'+p);return;}
 const doc=JSON.parse(fs.readFileSync(successorPath));
 assert.equal(doc.productionActivation,false);assert.equal(doc.humanApproval,false);
 assert.deepEqual(Object.keys(doc.predecessorDigests).sort(),Object.keys(current).sort(),'PREDECESSOR_COVERAGE_REQUIRED');
 for(const [p,hash] of Object.entries(doc.predecessorDigests))assert.equal(sha(p),hash,'HISTORICAL_FREEZE_CHANGED:'+p);
 assert.deepEqual(current,doc.artifacts,'CURRENT_SUCCESSOR_DRIFT');
 const registry=Object.keys(current).find(p=>p.endsWith('registry-freeze-v1.json'));
 assert.deepEqual(current[registry],JSON.parse(fs.readFileSync(registry)),'UNAPPROVED_REGISTRY_CHANGE');
 const production=Object.values(current).find(x=>x.stage==='B14-SKS-W80');
 assert.equal(production.productionFreezeComplete,false);assert.equal(production.customerAcceptance.complete,false);
 assert.ok(production.blockers.length);
}
