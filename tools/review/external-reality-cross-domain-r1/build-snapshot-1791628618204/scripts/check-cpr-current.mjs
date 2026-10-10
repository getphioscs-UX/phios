import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const boundary=read('content/professional/canonical-presentation-runtime/audits/cpr-authority-boundary-v1.json');
const asset=read('content/governance/current-authority-reconciliation/carc-w5-public-asset-base-v1.json');
const authority=read('content/governance/current-authority-reconciliation/current-authority-successor-registry-v1.json');
assert.equal(boundary.status,'frozen_boundary');
assert.equal(boundary.productionStatus,'validation_only');
assert.equal(boundary.invariants.duplicateAuthorityCreated,false);
assert.equal(boundary.invariants.cprMayApproveAsset,false);
assert.equal(boundary.invariants.cprMayPublishAsset,false);
assert.equal(asset.proof.duplicateCurrentOwnerPerLayer,false);
assert.equal(asset.proof.canonicalAssetAuthorityDistinctFromPublicationAndDelivery,true);
for (const layer of asset.layers) { assert.ok(fs.existsSync(layer.path)); assert.equal(sha(layer.path),layer.sha256,`Asset layer drift: ${layer.layer}`); }
const a=authority.authorities.find(x=>x.authorityId==='PRESENTATION_AUTHORITY');
assert.ok(a); assert.equal(a.currentFile,'content/professional/canonical-presentation-runtime/audits/cpr-authority-boundary-v1.json');
console.log('✓ CPR current successor passed: presentation authority is validation/composition only; historical public-asset digest is isolated.');
