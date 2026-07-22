import assert from 'node:assert/strict';
import fs from 'node:fs';
import reconstructRuntime from '../functions/runtime/reconstruction/rule-reconstruction.js';
import readRuntimeRuleFirst from '../functions/runtime/reading/rule-reading.js';
import {
  RUNTIME_COORDINATES,
  CARRIER_ORGANIZATION_LAYERS,
  CARRIER_CONFIGURATION_LAYERS,
  RUNTIME_CAPABILITIES,
  RUNTIME_DRIVERS
} from '../functions/runtime/formation/book-1-runtime-model.js';
import { validateReadingNavigationContract } from '../functions/runtime/navigation/reading-navigation-contract.js';

const registry = JSON.parse(fs.readFileSync('content/registry/book-1-runtime-alignment.json', 'utf8'));
assert.equal(registry.status, 'closed');
assert.equal(registry.changeClass, 'contract_closure_and_bug_fix');
assert.deepEqual(registry.newRuntimeStages, []);
assert.deepEqual(
  Object.keys(registry.figures),
  ['1A', '1B', '2A', '3A', '3B', '3C', '4A', '4B', '4C', '4D', '5A', '5B', '5C', '5D', '5E']
);
assert.equal(registry.guardrails.figuresAreConceptualReferencesNotRuntimeStages, true);
assert.equal(registry.guardrails.runtimeRegionIsNotRuntimeCapability, true);
assert.equal(registry.guardrails.compressionIsMechanismWithinExpression, true);
assert.equal(registry.guardrails.agencyIsCanonicalActionStyleIsDisplayCompatibility, true);
assert.equal(registry.guardrails.identityRuntimeSignatureIsNotCarrierSignatureFamily, true);
assert.equal(registry.guardrails.projectionCannotOverwriteObservedEvidence, true);
assert.equal(registry.conceptualMappings.runtimeRegion.contractField, 'runtimeRegions');
assert.equal(registry.conceptualMappings.runtimeCapability.contractField, 'runtimeCapabilities');
assert.notEqual(
  registry.conceptualMappings.runtimeRegion.contractField,
  registry.conceptualMappings.runtimeCapability.contractField
);
assert.equal(registry.conceptualMappings.compression.runtimeStage, null);
assert.equal(registry.conceptualMappings.compression.grammarContext, 'G9 Expression');
assert.equal(registry.conceptualMappings.agency.canonicalTerm, 'Agency');
assert.equal(registry.conceptualMappings.agency.contractField, 'agency_style');
assert.equal(registry.conceptualMappings.identityRuntimeSignature.removedCarrierSignatureFamily, false);
assert.equal(registry.conceptualMappings.projection.observedEvidenceMutableByProvider, false);
assert.deepEqual(RUNTIME_COORDINATES.map(item => item.id), registry.contracts.runtimeCoordinates);
assert.deepEqual(CARRIER_ORGANIZATION_LAYERS.map(item => item.id), registry.contracts.carrierOrganization);
assert.deepEqual(CARRIER_CONFIGURATION_LAYERS.map(item => item.id), registry.contracts.carrierConfiguration);
assert.deepEqual(RUNTIME_CAPABILITIES.map(item => item.id), registry.contracts.capabilities);
assert.deepEqual(RUNTIME_DRIVERS.map(item => item.id), registry.contracts.drivers);

const runtimeEntry = {
  schemaVersion: 'phi-os.runtime-entry.v1',
  runtimeEntityId: 'entity-book-1-alignment',
  runtimeEntryId: 'entry-book-1-alignment',
  realityChange: { rawStatement: 'Three months ago, spending checks increased after leaving fixed work.' },
  timing: { statedTiming: 'three months ago' },
  affectedDomains: [{ domain: 'Financial' }, { domain: 'Relationship' }],
  desiredTransition: { summary: 'Use actual figures to distinguish necessary spending from fear-driven delay.' },
  knownReality: ['Three planned tools were not purchased.', 'Two gatherings were cancelled.'],
  dependencies: [{ source: 'Large payments', effect: 'Balance checks increased' }],
  reconstructionEvidence: [
    { target: 'carrier_coordinates', statement: 'Sleep became shorter before large payments.' },
    { target: 'runtime_conditions', statement: 'The pattern is strongest under income pressure and family discussion.' },
    { target: 'experience_style', statement: 'Fear appears before spending.' },
    { target: 'expression_style', statement: 'I stop explaining and withdraw from the discussion.' },
    { target: 'agency_style', statement: 'I delay purchases and repeatedly check the balance.' },
    { target: 'identity_style', statement: 'I question my role as a business owner.' }
  ],
  evidenceBoundary: {
    observedEvidence: ['Three planned tools were not purchased.', 'Two gatherings were cancelled.'],
    reportedExperience: ['Fear appears before spending.'],
    interpretation: [],
    professionalAssessment: [],
    unknownReality: ['Sustainable business income remains unverified.']
  }
};

const reconstruction = reconstructRuntime(runtimeEntry, { language: 'en' });
assert.equal(reconstruction.runtimeCoordinate.length, 5);
assert.equal(reconstruction.carrierOrganization.length, 6);
assert.equal(reconstruction.carrierConfiguration.length, 6);
assert.equal(reconstruction.inquiry.complete, true);

const reading = readRuntimeRuleFirst({
  schemaVersion: 'phi-os.reading-input.v1',
  runtimeEntityId: runtimeEntry.runtimeEntityId,
  runtimeEntryId: runtimeEntry.runtimeEntryId,
  runtimeEntry,
  reconstruction,
  grammarStates: reconstruction.grammarStates,
  evidenceBoundary: runtimeEntry.evidenceBoundary
}, { outputLanguage: 'en' });

assert.equal(reading.runtimeCapabilities.length, 9);
assert.equal(reading.runtimeRegions.length, 9);
assert.ok(reading.runtimeCapabilities.every(item => item.representation === 'capability'));
assert.ok(reading.runtimeRegions.every(item => item.representation !== 'capability'));
assert.ok(reading.decisionContext.activeQuestion?.id.startsWith('Q'));
assert.equal(reading.decisionContext.drivers.length, 12);
assert.deepEqual(reading.decisionContext.driverPriority, []);
assert.equal(reading.decisionContext.guardrails.automaticDriverInferenceAllowed, false);
assert.equal(reading.carrierSignatures, undefined);
assert.equal(validateReadingNavigationContract(reading.navigationHandoff).valid, true);
assert.equal(reading.navigationHandoff.runtimeCapabilities.length, 9);
assert.equal(reading.navigationHandoff.runtimeCoordinate.length, 5);

const entrySource = fs.readFileSync('functions/runtime/entry/rule-entry.js', 'utf8');
assert.equal(entrySource.includes("target: 'carrier_signatures'"), false);
assert.equal(entrySource.includes("target: 'runtime_conditions'"), true);

const reconstructionSource = fs.readFileSync('functions/runtime/reconstruction/rule-reconstruction.js', 'utf8');
assert.match(reconstructionSource, /carrier_signatures[\s\S]*runtime_conditions/);

console.log('✓ M1-W7 Book 1 Figures 1A–5E conceptual boundaries, Runtime representation, and handoff alignment passed.');
