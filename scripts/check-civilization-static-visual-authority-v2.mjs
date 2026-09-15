import fs from 'node:fs';
import assert from 'node:assert/strict';
import {resolveAtlasStaticVisuals} from '../assets/js/pages/civilization-atlas/atlas-static-visual.js';
const dir='content/civilization-atlas/visuals/';
const read=p=>JSON.parse(fs.readFileSync(p));
const r=read(dir+'civilization-visual-asset-registry-v2.json');
const b=read(dir+'civilization-visual-batch-manifest-v2.json');
const p=read(dir+'civilization-visual-production-plan-v2.json');
const bindings=read(dir+'civilization-visual-approved-bindings-v1.json');
const ids=r.assets.map(a=>a.assetId);
assert.equal(ids.length,380);assert.equal(new Set(ids).size,380);assert.equal(new Set(r.assets.map(a=>a.family)).size,14);
assert.deepEqual(r.assets.filter(a=>a.family==='CASE_SECONDARY').map(a=>a.assetId).sort(),[...p.requiredSecondaryAssetIds].sort());
assert.ok(p.cancelledSecondaryAssetIds.every(id=>!ids.includes(id)));
assert.equal(b.batches.length,43);assert.ok(b.batches.every(b=>b.assetIds.length<=10));
assert.deepEqual(b.batches.flatMap(b=>b.assetIds).sort(),[...ids].sort());
assert.equal(bindings.assets.length,142);
for(const a of r.assets){
 for(const k of ['historicalAuthority','canonicalAuthority','registryWriteAuthority','ocrWriteBackAllowed','containsText'])assert.equal(a[k],false);
 assert.equal(a.fallback,'STRUCTURED_HTML_SVG');
 if(a.bindingState==='BOUND'){assert.equal(a.reviewState,'ACCEPTED');assert.match(a.sha256,/^[a-f0-9]{64}$/);assert.ok(fs.existsSync(a.reviewEvidence));
 const state=a.family==='TIMELINE_ANCHOR'?{activeLayer:'timeline',timeWindowId:a.subjectId}:{activeLayer:'cases',primaryCaseId:a.subjectId};
 assert.equal(resolveAtlasStaticVisuals({assets:[a]},state).length,1);
 }else assert.equal(a.bucketKey,null);
}
assert.equal(r.assets.filter(a=>a.reviewState==='ACCEPTED').length,162);
assert.equal(r.assets.filter(a=>a.status==='OWNER_CONFIRMED_REMOTE_UNRESOLVED').length,20);
console.log('PASS W4C current successor: 380 / 14 families / 43 batches, 64 REQUIRED; 142 accepted verified bindings, 20 unresolved remain unbound.');
