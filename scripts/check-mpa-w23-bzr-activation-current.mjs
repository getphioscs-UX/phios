import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  BASELINE, readJson, sha256File
} from './lib/method-production-activation/mpa-bzr-activation-v1.mjs';
import {
  trueSolarClockReference,
  independentBzrPillarsReference,
  validateBzrAuthorityRecord,
  evaluateBzrActivationReadiness,
  assertBzrProductionExecutionBlocked,
  MPA_BZR_ACTIVATION_DECISION_SCHEMA_VERSION
} from '../functions/method-production-activation/bzr-activation-runtime.js';

const root='content/professional/method-production-activation';
const contract=readJson(`${root}/contracts/mpa-bzr-activation-v1.json`);
const tolerance=readJson(`${root}/contracts/mpa-bzr-boundary-tolerance-freeze-v1.json`);
const tz=readJson(`${root}/registries/mpa-bzr-timezone-authority-resolution-v1.json`);
const solar=readJson(`${root}/registries/mpa-bzr-solar-term-authority-resolution-v1.json`);
const trueSolar=readJson(`${root}/registries/mpa-bzr-true-solar-time-reference-v1.json`);
const sexagenary=readJson(`${root}/registries/mpa-bzr-sexagenary-authority-resolution-v1.json`);
const luck=readJson(`${root}/registries/mpa-bzr-luck-start-exact-evidence-v1.json`);
const comparison=readJson(`${root}/registries/mpa-bzr-cross-implementation-evidence-v1.json`);
const regression=readJson(`${root}/registries/mpa-bzr-regression-freeze-v1.json`);
const fixtures=readJson(`${root}/fixtures/mpa-w23-bzr-activation-fixture-corpus-v1.1.json`);
const reconciliation=readJson(`${root}/audits/mpa-w23-bzr-fixture-reconciliation-v1.json`);
const readiness=readJson(`${root}/registries/mpa-bzr-activation-readiness-v1.json`);
const schema=readJson(`${root}/schemas/mpa-bzr-activation-readiness-v1.schema.json`);
const acceptance=readJson(`${root}/acceptance/mpa-w23-bzr-activation-acceptance-v1.json`);
const methodRegistry=readJson(`${root}/registries/method-registry-v2.json`);
const capabilityMatrix=readJson(`${root}/registries/mpa-method-capability-matrix-v1.json`);
const legacyManifest=readJson('content/professional/core-method-runtime/bzr-runtime-manifest-v1.json');

assert.equal(contract.work,'MPA-W23');
assert.equal(contract.baselineCommit,BASELINE);
assert.equal(contract.activationSemantics.createsProductionEligibility,false);
assert.equal(contract.methodAuthorityBoundary.mpaMayInventAlternativeBaziPolicies,false);
assert.equal(schema.properties.schemaVersion.const,MPA_BZR_ACTIVATION_DECISION_SCHEMA_VERSION);
assert.equal(schema.properties.productionEligible.const,false);

// Historical/frozen authority must remain byte-for-byte unchanged.
const frozen = {
  'content/professional/method-runtime/method-registry-v1.json':'a16b6f316365592acec4be4588a5305aedd3f760b9445ecae1c63b4bcb1161e1',
  'content/professional/method-runtime/method-runtime-freeze-v1.json':'8004a17aeb8936303221c9b3b37e190856bcb81067496322d72283472b6f4a83',
  'content/professional/method-governance/imr-method-registry-v1.json':'f6793363f06aa37be1f7ea8b52b7e07068cfcf48d6bd796c14e0ed2d7d7ae7e1',
  'content/professional/method-governance/imr-production-eligibility-registry-v1.json':'40a1a7312d88e53335dcdfaab331c50bdbc62f9938a6002826adfe9c9e36421b',
  'content/professional/method-governance/imr-method-governance-freeze-v1.json':'5fc6c6fa8353d54754aa06f51a907192f93d92da7301e385d3fe91a5fc200c11',
  'content/professional/core-method-runtime/bzr-runtime-manifest-v1.json':'83df7bff063d1f72b7fc6202a90935dceea3504e4c738c015a33b2a37be22b48',
  'content/professional/method-production-activation/registries/method-registry-v2.json':'7cab1dca382de4a796a8a92de3fb0105ae23689f91e4661a48ea1e4e4ca563b0',
  'content/professional/method-production-activation/registries/mpa-method-capability-matrix-v1.json':'b7da6d917c5d50f199d33ba0c5db5c4518f471c48837a9a57cd5a06153d5d5ce',
  'content/professional/method-production-activation/fixtures/mpa-reference-fixture-corpus-v1.json':'4fc6d5ac30b5628d7c517d7ef757648834f2975bb0c74fb50cc60c64876b754a',
  'content/professional/method-production-activation/registries/mpa-cross-implementation-comparison-registry-v1.json':'e7127066b0fd26657f404efe069281f4a745bd45354631e295bce01408189c5a',
  'content/professional/method-production-activation/registries/mpa-calculation-data-authority-registry-v1.json':'71352ed3b231449cec638e8347b5c9dcc50cd1aacf14eaf35e7a7aa79f5418d8'
};
for(const [file,digest] of Object.entries(frozen)) assert.equal(sha256File(file),digest,`HISTORICAL_AUTHORITY_DRIFT:${file}`);

// Resolve immutable shared authorities through a BZR-specific successor record.
assert.equal(validateBzrAuthorityRecord(tz,'IANA_TZDB'),true);
assert.equal(tz.authorityBinding.releaseVersion,'2026c');
assert.equal(tz.authorityBinding.artifact.digest,'3e5aec7d93522efc875fc8af553f78029677aaa9be8db396c862d687bdedb930379ba6246b33a15c5fb3a76d24e937dac4f4f66d6f9edf69a668bb21e9eeada7');
assert.equal(tz.authorityBinding.license,'PUBLIC_DOMAIN');
assert.equal(validateBzrAuthorityRecord(solar,'ASTRONOMY_ENGINE_JS'),true);
assert.equal(solar.authorityBinding.version,'2.1.19');
assert.equal(solar.authorityBinding.releaseCommit,'61dc07020aaa6885d2c7f688a4d82beaf6edb9ef');
assert.equal(solar.referenceEvidence.jieBoundaries.length,12);
assert.deepEqual(solar.referenceEvidence.jieBoundaries.map(x=>x.solarLongitudeDegrees),[285,315,345,15,45,75,105,135,165,195,225,255]);
assert.equal(tolerance.boundaryClassification.allowedAmbiguitySeconds,0);
assert.equal(tolerance.independentAstronomyComparison.maximumTimestampDifferenceSeconds,120);

// Recalculate true-solar clock independently; the physical UTC instant must remain invariant.
const valid=fixtures.fixtures.find(x=>x.fixtureId==='BZR-W23-VALID-1989-001');
const ref=trueSolarClockReference({
  utcIso:valid.expected.physicalInstantUtcIso,
  civilLocalDate:valid.input.birthDate,
  civilLocalTime:valid.input.birthTime,
  timezoneOffsetMinutes:480,
  longitudeDegreesEast:valid.input.coordinates.longitude
});
assert.equal(ref.physicalInstantUtcIso,'1989-11-15T14:50:00.000Z');
assert.ok(Math.abs(ref.equationOfTimeMinutes-trueSolar.fixture.noaaMeeusEquationOfTimeMinutes)<1e-10);
assert.ok(Math.abs(ref.totalCorrectionMinutes-valid.expected.trueSolarCorrectionMinutes)<1e-10);
assert.equal(ref.trueSolarLocalDate,valid.expected.trueSolarLocalDate);
assert.equal(ref.trueSolarLocalTime,valid.expected.trueSolarLocalTime);
assert.ok(trueSolar.fixture.independentSwissEphemeris.differenceSeconds<=tolerance.trueSolarReferenceComparison.maximumDifferenceSeconds);
assert.equal(trueSolar.semanticCorrection.historicalW12AcceptedForProduction,false);
assert.equal(reconciliation.resolution.historicalCorpusRewritten,false);
assert.equal(reconciliation.pillarImpact.hourChanged,false);

// Independent sexagenary recalculation must preserve the corrected fixture pillars.
assert.equal(validateBzrAuthorityRecord(sexagenary,'BZR_STEM_BRANCH_TABLES_V1'),true);
const p=independentBzrPillarsReference({
  birthDate:valid.input.birthDate,
  trueSolarLocalTime:ref.trueSolarLocalTime,
  yearAfterLiChun:true,
  monthOrdinalFromLiChun:9
});
const label=x=>`${x.stemCode}-${x.branchCode}`;
assert.deepEqual([label(p.year),label(p.month),label(p.day),label(p.hour)],
  [valid.expected.year,valid.expected.month,valid.expected.day,valid.expected.hour]);
assert.deepEqual([p.year.sexagenaryIndex,p.month.sexagenaryIndex,p.day.sexagenaryIndex,p.hour.sexagenaryIndex],[6,12,16,12]);
assert.equal(sexagenary.externalIndependentImplementationEvidence.version,'1.7.7');
assert.equal(sexagenary.externalIndependentImplementationEvidence.releaseCommit,'4c45a59f79b856125516f31aefa8295035c16afd');
assert.equal(sexagenary.externalIndependentImplementationEvidence.role,'SECONDARY_INDEPENDENT_IMPLEMENTATION_EVIDENCE_NOT_TRUSTED_AUTHORITY');

// Exact luck-start evidence uses physical instants and preserves an exact rational, not a fabricated integer-age result.
assert.equal(luck.physicalInterval.intervalSeconds,1859457);
assert.equal(luck.exactStartAge.totalYearsNumerator,619819);
assert.equal(luck.exactStartAge.totalYearsDenominator,86400);
assert.equal(luck.exactStartAge.roundingApplied,false);
assert.equal(luck.representationBoundary.trueSolarClockDoesNotChangePhysicalBirthInstant,true);
assert.equal(comparison.status,'PASS_METHOD_SPECIFIC_REFERENCE_EVIDENCE');
assert.equal(comparison.productionComparisonSatisfiedForMethodSpecificReadiness,true);

// Execute every legacy BZR validation checker as regression evidence. Passing them does not promote legacy BZR to Production.
const pkg=readJson('package.json');
for(const alias of regression.checkerAliases){
  const command=pkg.scripts[alias]; assert.ok(command?.startsWith('node '),`BZR_CHECKER_ALIAS_MISSING:${alias}`);
  const run=spawnSync(process.execPath,[command.slice('node '.length)],{cwd:process.cwd(),encoding:'utf8'});
  assert.equal(run.status,0,`${alias}\n${run.stdout}\n${run.stderr}`);
}
for(const item of regression.fingerprints) assert.equal(sha256File(item.path),item.sha256,`BZR_W23_REGRESSION_DRIFT:${item.path}`);

const bzr=methodRegistry.methods.find(x=>x.methodCode==='BAZI');
assert.equal(bzr.state,'ACTIVATION_CANDIDATE'); assert.equal(bzr.productionEligible,false); assert.equal(bzr.professionalEligible,false);
const caps=capabilityMatrix.methods.find(x=>x.methodCode==='BAZI');
assert.equal(caps.capabilities.CALCULATION.state,'IMPLEMENTED_VALIDATION_ONLY');
assert.equal(caps.capabilities.PROJECTION.state,'IMPLEMENTED_VALIDATION_ONLY');
assert.equal(caps.capabilities.PROFESSIONAL.state,'BLOCKED');
assert.equal(legacyManifest.activation.productionEligible,false);
assert.equal(legacyManifest.activation.professionalReady,false);
assert.equal(legacyManifest.activation.pluginActivated,false);

const decision=evaluateBzrActivationReadiness({gates:readiness.gates,evidenceReferences:readiness.evidenceReferences});
assert.equal(decision.decision,'READY_FOR_MPA_W26_ELIGIBILITY_DECISION');
assert.equal(decision.methodSpecificReady,true);
assert.equal(decision.readyForW26,true);
assert.equal(decision.productionEligible,false);
assert.equal(decision.productionExecutionAllowed,false);
assert.equal(decision.professionalEligible,false);
assert.deepEqual(decision,readiness);
assert.throws(()=>assertBzrProductionExecutionBlocked('production'),/MPA_W27_PRODUCTION_EXECUTION_GATE_REQUIRED/);
assert.equal(assertBzrProductionExecutionBlocked('validation'),true);

assert.equal(acceptance.status,'ACCEPT_BZR_METHOD_SPECIFIC_SUCCESSOR_ACTIVATION_EVIDENCE_READY_FOR_W26_NO_PRODUCTION_EXECUTION');
assert.equal(acceptance.acceptedFacts.methodSpecificReadyForW26,true);
assert.equal(acceptance.nextWork,'MPA-W24_HDR_BOUNDARY');

// Current checker intentionally omits historical package.json wiring assertions.
console.log('✓ MPA-W23 BZR Activation passed.');
console.log('  Historical synthetic true-solar/solar-term fixtures are reconciled through a versioned successor; W12/W15 history remains unchanged.');
console.log('  BZR method-specific successor evidence is ready for MPA-W26; Production execution remains blocked until MPA-W27.');
