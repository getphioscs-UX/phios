import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const checks = [
  "check-mpa-w0-method-production-reconciliation.mjs",
  "check-mpa-w1-activation-authority-boundary.mjs",
  "check-mpa-w2-method-registry-v2-reconciliation.mjs",
  "check-mpa-w3-method-lifecycle-v2.mjs",
  "check-mpa-w4-public-method-vocabulary-boundary.mjs",
  "check-mpa-w5-method-capability-matrix.mjs",
  "check-mpa-w6-canonical-method-input-contract.mjs",
  "check-mpa-w7-consent-data-purpose.mjs",
  "check-mpa-w8-birth-initialization-data-runtime.mjs",
  "check-mpa-w9-temporal-spatial-resolution.mjs",
  "check-mpa-w10-deterministic-calculation-contract.mjs",
  "check-mpa-w11-calculation-data-authority.mjs",
  "check-mpa-w12-reference-fixture-corpus.mjs",
  "check-mpa-w13-method-validation-harness.mjs",
  "check-mpa-w14-current-regression-runtime.mjs",
  "check-mpa-w15-cross-implementation-comparison.mjs",
  "check-mpa-w16-method-uncertainty-error-contract.mjs",
  "check-mpa-w17-projection-freeze.mjs",
  "check-mpa-w18-interpretation-boundary.mjs",
  "check-mpa-w19-meaning-knowledge-integration.mjs",
  "check-mpa-w20-professional-integration.mjs",
  "check-mpa-w21-num-activation-current.mjs",
  "check-mpa-w22-ast-activation-current.mjs",
  "check-mpa-w23-bzr-activation-current.mjs",
  "check-mpa-w24-hdr-boundary-current.mjs",
  "check-mpa-w25-future-method-holding-registry-current.mjs",
  "check-mpa-w26-w27-mcd5-successor-current.mjs",
  "check-mpa-w28-downstream-integration-current.mjs",
  "check-mpa-w29-full-acceptance-current.mjs",
  "check-mpa-w30-current-freeze.mjs"
];
for (const file of checks) {
  const result = spawnSync(process.execPath, [`scripts/${file}`], { stdio: 'inherit', shell: false });
  assert.equal(result.status, 0, `MPA_CURRENT_CHECK_FAILED:${file}`);
}
console.log('✓ MPA Current Check Consolidation passed.');
console.log(`  ${checks.length} current method authority/validation/activation/freeze checks executed through one canonical npm entry: check:mpa.`);
