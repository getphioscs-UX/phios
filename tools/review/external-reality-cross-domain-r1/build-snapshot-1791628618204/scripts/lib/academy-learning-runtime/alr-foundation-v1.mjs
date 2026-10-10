const present = value => value !== undefined && value !== null && value !== '';

export function evaluateAlrAuthorityAction(contract, action) {
  if (!contract || !Array.isArray(contract.actionMatrix) || !present(action)) return 'UNRESOLVED';
  return contract.actionMatrix.find(entry => entry.action === action)?.decision ?? 'UNRESOLVED';
}

export function resolveLearningObjectType(registry, typeCode) {
  if (!registry || !Array.isArray(registry.objectTypes) || !present(typeCode)) return null;
  return registry.objectTypes.find(entry => entry.typeCode === typeCode) ?? null;
}

export function validateAcademyLevelRegistry(registry) {
  const expected = ['FOUNDATION', 'READER', 'NAVIGATOR', 'PROFESSIONAL'];
  if (!registry || !Array.isArray(registry.levels)) return false;
  if (registry.levels.length !== expected.length) return false;
  return registry.levels.every((level, index) =>
    level.levelCode === expected[index] &&
    level.ordinal === index + 1 &&
    present(level.definition) &&
    present(level.boundary)
  );
}

export function validateLearningTrackDefinition(trackRegistry, levelRegistry, input = {}) {
  const forbiddenPayloadFields = [
    'subjectReference',
    'accountReference',
    'learnerReference',
    'progress',
    'assessmentResponse',
    'capabilityState'
  ];
  if (forbiddenPayloadFields.some(field => Object.hasOwn(input, field))) return 'DENY_USER_OR_RUNTIME_DATA';
  const required = trackRegistry?.requiredTrackFields ?? [];
  if (required.some(field => !present(input[field]))) return 'UNRESOLVED';
  if (!Array.isArray(input.allowedAcademyLevels) || input.allowedAcademyLevels.length === 0) return 'UNRESOLVED';
  if (!Array.isArray(input.sourceScopeReferences) || input.sourceScopeReferences.length === 0) return 'UNRESOLVED';
  if (!trackRegistry.trackClasses.some(entry => entry.trackClass === input.trackClass)) return 'UNKNOWN_TRACK_CLASS';
  const levels = new Set((levelRegistry?.levels ?? []).map(entry => entry.levelCode));
  if (input.allowedAcademyLevels.some(level => !levels.has(level))) return 'UNKNOWN_ACADEMY_LEVEL';
  if (!/^ALR-TRACK-[A-Z0-9-]+$/.test(input.trackCode)) return 'INVALID_TRACK_IDENTITY';
  if (input.authorityReference !== 'ALR') return 'DENY_AUTHORITY_REFERENCE';
  return 'VALID_TRACK_DEFINITION';
}
