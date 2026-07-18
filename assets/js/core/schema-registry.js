/**
 * PHI OS browser-side schema registry.
 *
 * Keep identifiers aligned with:
 * functions/runtime/shared/schema-registry.js
 */

export const SCHEMA_IDS = Object.freeze({
  RUNTIME_ENTRY: 'phi-os.runtime-entry.v1',
  RECONSTRUCTION: 'phi-os.reconstruction.v1',
  READING_INPUT: 'phi-os.reading-input.v1',
  REALITY_READING: 'phi-os.reality-reading.v1',
  NAVIGATION_INPUT: 'phi-os.navigation-input.v1',
  NAVIGATION: 'phi-os.navigation.v1',
  REVIEW: 'phi-os.review.v1',
  CONTINUITY: 'phi-os.continuity.v1',
  RUNTIME_SCOPE: 'phi-os.runtime-scope.v1'
});

const defineSchema = (current, aliases = []) =>
  Object.freeze({
    current,
    accepted: Object.freeze([
      ...new Set([current, ...aliases])
    ])
  });

export const SCHEMA_REGISTRY = Object.freeze({
  runtimeEntry: defineSchema(
    SCHEMA_IDS.RUNTIME_ENTRY,
    ['phi-os.rule-entry.v1', '1.0']
  ),
  reconstruction: defineSchema(
    SCHEMA_IDS.RECONSTRUCTION
  ),
  readingInput: defineSchema(
    SCHEMA_IDS.READING_INPUT
  ),
  realityReading: defineSchema(
    SCHEMA_IDS.REALITY_READING
  ),
  navigationInput: defineSchema(
    SCHEMA_IDS.NAVIGATION_INPUT
  ),
  navigation: defineSchema(
    SCHEMA_IDS.NAVIGATION
  ),
  review: defineSchema(
    SCHEMA_IDS.REVIEW
  ),
  continuity: defineSchema(
    SCHEMA_IDS.CONTINUITY
  ),
  runtimeScope: defineSchema(
    SCHEMA_IDS.RUNTIME_SCOPE
  )
});

export function isAcceptedSchema(
  schemaName,
  schemaVersion
) {
  const definition = SCHEMA_REGISTRY[schemaName];

  return Boolean(
    definition &&
    typeof schemaVersion === 'string' &&
    definition.accepted.includes(
      schemaVersion.trim()
    )
  );
}
