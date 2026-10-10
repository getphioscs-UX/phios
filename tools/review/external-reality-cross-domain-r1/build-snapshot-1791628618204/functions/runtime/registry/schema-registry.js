/**
 * M2 Runtime Schema Registry.
 *
 * The first ten records are derived from the M1 compatibility registry so
 * existing request validation and the infrastructure registry cannot drift.
 * Service schemas that predate the shared registry remain explicit records.
 * Breaking changes require a new schema identifier and an M2-W4 migration.
 */
import { SCHEMA_REGISTRY as M1_SCHEMA_REGISTRY } from
  '../shared/schema-registry.js';

const definitions = [
  ['runtime-entry', M1_SCHEMA_REGISTRY.runtimeEntry,
    'functions/runtime/shared/schema-registry.js'],
  ['reconstruction', M1_SCHEMA_REGISTRY.reconstruction,
    'functions/runtime/shared/schema-registry.js'],
  ['reading-input', M1_SCHEMA_REGISTRY.readingInput,
    'functions/runtime/shared/schema-registry.js'],
  ['reality-reading', M1_SCHEMA_REGISTRY.realityReading,
    'functions/runtime/shared/schema-registry.js'],
  ['reading-navigation', {
    current: 'phi-os.reading-navigation-contract.v2',
    accepted: ['phi-os.reading-navigation-contract.v2']
  }, 'functions/runtime/navigation/reading-navigation-contract.js'],
  ['navigation-input', M1_SCHEMA_REGISTRY.navigationInput,
    'functions/runtime/shared/schema-registry.js'],
  ['navigation', M1_SCHEMA_REGISTRY.navigation,
    'functions/runtime/shared/schema-registry.js'],
  ['review', M1_SCHEMA_REGISTRY.review,
    'functions/runtime/shared/schema-registry.js'],
  ['runtime-memory', M1_SCHEMA_REGISTRY.runtimeMemory,
    'functions/runtime/shared/schema-registry.js'],
  ['continuity', M1_SCHEMA_REGISTRY.continuity,
    'functions/runtime/shared/schema-registry.js'],
  ['runtime-transition-execution', {
    current: 'phi-os.runtime-transition-execution.v1', accepted: []
  }, 'assets/js/modules/runtime-transition-engine.js'],
  ['reading-revision-request', {
    current: 'phi-os.reading-revision-request.v1', accepted: []
  }, 'assets/js/modules/runtime-revision-initializer.js'],
  ['reading-revision-initialization', {
    current: 'phi-os.reading-revision-initialization.v1', accepted: []
  }, 'assets/js/modules/runtime-revision-initializer.js'],
  ['entry-continuity-handoff', {
    current: 'phi-os.entry-continuity-handoff.v1', accepted: []
  }, 'assets/js/modules/runtime-revision-initializer.js'],
  ['entry-initialization', {
    current: 'phi-os.entry-initialization.v1', accepted: []
  }, 'assets/js/modules/runtime-revision-initializer.js'],
  ['runtime-lineage', {
    current: 'phi-os.runtime-lineage.v1', accepted: []
  }, 'assets/js/modules/runtime-lineage.js'],
  ['runtime-snapshot', {
    current: 'phi-os.runtime-snapshot.v1', accepted: []
  }, 'assets/js/modules/runtime-persistence.js'],
  ['runtime-recovery-state', {
    current: 'phi-os.runtime-recovery-state.v1', accepted: []
  }, 'assets/js/modules/runtime-persistence.js'],
  ['runtime-workspace-state', {
    current: 'phi-os.runtime-workspace-state.v1', accepted: []
  }, 'assets/js/modules/runtime-workspace-state.js'],
  ['runtime-kernel', {
    current: 'phi-os.runtime-kernel.v1', accepted: []
  }, 'assets/js/runtime/kernel/kernel.js']
];

export const RUNTIME_SCHEMAS = Object.freeze(
  definitions.map(([id, definition, authority]) => {
    const current = String(definition.current || '').trim();
    const accepted = [...new Set([
      current,
      ...(definition.accepted || [])
    ].filter(Boolean))];

    return Object.freeze({
      id,
      current,
      accepted: Object.freeze(accepted),
      status: 'stable',
      authority,
      migrationRequiredForBreakingChange: true
    });
  })
);

const byId = new Map(RUNTIME_SCHEMAS.map(schema => [schema.id, schema]));
const byVersion = new Map(
  RUNTIME_SCHEMAS.flatMap(schema =>
    schema.accepted.map(version => [version, schema])
  )
);

export function getRuntimeSchema(id) {
  return byId.get(id) || null;
}

export function getRuntimeSchemaByVersion(version) {
  return byVersion.get(String(version || '').trim()) || null;
}

export function hasRuntimeSchema(id) {
  return byId.has(id);
}

export function acceptsRuntimeSchema(id, version) {
  return Boolean(
    getRuntimeSchema(id)?.accepted.includes(String(version || '').trim())
  );
}

export function resolveRuntimeSchema(id, version) {
  return acceptsRuntimeSchema(id, version)
    ? getRuntimeSchema(id).current
    : null;
}

export default RUNTIME_SCHEMAS;
