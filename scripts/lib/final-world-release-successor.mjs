import {worldAskDependencyPredecessors} from './unified-world-ask-dependency-r1.mjs';
import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {mainConvergencePredecessors,mainHistoricalPredecessors} from './main-convergence-source-successor-r1.mjs';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
export const WORLD_CONTRAST_RECORD='content/civilization-atlas/maintenance/world-contrast-r1-source-successor.json';
export const WORLD_CONTRAST_CSS='assets/css/world-experience-r2.css';
const WORLD_CONTRAST_BASELINE='096b22df9e43d2bed0a82ba5bb010b2eea337ca3';
const WORLD_CONTRAST_FROZEN='content/civilization-atlas/maintenance/book-v-world-customer-journey-successor-v20.json';
const WORLD_CONTRAST_RECORD_SHA='4d293ce3374ac92128ca9c8972722b7ef70dd9992658afca7c811b2c36ca9187';
const WORLD_CONTRAST_FROZEN_SHA='a92ce321480cdeee6b762e8b8b08e9edd7129afee4b4ed5c4823912cc0aee9e5';
const WORLD_CONTRAST_PREVIOUS_SHA='86fa4c871f58128d597782e12bf05acd1c564001ebd4099373669893b54b0a45';
const WORLD_CONTRAST_CURRENT_SHA='d755d3b9da48bcc27738aac323b4da3905fc1ec8eca2e9500240233135956e4c';
const WORLD_CONTRAST_APPEND_SHA='64fdecc08e2c0d84661fa2785edefffd76e522d00f41562b9385e28071508d99';
// Read-only reader injection is for negative tests. Historical checker callers
// use finalWorldReleasePredecessors(), which always validates real current bytes.
export function validateWorldContrastSourceSuccessor({
 recordBytes=fs.readFileSync(WORLD_CONTRAST_RECORD),
 frozenBytes=fs.readFileSync(WORLD_CONTRAST_FROZEN),
 readGit=(ref,p)=>execFileSync('git',['show',ref+':'+p]),
 readCurrent=p=>fs.readFileSync(p)
}={}){
 assert.equal(hash(recordBytes),WORLD_CONTRAST_RECORD_SHA,'Immutable World contrast source record');
 assert.equal(hash(frozenBytes),WORLD_CONTRAST_FROZEN_SHA,'Original V20 freeze must remain unchanged');
 const record=JSON.parse(recordBytes),frozen=JSON.parse(frozenBytes);
 assert.equal(record.work,'WORLD_CONTRAST_R1_SOURCE_SUCCESSOR');
 assert.equal(record.status,'LOCAL_ENGINEERING_SUCCESSOR_RELEASE_PENDING');
 assert.equal(record.humanDecision,'LOCAL_VISUAL_ACCEPTED_ONLY');
 assert.equal(record.releaseDecision,'PENDING');
 assert.equal(record.baseline,WORLD_CONTRAST_BASELINE);
 assert.deepEqual(record.predecessorRecord,{path:WORLD_CONTRAST_FROZEN,sha256:WORLD_CONTRAST_FROZEN_SHA});
 assert.deepEqual(record.changes.map(c=>c.path),[WORLD_CONTRAST_CSS],'Exactly one approved CSS path');
 for(const key of ['historicalFreezeRewritten','checksumValidationRelaxed','extraPathsAdmitted','canonicalTheoryChanged','commercialAdmissionGranted','privateSubjectAdmissionChanged','providerLiveEnabled','productionAdmissionChanged','productionDeployed'])assert.equal(record.boundaries[key],false);
 const row=record.changes[0],original=frozen.changes.filter(c=>c.path===WORLD_CONTRAST_CSS);
 assert.equal(original.length,1,'Exactly one V20 CSS predecessor');
 assert.equal(original[0].successorSha256,WORLD_CONTRAST_PREVIOUS_SHA);
 assert.equal(row.previousGitRevision,WORLD_CONTRAST_BASELINE);
 assert.equal(row.previousSha256,WORLD_CONTRAST_PREVIOUS_SHA);
 assert.equal(row.successorSha256,WORLD_CONTRAST_CURRENT_SHA);
 assert.equal(row.approvedAppendSHA256,WORLD_CONTRAST_APPEND_SHA);
 assert.equal(row.approvedRuleCount,2);
 assert.equal(hash(readGit(WORLD_CONTRAST_BASELINE,WORLD_CONTRAST_FROZEN)),WORLD_CONTRAST_FROZEN_SHA,'Immutable Main096 V20 record');
 const previous=readGit(WORLD_CONTRAST_BASELINE,WORLD_CONTRAST_CSS),current=readCurrent(WORLD_CONTRAST_CSS);
 assert.equal(hash(previous),WORLD_CONTRAST_PREVIOUS_SHA,'Immutable Main096 CSS predecessor');
 assert.equal(hash(current),WORLD_CONTRAST_CURRENT_SHA,'Unregistered World contrast CSS drift');
 assert.ok(current.subarray(0,previous.length).equals(previous),'Historical CSS prefix must remain byte-identical');
 assert.equal(hash(current.subarray(previous.length)),WORLD_CONTRAST_APPEND_SHA,'Exactly the approved two-rule append');
 return previous;
}
export function finalWorldReleasePredecessors(){
 const worldContrastPrevious=validateWorldContrastSourceSuccessor();
 const convergence=mainConvergencePredecessors(),askDependency=worldAskDependencyPredecessors(),currentBytes=p=>askDependency.get(p)||convergence.get(p)||fs.readFileSync(p);
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
 for(const c of maintenance.changes){const registered=r.changes.find(item=>item.path===c.path);assert.ok(registered,c.path+' unknown final-source predecessor');assert.equal(c.previousSha256,registered.successorSha256,c.path+' maintenance chain mismatch');assert.match(c.previousGitRevision,/^[a-f0-9]{40}$/);const prior=execFileSync('git',['show',c.previousGitRevision+':'+c.path]);assert.equal(hash(prior),c.previousSha256,c.path+' immutable maintenance predecessor');assert.equal(hash(currentBytes(c.path)),c.successorSha256,c.path+' unregistered maintenance-source drift');currentPredecessors.set(c.path,prior);}
 for(const d of maintenance.dependencies)assert.equal(hash(currentBytes(d.path)),d.sha256,d.path+' maintenance dependency drift');
 assert.equal(new Set(r.changes.map(c=>c.path)).size,r.changes.length);const map=new Map(convergence);
 for(const c of r.changes){assert.equal(c.previousGitRevision,'8cdc4875df3bfc74c92efba3e0f619536443b45b');const prior=execFileSync('git',['show',c.previousGitRevision+':'+c.path]);assert.equal(hash(prior),c.previousSha256,c.path+' immutable predecessor');assert.equal(hash(currentPredecessors.get(c.path)||currentBytes(c.path)),c.successorSha256,c.path+' unregistered final-source drift');map.set(c.path,prior);}
 for(const [p,prior]of mainHistoricalPredecessors()){assert.ok(!r.changes.some(c=>c.path===p),'Historical successor must not replace a V24 entry');map.set(p,prior);}
 assert.ok(!map.has(WORLD_CONTRAST_CSS),'World contrast cannot replace another registered successor');
 for(const [path,bytes] of askDependency){assert.ok(!map.has(path),'Ask dependency cannot replace another successor');map.set(path,bytes);}
 map.set(WORLD_CONTRAST_CSS,worldContrastPrevious);
 return map;
}
