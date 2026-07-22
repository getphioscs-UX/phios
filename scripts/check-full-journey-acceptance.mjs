import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import evaluateEntryRuleFirst from '../functions/runtime/entry/rule-entry.js';
import reconstructRuntime from '../functions/runtime/reconstruction/rule-reconstruction.js';
import readRuntimeRuleFirst from '../functions/runtime/reading/rule-reading.js';
import navigateRuntimeRuleFirst from '../functions/runtime/navigation/rule-navigation.js';
import { buildReviewContractFromNavigation } from '../functions/runtime/review/navigation-review-builder.js';
import { buildRuntimeMemoryFromReview } from '../functions/runtime/memory/review-memory-builder.js';
import { buildRealityContinuityFromMemory } from '../functions/runtime/continuity/memory-continuity-builder.js';
import { validateRealityContinuityContract } from '../functions/runtime/continuity/reality-continuity-contract.js';

const root = process.cwd();
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const acceptance = readJson('content/registry/runtime-v1-acceptance.json');
const fixtureDir = path.join(root, 'tests/fixtures/runtime-journeys');
const fixtureFiles = fs.readdirSync(fixtureDir).filter(file => file.endsWith('.json')).sort();
const fixtures = fixtureFiles.map(file => readJson(`tests/fixtures/runtime-journeys/${file}`));

assert.equal(acceptance.release, 'runtime-engine-v1.0.0');
assert.equal(acceptance.status, 'candidate');
assert.equal(acceptance.tagCreated, false, 'The release tag may only be created after deployed visual acceptance.');
assert.equal(fixtures.length, 3);
assert.deepEqual(acceptance.viewports.map(item => item.width), [360, 768, 1440]);
assert.equal(acceptance.languageScenarios.length, 4);

const pageFiles = [
  'reality-entry.html',
  'reality-reconstruction.html',
  'reality-reading.html',
  'reality-navigation.html',
  'reality-review.html',
  'my-reality.html'
];
for (const file of pageFiles) {
  assert.equal(fs.existsSync(path.join(root, file)), true, `Journey page missing: ${file}`);
  assert.match(fs.readFileSync(path.join(root, file), 'utf8'), /viewport/i, `Responsive viewport metadata missing: ${file}`);
}

function outputLanguage(scenario) {
  return scenario.ui === 'zh-Hans' ? 'zh' : 'en';
}

function inputFor(fixture, scenario, revised = false) {
  const suffix = revised ? 'revised' : '';
  if (scenario.input === 'zh') return fixture[`${suffix}ChineseInput`] || fixture.chineseInput;
  return fixture[`${suffix}EnglishInput`] || fixture.englishInput;
}

function runtimeEntry(fixture, language, observedChange) {
  return {
    schemaVersion: 'phi-os.runtime-entry.v1',
    runtimeEntityId: `entity-${fixture.id}`,
    runtimeEntryId: `entry-${fixture.id}`,
    language,
    observedChange,
    realityChange: { rawStatement: observedChange, normalizedStatement: observedChange },
    timing: { statedTiming: 'three months ago', normalizedTiming: 'three months ago', precision: 'relative' },
    knownReality: fixture.observedEvidence,
    entryEvidence: fixture.observedEvidence.map(statement => ({ statement, evidenceClass: 'observed_evidence' })),
    affectedDomains: fixture.domains.map(domain => ({ domain, role: 'connected', effect: observedChange })),
    desiredTransition: { summary: language === 'zh-Hans' ? fixture.desiredDirectionZh : fixture.desiredDirection },
    activeConstraints: fixture.unknownReality,
    emergingTension: { summary: fixture.reportedExperience[0] },
    dependencies: [{ source: fixture.observedEvidence[0], effect: fixture.observedEvidence[1], status: 'reported' }],
    evidenceBoundary: {
      observedEvidence: fixture.observedEvidence,
      reportedExperience: fixture.reportedExperience,
      interpretation: [],
      professionalAssessment: [],
      unknownReality: fixture.unknownReality
    },
    reconstructionEvidence: [
      { target: 'carrier_coordinates', statement: 'No verified physical change has been established.' },
      { target: 'carrier_signatures', statement: fixture.observedEvidence[0] },
      { target: 'experience_style', statement: fixture.reportedExperience[0] },
      { target: 'expression_style', statement: observedChange },
      { target: 'agency_style', statement: fixture.observedEvidence[1] },
      { target: 'identity_style', statement: fixture.desiredDirection }
    ]
  };
}

function completeReview(review, fixture) {
  return {
    ...review,
    status: 'completed',
    customerReport: {
      ...review.customerReport,
      pathStatus: 'completed',
      startedAt: '2026-07-01T00:00:00.000Z',
      reviewedAt: '2026-07-08T00:00:00.000Z',
      observedChanges: [fixture.observedEvidence[0]],
      noObservedChange: [],
      unexpectedReality: [],
      difficulties: [],
      customerNotes: 'Fixture acceptance report.',
      evidenceClass: 'reported_experience'
    },
    observedEvidence: [fixture.observedEvidence[0]],
    runtimeDrift: {
      status: 'no_material_drift',
      observations: [],
      interpretation: null,
      automaticDetection: false
    },
    reviewOutcome: {
      status: 'assessed',
      nextRuntimeState: fixture.nextRuntimeState,
      reasons: ['Fixture acceptance selection'],
      userChoiceRequired: true,
      userSelected: true,
      automaticSelection: false
    }
  };
}

let journeyCases = 0;
for (const fixture of fixtures) {
  for (const scenario of acceptance.languageScenarios) {
    const initialInput = inputFor(fixture, scenario);
    const revisedInput = inputFor(fixture, scenario, true);
    const lang = outputLanguage(scenario);

    const entry = evaluateEntryRuleFirst({
      conversation: [{ role: 'user', content: initialInput }],
      entryRound: 1,
      language: lang,
      evidenceDepth: 'guided',
      answerTarget: 'observed_change'
    });
    assert.equal(entry.schemaVersion, 'phi-os.runtime-entry.v1');
    assert.ok(entry.extractedFields.observedChange);

    // Return to Entry + Edit must revise the requested field without erasing history.
    const revised = evaluateEntryRuleFirst({
      conversation: [
        { role: 'user', content: initialInput },
        { role: 'user', content: revisedInput }
      ],
      entryRound: 2,
      language: lang,
      evidenceDepth: 'guided',
      mode: 'revision',
      answerTarget: 'observed_change',
      askedTargets: entry.assessment.askedTargets,
      answerBindings: [{ target: 'observed_change', content: revisedInput, revision: true }]
    });
    assert.ok(revised.extractedFields.observedChange.includes(revisedInput.slice(0, 18)));
    assert.equal(revised.assessment.entryRound, 2);

    const entryContract = runtimeEntry(fixture, scenario.ui, revisedInput);
    const reconstruction = reconstructRuntime(entryContract, { language: scenario.ui });
    assert.equal(reconstruction.schemaVersion, 'phi-os.reconstruction.v1');
    assert.ok(reconstruction.grammarStates.length >= 5);

    const readingInput = {
      schemaVersion: 'phi-os.reading-input.v1',
      runtimeEntityId: entryContract.runtimeEntityId,
      runtimeEntryId: entryContract.runtimeEntryId,
      runtimeEntry: entryContract,
      evidenceBoundary: entryContract.evidenceBoundary,
      reconstruction,
      grammarStates: reconstruction.grammarStates,
      languageContract: { locale: scenario.ui, outputLanguage: lang }
    };
    const reading = readRuntimeRuleFirst(readingInput, { outputLanguage: lang });
    assert.equal(reading.schemaVersion, 'phi-os.reality-reading.v1');
    assert.equal(reading.runtimeEntryId, entryContract.runtimeEntryId);

    const navigation = navigateRuntimeRuleFirst({
      schemaVersion: 'phi-os.navigation-input.v1',
      runtimeEntityId: entryContract.runtimeEntityId,
      runtimeEntryId: entryContract.runtimeEntryId,
      reading,
      evidenceBoundary: reading.evidenceBoundary,
      transition: { desiredDirection: lang === 'zh' ? fixture.desiredDirectionZh : fixture.desiredDirection },
      languageContract: { locale: scenario.ui, outputLanguage: lang }
    });
    assert.ok(Array.isArray(navigation.availablePaths));
    assert.ok(navigation.availablePaths.length > 0, `${fixture.id}/${scenario.id}: Navigation paths missing.`);

    const selectedPath = {
      ...navigation.availablePaths.find(path => path.pathType !== 'professional_review'),
      status: 'selected',
      selectedAt: '2026-07-01T00:00:00.000Z',
      selectionSource: 'user_choice'
    };
    const reviewSource = {
      ...navigation,
      navigation: {
        schemaVersion: 'phi-os.navigation.v1',
        availablePaths: navigation.availablePaths.map(path => ({ ...path, status: path.id === selectedPath.id ? 'selected' : 'available' })),
        selectedPath
      },
      navigationState: {
        schemaVersion: 'phi-os.navigation-state.v1',
        reviewGate: { ready: true, blockers: [], preparedAt: '2026-07-01T00:05:00.000Z' },
        professionalConsent: { required: false, accepted: false, acceptedAt: '' }
      }
    };
    const review = completeReview(buildReviewContractFromNavigation(reviewSource), fixture);
    const memory = buildRuntimeMemoryFromReview(review);
    const continuity = buildRealityContinuityFromMemory(memory, {
      nextRuntimeState: fixture.nextRuntimeState,
      confirmed: true,
      confirmedAt: '2026-07-08T00:05:00.000Z'
    });
    assert.equal(validateRealityContinuityContract(continuity).valid, true);
    assert.equal(continuity.userChoice.selectionSource, 'user_confirmation');

    if (scenario.switchAfterStart) {
      const switched = evaluateEntryRuleFirst({
        conversation: [{ role: 'user', content: initialInput }],
        entryRound: 1,
        language: 'zh',
        evidenceDepth: 'guided',
        answerTarget: 'observed_change'
      });
      assert.match(switched.acknowledgement, /PHI OS 已记录/);
      assert.equal(switched.extractedFields.observedChange, entry.extractedFields.observedChange);
    }
    journeyCases += 1;
  }
}

assert.equal(journeyCases, 12);
assert.equal(journeyCases * acceptance.viewports.length, acceptance.automatedCases);
assert.equal(acceptance.releaseGates.p0Open, 0);
assert.equal(acceptance.releaseGates.p1Open, 0);

console.log(`✓ M1-W6 Full Journey Acceptance passed (${journeyCases} language journeys × 3 viewports = ${acceptance.automatedCases} cases).`);
console.log('  Runtime v1 remains a release candidate until deployed visual acceptance is confirmed; Git tag not created.');
