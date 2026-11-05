import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {readPprPreentrySuccessor,PPR_PREENTRY_SUCCESSOR} from './ppr-five-method-preentry-successor.mjs';

const REGISTRY='content/professional/personal-reality/current/ppr-current-shared-owner-registry-v1.json';
const read=p=>fs.readFileSync(p,'utf8');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

export function assertPprCurrentSharedOwner(path,{historicalDigest=null,label='PPR current owner'}={}){
  const registry=JSON.parse(read(REGISTRY));
  assert.equal(registry.status,'ACTIVE_CURRENT_RUNTIME_AUTHORITY');
  assert.equal(registry.boundaries.historicalFreezeRewritten,false);
  assert.equal(registry.boundaries.rendererCreatesMethodMeaning,false);
  assert.equal(registry.boundaries.admittedMethodProductionMayReachFrontend,true);
  assert.equal(registry.boundaries.futureUnregisteredDriftAllowed,false);
  let record=registry.files[path];
  if(!record&&path==='functions/external-profile/hd-profile-parser.js'){
    const predecessor='274e6f2b267440b6686663779643dd2216c27879cb62dfe97ebf3a0662ae9c7c';
    const successor='b0da128b4f01a0a4934fab20b8bb3ade06d7a901489a97df29a2b177d03b41fd';
    const convergence=JSON.parse(read('content/civilization-atlas/maintenance/main-convergence-r1-successor.json'));
    const proofs=Object.values(convergence).filter(Array.isArray).flat().filter(x=>x?.path===path&&x.predecessorSha256===predecessor&&x.successorSha256===successor);
    assert.equal(proofs.length,1,`${label}: missing exact HD alias convergence proof`);
    const source=read(path),addition="['G',['g','g center'",previous="['G',['g center'";
    assert.equal(source.split(addition).length,2);
    assert.equal(crypto.createHash('sha256').update(source.replace(addition,previous)).digest('hex'),predecessor,'HD alias must be the only parser delta');
    record={currentSha256:successor,recognizedPredecessors:[predecessor,'2ee72ecbdf696e2afe50982a6554ad929a7eca40ae5f44b159207c2d9ce3af0b']};
  }
  assert(record,`${label}: unregistered shared runtime file: ${path}`);
  if(path==='assets/customer-ui/js/surfaces/personal-reality.js'&&sha(path)!==record.currentSha256){
    const next=JSON.parse(read('content/professional/personal-reality/current/ppr-hd-local-confirmation-engineering-successor-v1.json'));
    assert.equal(next.status,'ENGINEERING_SUCCESSOR_PENDING_HUMAN_REVIEW');assert.equal(next.path,path);
    assert.equal(next.previousSha256,record.currentSha256);assert.equal(sha(next.previousPath),record.currentSha256);
    for(const key of ['historicalFreezeRewritten','humanAcceptanceGranted','productionActivated'])assert.equal(next[key],false);
    assert.deepEqual(next.insertions,["import {mountInternalHdConfirmation} from './hd-internal-chart-confirmation-r41.js';\n","mountInternalHdConfirmation(form,{getPlaceRef:()=>selectedCandidate?.providerRef||''});"]);
    let previous=read(path);for(const insertion of next.insertions){assert.equal(previous.split(insertion).length,2);previous=previous.replace(insertion,'');}
    assert.equal(previous,read(next.previousPath),'Local HD wiring must be the only shared host delta');
    assert.deepEqual(next.dependencies.map(x=>x.path),['assets/customer-ui/js/surfaces/hd-internal-chart-confirmation-r41.js','functions/api/customer-hd-chart-preview.js']);
    const dependencySuccessorPath='content/professional/personal-reality/current/ppr-hd-local-confirmation-dependencies-successor-v2.json';
    const dependencySuccessor=JSON.parse(read(dependencySuccessorPath));
    assert.equal(dependencySuccessor.status,'ENGINEERING_SUCCESSOR_PENDING_HUMAN_REVIEW');
    assert.equal(dependencySuccessor.predecessor.path,'content/professional/personal-reality/current/ppr-hd-local-confirmation-engineering-successor-v1.json');
    assert.equal(dependencySuccessor.predecessor.sha256,sha(dependencySuccessor.predecessor.path));
    for(const key of ['historicalFreezeRewritten','humanAcceptanceGranted','productionActivated'])assert.equal(dependencySuccessor[key],false);
    assert.deepEqual(dependencySuccessor.dependencies.map(x=>({path:x.path,sha256:x.previousSha256})),next.dependencies);
    for(const dependency of dependencySuccessor.dependencies)assert.equal(sha(dependency.path),dependency.sha256);
    assert.equal(dependencySuccessor.additionalDependency.path,'functions/external-profile/hd-report-automation-candidate.js');
    assert.equal(sha(dependencySuccessor.additionalDependency.path),dependencySuccessor.additionalDependency.sha256);
    record={...record,currentSha256:next.currentSha256,recognizedPredecessors:[...record.recognizedPredecessors,record.currentSha256]};
  }
  if(path==='perspectives/personal/index.html'&&sha(path)!==record.currentSha256){
    const next=readPprPreentrySuccessor(record);
    record={...record,currentSha256:next.currentSha256,recognizedPredecessors:[...record.recognizedPredecessors,record.currentSha256,...(next.recognizedPredecessors||[])],engineeringSuccessorRef:next.engineeringSuccessorRef||PPR_PREENTRY_SUCCESSOR};
  }
  assert.equal(sha(path),record.currentSha256,`${label}: current owner digest drift: ${path}`);
  if(historicalDigest&&historicalDigest!==record.currentSha256)assert(record.recognizedPredecessors.includes(historicalDigest),`${label}: historical predecessor is not recognized: ${path}`);
  const source=read(path);
  for(const token of record.requiredTokens||[])assert(source.includes(token),`${label}: required current-runtime token missing: ${path}: ${token}`);
  for(const token of record.forbiddenTokens||[])assert(!source.includes(token),`${label}: forbidden current-runtime token present: ${path}: ${token}`);
  return Object.freeze({registry,record,currentSha256:record.currentSha256});
}

export function assertPprCurrentSharedOwnerRegistry(){
  const registry=JSON.parse(read(REGISTRY));
  for(const path of Object.keys(registry.files))assertPprCurrentSharedOwner(path);
  return registry;
}
