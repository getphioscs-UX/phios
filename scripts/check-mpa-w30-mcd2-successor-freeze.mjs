import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const BASE='content/professional/method-production-activation';
const successor=j(`${BASE}/successors/mpa-w30-mcd2-adapter-successor-v1.json`);
const freeze=j(`${BASE}/freeze/mpa-production-activation-freeze-v1.json`);
const manifest=j(`${BASE}/freeze/mpa-w0-w29-content-preservation-manifest-v1.json`);
const mcd1=j(`${BASE}/successors/mpa-mcd-1-production-authority-successor-v1.json`);
const mcd2=j('content/professional/method-client-delivery/registries/mcd-2-canonical-runtime-adapter-registry-v1.json');

assert.equal(successor.status,'ACTIVE_VERSIONED_SUCCESSOR_AUTHORIZING_CANONICAL_API_ADAPTER_BINDING_ONLY');
assert.equal(successor.authorityOwner,'MPA');
assert.equal(successor.predecessor.predecessorMutated,false);
assert.equal(sha(successor.predecessor.freezePath),successor.predecessor.freezeSha256);
assert.equal(sha(successor.predecessor.manifestPath),successor.predecessor.manifestSha256);
assert.equal(freeze.status,'MPA-v1.0.0-FROZEN');
assert.equal(manifest.status,'FROZEN_CONTENT_PRESERVATION_MANIFEST');

const allowed=new Map(successor.authorizedDrift.map(x=>[x.path,x]));
assert.equal(allowed.size,1);
assert.ok(allowed.has('functions/api/method-execute.js'));
for(const entry of manifest.entries){
  assert.ok(fs.existsSync(entry.reference),`Missing frozen artifact: ${entry.reference}`);
  const drift=allowed.get(entry.reference);
  if(drift){
    assert.equal(entry.sha256,drift.predecessorSha256,'Authorized drift predecessor digest must equal frozen manifest.');
    assert.equal(sha(entry.reference),drift.successorSha256,'Authorized MCD-2 API successor drift mismatch.');
  }else{
    assert.equal(sha(entry.reference),entry.sha256,`Unauthorized MPA frozen artifact drift: ${entry.reference}`);
  }
}
for(const code of ['AST','BZR','NUM']){
  const m=mcd1.methods.find(x=>x.pluginCode===code); assert.ok(m); assert.equal(m.dispatchAllowed,true); assert.equal(m.productionEligible,true);
  const a=mcd2.entries.find(x=>x.pluginCode===code); assert.ok(a); assert.equal(a.productionAdapterBindingActive,true); assert.equal(a.customerCalculationActive,false);
}
const hm=mcd1.methods.find(x=>x.pluginCode==='HDR'); assert.equal(hm.state,'BLOCKED'); assert.equal(hm.dispatchAllowed,false);
const ha=mcd2.entries.find(x=>x.pluginCode==='HDR'); assert.equal(ha.registrationStatus,'REGISTERED_VALIDATION_ONLY'); assert.equal(ha.productionInvocation,'FORBIDDEN');

const pkg=j('package.json');
assert.equal(pkg.scripts['check:mpa-w30'],'node scripts/check-mpa-w30-mcd2-successor-freeze.mjs');
assert.equal(pkg.scripts['check:mpa-freeze'],'npm run check:mpa-w30');
assert.equal(pkg.scripts['check:mpa-complete'],'npm run check:mpa');
console.log('✓ MPA-W30 → MCD-2 versioned successor freeze passed.');
console.log('  Historical W0-W30 authority remains byte-frozen except the single authorized canonical API adapter-binding drift.');
console.log('  AST/BZR/NUM MPA successor authority is consumed without granting new authority; HDR remains BLOCKED and Production invocation forbidden.');
