import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const run = (script) => {
  const r = spawnSync(npm, ['run', script], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  assert.equal(r.status, 0, `npm run ${script} failed`);
};
const json = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const sha = (path) => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');

// Preserve and re-run the accepted predecessor and the MCD-1..5 authority chain.
run('check:mir-2');
for (const script of ['check:mcd-1','check:mcd-2','check:mcd-3','check:mcd-4','check:mcd-5','check:mfig']) run(script);

// Keep the governing Method Production Authority current without depending on removed MPA npm sub-aliases.
const runNode = (file) => {
  const r = spawnSync(process.execPath, [file], { stdio: 'inherit', shell: false });
  assert.equal(r.status, 0, `node ${file} failed`);
};
for (const file of [
  'scripts/check-mpa-w21-num-activation-current.mjs',
  'scripts/check-mpa-w22-ast-activation-current.mjs',
  'scripts/check-mpa-w23-bzr-activation-current.mjs',
  'scripts/check-mpa-w24-hdr-boundary-current.mjs',
  'scripts/check-mpa-w26-w27-mcd5-successor-current.mjs'
]) runNode(file);
run('check:hdr-w2');

// MIR-3 deterministic Personal Structure successor contract.
for (const script of [
  'check:personal-structure:gate-wheel',
  'check:personal-structure:gate-line',
  'check:personal-structure:scu',
  'check:personal-structure:center-graph',
  'check:personal-structure:type',
  'check:personal-structure:authority',
  'check:personal-structure:definition',
  'check:personal-structure:profile',
  'check:personal-structure:incarnation',
  'check:personal-structure:variable-boundary',
  'check:personal-structure:capability',
  'check:personal-structure:runtime',
]) run(script);

const aggregatePath = 'content/reconciliation/mir/mir-3-method-calculation-projection-v1.json';
const x = json(aggregatePath);
assert.equal(x.work, 'MIR-3');
assert.equal(x.status, 'COMPLETE_WITH_EXPLICIT_UPSTREAM_CAPABILITY_GAPS');
assert.equal(x.authorityModel.clientInput, 'MCD-3 / SHARED_DATA_AUTHORITY');
assert.equal(x.authorityModel.calculation, 'SHARED_CALCULATION_RUNTIME');
assert.equal(x.authorityModel.projection, 'SHARED_PROJECTION_RUNTIME');
assert.equal(x.authorityModel.publicMethodDispatch, 'MPA');
assert.equal(x.methodReconciliation.PHI_OS_PERSONAL_STRUCTURE.capabilityGatedInternalCalculationImplemented, true);
assert.equal(x.methodReconciliation.PHI_OS_PERSONAL_STRUCTURE.currentFullCoreReady, false);
assert.equal(x.methodReconciliation.PHI_OS_PERSONAL_STRUCTURE.currentBlockerType, 'CALCULATION_CAPABILITY_NOT_SOURCE_TRADEMARK');
assert.equal(x.knownCurrentCapabilityState.thisIsNotAMir3AuthorityFailure, true);
for (const [gate, value] of Object.entries(x.exitGate)) assert.equal(value, true, `MIR-3 exit gate failed: ${gate}`);
for (const [path, digest] of Object.entries(x.artifacts)) {
  assert.ok(fs.existsSync(path), `missing MIR-3 artifact ${path}`);
  assert.equal(sha(path), digest, `MIR-3 artifact drift ${path}`);
}
for (const [path, digest] of Object.entries(x.preservationEvidence)) {
  assert.ok(fs.existsSync(path), `missing preserved predecessor artifact ${path}`);
  assert.equal(sha(path), digest, `MIR-3 silently mutated preserved predecessor ${path}`);
}

const capability = json('content/method/personal-structure/personal-runtime-capability-readiness-v1.json');
assert.equal(capability.status, 'ACTIVE_CAPABILITY_GATED');
assert.equal(capability.sourceTrademarkFlagsAreCoreCalculationGates, false);
assert.equal(capability.legacyGlobalHdrBlockedFlagAllowedAsPersonalRuntimeGate, false);
assert.equal(capability.capabilityGatedExecutionAllowed, true);
assert.equal(capability.currentFullCoreProductionReady, false);
assert.equal(capability.blockedBySourceOrTrademark, false);

const astronomyBinding = json('content/method/personal-structure/canonical-astronomy-binding-v1.json');
assert.equal(astronomyBinding.authorityOwner, 'EXISTING_SHARED_AST_ASTRONOMY_AUTHORITY');
assert.equal(astronomyBinding.secondEphemerisAuthorityCreated, false);
assert.equal(astronomyBinding.astCanonicalNodePolicy.policyCode, 'PHI_OS_AST_NODE_NONE_V1');
assert.equal(astronomyBinding.astCanonicalNodePolicy.included, false);
assert.equal(astronomyBinding.nonNodeCalculationContinuesWhenNodeUnavailable, true);
assert.equal(astronomyBinding.nodeSpecificActivationMayBeUnknown, true);

const astPolicy = json('content/professional/method-governance/successors/ast-production-policy-successor-v1.json');
assert.equal(astPolicy.policy.nodePolicy.policyCode, 'PHI_OS_AST_NODE_NONE_V1');
assert.equal(astPolicy.policy.nodePolicy.included, false);
assert.ok(astPolicy.explicitlyDeferred.includes('LUNAR_NODES'));

const calcBinding = json('content/professional/method-runtime/mfig-calculation-runtime-binding-registry-v1.json');
const projectionBinding = json('content/professional/method-runtime/mfig-projection-runtime-binding-registry-v1.json');
assert.equal(calcBinding.secondCalculationAuthorityCreated, false);
assert.equal(calcBinding.calculationAuthority, 'functions/method-runtime/shared-calculation-runtime.js');
assert.equal(projectionBinding.secondProjectionAuthorityCreated, false);
assert.equal(projectionBinding.projectionAuthority, 'functions/method-runtime/shared-projection-runtime.js');

const eligibility = json('content/professional/method-production-activation/successors/mir-3-method-production-eligibility-binding-v1.json');
assert.equal(eligibility.authorityOwner, 'MPA_FOR_PUBLIC_METHOD_DISPATCH');
assert.equal(eligibility.mfig050Role, 'DESCRIBE_OR_CONSTRAIN_ONLY_NOT_GRANT');
assert.equal(eligibility.publicMethods.HUMAN_DESIGN.dispatchAllowed, false);
assert.equal(eligibility.personalStructureInternal.isBrandedPublicMethodDispatch, false);
assert.equal(eligibility.personalStructureInternal.sourceTrademarkCanGloballyBlock, false);
assert.ok(eligibility.forbiddenGrantOwners.includes('Renderer'));
assert.ok(eligibility.forbiddenGrantOwners.includes('IR'));
assert.ok(eligibility.forbiddenGrantOwners.includes('MFIG'));

console.log('✓ MIR-3 Method Calculation + Canonical Projection Reconciliation passed.');
console.log('✓ Single input/calculation/projection authority preserved; MPA remains the public Method dispatch owner.');
console.log('✓ PHI OS Personal Structure deterministic successor is capability-gated, not trademark-gated.');
console.log('✓ Current AST node policy remains PHI_OS_AST_NODE_NONE_V1: node activations stay UNKNOWN while non-node calculation continues.');
console.log('✓ MIR-3 is complete with an explicit upstream astronomy capability gap; no frozen predecessor was silently mutated.');
