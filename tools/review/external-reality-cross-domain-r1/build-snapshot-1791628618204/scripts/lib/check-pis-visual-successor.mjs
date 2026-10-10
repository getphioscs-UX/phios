import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
export function assertCurrentVisualSuccessor(pointer){
 const predecessor='content/web-production/registries/client-visual-asset-registry-v1.7.json';
 assert.equal(pointer.currentRegistryPath,'/content/web-production/registries/client-visual-asset-registry-v1.8.json');
 const current=JSON.parse(fs.readFileSync(pointer.currentRegistryPath.slice(1)));
 assert.equal(current.registry,'PHI-OS-CLIENT-VISUAL-ASSET-REGISTRY-v1.8');
 assert.equal(current.summary.assetCount,current.assets.length);
 const old=JSON.parse(fs.readFileSync(predecessor));
 assert.equal(current.pisSuccessor.predecessor,predecessor);
 assert.equal(current.pisSuccessor.sha256,crypto.createHash('sha256').update(fs.readFileSync(predecessor)).digest('hex'));
 assert.deepEqual(current.assets.slice(0,old.assets.length),old.assets,'Historical identities must remain unchanged');
 const verified=JSON.parse(fs.readFileSync(current.pisSuccessor.evidence)).results;
 assert.equal(current.assets.length,old.assets.length+41);assert.equal(verified.length,41);
 for(const a of current.assets.slice(old.assets.length)){
  const proof=verified.find(p=>p.key===a.r2.objectKey);assert.ok(proof);assert.equal(proof.status,200);assert.ok(proof.bytes>0);
  assert.equal(a.r2.sha256,proof.sha256);assert.equal(a.r2.remoteVerified,true);
 }
 return current;
}
