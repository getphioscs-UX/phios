import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
export function verifyRitualMaintenanceDependency(dep,successor){
 assert.equal(successor.status,'LOCAL_SOURCE_MAINTENANCE_NOT_HUMAN_ACCEPTED');
 assert.equal(successor.deployed,false);assert.equal(successor.productionActivated,false);
 assert.equal(successor.humanSensoryAcceptance,'PENDING');
 assert.equal(successor.predecessorDependency.path,dep.path);
 assert.equal(successor.predecessorDependency.sha256,dep.sha256);
 assert.equal(successor.predecessorReceipt,'content/production/symbolic-method/reconciliation/iching-ritual-interaction-successor-v1.json');
 for(const value of Object.values(successor.authorityChanges))assert.equal(value,false);
 const base=fs.readFileSync(successor.predecessorSource.path,'utf8');
 assert.equal(sha(base),dep.sha256,'RITUAL_PREDECESSOR_SOURCE_DRIFT');
 let projected=base;
 for(const change of successor.boundedReplacements){
  assert.equal(projected.split(change.before).length-1,1,'RITUAL_MAINTENANCE_REPLACEMENT_NOT_UNIQUE');
  projected=projected.replace(change.before,change.after);
 }
 assert.equal(sha(projected),successor.currentDependency.sha256,'RITUAL_MAINTENANCE_DECLARATION_DRIFT');
 assert.equal(successor.currentDependency.path,dep.path);
 assert.equal(fs.readFileSync(dep.path,'utf8'),projected,'RITUAL_DEPENDENCY_DRIFT');
 return true;
}
