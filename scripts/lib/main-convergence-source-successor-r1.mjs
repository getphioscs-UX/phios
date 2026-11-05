import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
export const MAIN_CONVERGENCE_RECORD='content/civilization-atlas/maintenance/main-convergence-r1-successor.json';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
export function mainConvergencePredecessors({paths=null}={}){
 const doc=JSON.parse(fs.readFileSync(MAIN_CONVERGENCE_RECORD,'utf8'));
 assert.equal(doc.work,'UNIFIED_MAIN_CONVERGENCE_R1');
 assert.equal(doc.status,'LOCAL_INTEGRATION_PENDING_OWNER_CHECK');
 assert.equal(doc.humanDecision,'PENDING');
 assert.equal(doc.baseline,'2391e4e104269b30d95987dda7f82a00e580227b');
 for(const k of ['historicalFreezeRewritten','checksumValidationRelaxed','canonicalKnowledgeCreated','secondAskRuntimeCreated','commercialAdmissionGranted','productionDeployed','providerLiveEnabled'])assert.equal(doc.boundaries[k],false);
 assert.equal(new Set(doc.changes.map(c=>c.path)).size,doc.changes.length);
 const result=new Map();
 for(const c of doc.changes){
  if(paths&&!paths.includes(c.path))continue;
  assert.ok(!c.path.startsWith('/')&&!c.path.split('/').includes('..'));
  const previous=execFileSync('git',['show',doc.baseline+':'+c.path],{maxBuffer:32*1024*1024});
  assert.equal(sha(previous),c.predecessorSha256,c.path+' immutable convergence predecessor');
  assert.equal(sha(fs.readFileSync(c.path)),c.successorSha256,c.path+' unregistered convergence source drift');
  result.set(c.path,previous);
 }
 return result;
}
// These successors already exist on main. Preserve the older SPW freeze
// using immutable Git parents, while still checking the actual candidate bytes.
export function mainHistoricalPredecessors(){
 const doc=JSON.parse(fs.readFileSync(MAIN_CONVERGENCE_RECORD,'utf8')),rows=doc.inheritedAlreadyInMain;
 assert.deepEqual(rows.map(r=>r.path),['assets/js/pages/civilization-atlas/world-integrated-r42.js','functions/_lib/world-country-evidence.js','assets/customer-ui/surfaces/profile-country-r1.css','assets/js/pages/civilization-atlas/world-country-search.js','assets/js/pages/civilization-atlas/world-company-analysis.js','assets/js/pages/client-intent-router.js','assets/js/ask-entry-ui.js','functions/public/client-intent-router.js']);
 const result=new Map();
 for(const r of rows){
  assert(['419357257da40bca7bdf9579bcf82d785e29d151','400ac5eed99fb73d7db085e1df3394933dd2fb57'].includes(r.previousGitRevision));
  const current=execFileSync('git',['show',doc.baseline+':'+r.path]);assert.equal(sha(current),r.successorSha256);
  const expected=doc.changes.find(c=>c.path===r.path)?.successorSha256||r.successorSha256;assert.equal(sha(fs.readFileSync(r.path)),expected,r.path+' unregistered current source');
  const prior=execFileSync('git',['show',r.previousGitRevision+':'+r.path]);assert.equal(sha(prior),r.previousSha256);
  result.set(r.path,prior);
 }
 return result;
}
