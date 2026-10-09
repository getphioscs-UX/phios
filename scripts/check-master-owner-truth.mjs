import fs from 'node:fs';import assert from 'node:assert/strict';
import {refreshMasterOwnerTruth} from './lib/master-owner-truth.mjs';
import {verifyRitualMaintenanceDependency} from './lib/iching-ritual-maintenance-successor.mjs';
const truth=refreshMasterOwnerTruth();
assert.equal(truth.W39.totalItems,29);assert.equal(truth.W39.items.length,29);
const states=['COMPLETE','PARTIAL','PLACEHOLDER_ONLY','NOT_STARTED','BLOCKED'];
for(const item of truth.W39.items){assert.ok(states.includes(item.state));assert.ok(item.firstMissingRequirement);if(item.state==='COMPLETE')assert.ok(item.actualEvidence.length>0);if(item.state==='PLACEHOLDER_ONLY')assert.equal(item.actualEvidence.length,0);}
assert.equal(truth.W39.completeItems+truth.W39.partialItems+truth.W39.placeholderOnlyItems+truth.W39.notStartedItems+truth.W39.blockedItems,29);
const nodes=['Entry','Account / Entitlement','Input','Generation / Retrieval','Result','Save to My Reality','Follow-up','Navigation Handoff','Academy / Related Content Handoff','Deployment Evidence','Live Evidence'];
for(const j of truth.W38){for(const n of nodes){assert.ok(['PASS','PARTIAL','NOT_IMPLEMENTED','BLOCKED','NOT_RUN'].includes(j[n].state));if(j[n].state==='PASS')assert.ok(j[n].actualEvidence.length>0);}assert.equal(j.FIRST_STOP_NODE,nodes.find(n=>j[n].state!=='PASS'));assert.equal(j['Live Evidence'].state,'NOT_RUN');}
assert.equal(truth.layers.NAVIGATION_DOCTRINE,'HUMAN_ACCEPTED');assert.equal(truth.layers.RUNTIME_CONTRACT,'PARTIAL');assert.notEqual(truth.layers.CUSTOMER_NAVIGATION_API,'PASS');
assert.equal(truth.providerAuthorization.currentCalls,0);assert.equal(truth.providerAuthorization.currentSpendUSD,0);assert.equal(truth.operational.FIRST_GOVERNED_REAL_PILOT,false);assert.equal(truth.operational.VALIDATION_CORPUS_READY,false);
if(truth.buildIdentity.source==='PASS'){assert.equal(truth.buildIdentity.currentHead,truth.buildIdentity.evidenceCommit);assert.equal(truth.buildIdentity.stale,false);}
const dir='content/production/symbolic-method/reconciliation',maintenance=JSON.parse(fs.readFileSync(dir+'/iching-ritual-dependency-maintenance-v2.json')),old=JSON.parse(fs.readFileSync(dir+'/iching-ritual-interaction-successor-v1.json'));
assert.equal(verifyRitualMaintenanceDependency(old.dependencies[0],maintenance),true);
assert.throws(()=>verifyRitualMaintenanceDependency({...old.dependencies[0],sha256:'0'.repeat(64)},maintenance));
assert.throws(()=>verifyRitualMaintenanceDependency(old.dependencies[0],{...maintenance,humanSensoryAcceptance:'ACCEPTED'}));
assert.throws(()=>verifyRitualMaintenanceDependency(old.dependencies[0],{...maintenance,currentDependency:{...maintenance.currentDependency,sha256:'0'.repeat(64)}}));
console.log('PASS: 29 real content states/counts; five exact first-stop node ledgers; doctrine is not consumer admission; zero paid calls; conditional B/C gates; bounded I Ching predecessor/current/tamper checks.');
