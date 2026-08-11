import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { BASELINE, readJson, sha256File } from './lib/method-production-activation/mpa-ast-activation-v1.mjs';
import { validateAstEphemerisAuthority, validateAstTimezoneAuthority, evaluateAstActivationReadiness, assertAstProductionExecutionBlocked, MPA_AST_ACTIVATION_DECISION_SCHEMA_VERSION } from '../functions/method-production-activation/ast-activation-runtime.js';

const root = 'content/professional/method-production-activation';
const contract = readJson(`${root}/contracts/mpa-ast-activation-v1.json`);
const tolerance = readJson(`${root}/contracts/mpa-ast-tolerance-freeze-v1.json`);
const ephemeris = readJson(`${root}/registries/mpa-ast-ephemeris-authority-resolution-v1.json`);
const timezone = readJson(`${root}/registries/mpa-ast-timezone-authority-resolution-v1.json`);
const trusted = readJson(`${root}/registries/mpa-ast-trusted-reference-evidence-v1.json`);
const regression = readJson(`${root}/registries/mpa-ast-regression-freeze-v1.json`);
const policyBlocker = readJson(`${root}/registries/mpa-ast-production-policy-blocker-v1.json`);
const readiness = readJson(`${root}/registries/mpa-ast-activation-readiness-v1.json`);
const schema = readJson(`${root}/schemas/mpa-ast-activation-readiness-v1.schema.json`);
const timezoneFixtures = readJson(`${root}/fixtures/mpa-w22-ast-timezone-fixture-corpus-v1.json`);
const referenceFixtures = readJson(`${root}/fixtures/mpa-w22-ast-trusted-reference-fixture-corpus-v1.json`);
const acceptance = readJson(`${root}/acceptance/mpa-w22-ast-activation-acceptance-v1.json`);
const methodRegistry = readJson(`${root}/registries/method-registry-v2.json`);
const capabilityMatrix = readJson(`${root}/registries/mpa-method-capability-matrix-v1.json`);
const legacyFreeze = readJson('content/professional/core-method-runtime/ast-production-freeze-v1.json');

assert.equal(contract.work, 'MPA-W22');
assert.equal(contract.baselineCommit, BASELINE);
assert.equal(contract.activationSemantics.createsProductionEligibility, false);
assert.equal(contract.methodPolicyBoundary.mpaMaySelectOrApproveThesePolicies, false);
assert.equal(schema.properties.schemaVersion.const, MPA_AST_ACTIVATION_DECISION_SCHEMA_VERSION);
assert.equal(schema.properties.productionEligible.const, false);

// Historical W11/W15 authority remains immutable; W22 is a successor evidence layer.
assert.equal(sha256File(`${root}/registries/mpa-calculation-data-authority-registry-v1.json`), '71352ed3b231449cec638e8347b5c9dcc50cd1aacf14eaf35e7a7aa79f5418d8');
assert.equal(sha256File(`${root}/registries/mpa-cross-implementation-comparison-registry-v1.json`), 'e7127066b0fd26657f404efe069281f4a745bd45354631e295bce01408189c5a');

const e = validateAstEphemerisAuthority(ephemeris);
assert.equal(e.versionResolved, true); assert.equal(e.digestResolved, true);
assert.equal(ephemeris.authorityBinding.version, '2.1.19');
assert.equal(ephemeris.authorityBinding.releaseCommit, '61dc07020aaa6885d2c7f688a4d82beaf6edb9ef');
assert.equal(ephemeris.authorityBinding.sourceArtifact.digest, 'b16e54660ee65df2947079b383d90bac06ee82bf');
assert.equal(ephemeris.authorityBinding.license.digest, '9dd5faf8b0dad1d25ce768b8c0792c8185b0e7ae');
assert.equal(ephemeris.resolution.runtimeAdapterBindingRequiredAt, 'MPA-W27');

const tz = validateAstTimezoneAuthority(timezone);
assert.equal(tz.historicalTimezoneResolved, true);
assert.equal(timezone.authorityBinding.releaseCommit, '71f28b9ab3b67c0f9466803f6151812d4fc8e357');
assert.equal(timezone.authorityBinding.artifact.digest, '3e5aec7d93522efc875fc8af553f78029677aaa9be8db396c862d687bdedb930379ba6246b33a15c5fb3a76d24e937dac4f4f66d6f9edf69a668bb21e9eeada7');
assert.equal(timezone.authorityBinding.license, 'PUBLIC_DOMAIN');
assert.equal(timezone.runtimeBoundary.hostIntlIsCanonicalAuthority, false);

assert.equal(tolerance.angularComparison.maximumArcminutes, 0.878);
assert.equal(tolerance.angularComparison.maximumArcseconds, 52.68);
assert.equal(tolerance.scopeBoundary.thisIsAstrologyAspectOrbPolicy, false);
assert.equal(tolerance.scopeBoundary.productionAspectOrbPolicyApproved, false);
assert.equal(trusted.status, 'WITHIN_FROZEN_TOLERANCE_UPSTREAM_RELEASE_EVIDENCE');
assert.equal(trusted.upstreamComparisonHarness.gitBlobSha1, '05e66c569b9e65c5004487681a3bf5ba84fd8df2');
assert.equal(trusted.upstreamComparisonHarness.runnerGitBlobSha1, '9c361b94457f59cd39fda288e41905221d1f639f');
assert.equal(trusted.trustedReference.archivedSnapshot.gitBlobSha1, '2ee26b47f6e90e35e7131fb6af3da7ac68062d7c');
assert.equal(trusted.evidenceClassification.directPhiNumericReplayExecuted, false);
assert.equal(trusted.evidenceClassification.exactMatchClaimed, false);
assert.equal(trusted.evidenceClassification.technicalTrustedReferenceGateSatisfied, true);
assert.equal(referenceFixtures.directPhiNumericReplayExecuted, false);
assert.equal(referenceFixtures.fixtures[0].referenceOutput.j2000RaDegrees, 240.63084);

function offsetMinutes(zoneId, utc) {
  const name = new Intl.DateTimeFormat('en-US', {timeZone: zoneId, timeZoneName: 'longOffset', hour:'2-digit'}).formatToParts(new Date(utc)).find(p => p.type === 'timeZoneName')?.value;
  if (name === 'GMT' || name === 'UTC') return 0;
  const m = /^GMT([+-])(\d{2}):(\d{2})$/.exec(name || '');
  if (!m) throw new Error(`UNPARSABLE_HOST_TIMEZONE_OFFSET:${zoneId}:${utc}:${name}`);
  const n = Number(m[2]) * 60 + Number(m[3]); return m[1] === '-' ? -n : n;
}
for (const fixture of timezoneFixtures.fixtures) {
  assert.equal(offsetMinutes(fixture.zoneId, fixture.utc), fixture.expectedOffsetMinutes, fixture.fixtureId);
}
assert.equal(timezoneFixtures.fixtureRole, 'HOST_RUNTIME_SMOKE_NOT_AUTHORITY_PROOF');

for (const item of regression.fingerprints) assert.equal(sha256File(item.path), item.sha256, `AST_W22_REGRESSION_DRIFT:${item.path}`);
const pkg = readJson('package.json');
for (const alias of regression.checkerAliases) {
  const command = pkg.scripts[alias]; assert.ok(command?.startsWith('node '), `AST_CHECKER_ALIAS_MISSING:${alias}`);
  const run = spawnSync(process.execPath, [command.slice('node '.length)], {cwd:process.cwd(), encoding:'utf8'});
  assert.equal(run.status, 0, `${alias}\n${run.stdout}\n${run.stderr}`);
}

const astMethod = methodRegistry.methods.find(item => item.methodCode === 'ASTROLOGY');
assert.equal(astMethod.state, 'ACTIVATION_CANDIDATE'); assert.equal(astMethod.productionEligible, false); assert.equal(astMethod.professionalEligible, false);
assert.deepEqual(astMethod.blockingReasons, ['REFERENCE_VALIDATION_NOT_PASSED','REGRESSION_NOT_PASSED','PRODUCTION_POLICIES_NOT_APPROVED','MPA_EXECUTION_GATE_NOT_ESTABLISHED']);
const caps = capabilityMatrix.methods.find(item => item.methodCode === 'ASTROLOGY');
assert.equal(caps.capabilities.CALCULATION.state, 'IMPLEMENTED_VALIDATION_ONLY'); assert.equal(caps.capabilities.PROFESSIONAL.state, 'BLOCKED');
assert.equal(legacyFreeze.productionStatus, 'blocked'); assert.equal(legacyFreeze.executionMode, 'validation_only');
assert.equal(legacyFreeze.frozenPolicyFacts.houseSystemProductionPolicyApproved, false);
assert.equal(legacyFreeze.frozenPolicyFacts.zodiacProductionPolicyApproved, false);
assert.equal(legacyFreeze.frozenPolicyFacts.productionOrbPolicyApproved, false);
assert.equal(policyBlocker.status, 'BLOCKED_METHOD_POLICY_AUTHORITY_REQUIRED');
assert.equal(policyBlocker.mpaDecision.mayInventDefaults, false);

const decision = evaluateAstActivationReadiness({
  technicalGates:{ephemerisVersion:true, ephemerisDigest:true, trustedJplReference:true, toleranceFreeze:true, historicalTimezoneAuthority:true},
  productionPolicyAuthorityApproved:false,
  evidenceReferences:readiness.evidenceReferences
});
assert.equal(decision.decision, 'BLOCKED_PRODUCTION_POLICY_AUTHORITY_REQUIRED');
assert.equal(decision.technicalActivationEvidenceReady, true); assert.equal(decision.methodSpecificReady, false); assert.equal(decision.readyForW26, false);
assert.equal(decision.productionEligible, false); assert.equal(decision.productionExecutionAllowed, false); assert.equal(decision.professionalEligible, false);
assert.deepEqual(decision.remainingMethodSpecificBlockers, ['PRODUCTION_POLICIES_NOT_APPROVED']);
assert.deepEqual(readiness, decision);
assert.throws(() => assertAstProductionExecutionBlocked('production'), /MPA_W27_PRODUCTION_EXECUTION_GATE_REQUIRED/);
assert.equal(assertAstProductionExecutionBlocked('validation'), true);

assert.equal(acceptance.status, 'ACCEPT_AST_TECHNICAL_ACTIVATION_EVIDENCE_METHOD_POLICY_BLOCKED_NO_PRODUCTION_EXECUTION');
assert.equal(acceptance.acceptedFacts.technicalActivationEvidenceReady, true);
assert.equal(acceptance.acceptedFacts.methodSpecificReadyForW26, false);
assert.equal(acceptance.nextWork, 'MPA-W23_BZR_ACTIVATION');

assert.equal(pkg.scripts['check:mpa-w22'], 'node scripts/check-mpa-w22-ast-activation.mjs');
assert.equal(pkg.scripts['check:mpa-ast-activation'], 'npm run check:mpa-w22');
const segments = String(pkg.scripts['check:mpa'] || '').split(' && ');
assert.deepEqual(segments.slice(0,6), [
  'npm run check:mpa-foundation','npm run check:mpa-input-calculation','npm run check:mpa-validation-evidence','npm run check:mpa-projection-integration','npm run check:mpa-num-activation','npm run check:mpa-ast-activation'
]);
assert.equal(String(pkg.scripts.postcheck || '').includes('check:mpa'), false);

console.log('✓ MPA-W22 AST Activation passed.');
console.log('  Ephemeris version/digest, JPL trusted-reference evidence, tolerance, and TZDB authority are resolved for AST technical activation evidence.');
console.log('  AST remains method-policy blocked and is not yet ready for MPA-W26; Production execution remains blocked until MPA-W27.');
