import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildProfileSignalEnvelope,
  PROFILE_SIGNAL_SCHEMA
} from '../functions/profile/profile-foundation-runtime.js';
import {
  buildProfileCurrentRealityCorrelation,
  buildCrossSourcePerspective,
  buildRelationshipProfileEvidence,
  assertAcademicBridgeRegistry,
  stableProfileContextSnapshot,
  PROFILE_REALITY_CORRELATION_SCHEMA,
  CROSS_SOURCE_PERSPECTIVE_SCHEMA,
  RELATIONSHIP_PROFILE_EVIDENCE_SCHEMA,
  PROFILE_REALITY_STATES,
  CROSS_SOURCE_GROUPS,
  RELATIONSHIP_PROFILE_CLASSES
} from '../functions/profile/profile-context-runtime.js';
import {
  normalizePersonalCurrentRealityInput,
  canonicalizeCurrentRealityObservations
} from '../functions/current-reality/personal-current-reality-runtime.js';
import { normalizeRelationshipIntent } from '../functions/personal-reading/relationship/relationship-intent.js';

const BASE = 'fc9616b9f63ed4099e008a9395ad4d167bfa597e';
const MODE = String(process.argv[2] || 'ALL').toUpperCase();
const run = label => MODE === 'ALL' || MODE === label;
const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const text = path => fs.readFileSync(path, 'utf8');

const w7Contract = read('content/professional/profile/current-reality/contracts/profile-current-reality-correlation-contract-v1.json');
const w8Contract = read('content/professional/profile/cross-source/contracts/cross-source-perspective-contract-v1.json');
const crossSourceRegistry = read('content/professional/profile/cross-source/registries/cross-source-translation-rule-registry-v1.json');
const w9Contract = read('content/professional/profile/relationship/contracts/relationship-profile-evidence-contract-v1.json');
const relationshipRuleRegistry = read('content/professional/profile/relationship/registries/relationship-profile-comparison-rule-registry-v1.json');
const academicRegistry = read('content/professional/profile/academic/registries/academic-bridge-registry-v1.json');
const fixture = read('content/professional/profile/fixtures/profile-prf-w7-w10-fixture-v1.json');
const acceptance = read('content/professional/profile/acceptance/profile-prf-w7-w10-machine-acceptance-v1.json');

function mustThrow(fn, code) {
  let caught = null;
  try { fn(); } catch (error) { caught = error; }
  assert.ok(caught, `Expected ${code} to be thrown`);
  assert.equal(caught.code, code);
}
async function mustReject(fn, code) {
  let caught = null;
  try { await fn(); } catch (error) { caught = error; }
  assert.ok(caught, `Expected ${code} to be rejected`);
  assert.equal(caught.code, code);
}

async function signal(input) {
  const out = await buildProfileSignalEnvelope(input);
  assert.equal(out.schemaVersion, PROFILE_SIGNAL_SCHEMA);
  return out;
}

const common = {
  assessmentDate: '2026-08-20',
  customerConfirmed: true,
  precisionBoundary: ['BOUNDED_PROFILE_SIGNAL'],
  provenance: [{ source: 'PRF-W7-W10-FIXTURE' }]
};

const selfA = await signal({
  ...common,
  participantRef: fixture.participantARef,
  sourceClass: 'CUSTOMER_SELF_REPORT',
  sourceRef: 'PHI-SA2-RESULT-PERSON-A',
  domainId: 'COGNITIVE_NAVIGATION',
  value: 74,
  valueType: 'NUMBER',
  confidence: 'CUSTOMER_CONFIRMED'
});
const selfB = await signal({
  ...common,
  participantRef: fixture.participantBRef,
  sourceClass: 'CUSTOMER_SELF_REPORT',
  sourceRef: 'PHI-SA2-RESULT-PERSON-B',
  domainId: 'COGNITIVE_NAVIGATION',
  value: 46,
  valueType: 'NUMBER',
  confidence: 'CUSTOMER_CONFIRMED'
});
const externalA = await signal({
  ...common,
  participantRef: fixture.participantARef,
  sourceClass: 'EXTERNAL_PROFILE_RESULT',
  sourceRef: 'EXT-16P-A',
  providerFamily: '16P_NERIS',
  domainId: 'EXTERNAL_PROFILE::16P_NERIS::E_I',
  value: { label: 'E', value: 62 },
  valueType: 'OBJECT',
  confidence: 'EXTERNAL_RESULT_CONFIRMED'
});
const externalB = await signal({
  ...common,
  participantRef: fixture.participantBRef,
  sourceClass: 'EXTERNAL_PROFILE_RESULT',
  sourceRef: 'EXT-16P-B',
  providerFamily: '16P_NERIS',
  domainId: 'EXTERNAL_PROFILE::16P_NERIS::E_I',
  value: { label: 'I', value: 58 },
  valueType: 'OBJECT',
  confidence: 'EXTERNAL_RESULT_CONFIRMED'
});
const reasoningA = await signal({
  participantRef: fixture.participantARef,
  sourceClass: 'MEASURED_TASK_PERFORMANCE',
  sourceRef: 'PRF-REASON-PERSON-A',
  domainId: 'REASONING_TASK_PERFORMANCE',
  facetId: 'PATTERN_COMPLETION',
  value: { rawCorrect: 4, rawAttempted: 5, rawAccuracy: 0.8 },
  valueType: 'OBJECT',
  confidence: 'TASK_OBSERVED',
  assessmentDate: '2026-09-01',
  customerConfirmed: true,
  precisionBoundary: ['RAW_TASK_PERFORMANCE_ONLY', 'NOT_IQ', 'NOT_PERCENTILE'],
  provenance: [{ source: 'ORIGINAL-FIXTURE-TASK-BANK' }]
});
const reasoningB = await signal({
  participantRef: fixture.participantBRef,
  sourceClass: 'MEASURED_TASK_PERFORMANCE',
  sourceRef: 'PRF-REASON-PERSON-B',
  domainId: 'REASONING_TASK_PERFORMANCE',
  facetId: 'PATTERN_COMPLETION',
  value: { rawCorrect: 3, rawAttempted: 5, rawAccuracy: 0.6 },
  valueType: 'OBJECT',
  confidence: 'TASK_OBSERVED',
  assessmentDate: '2026-09-01',
  customerConfirmed: true,
  precisionBoundary: ['RAW_TASK_PERFORMANCE_ONLY', 'NOT_IQ', 'NOT_PERCENTILE'],
  provenance: [{ source: 'ORIGINAL-FIXTURE-TASK-BANK' }]
});
const symbolicA = await signal({
  participantRef: fixture.participantARef,
  sourceClass: 'SYMBOLIC_INTERPRETATION',
  sourceRef: 'ACCEPTED-METHOD-CLAIM-A-001',
  domainId: 'COGNITIVE_NAVIGATION',
  value: 'A governed symbolic perspective highlights a deliberate decision rhythm.',
  valueType: 'TEXT',
  confidence: 'UNKNOWN',
  assessmentDate: null,
  customerConfirmed: false,
  precisionBoundary: ['SYMBOLIC_INTERPRETATION_ONLY', 'NOT_EMPIRICAL_MEASUREMENT'],
  provenance: [{ source: 'ACCEPTED-METHOD-CLAIM-A-001' }]
});

let realityIr;
let w7Result;
if (run('W7')) {
  assert.equal(w7Contract.baselineCommit, BASE);
  assert.equal(w7Contract.runtimeSchema, PROFILE_REALITY_CORRELATION_SCHEMA);
  assert.deepEqual(w7Contract.allowedStates, PROFILE_REALITY_STATES);
  assert.equal(w7Contract.rules.automaticSemanticMatching, false);
  assert.equal(w7Contract.rules.currentRealityProvesProfileModel, false);
  assert.equal(w7Contract.rules.oldResultMaySilentlyPresentAsCurrent, false);

  const currentInput = normalizePersonalCurrentRealityInput(fixture.currentRealityInput, 'en');
  realityIr = canonicalizeCurrentRealityObservations(currentInput);
  w7Result = await buildProfileCurrentRealityCorrelation({
    profileSignals: [selfA, externalA, symbolicA],
    currentRealityIr: realityIr,
    asOfDate: fixture.asOfDate,
    responses: [
      { profileSignalId: selfA.profileSignalId, state: 'PARTIALLY_RESONANT', observationRefs: ['CR-OBS-01'], customerNote: 'This is present, but not in every decision.' },
      { profileSignalId: symbolicA.profileSignalId, state: 'CURRENTLY_NOT_RESONANT', observationRefs: ['CR-OBS-01'], customerNote: 'This does not describe the current decision process.' }
    ]
  });
  assert.equal(w7Result.schemaVersion, PROFILE_REALITY_CORRELATION_SCHEMA);
  assert.equal(w7Result.participantRef, fixture.participantARef);
  assert.equal(w7Result.correlations.length, 3);
  assert.equal(w7Result.correlations.find(item => item.profileSignalRef === externalA.profileSignalId).state, 'OPEN');
  assert.equal(w7Result.correlations.find(item => item.profileSignalRef === selfA.profileSignalId).freshness.assessmentDate, '2026-08-20');
  assert.equal(w7Result.correlations.find(item => item.profileSignalRef === selfA.profileSignalId).freshness.dateDisclosureRequired, true);
  assert.equal(w7Result.governance.automaticSemanticMatching, false);
  assert.equal(w7Result.governance.profileModelTruthConversionAllowed, false);
  assert.ok(w7Result.correlations.every(item => item.governance.currentRealityProvesProfileModel === false));
  assert.ok(w7Result.correlations.every(item => item.governance.profileSignalRewritten === false));
  await mustReject(() => buildProfileCurrentRealityCorrelation({profileSignals:[selfA],currentRealityIr:realityIr,responses:[{profileSignalId:selfA.profileSignalId,state:'CURRENTLY_RESONANT',observationRefs:['MISSING']}]}), 'PROFILE_REALITY_OBSERVATION_REF_UNKNOWN');
  await mustReject(() => buildProfileCurrentRealityCorrelation({profileSignals:[selfA,selfB],currentRealityIr:realityIr,responses:[]}), 'PROFILE_REALITY_SINGLE_PARTICIPANT_SCOPE_REQUIRED');
  console.log('✓ PRF-W7 Profile × Current Reality correlation passed: explicit customer comparison, open-by-default, date disclosed, no truth conversion.');
}

let w8Result;
if (run('W8')) {
  assert.equal(w8Contract.baselineCommit, BASE);
  assert.equal(w8Contract.runtimeSchema, CROSS_SOURCE_PERSPECTIVE_SCHEMA);
  assert.deepEqual(w8Contract.outputGroups, CROSS_SOURCE_GROUPS);
  assert.equal(w8Contract.rules.automaticSemanticMatching, false);
  assert.equal(w8Contract.rules.symbolicConvergenceMayCreateScientificValidation, false);
  assert.equal(crossSourceRegistry.status, 'FOUNDATION_ADMITTED_MACHINE_ONLY');
  assert.ok(crossSourceRegistry.rules.every(rule => rule.status === 'ADMITTED' && rule.automaticSemanticMatching === false && rule.truthConversionAllowed === false));

  if (!realityIr) realityIr = canonicalizeCurrentRealityObservations(normalizePersonalCurrentRealityInput(fixture.currentRealityInput, 'en'));
  if (!w7Result) w7Result = await buildProfileCurrentRealityCorrelation({
    profileSignals: [selfA, externalA, symbolicA],
    currentRealityIr: realityIr,
    asOfDate: fixture.asOfDate,
    responses: [
      { profileSignalId: selfA.profileSignalId, state: 'PARTIALLY_RESONANT', observationRefs: ['CR-OBS-01'] },
      { profileSignalId: symbolicA.profileSignalId, state: 'CURRENTLY_NOT_RESONANT', observationRefs: ['CR-OBS-01'] }
    ]
  });
  const selfRealityRef = w7Result.correlations.find(item => item.profileSignalRef === selfA.profileSignalId).correlationId;
  const symbolicRealityRef = w7Result.correlations.find(item => item.profileSignalRef === symbolicA.profileSignalId).correlationId;
  w8Result = await buildCrossSourcePerspective({
    profileSignals: [selfA, externalA, symbolicA],
    profileRealityCorrelation: w7Result,
    translationRuleRegistry: crossSourceRegistry,
    comparisons: [
      {
        ruleId: 'PRF-XSR-PARALLEL-SOURCE-COMPARISON-v1',
        group: 'SOURCE_COMPLEMENTARY',
        topicId: 'SOCIAL_ENERGY',
        signalRefs: [selfA.profileSignalId, externalA.profileSignalId],
        realityCorrelationRefs: [],
        explicitComparison: true,
        statement: 'The self-assessment and imported external profile describe different but potentially complementary aspects of how this person approaches social and cognitive demands.'
      },
      {
        ruleId: 'PRF-XSR-PARALLEL-SOURCE-COMPARISON-v1',
        group: 'SOURCE_TENSION',
        topicId: 'DECISION_STYLE',
        signalRefs: [selfA.profileSignalId, symbolicA.profileSignalId],
        realityCorrelationRefs: [],
        explicitComparison: true,
        statement: 'The self-reported cognitive-navigation signal and the governed symbolic perspective do not point in exactly the same direction, so the tension remains visible.'
      },
      {
        ruleId: 'PRF-XSR-CURRENT-REALITY-CONTEXT-v1',
        group: 'CURRENTLY_SUPPORTED',
        topicId: 'CURRENT_DECISION_CONTEXT',
        signalRefs: [selfA.profileSignalId],
        realityCorrelationRefs: [selfRealityRef],
        explicitComparison: true,
        statement: 'Current Reality partially supports this self-reported signal in the active decision context.'
      },
      {
        ruleId: 'PRF-XSR-CURRENT-REALITY-CONTEXT-v1',
        group: 'CURRENTLY_CONTRADICTED',
        topicId: 'CURRENT_DECISION_CONTEXT',
        signalRefs: [symbolicA.profileSignalId],
        realityCorrelationRefs: [symbolicRealityRef],
        explicitComparison: true,
        statement: 'Current Reality currently contradicts this symbolic interpretation in the active decision context.'
      }
    ]
  });
  assert.equal(w8Result.schemaVersion, CROSS_SOURCE_PERSPECTIVE_SCHEMA);
  assert.equal(w8Result.perspectives.length, 4);
  assert.ok(w8Result.perspectives.every(item => item.governance.sourceClassesPreserved === true));
  assert.ok(w8Result.perspectives.every(item => item.governance.scientificValidationCreated === false));
  assert.ok(w8Result.perspectives.every(item => item.governance.consensusTruthCreated === false));
  assert.ok(w8Result.perspectives.some(item => item.sourceClasses.includes('SYMBOLIC_INTERPRETATION') && item.sourceClasses.includes('CUSTOMER_SELF_REPORT')));
  assert.equal(w8Result.groupIndex.SOURCE_CONTRADICTION.length, 0);
  await mustReject(() => buildCrossSourcePerspective({profileSignals:[selfA],comparisons:[{ruleId:'MISSING',group:'OPEN',topicId:'X',signalRefs:[selfA.profileSignalId],explicitComparison:true,statement:'Open.'}],translationRuleRegistry:crossSourceRegistry}), 'PRF_W8_RULE_NOT_FOUND');
  await mustReject(() => buildCrossSourcePerspective({profileSignals:[selfA],comparisons:[{ruleId:'PRF-XSR-PARALLEL-SOURCE-COMPARISON-v1',group:'SOURCE_ALIGNED',topicId:'X',signalRefs:[selfA.profileSignalId],explicitComparison:true,statement:'Aligned.'}],translationRuleRegistry:crossSourceRegistry}), 'PRF_W8_SOURCE_GROUP_REQUIRES_TWO_SIGNALS');
  console.log('✓ PRF-W8 Cross-Source Perspective passed: explicit admitted rules, source classes preserved, disagreement/open retained, no scientific-validation conversion.');
}

let w9Result;
if (run('W9')) {
  assert.equal(w9Contract.baselineCommit, BASE);
  assert.equal(w9Contract.runtimeSchema, RELATIONSHIP_PROFILE_EVIDENCE_SCHEMA);
  assert.deepEqual(w9Contract.allowedOutputs, RELATIONSHIP_PROFILE_CLASSES);
  assert.equal(w9Contract.mustNotBecome, 'REL-W4_METHOD_COMPOSITION');
  assert.equal(w9Contract.rules.compatibilityPercentageAllowed, false);
  assert.equal(w9Contract.rules.partnerHiddenStateInferenceAllowed, false);
  assert.ok(relationshipRuleRegistry.rules.every(rule => rule.status === 'ADMITTED' && rule.requiresExplicitComparison === true));

  const relationshipIntent = normalizeRelationshipIntent(fixture.relationshipIntent);
  w9Result = await buildRelationshipProfileEvidence({
    relationshipIntent,
    participantARef: fixture.participantARef,
    participantBRef: fixture.participantBRef,
    profileSignals: [selfA, selfB, externalA, externalB, reasoningA, reasoningB],
    comparisonRuleRegistry: relationshipRuleRegistry,
    comparisons: [
      {
        ruleId: 'PRF-REL-SELF-REPORT-SAME-DOMAIN-v1',
        comparisonClass: 'DIFFERENT_SELF_REPORTED_TENDENCY',
        signalARef: selfA.profileSignalId,
        signalBRef: selfB.profileSignalId,
        topicId: 'COGNITIVE_NAVIGATION',
        explicitComparison: true,
        statement: 'A and B currently describe their cognitive-navigation tendency differently; this is a comparison target rather than a compatibility verdict.'
      },
      {
        ruleId: 'PRF-REL-EXTERNAL-SAME-PROVIDER-DIMENSION-v1',
        comparisonClass: 'COMPLEMENTARY_PATTERN',
        signalARef: externalA.profileSignalId,
        signalBRef: externalB.profileSignalId,
        topicId: '16P_NERIS_E_I',
        explicitComparison: true,
        statement: 'The same imported provider dimension points to different reported orientations that may be useful to observe when sharing social load.'
      },
      {
        ruleId: 'PRF-REL-REASONING-SAME-TASK-FAMILY-CONTEXT-v1',
        comparisonClass: 'COMMUNICATION_OBSERVATION_TARGET',
        signalARef: reasoningA.profileSignalId,
        signalBRef: reasoningB.profileSignalId,
        topicId: 'PATTERN_COMPLETION',
        explicitComparison: true,
        statement: 'The raw task-family results differ, so communication about pace and reasoning steps is an observation target only.'
      }
    ]
  });
  assert.equal(w9Result.schemaVersion, RELATIONSHIP_PROFILE_EVIDENCE_SCHEMA);
  assert.equal(w9Result.evidence.length, 3);
  assert.equal(w9Result.governance.separateEvidenceLane, true);
  assert.equal(w9Result.governance.relW4MethodCompositionUntouched, true);
  assert.ok(w9Result.evidence.every(item => item.governance.compatibilityScoreCreated === false));
  assert.ok(w9Result.evidence.every(item => item.governance.partnerHiddenStateInferred === false));
  assert.ok(w9Result.evidence.every(item => item.governance.objectiveRelationshipFactCreated === false));
  assert.ok(w9Result.evidence.every(item => item.participants.A.participantRef === fixture.participantARef && item.participants.B.participantRef === fixture.participantBRef));
  await mustReject(() => buildRelationshipProfileEvidence({relationshipIntent,participantARef:fixture.participantARef,participantBRef:fixture.participantBRef,profileSignals:[selfA,externalB],comparisonRuleRegistry:relationshipRuleRegistry,comparisons:[{ruleId:'PRF-REL-SELF-REPORT-SAME-DOMAIN-v1',comparisonClass:'OPEN',signalARef:selfA.profileSignalId,signalBRef:externalB.profileSignalId,explicitComparison:true,statement:'Open.'}]}), 'PRF_W9_CROSS_SOURCE_PARTNER_COMPARISON_NOT_ADMITTED');
  await mustReject(() => buildRelationshipProfileEvidence({relationshipIntent,participantARef:fixture.participantARef,participantBRef:fixture.participantBRef,profileSignals:[selfA,selfB],comparisonRuleRegistry:relationshipRuleRegistry,comparisons:[{ruleId:'PRF-REL-SELF-REPORT-SAME-DOMAIN-v1',comparisonClass:'OPEN',signalARef:selfA.profileSignalId,signalBRef:selfB.profileSignalId,explicitComparison:true,statement:'Open.',compatibilityScore:80}]}), 'PRF_W9_PROHIBITED_RELATIONSHIP_FIELD');
  console.log('✓ PRF-W9 Relationship Profile Evidence lane passed: A/B remain distinct, admitted same-lane rules only, no REL-W4 merge, score, mind-reading or outcome prediction.');
}

if (run('W10')) {
  assert.equal(academicRegistry.baselineCommit, BASE);
  assertAcademicBridgeRegistry(academicRegistry);
  assert.deepEqual(academicRegistry.instruments.map(item => item.priority), ['P1', 'P2', 'P3', 'P4']);
  const ipip = academicRegistry.instruments.find(item => item.instrumentFamily === 'IPIP_BIG_FIVE');
  assert.equal(ipip.sourceClass, 'STANDARDIZED_SELF_REPORT');
  assert.equal(ipip.sourceRefs[0], 'https://ipip.ori.org/');
  assert.match(ipip.licenseUsageStatus, /PUBLIC_DOMAIN/);
  assert.equal(ipip.normingStatus, 'NOT_ADMITTED');
  assert.equal(ipip.firstPartyAssessmentStatus, 'INSTRUMENT_SELECTION_VALIDATION_PENDING');
  const reasoning = academicRegistry.instruments.find(item => item.priority === 'P2');
  assert.equal(reasoning.sourceClass, 'MEASURED_TASK_PERFORMANCE');
  assert.equal(reasoning.normingStatus, 'NOT_ADMITTED');
  const ria = academicRegistry.instruments.find(item => item.priority === 'P3');
  const finance = academicRegistry.instruments.find(item => item.priority === 'P4');
  assert.equal(ria.customerAvailability, 'UNAVAILABLE');
  assert.equal(finance.customerAvailability, 'UNAVAILABLE');
  assert.equal(academicRegistry.governance.p3P4OptionalAndNonBlocking, true);
  assert.equal(academicRegistry.governance.symbolicMethodsNotScientificallyValidatedByAcademicBridge, true);
  console.log('✓ PRF-W10 Academic Bridge registry passed: IPIP bridge bounded, raw reasoning separate, RIASEC/OECD successors fail closed until separate admission.');
}

if (MODE === 'ALL') {
  assert.equal(acceptance.baselineCommit, BASE);
  assert.equal(acceptance.status, 'PROFILE_CONTEXT_TRANSLATION_MACHINE_VERIFIED');
  assert.equal(acceptance.customerPublication.allowed, false);
  assert.equal(acceptance.customerPublication.nextRequiredGate, 'PRF-W12');
  assert.equal(acceptance.verifiedBoundaries.currentRealityDoesNotProveProfile, true);
  assert.equal(acceptance.verifiedBoundaries.sourceClassesPreserved, true);
  assert.equal(acceptance.verifiedBoundaries.relationshipProfileLaneSeparateFromRelW4, true);
  assert.equal(acceptance.verifiedBoundaries.academicBridgeInstrumentSpecificAdmissionRequired, true);
  assert.match(text('functions/profile/profile-context-runtime.js'), /scientificValidationCreated:\s*false/);
  assert.match(text('functions/profile/profile-context-runtime.js'), /profileEvidenceLaneSeparateFromRelW4:\s*true/);

  const snapshots = [];
  if (w7Result) snapshots.push(stableProfileContextSnapshot(w7Result));
  if (w8Result) snapshots.push(stableProfileContextSnapshot(w8Result));
  if (w9Result) snapshots.push(stableProfileContextSnapshot(w9Result));
  assert.ok(snapshots.every(value => typeof value === 'string' && value.length > 20));
  console.log('✓ PRF-W7–W10 Profile context tranche machine gate passed. Customer publication remains closed until PRF-W12 human admission + freeze.');
}
