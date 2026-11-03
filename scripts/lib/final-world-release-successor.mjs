import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
export function finalWorldReleasePredecessors(){
 const r=JSON.parse(fs.readFileSync('content/civilization-atlas/maintenance/book-v-final-unified-release-successor-v24.json','utf8'));
 assert.equal(r.work,'FINAL-UNIFIED-PRODUCTION-RELEASE-R1');assert.equal(r.status,'ENGINEERING_SUCCESSOR_PENDING_OWNER_RELEASE_ACCEPT');assert.equal(r.humanDecision,'PENDING');assert.equal(hash(fs.readFileSync(r.predecessor)),r.predecessorSha256);
 for(const k of ['historicalEvidenceRewritten','canonicalTheoryChanged','commercialAdmissionGranted','productionDeployed'])assert.equal(r[k],false);
 assert.deepEqual(r.requiredCurrentChecks,['scripts/check-final-unified-release-r1.mjs','scripts/check-country-history-coverage-r1.mjs','scripts/check-world-country-latest.mjs','scripts/check-world-country-observation-p2.mjs']);
 const maintenance=JSON.parse(fs.readFileSync('content/civilization-atlas/maintenance/book-v-public-question-maintenance-successor-v25.json','utf8'));
 assert.equal(maintenance.work,'WORLD_PUBLIC_QUESTION_MAINTENANCE_R1');assert.equal(maintenance.status,'ENGINEERING_SUCCESSOR_PENDING_HUMAN_REVIEW');assert.equal(maintenance.humanDecision,'PENDING');
 assert.equal(maintenance.predecessor,'content/civilization-atlas/maintenance/book-v-final-unified-release-successor-v24.json');assert.equal(hash(fs.readFileSync(maintenance.predecessor)),maintenance.predecessorSha256);
 for(const k of ['historicalEvidenceRewritten','canonicalTheoryChanged','commercialAdmissionGranted','productionDeployed','providerLiveEnabled','privateSubjectAdmissionChanged'])assert.equal(maintenance[k],false);
 assert.deepEqual(maintenance.requiredCurrentChecks,['scripts/check-world-public-question-maintenance-r1.mjs']);
 assert.equal(new Set(maintenance.changes.map(c=>c.path)).size,maintenance.changes.length);
 const currentPredecessors=new Map();
 for(const c of maintenance.changes){const registered=r.changes.find(item=>item.path===c.path);assert.ok(registered,c.path+' unknown final-source predecessor');assert.equal(c.previousSha256,registered.successorSha256,c.path+' maintenance chain mismatch');assert.match(c.previousGitRevision,/^[a-f0-9]{40}$/);const prior=execFileSync('git',['show',c.previousGitRevision+':'+c.path]);assert.equal(hash(prior),c.previousSha256,c.path+' immutable maintenance predecessor');assert.equal(hash(fs.readFileSync(c.path)),c.successorSha256,c.path+' unregistered maintenance-source drift');currentPredecessors.set(c.path,prior);}
 for(const d of maintenance.dependencies)assert.equal(hash(fs.readFileSync(d.path)),d.sha256,d.path+' maintenance dependency drift');
 assert.equal(new Set(r.changes.map(c=>c.path)).size,r.changes.length);const map=new Map();
 for(const c of r.changes){assert.equal(c.previousGitRevision,'8cdc4875df3bfc74c92efba3e0f619536443b45b');const prior=execFileSync('git',['show',c.previousGitRevision+':'+c.path]);assert.equal(hash(prior),c.previousSha256,c.path+' immutable predecessor');assert.equal(hash(currentPredecessors.get(c.path)||fs.readFileSync(c.path)),c.successorSha256,c.path+' unregistered final-source drift');map.set(c.path,prior);}
 return map;
}
