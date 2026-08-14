import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const json = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');

const contract = json('content/professional/method-client-delivery/contracts/mcd-2-canonical-runtime-adapter-contract-v1.json');
const registry = json('content/professional/method-client-delivery/registries/mcd-2-canonical-runtime-adapter-registry-v1.json');
const freeze = json('content/professional/method-client-delivery/freeze/mcd-2-canonical-runtime-adapter-freeze-v1.json');
const restoration = json('content/professional/method-client-delivery/reconciliation/mcd-2-artifact-restoration-and-script-lineage-v1.json');
const mpaMcd2 = json('content/professional/method-production-activation/successors/mpa-w30-mcd2-adapter-successor-v1.json');
const mpaMcd4 = json('content/professional/method-production-activation/successors/mpa-w30-mcd4-execution-successor-v1.json');
const pkg = json('package.json');

assert.equal(contract.work, 'MCD-2');
assert.deepEqual(contract.authorityChain, ['API', 'MPA', 'ADAPTER_REGISTRY', 'METHOD_ADAPTER', 'CORE_METHOD_RUNTIME']);
assert.equal(registry.status, 'ACTIVE_CANONICAL_BINDINGS_MPA_GATED_CUSTOMER_EXECUTION_DEFERRED');
for (const code of ['AST', 'BZR', 'NUM']) {
  const adapter = registry.entries.find(record => record.pluginCode === code);
  assert.equal(adapter.productionAdapterBindingActive, true, code);
  assert.equal(adapter.mpaDispatchAllowed, true, code);
}
const hdr = registry.entries.find(record => record.pluginCode === 'HDR');
assert.equal(hdr.registrationStatus, 'REGISTERED_VALIDATION_ONLY');
assert.equal(hdr.productionInvocation, 'FORBIDDEN');
assert.equal(freeze.status, 'FROZEN_ADAPTER_BINDING_MCD3_MCD4_NOT_ACTIVATED');
const apiDrift = mpaMcd4.authorizedDrift.find(record => record.path === 'functions/api/method-execute.js');
for (const record of [...freeze.frozenOutputs, ...freeze.predecessorEvidence]) {
  if (record.path === apiDrift.path) {
    assert.equal(record.sha256, apiDrift.predecessorSha256);
    assert.equal(sha256(record.path), apiDrift.successorSha256);
  } else {
    assert.equal(sha256(record.path), record.sha256, `MCD-2 freeze drift: ${record.path}`);
  }
}
assert.equal(restoration.status, 'BYTE_EXACT_MCD2_SUCCESSOR_RESTORATION_AND_PACKAGE_SCRIPT_RECONCILIATION');
assert.equal(sha256(restoration.restoredArtifact.path), restoration.restoredArtifact.sha256);
assert.equal(restoration.restoredArtifact.sha256, sha256('content/professional/method-production-activation/successors/mpa-w30-mcd2-adapter-successor-v1.json'));
assert.equal(mpaMcd4.predecessor.sha256, sha256(mpaMcd4.predecessor.path));
assert.equal(mpaMcd4.predecessor.sha256, sha256('content/professional/method-production-activation/successors/mpa-w30-mcd2-adapter-successor-v1.json'));
assert.equal(mpaMcd2.status, 'ACTIVE_VERSIONED_SUCCESSOR_AUTHORIZING_CANONICAL_API_ADAPTER_BINDING_ONLY');
assert.equal(pkg.scripts['check:mcd-2'], 'node scripts/check-mcd-2-mcd4-successor.mjs');
assert.equal(pkg.scripts['check:mcd-2-historical'], 'node scripts/check-mcd-2-canonical-runtime-adapter.mjs');

console.log('✓ MCD-2 → MCD-4 Canonical Adapter successor passed.');
console.log('  Frozen adapter bindings remain intact; only the MPA-authorized MCD-4 API successor drift is active.');
