import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const t=p=>fs.readFileSync(p,'utf8');
const exists=p=>fs.existsSync(p);

const V5_POINTER='content/governance/production-capability-matrix/reconciliation/production-capability-current-successor-v5.json';
const V6_POINTER='content/governance/production-capability-matrix/reconciliation/production-capability-current-successor-v6.json';
const currentPointerPath=exists(V6_POINTER)?V6_POINTER:V5_POINTER;
const current=j(currentPointerPath);
const reg=j(current.currentRegistry);
const statusProjection=j(current.currentStatusProjection);
const status=new Map(reg.capabilities.map(x=>[x.methodRuntime.pluginCode,x.capabilityAvailability]));

// Preserve the FMA predecessor evidence even after a governed successor becomes current.
const v5=j(V5_POINTER);
assert.equal(v5.currentRegistry,'content/governance/production-capability-matrix/registries/production-capability-registry-v5.json');
assert.equal(v5.currentStatusProjection,'content/governance/production-capability-matrix/projections/production-capability-status-projection-v5.json');
if(currentPointerPath===V6_POINTER){
  assert.equal(current.predecessor,V5_POINTER);
  assert.equal(current.predecessorMutated,false);
}

for(const code of ['AST','BZR','NUM'])assert.equal(status.get(code),'AVAILABLE');
if(currentPointerPath===V6_POINTER)assert.equal(status.get('ZWR'),'AVAILABLE');
assert.equal(status.get('HDR'),'BLOCKED');
for(const code of ['ICH','TAR'])assert.notEqual(status.get(code),'AVAILABLE');

const surfaces=[
  ['AST','assets/js/pages/ast-production-meaning.js'],
  ['BZR','assets/js/pages/bzr-production-meaning.js'],
  ['NUM','assets/js/pages/num-production-meaning.js']
];
if(currentPointerPath===V6_POINTER)surfaces.push(['ZWR','assets/js/pages/zwr-production-meaning.js']);
for(const [code,p] of surfaces){
  assert(exists(p),`${code} production surface must exist`);
  const s=t(p);
  assert(/Available|available/.test(s),`${code} visible available label`);
  assert.equal(status.get(code),'AVAILABLE',`${code} frontend label must be backed by current PCM`);
}

const account=t('assets/js/pages/account-method-status.js');
const currentProjectionBasename=path.basename(current.currentStatusProjection);
assert(account.includes(currentProjectionBasename),`Account must consume current PCM status projection ${currentProjectionBasename}`);
assert(!/localStorage|sessionStorage|indexedDB/.test(account));

const projected=new Map((statusProjection.items||[]).map(x=>[x.pluginCode,x.status]));
for(const [code,value] of status){
  if(value==='AVAILABLE')assert.equal(projected.get(code),'Available',`${code} PCM/status projection parity`);
}

console.log(`✓ No-fake Method availability gate passed against ${path.basename(currentPointerPath)}.`);
