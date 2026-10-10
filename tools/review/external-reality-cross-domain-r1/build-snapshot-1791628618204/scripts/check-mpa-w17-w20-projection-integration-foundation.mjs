import assert from 'node:assert/strict';
import { BASELINE, readJson } from './lib/method-production-activation/mpa-projection-integration-v1.mjs';
await import('./check-mpa-w17-projection-freeze.mjs');
await import('./check-mpa-w18-interpretation-boundary.mjs');
await import('./check-mpa-w19-meaning-knowledge-integration.mjs');
await import('./check-mpa-w20-professional-integration.mjs');
const a = readJson('content/professional/method-production-activation/acceptance/mpa-w17-w20-projection-integration-foundation-acceptance-v1.json');
assert.equal(a.baselineCommit, BASELINE);
assert.deepEqual(a.completedWorks, ['MPA-W17','MPA-W18','MPA-W19','MPA-W20']);
assert.equal(a.status, 'ACCEPT_INTEGRATION_FOUNDATION_PRODUCTION_AND_PROFESSIONAL_RELEASE_REMAIN_BLOCKED');
assert.equal(a.acceptedFacts.projectionFreezeEstablished, true);
assert.equal(a.acceptedFacts.meaningKnowledgeIntegrationReferenceOnly, true);
assert.equal(a.acceptedFacts.prV2CanonicalArtifactResolved, false);
assert.equal(a.acceptedFacts.productionExecutionActivated, false);
assert.equal(a.acceptedFacts.professionalReleaseActivated, false);
const pkg = readJson('package.json');
const expected = {
  'check:mpa-w17':'node scripts/check-mpa-w17-projection-freeze.mjs',
  'check:mpa-w18':'node scripts/check-mpa-w18-interpretation-boundary.mjs',
  'check:mpa-w19':'node scripts/check-mpa-w19-meaning-knowledge-integration.mjs',
  'check:mpa-w20':'node scripts/check-mpa-w20-professional-integration.mjs',
  'check:mpa-w17-w20':'node scripts/check-mpa-w17-w20-projection-integration-foundation.mjs',
  'check:mpa-projection-integration':'npm run check:mpa-w17-w20'
};
for (const [k,v] of Object.entries(expected)) assert.equal(pkg.scripts[k],v,k);
const segments = String(pkg.scripts['check:mpa'] || '').split(' && ');
assert.deepEqual(segments.slice(0,4), [
  'npm run check:mpa-foundation',
  'npm run check:mpa-input-calculation',
  'npm run check:mpa-validation-evidence',
  'npm run check:mpa-projection-integration'
]);
assert.equal(String(pkg.scripts.postcheck||'').includes('check:mpa'), false, 'MPA remains outside global postcheck before W30.');
console.log('✓ MPA-W17-W20 Projection / Interpretation / Meaning / Professional Integration Acceptance passed.');
console.log('✓ MPA is ready to begin method-specific activation at W21; no Production or Professional release is granted here.');
