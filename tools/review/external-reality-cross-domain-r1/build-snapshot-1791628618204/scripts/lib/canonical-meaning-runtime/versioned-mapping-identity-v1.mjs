import crypto from 'node:crypto';

const canonicalize = value => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]));
  }
  return value;
};

export const canonicalJson = value => JSON.stringify(canonicalize(value));
export const sha256Canonical = value => crypto.createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex');

export const deriveMappingDigests = mapping => {
  const predicateHash = sha256Canonical({
    sourceMethodCode: mapping.sourceMethodCode,
    sourceProjectionSchemaVersion: mapping.sourceProjectionSchemaVersion,
    projectionType: mapping.projectionType,
    projectionPredicate: mapping.projectionPredicate
  });
  const targetMeaningHash = sha256Canonical({
    targetMeaningCodes: [...mapping.targetMeaningCodes].sort()
  });
  const mappingDigest = sha256Canonical({
    mappingId: mapping.mappingId,
    mappingCode: mapping.mappingCode,
    mappingVersion: mapping.mappingVersion,
    predicateHash,
    targetMeaningHash,
    mappingAuthority: mapping.mappingAuthority,
    mappingConfidence: mapping.mappingConfidence,
    boundary: mapping.boundary
  });
  return { predicateHash, targetMeaningHash, mappingDigest };
};

export const validateCompatibility = record => {
  const errors = [];
  if (!record.compatibility.backwardCompatible && !record.compatibility.migrationRequired) {
    errors.push('MAPPING_INCOMPATIBLE_REQUIRES_MIGRATION');
  }
  if (record.lifecycle.deprecated !== (record.lifecycle.status === 'deprecated')) {
    errors.push('MAPPING_DEPRECATION_STATE_MISMATCH');
  }
  if (!record.lifecycle.deprecated && (
    record.lifecycle.deprecatedAt !== null ||
    record.lifecycle.deprecatedReason !== null ||
    record.lifecycle.successorMappingId !== null
  )) {
    errors.push('MAPPING_ACTIVE_RECORD_HAS_DEPRECATION_METADATA');
  }
  if (record.lifecycle.successorMappingId === record.mappingId) {
    errors.push('MAPPING_SUCCESSOR_MUST_DIFFER');
  }
  return errors;
};
