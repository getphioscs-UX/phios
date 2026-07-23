/** Canonical executable Contract Registry introduced by M2-W1. */
import { getRuntimeSchema } from './schema-registry.js';
import { getRuntimeVersion } from './version-registry.js';
import { getRuntimeMigrationForSchema } from './migration-registry.js';

const commonErrors = Object.freeze([
  'missing_required_field',
  'invalid_field_type',
  'unsupported_schema'
]);

const contractValidators = Object.freeze({
  'reading-navigation':
    'functions/runtime/navigation/reading-navigation-contract.js',
  navigation: 'functions/runtime/navigation/navigation-contract.js',
  review: 'functions/runtime/review/review-contract.js',
  'runtime-memory': 'functions/runtime/memory/runtime-memory-contract.js',
  continuity: 'functions/runtime/continuity/reality-continuity-contract.js'
});

const definitions = [
  ['runtime-entry', 'entry', 'stage-output', [],
    ['schemaVersion', 'evidenceBoundary', 'assessment']],
  ['reconstruction', 'reconstruction', 'stage-output', ['runtime-entry'],
    ['schemaVersion', 'grammarStates', 'evidenceBoundary']],
  ['reading-input', 'reading', 'stage-input',
    ['runtime-entry', 'reconstruction'],
    ['schemaVersion', 'runtimeEntityId', 'runtimeEntryId']],
  ['reality-reading', 'reading', 'stage-output', ['reading-input'],
    ['schemaVersion', 'evidenceBoundary', 'navigationReadiness']],
  ['reading-navigation', 'navigation', 'handoff', ['reality-reading'],
    ['schemaVersion', 'readingSchemaVersion', 'navigationReady',
      'evidenceBoundary', 'unknownReality']],
  ['navigation-input', 'navigation', 'stage-input', ['reading-navigation'],
    ['schemaVersion', 'runtimeEntityId', 'runtimeEntryId']],
  ['navigation', 'navigation', 'stage-output', ['navigation-input'],
    ['schemaVersion', 'availablePaths', 'navigationState']],
  ['review', 'review', 'stage-output', ['navigation'],
    ['schemaVersion', 'sourceNavigation', 'customerReport', 'reviewOutcome']],
  ['runtime-memory', 'memory', 'stage-output', ['review'],
    ['schemaVersion', 'sourceReview', 'reportedMemory', 'outcomeMemory']],
  ['continuity', 'continuity', 'stage-output', ['runtime-memory'],
    ['schemaVersion', 'sourceMemory', 'userChoice', 'transition',
      'guardrails']],
  ['runtime-transition-execution', 'transition', 'service-output',
    ['continuity'],
    ['schemaVersion', 'continuityId', 'status', 'action', 'userInitiated',
      'automaticExecution']],
  ['reading-revision-request', 'revision', 'handoff',
    ['runtime-transition-execution'],
    ['schemaVersion', 'requestId', 'sourceRuntimeId']],
  ['reading-revision-initialization', 'revision', 'service-output',
    ['reading-revision-request'], ['schemaVersion', 'sourceId', 'status']],
  ['entry-continuity-handoff', 'transition', 'handoff',
    ['runtime-transition-execution'],
    ['schemaVersion', 'handoffId', 'previousRuntimeId', 'userInitiated']],
  ['entry-initialization', 'revision', 'service-output',
    ['entry-continuity-handoff'],
    ['schemaVersion', 'runtimeId', 'runtimeEntryId', 'historicalOverwrite']],
  ['runtime-lineage', 'lineage', 'service-output', ['runtime-entry'],
    ['schemaVersion', 'runtimeEntityId', 'runtimes', 'guardrails']],
  ['runtime-snapshot', 'persistence', 'service-output', ['runtime-entry'],
    ['schemaVersion', 'contracts', 'integrity']],
  ['runtime-recovery-state', 'recovery', 'service-output',
    ['runtime-snapshot'], ['schemaVersion', 'status']],
  ['runtime-workspace-state', 'workspace', 'service-output', ['runtime-entry'],
    ['schemaVersion', 'currentStage', 'completedStages', 'availableStages']],
  ['runtime-kernel', 'kernel', 'boundary-status',
    ['runtime-workspace-state'],
    ['schemaVersion', 'started', 'managers', 'guardrails']]
];

export const RUNTIME_CONTRACTS = Object.freeze(
  definitions.map(([id, owner, kind, dependencies, requiredFields]) => {
    const schema = getRuntimeSchema(id);
    const version = getRuntimeVersion(id);
    const migration = getRuntimeMigrationForSchema(id);

    return Object.freeze({
      id,
      version: version?.current || '',
      status: 'stable',
      schemaId: schema?.current || '',
      migrationId: migration?.id || '',
      owner,
      kind,
      input: `${owner}_source`,
      output: id,
      required_fields: Object.freeze([...requiredFields]),
      optional_fields: Object.freeze([]),
      errors: commonErrors,
      dependencies: Object.freeze([...dependencies]),
      validator: contractValidators[id] || schema?.authority || ''
    });
  })
);

const registry = new Map(
  RUNTIME_CONTRACTS.map(contract => [contract.id, contract])
);

export function getRuntimeContract(id) {
  return registry.get(id) || null;
}

export function hasRuntimeContract(id) {
  return registry.has(id);
}

export function listRuntimeContracts({ owner, kind } = {}) {
  return RUNTIME_CONTRACTS.filter(contract =>
    (!owner || contract.owner === owner) &&
    (!kind || contract.kind === kind)
  );
}

export default RUNTIME_CONTRACTS;
