import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const a=JSON.parse(fs.readFileSync('content/product-convergence-r1/audits/pc-r1-w0-current-main-reconciliation-v1.json'));
for(const key of ['baselineCommit','canonicalAuthorities','activeSuccessors','legacySurfaces','customerRoutes','runtimeOwners','pendingHumanGates','pendingCutovers','knownConflicts'])assert(key in a,key);
for(const rows of Object.values(a.canonicalAuthorities))for(const r of rows){assert(r.present,r.path+' missing');assert.equal(crypto.createHash('sha256').update(fs.readFileSync(r.path)).digest('hex'),r.sha256,r.path+' changed since reconciliation');}
assert.equal(a.status,'CURRENT_MAIN_RECONCILED','Mandatory predecessor gates must pass before PC-W1');
console.log('CURRENT_MAIN_RECONCILED');
