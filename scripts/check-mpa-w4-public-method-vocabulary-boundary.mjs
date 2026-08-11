import assert from 'node:assert/strict';
import { BASELINE, readJson, sorted } from './lib/method-production-activation/mpa-foundation-v1.mjs';
const v = readJson('content/professional/method-production-activation/registries/mpa-public-method-vocabulary-boundary-v1.json');
assert.equal(v.schemaVersion,'PHI-OS-MPA-W4-PUBLIC-METHOD-VOCABULARY-BOUNDARY-v1.0.0');
assert.equal(v.baselineCommit,BASELINE);
assert.equal(v.resolver.authority,'PUBLIC_VOCABULARY_REGISTRY');
assert.equal(v.resolver.fallbackToInternalNameAllowed,false);
assert.equal(v.resolver.missingVocabularyBehavior,'FAIL_CLOSED_NO_PUBLIC_LABEL');
assert.deepEqual(sorted(v.internalTracks.map(x=>x.internalCode)), sorted(['HDR','AST','BZR','NUM']));
for (const item of v.internalTracks) {
  assert.ok(item.publicVocabularyKey);
  assert.equal(item.directInternalNameExposureAllowed,false);
  assert.equal(item.publicLabel,null,'W4 establishes the boundary; it must not invent marketing copy.');
}
const hdr=v.internalTracks.find(x=>x.internalCode==='HDR');
assert.equal(hdr.restrictedOrTrademarkSensitive,true);
assert.equal(hdr.publicStatus,'BLOCKED_PENDING_GOVERNED_VOCABULARY');
for (const value of Object.values(v.forbidden)) assert.equal(value,true);
console.log('✓ MPA-W4 Public Method Vocabulary Boundary passed.');
console.log('  Internal method identities cannot leak into customer/marketing copy; restricted terminology fails closed.');
