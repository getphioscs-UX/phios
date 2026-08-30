import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

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
  const record=registry.files[path];
  assert(record,`${label}: unregistered shared runtime file: ${path}`);
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
