import assert from 'node:assert/strict';
import { BASELINE, readJson } from './lib/method-production-activation/mpa-foundation-v1.mjs';
await import('./check-mpa-w0-method-production-reconciliation.mjs');
await import('./check-mpa-w1-activation-authority-boundary.mjs');
await import('./check-mpa-w2-method-registry-v2-reconciliation.mjs');
await import('./check-mpa-w3-method-lifecycle-v2.mjs');
await import('./check-mpa-w4-public-method-vocabulary-boundary.mjs');
await import('./check-mpa-w5-method-capability-matrix.mjs');
const a=readJson('content/professional/method-production-activation/acceptance/mpa-w0-w5-foundation-acceptance-v1.json');
assert.equal(a.baselineCommit,BASELINE);
assert.equal(a.status,'ACCEPT_FOUNDATION_RECONCILED_NO_METHOD_PRODUCTION_ACTIVATION');
assert.deepEqual(a.completedWorks,['MPA-W0','MPA-W1','MPA-W2','MPA-W3','MPA-W4','MPA-W5']);
assert.equal(a.acceptedFacts.frozenMrV1Preserved,true);
assert.equal(a.acceptedFacts.frozenImrV1Preserved,true);
assert.equal(a.acceptedFacts.numAddedOnlyThroughVersionedSuccessor,true);
assert.equal(a.acceptedFacts.hdrFailClosed,true);
assert.equal(a.acceptedFacts.methodExecutionActivated,false);
assert.equal(a.acceptedFacts.professionalReleaseActivated,false);
const pkg=readJson('package.json');
const expected={
  'check:mpa-w0':'node scripts/check-mpa-w0-method-production-reconciliation.mjs',
  'check:mpa-w1':'node scripts/check-mpa-w1-activation-authority-boundary.mjs',
  'check:mpa-w2':'node scripts/check-mpa-w2-method-registry-v2-reconciliation.mjs',
  'check:mpa-w3':'node scripts/check-mpa-w3-method-lifecycle-v2.mjs',
  'check:mpa-w4':'node scripts/check-mpa-w4-public-method-vocabulary-boundary.mjs',
  'check:mpa-w5':'node scripts/check-mpa-w5-method-capability-matrix.mjs',
  'check:mpa-w0-w5':'node scripts/check-mpa-w0-w5-foundation.mjs',
  'check:mpa-foundation':'npm run check:mpa-w0-w5',
  'check:mpa':'npm run check:mpa-foundation && npm run check:mpa-input-calculation'
};
for(const [k,v] of Object.entries(expected)) assert.equal(pkg.scripts[k],v,k);
assert.equal(String(pkg.scripts.postcheck||'').includes('check:mpa'),false,'MPA must not enter global postcheck before W30 Full Acceptance/Freeze.');
console.log('✓ MPA-W0-W5 Foundation Acceptance passed.');
console.log('✓ Method execution remains closed; next work is MPA-W6 Canonical Method Input Contract.');
