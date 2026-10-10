const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export const parseSemver = version => {
  const match = semverPattern.exec(version);
  if (!match) throw new Error(`MAPPING_VERSION_INVALID:${version}`);
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
};

export const compareSemver = (a, b) => {
  const left = parseSemver(a);
  const right = parseSemver(b);
  for (const key of ['major', 'minor', 'patch']) {
    if (left[key] < right[key]) return -1;
    if (left[key] > right[key]) return 1;
  }
  return 0;
};

export const classifyVersionBump = (fromVersion, toVersion) => {
  const from = parseSemver(fromVersion);
  const to = parseSemver(toVersion);
  if (compareSemver(fromVersion, toVersion) >= 0) return 'invalid';
  if (to.major > from.major) return 'major';
  if (to.minor > from.minor) return 'minor';
  return 'patch';
};

export const classifyMappingChange = (previous, next) => {
  const breaking =
    previous.predicateHash !== next.predicateHash ||
    previous.targetMeaningHash !== next.targetMeaningHash ||
    previous.mappingAuthority !== next.mappingAuthority ||
    previous.boundary !== next.boundary;
  if (breaking) return 'breaking';

  const previousCompatible = new Set(previous.compatibility?.compatibleFromVersions ?? []);
  const nextCompatible = new Set(next.compatibility?.compatibleFromVersions ?? []);
  const compatibilityExtended = [...nextCompatible].some(version => !previousCompatible.has(version));
  if (compatibilityExtended) return 'compatible_extension';

  const metadataChanged =
    previous.mappingConfidence !== next.mappingConfidence ||
    JSON.stringify(previous.lifecycle) !== JSON.stringify(next.lifecycle) ||
    JSON.stringify(previous.compatibility) !== JSON.stringify(next.compatibility);
  return metadataChanged ? 'metadata' : 'none';
};

export const evaluateMappingCompatibility = (previous, next) => {
  const errors = [];
  if (previous.mappingId !== next.mappingId) errors.push('MAPPING_IDENTITY_MISMATCH');
  if (previous.mappingCode && next.mappingCode && previous.mappingCode !== next.mappingCode) {
    errors.push('MAPPING_CODE_CHANGED_WITHIN_IDENTITY');
  }

  const bump = classifyVersionBump(previous.mappingVersion, next.mappingVersion);
  if (bump === 'invalid') errors.push('MAPPING_VERSION_NOT_INCREASING');
  const change = classifyMappingChange(previous, next);

  if (change === 'breaking' && bump !== 'major') errors.push('MAPPING_BREAKING_CHANGE_REQUIRES_MAJOR');
  if (change === 'compatible_extension' && !['minor', 'major'].includes(bump)) {
    errors.push('MAPPING_COMPATIBLE_EXTENSION_REQUIRES_MINOR');
  }
  if (change === 'metadata' && !['patch', 'minor', 'major'].includes(bump)) {
    errors.push('MAPPING_METADATA_CHANGE_REQUIRES_PATCH');
  }
  if (change === 'none') errors.push('MAPPING_EMPTY_VERSION_BUMP');

  if (!next.compatibility.backwardCompatible && !next.compatibility.migrationRequired) {
    errors.push('MAPPING_INCOMPATIBLE_REQUIRES_MIGRATION');
  }
  if (change === 'breaking' && next.compatibility.backwardCompatible) {
    errors.push('MAPPING_BREAKING_CHANGE_CANNOT_BE_BACKWARD_COMPATIBLE');
  }

  return {
    valid: errors.length === 0,
    change,
    bump,
    outcome:
      errors.length > 0 ? 'invalid_version_transition' :
      change === 'breaking' ? 'breaking_major' :
      bump === 'patch' ? 'backward_compatible_patch' :
      bump === 'minor' ? 'backward_compatible_minor' :
      'identical',
    errors
  };
};

export const validateMappingRegistryCompatibility = registry => {
  const errors = [];
  const byId = new Map();
  const versionIdentities = new Set();

  for (const record of registry.mappings ?? []) {
    const versionIdentity = `${record.mappingCode}@${record.mappingVersion}`;
    if (versionIdentities.has(versionIdentity)) errors.push(`MAPPING_VERSION_IDENTITY_DUPLICATE:${versionIdentity}`);
    versionIdentities.add(versionIdentity);
    if (!byId.has(record.mappingId)) byId.set(record.mappingId, []);
    byId.get(record.mappingId).push(record);
  }

  const allIds = new Set(byId.keys());
  for (const [mappingId, records] of byId.entries()) {
    records.sort((a, b) => compareSemver(a.mappingVersion, b.mappingVersion));
    const mappingCodes = new Set(records.map(record => record.mappingCode));
    if (mappingCodes.size !== 1) errors.push(`MAPPING_CODE_MULTIPLE_WITHIN_IDENTITY:${mappingId}`);

    const knownVersions = new Set(records.map(record => record.mappingVersion));
    for (const record of records) {
      for (const compatibleVersion of record.compatibility.compatibleFromVersions) {
        if (!knownVersions.has(compatibleVersion)) {
          errors.push(`MAPPING_COMPATIBLE_VERSION_UNRESOLVED:${mappingId}@${record.mappingVersion}:${compatibleVersion}`);
        }
      }
      if (record.lifecycle.successorMappingId && !allIds.has(record.lifecycle.successorMappingId)) {
        errors.push(`MAPPING_SUCCESSOR_UNRESOLVED:${record.lifecycle.successorMappingId}`);
      }
      if (record.lifecycle.successorMappingId === record.mappingId) {
        errors.push(`MAPPING_SUCCESSOR_MUST_DIFFER:${mappingId}`);
      }
    }

    for (let index = 1; index < records.length; index += 1) {
      const result = evaluateMappingCompatibility(records[index - 1], records[index]);
      for (const error of result.errors) {
        errors.push(`${error}:${mappingId}:${records[index - 1].mappingVersion}->${records[index].mappingVersion}`);
      }
    }
  }

  return errors;
};
