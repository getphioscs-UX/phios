import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  PROFILE_SOURCE_CLASSES,
  EXTERNAL_PROFILE_PROVIDER_FAMILIES,
  REASONING_TASK_FAMILIES,
  SELF_ASSESSMENT_PURPOSE,
  normalizeExternalProfileInput,
  scoreSelfAssessment,
  normalizeReasoningTaskPerformance,
  buildProfileSignalEnvelope,
  buildSelfAssessmentProfileSignals,
  buildExternalProfileSignals,
  buildReasoningPerformanceSignals,
  stableProfileSnapshot
} from '../functions/profile/profile-foundation-runtime.js';

const BASE = '4b2688665e0875f6a628c2b81d1991a14ea62a49';
const MODE = String(process.argv[2] || 'ALL').toUpperCase();
const VALID = new Set(['ALL','A0','W0','W1','W2','W3','W4','W5','W6']);
if (!VALID.has(MODE)) throw new Error(`PROFILE_CHECK_UNKNOWN_MODE:${MODE}`);
const run = code => MODE === 'ALL' || MODE === code;
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const text = path => fs.readFileSync(path, 'utf8');
const mustThrow = (fn, code) => {
  let caught = null;
  try { fn(); } catch (error) { caught = error; }
  assert.ok(caught, `expected ${code}`);
  assert.equal(caught.code, code);
};

const reconciliation = read('content/personal-reading/authority/personal-perspective-authority-reconciliation-v2.json');
const sourceContract = read('content/professional/profile/contracts/profile-source-class-contract-v1.json');
const externalContract = read('content/professional/profile/contracts/external-profile-input-contract-v1.json');
const providerRegistry = read('content/professional/profile/registries/external-profile-provider-registry-v1.json');
const instrument = read('content/professional/profile/assessment/self-assessment-instrument-v2.json');
const scoringContract = read('content/professional/profile/assessment/self-assessment-scoring-contract-v1.json');
const reasoningContract = read('content/professional/profile/reasoning/reasoning-task-performance-contract-v1.json');
const signalContract = read('content/professional/profile/contracts/profile-signal-envelope-contract-v1.json');
const externalFixture = read('content/professional/profile/fixtures/external-profile-import-fixture-v1.json');
const assessmentFixture = read('content/professional/profile/fixtures/self-assessment-response-fixture-v2.json');
const reasoningFixture = read('content/professional/profile/fixtures/reasoning-task-performance-fixture-v1.json');
const acceptance = read('content/professional/profile/acceptance/profile-prf-w0-w6-machine-acceptance-v1.json');

if (run('A0') || run('W0')) {
  assert.equal(reconciliation.baselineCommit, BASE);
  assert.equal(reconciliation.status, 'RECONCILED_FOR_PRF_REL_SUCCESSOR');
  for (const method of ['ECR','AST','BZR','ZWR','NUM']) {
    assert.equal(reconciliation.methods[method].state, 'CUSTOMER_PUBLISHABLE', method);
    assert.equal(reconciliation.methods[method].customerPublishable, true, method);
  }
  const methodFreeze = read('content/professional/method-full-production-recovery/method-r2-pre-current-reality-freeze-v1.json');
  for (const method of ['ECR','AST','BZR','ZWR','NUM']) assert.equal(methodFreeze.methods[method].state, 'CUSTOMER_PUBLISHABLE', method);
  const hdCutover = read('content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3/production/HD-PRO-R3-W25-production-cutover-v1.json');
  assert.equal(hdCutover.status, 'CUSTOMER_PUBLISHED');
  assert.equal(hdCutover.boundaries.phiosHumanDesignCalculationAuthorityCreated, false);
  assert.equal(hdCutover.boundaries.dualChartRelationshipAuthorityCreated, false);
  assert.equal(reconciliation.methods.HD.customerPublishable, true);
  assert.equal(reconciliation.methods.HD.calculationAuthorityCreated, false);
  assert.equal(reconciliation.methods.HD.dualChartRelationshipAuthorityCreated, false);
  for (const code of ['PRF_EXTERNAL_PROFILE','PRF_SELF_ASSESSMENT','PRF_REASONING_TASKS']) assert.equal(reconciliation.profileAuthorities[code].customerPublishable, false, code);

  assert.equal(sourceContract.baselineCommit, BASE);
  assert.equal(sourceContract.schemaVersion, 'PHI-OS-PROFILE-SOURCE-CLASS-v1.0.0');
  assert.deepEqual(sourceContract.sourceClasses, PROFILE_SOURCE_CLASSES);
  assert.equal(sourceContract.requirements.everyProfileSignalCarriesSourceClass, true);
  assert.equal(sourceContract.requirements.evidenceClassesMayBeFlattened, false);
  assert.equal(sourceContract.requirements.sourceProvenancePreserved, true);
  assert.equal(sourceContract.forbiddenConversions.length, 4);
  console.log('✓ PRF-W0 source-class contract + A0 authority reconciliation passed.');
}

let externalProfile;
if (run('W1') || MODE === 'ALL') {
  assert.equal(externalContract.baselineCommit, BASE);
  assert.equal(externalContract.runtimeSchema, 'PHI-OS-EXTERNAL-PROFILE-INPUT-v1');
  assert.deepEqual(externalContract.providerFamilies, EXTERNAL_PROFILE_PROVIDER_FAMILIES);
  assert.equal(externalContract.rules.officialMbtiEquals16pNeris, false);
  assert.equal(externalContract.rules.proprietaryItemBankReproduction, false);
  mustThrow(() => normalizeExternalProfileInput({...externalFixture, consent:false}, providerRegistry), 'EXTERNAL_PROFILE_EXPLICIT_CONSENT_REQUIRED');
  mustThrow(() => normalizeExternalProfileInput({...externalFixture, purpose:'WRONG'}, providerRegistry), 'EXTERNAL_PROFILE_PURPOSE_REQUIRED');
  mustThrow(() => normalizeExternalProfileInput({...externalFixture, customerConfirmed:false}, providerRegistry), 'EXTERNAL_PROFILE_CUSTOMER_CONFIRMATION_REQUIRED');
  externalProfile = normalizeExternalProfileInput(externalFixture, providerRegistry);
  assert.equal(externalProfile.schemaVersion, 'PHI-OS-EXTERNAL-PROFILE-INPUT-v1');
  assert.equal(externalProfile.providerFamily, '16P_NERIS');
  assert.notEqual(externalProfile.providerFamily, 'MBTI_OFFICIAL');
  assert.equal(externalProfile.sourceClass, 'EXTERNAL_PROFILE_RESULT');
  assert.equal(externalProfile.governance.proprietaryItemBankReproduced, false);
  assert.equal(externalProfile.governance.phiOsProviderRescoringPerformed, false);
  assert.equal(externalProfile.governance.providerFamilyEquivalenceAssumed, false);
  console.log('✓ PRF-W1 external Profile import preserves provider identity and explicit customer provenance.');
}

if (run('W2') || MODE === 'ALL') {
  assert.equal(providerRegistry.baselineCommit, BASE);
  assert.equal(providerRegistry.schemaVersion, 'PHI-OS-EXTERNAL-PROFILE-PROVIDER-REGISTRY-v1.0.0');
  assert.deepEqual(providerRegistry.providers.map(item => item.providerFamily), EXTERNAL_PROFILE_PROVIDER_FAMILIES);
  assert.equal(new Set(providerRegistry.providers.map(item => item.providerFamily)).size, EXTERNAL_PROFILE_PROVIDER_FAMILIES.length);
  for (const provider of providerRegistry.providers) {
    assert.equal(provider.manualResultImportAllowed, true, provider.providerFamily);
    assert.equal(provider.firstPartyAssessmentAllowed, false, provider.providerFamily);
    assert.equal(provider.itemBankReproductionAllowed, false, provider.providerFamily);
    assert.equal(provider.relationshipComparisonAllowed, false, provider.providerFamily);
    assert.equal(provider.sourceDisclosureRequired, true, provider.providerFamily);
    assert.equal(provider.customerAvailability, 'FOUNDATION_ONLY_NOT_PUBLISHED_UNTIL_PRF_W12', provider.providerFamily);
  }
  assert.equal(providerRegistry.failClosed.itemReproduction, 'NOT_ALLOWED');
  assert.equal(providerRegistry.failClosed.phiOsScoring, 'NOT_ALLOWED');
  assert.equal(providerRegistry.failClosed.relationshipComparison, 'NOT_ALLOWED_UNTIL_PRF_W9');
  console.log('✓ PRF-W2 provider capability registry fails closed on testing, scoring and relationship comparison.');
}

if (run('W3') || MODE === 'ALL') {
  assert.equal(instrument.baselineCommit, BASE);
  assert.equal(instrument.schemaVersion, 'PHI-OS-SELF-ASSESSMENT-INSTRUMENT-v2.0.0');
  assert.equal(instrument.instrumentClass, 'CUSTOMER_SELF_REPORT');
  assert.equal(instrument.diagnosticInstrument, false);
  assert.equal(instrument.normedInstrument, false);
  assert.equal(instrument.domains.length, 6);
  assert.equal(instrument.items.length, 30);
  assert.equal(new Set(instrument.items.map(item => `${item.domainId}.${item.facetId}`)).size, 30);
  for (const domain of instrument.domains) assert.equal(domain.facets.length, 5, domain.domainId);
  for (const item of instrument.items) {
    assert.equal(item.sourceClass, 'CUSTOMER_SELF_REPORT', item.itemId);
    assert.equal(item.responseScale, 'LIKERT_5_SELF_REPORT', item.itemId);
    assert.deepEqual(item.locale, ['en','zh-Hans'], item.itemId);
    assert.equal(typeof item.prompt.en, 'string', item.itemId);
    assert.equal(typeof item.prompt['zh-Hans'], 'string', item.itemId);
    assert.doesNotMatch(`${item.domainId} ${item.facetId} ${item.prompt.en} ${item.prompt['zh-Hans']}`, /\b(?:IQ|EQ|AQ|HQ|FQ|SQ)\b|Energy Frequency|能量频率/i, item.itemId);
  }
  assert.equal(instrument.boundaries.energyFrequencyScoringRetired, true);
  assert.equal(instrument.boundaries.objectivePersonalityFactCreated, false);
  assert.equal(instrument.boundaries.medicalOrMentalHealthDiagnosisCreated, false);
  assert.equal(instrument.boundaries.scientificPercentileCreated, false);
  console.log('✓ PRF-W3 Self-Assessment v2: 6 domains × 5 facets, bilingual and explicitly non-diagnostic.');
}

let assessmentResult;
if (run('W4') || MODE === 'ALL') {
  assert.equal(scoringContract.baselineCommit, BASE);
  assert.equal(scoringContract.outputSchema, 'PHI-OS-SELF-ASSESSMENT-RESULT-IR-v1');
  assert.equal(scoringContract.inputConsent.explicitConsentRequired, true);
  assert.equal(scoringContract.inputConsent.sensitiveItemConsentRequiredWhenAnswered, true);
  mustThrow(() => scoreSelfAssessment({instrument,responses:{'PHI-SA2-01-01':3},participantRef:'PERSON-A',assessmentDate:'2026-09-01',purpose:SELF_ASSESSMENT_PURPOSE}), 'SELF_ASSESSMENT_EXPLICIT_CONSENT_REQUIRED');
  mustThrow(() => scoreSelfAssessment({instrument,responses:{'PHI-SA2-01-01':3},participantRef:'PERSON-A',assessmentDate:'2026-09-01',consent:true,purpose:'WRONG'}), 'SELF_ASSESSMENT_PURPOSE_REQUIRED');
  mustThrow(() => scoreSelfAssessment({instrument,responses:{'PHI-SA2-04-01':3},participantRef:'PERSON-A',assessmentDate:'2026-09-01',consent:true,purpose:SELF_ASSESSMENT_PURPOSE}), 'SELF_ASSESSMENT_SENSITIVE_CONSENT_REQUIRED');
  mustThrow(() => scoreSelfAssessment({instrument,responses:{'PHI-SA2-01-01':6},participantRef:'PERSON-A',assessmentDate:'2026-09-01',consent:true,purpose:SELF_ASSESSMENT_PURPOSE}), 'SELF_ASSESSMENT_RESPONSE_OUT_OF_RANGE');
  assessmentResult = scoreSelfAssessment({ instrument, ...assessmentFixture });
  assert.equal(assessmentResult.schemaVersion, 'PHI-OS-SELF-ASSESSMENT-RESULT-IR-v1');
  assert.equal(assessmentResult.sourceClass, 'CUSTOMER_SELF_REPORT');
  assert.equal(assessmentResult.purpose, SELF_ASSESSMENT_PURPOSE);
  assert.equal(assessmentResult.consent, true);
  assert.equal(assessmentResult.sensitiveConsent, true);
  assert.equal(assessmentResult.sensitiveResponseCount, 10);
  assert.equal(assessmentResult.governance.explicitConsentCaptured, true);
  assert.equal(assessmentResult.governance.sensitiveConsentCapturedIfRequired, true);
  assert.equal(assessmentResult.governance.automaticPersistence, false);
  assert.equal(assessmentResult.responseCompleteness.answered, 30);
  assert.equal(assessmentResult.responseCompleteness.total, 30);
  assert.equal(assessmentResult.responseCompleteness.ratio, 1);
  assert.equal(Object.keys(assessmentResult.domainRawScore).length, 6);
  assert.equal(Object.keys(assessmentResult.facetRawScore).length, 30);
  assert.ok(assessmentResult.normalizedSelfReportIndex.overall >= 0 && assessmentResult.normalizedSelfReportIndex.overall <= 100);
  assert.equal(assessmentResult.governance.objectivePersonalityFactCreated, false);
  assert.equal(assessmentResult.governance.diagnosisCreated, false);
  assert.equal(assessmentResult.governance.scientificPercentileCreated, false);
  assert.equal(assessmentResult.governance.quotientLabelCreated, false);
  assert.doesNotMatch(JSON.stringify(assessmentResult), /"IQ"|"EQ"|clinical resilience|objective health|scientific percentile/i);
  console.log('✓ PRF-W4 scoring requires explicit/sensitive consent and produces bounded self-report indices — no quotient or diagnosis.');
}

let reasoningPerformance;
if (run('W5') || MODE === 'ALL') {
  assert.equal(reasoningContract.baselineCommit, BASE);
  assert.equal(reasoningContract.status, 'FOUNDATION_CONTRACT_NO_PRODUCTION_TASK_BANK');
  assert.equal(reasoningContract.productionTaskBank.state, 'NOT_ADMITTED');
  assert.equal(reasoningContract.productionTaskBank.historicalUnidentifiedPuzzleReuseAllowed, false);
  assert.deepEqual(reasoningContract.taskFamilies, REASONING_TASK_FAMILIES);
  mustThrow(() => normalizeReasoningTaskPerformance({...reasoningFixture, taskBankAuthority:{status:'NOT_ADMITTED',sourceRef:'NO',version:'0'}}), 'REASONING_TASK_ADMITTED_TASK_BANK_REQUIRED');
  mustThrow(() => normalizeReasoningTaskPerformance(reasoningFixture), 'REASONING_TASK_ADMITTED_TASK_BANK_REQUIRED');
  reasoningPerformance = normalizeReasoningTaskPerformance({...reasoningFixture, fixtureMode:true});
  assert.equal(reasoningPerformance.schemaVersion, 'PHI-OS-REASONING-TASK-PERFORMANCE-v1');
  assert.equal(reasoningPerformance.sourceClass, 'MEASURED_TASK_PERFORMANCE');
  assert.equal(reasoningPerformance.rawAttempted, 3);
  assert.equal(reasoningPerformance.rawCorrect, 2);
  assert.equal(reasoningPerformance.governance.rawPerformanceIsIq, false);
  assert.equal(reasoningPerformance.governance.percentileCreated, false);
  assert.equal(reasoningPerformance.governance.cognitiveDiagnosisCreated, false);
  assert.equal(reasoningPerformance.governance.selfRatedCognitiveProfileMerged, false);
  console.log('✓ PRF-W5 reasoning-task contract is separate, raw-only and closed until an original/admitted production task bank exists.');
}

if (run('W6') || MODE === 'ALL') {
  assert.equal(signalContract.baselineCommit, BASE);
  assert.equal(signalContract.runtimeSchema, 'PHI-OS-PROFILE-SIGNAL-ENVELOPE-v1');
  if (!externalProfile) externalProfile = normalizeExternalProfileInput(externalFixture, providerRegistry);
  if (!assessmentResult) assessmentResult = scoreSelfAssessment({ instrument, ...assessmentFixture });
  if (!reasoningPerformance) reasoningPerformance = normalizeReasoningTaskPerformance({...reasoningFixture, fixtureMode:true});

  const selfSignals = await buildSelfAssessmentProfileSignals(assessmentResult);
  const externalSignals = await buildExternalProfileSignals(externalProfile);
  const reasoningSignals = await buildReasoningPerformanceSignals(reasoningPerformance);
  assert.equal(selfSignals.length, 6);
  assert.equal(externalSignals.length, Object.keys(externalProfile.resultDimensions).length);
  assert.equal(reasoningSignals.length, 3);
  assert.ok(selfSignals.every(item => item.sourceClass === 'CUSTOMER_SELF_REPORT'));
  assert.ok(externalSignals.every(item => item.sourceClass === 'EXTERNAL_PROFILE_RESULT'));
  assert.ok(reasoningSignals.every(item => item.sourceClass === 'MEASURED_TASK_PERFORMANCE'));
  assert.ok(externalSignals.every(item => item.providerFamily === '16P_NERIS'));
  assert.ok(reasoningSignals.every(item => item.precisionBoundary.includes('NOT_IQ')));
  for (const item of [...selfSignals, ...externalSignals, ...reasoningSignals]) {
    assert.equal(item.schemaVersion, 'PHI-OS-PROFILE-SIGNAL-ENVELOPE-v1');
    assert.match(item.profileSignalId, /^PRF-SIG-[A-F0-9]{24}$/);
    assert.match(item.semanticDigest, /^[a-f0-9]{64}$/);
    assert.equal(item.governance.commonTranslationEnvelopeOnly, true);
    assert.equal(item.governance.newPersonalityTruthAuthorityCreated, false);
    assert.equal(item.governance.sourceClassErased, false);
    assert.equal(item.governance.crossSourceProofCreated, false);
    assert.equal(item.governance.customerPublishableBeforePrfW12, false);
  }

  const deterministicInput = {
    participantRef:'PERSON-A',sourceClass:'CUSTOMER_SELF_REPORT',sourceRef:'TEST-SOURCE',domainId:'TEST_DOMAIN',facetId:'TEST_FACET',
    value:72,valueType:'NUMBER',confidence:'SELF_REPORTED',assessmentDate:'2026-09-01',customerConfirmed:true,
    precisionBoundary:['SELF_REPORTED_ONLY'],provenance:[{source:'TEST-SOURCE'}]
  };
  const a = await buildProfileSignalEnvelope(deterministicInput);
  const b = await buildProfileSignalEnvelope(JSON.parse(JSON.stringify(deterministicInput)));
  assert.equal(a.semanticDigest, b.semanticDigest);
  assert.equal(a.profileSignalId, b.profileSignalId);
  assert.equal(stableProfileSnapshot(a), stableProfileSnapshot(b));
  assert.notEqual(selfSignals[0].sourceClass, reasoningSignals[0].sourceClass);
  assert.notEqual(externalSignals[0].sourceClass, selfSignals[0].sourceClass);
  console.log(`✓ PRF-W6 canonical ProfileSignalEnvelope passed: ${selfSignals.length + externalSignals.length + reasoningSignals.length} fixture signals preserve source class + deterministic lineage.`);
}

if (MODE === 'ALL') {
  assert.equal(acceptance.baselineCommit, BASE);
  assert.equal(acceptance.status, 'FOUNDATION_MACHINE_VERIFIED');
  assert.equal(acceptance.customerPublication.allowed, false);
  assert.equal(acceptance.customerPublication.nextRequiredGate, 'PRF-W12');
  assert.equal(acceptance.boundaries.noProfileTruthAuthority, true);
  assert.equal(acceptance.boundaries.noDiagnosticAuthority, true);
  assert.equal(acceptance.boundaries.noProductionReasoningTaskBank, true);
  assert.equal(acceptance.boundaries.explicitSelfAssessmentConsentRequired, true);
  assert.equal(acceptance.boundaries.sensitiveSelfAssessmentConsentRequired, true);
  assert.match(text('functions/profile/profile-foundation-runtime.js'), /commonTranslationEnvelopeOnly/);
  console.log('✓ PRF-W0–W6 Profile foundation machine gate passed. Customer publication remains closed until PRF-W12.');
}
