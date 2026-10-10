import assert from 'node:assert/strict';
import { BASELINE, readJson, sorted } from './lib/method-production-activation/mpa-foundation-v1.mjs';
const m = readJson('content/professional/method-production-activation/registries/mpa-method-capability-matrix-v1.json');
const schema = readJson('content/professional/method-production-activation/schemas/mpa-method-capability-matrix-v1.schema.json');
const capabilities=['DATA','CALCULATION','PROJECTION','INTERPRETATION','PROFESSIONAL','PUBLIC'];
assert.equal(m.schemaVersion,'PHI-OS-MPA-W5-METHOD-CAPABILITY-MATRIX-v1.0.0');
assert.equal(m.baselineCommit,BASELINE);
assert.deepEqual(m.capabilities,capabilities);
assert.deepEqual(schema.properties.capabilities.const,capabilities);
assert.equal(m.methods.length,7);
for (const method of m.methods) {
  assert.equal('productionReady' in method,false,'MPA capability matrix must not collapse to productionReady boolean.');
  assert.deepEqual(sorted(Object.keys(method.capabilities)),sorted(capabilities),method.methodCode);
  for (const [cap,record] of Object.entries(method.capabilities)) {
    assert(m.capabilityStates.includes(record.state),`${method.methodCode}:${cap}:${record.state}`);
    assert.notEqual(record.state,'PRODUCTION_ELIGIBLE',`${method.methodCode}:${cap} cannot be promoted in W5.`);
    assert.notEqual(record.state,'PROFESSIONAL_ELIGIBLE',`${method.methodCode}:${cap} cannot be promoted in W5.`);
  }
}
for (const code of ['NUMEROLOGY','ASTROLOGY','BAZI','HUMAN_DESIGN']) {
  const method=m.methods.find(x=>x.methodCode===code);
  assert.equal(method.capabilities.CALCULATION.state,'IMPLEMENTED_VALIDATION_ONLY');
  assert.equal(method.capabilities.PROJECTION.state,'IMPLEMENTED_VALIDATION_ONLY');
  assert.equal(method.capabilities.INTERPRETATION.state,'BLOCKED');
  assert.equal(method.capabilities.PROFESSIONAL.state,'BLOCKED');
  assert.equal(method.capabilities.PUBLIC.state,'BLOCKED');
}
console.log('✓ MPA-W5 Method Capability Matrix passed.');
console.log('  DATA / CALCULATION / PROJECTION / INTERPRETATION / PROFESSIONAL / PUBLIC are independently governed.');
