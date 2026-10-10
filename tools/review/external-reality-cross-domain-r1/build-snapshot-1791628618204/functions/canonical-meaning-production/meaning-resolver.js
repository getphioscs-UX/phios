const PROJECTION_SCHEMA = 'PHI-OS-CANONICAL-METHOD-PROJECTION-v1.0.0';
const PUBLIC_METHOD_TO_CODE = Object.freeze({
  ASTROLOGY_PROJECTION: 'ASTROLOGY',
  BAZI_PROJECTION: 'BAZI',
  NUMEROLOGY_PROJECTION: 'NUMEROLOGY'
});

function fail(code, detail = '') {
  const error = new Error(detail ? `${code}: ${detail}` : code);
  error.code = code;
  throw error;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  }
  return value;
}

export async function sha256Canonical(value) {
  const source = JSON.stringify(stable(value));
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(source).digest('hex');
}

function getPath(value, path) {
  return String(path || '').split('.').filter(Boolean).reduce((current, key) => current?.[key], value);
}

function objectMatches(candidate, pattern) {
  if (!candidate || typeof candidate !== 'object') return false;
  for (const [key, expected] of Object.entries(pattern || {})) {
    if (key === 'codePrefix') {
      if (typeof candidate.code !== 'string' || !candidate.code.startsWith(expected)) return false;
      continue;
    }
    if (key === 'codeSuffix') {
      if (typeof candidate.code !== 'string' || !candidate.code.endsWith(expected)) return false;
      continue;
    }
    if (candidate[key] !== expected) return false;
  }
  return true;
}

export function selectorMatches(projection, selector) {
  const value = getPath(projection, selector?.path);
  if (selector?.operator === 'array_object_match') {
    return Array.isArray(value) && value.some(item => objectMatches(item, selector.match));
  }
  if (selector?.operator === 'array_object_exists') {
    return Array.isArray(value) && value.some(item => objectMatches(item, selector.match));
  }
  if (selector?.operator === 'nested_array_object_match') {
    if (!Array.isArray(value)) return false;
    return value.some(outer => {
      if (!objectMatches(outer, selector.outerMatch)) return false;
      const child = getPath(outer, selector.childPath);
      return Array.isArray(child) && child.some(item => objectMatches(item, selector.childMatch));
    });
  }
  fail('CMP_SELECTOR_OPERATOR_UNSUPPORTED', selector?.operator || 'missing');
}

export function assertCanonicalMethodProjectionBoundary(projection) {
  if (!projection || projection.schemaVersion !== PROJECTION_SCHEMA) fail('CMP_PROJECTION_SCHEMA_INVALID');
  const publicMethodCode = projection.method?.publicMethodCode;
  const methodCode = PUBLIC_METHOD_TO_CODE[publicMethodCode];
  if (!methodCode) fail('CMP_PUBLIC_METHOD_CODE_UNREGISTERED', publicMethodCode || 'missing');
  if (projection.projection?.productionResult !== true) fail('CMP_PROJECTION_NOT_PRODUCTION_RESULT');
  if (projection.projection?.clientRenderable !== true) fail('CMP_PROJECTION_NOT_CLIENT_RENDERABLE');
  if (projection.interpretation?.included !== false) fail('CMP_INTERPRETATION_BOUNDARY_INVALID');
  if (projection.interpretation?.meaningAuthorityCreated !== false) fail('CMP_UPSTREAM_MEANING_AUTHORITY_ALREADY_CREATED');
  if (projection.interpretation?.professionalJudgmentCreated !== false) fail('CMP_PROFESSIONAL_JUDGMENT_BOUNDARY_INVALID');
  if (!projection.projectionId) fail('CMP_PROJECTION_ID_MISSING');
  return Object.freeze({ methodCode, publicMethodCode });
}

function assertRegistryBoundary(admissionRegistry, mappingRegistry, mode) {
  if (!admissionRegistry || !mappingRegistry) fail('CMP_REGISTRY_MISSING');
  if (mode === 'production') {
    if (admissionRegistry.productionActivated !== true || mappingRegistry.productionActivated !== true) {
      fail('CMP_PRODUCTION_NOT_ACTIVATED');
    }
  } else if (mode !== 'foundation_validation') {
    fail('CMP_EXECUTION_MODE_INVALID', mode);
  }
}

export async function resolveCanonicalMeaningItems({ projection, admissionRegistry, mappingRegistry, mode = 'foundation_validation' }) {
  const { methodCode, publicMethodCode } = assertCanonicalMethodProjectionBoundary(projection);
  assertRegistryBoundary(admissionRegistry, mappingRegistry, mode);

  const admissions = new Map((admissionRegistry.admissions || []).map(record => [record.meaningCode, record]));
  const candidates = (mappingRegistry.mappings || [])
    .filter(mapping => mapping.sourceMethodCode === methodCode)
    .filter(mapping => mapping.sourcePublicMethodCode === publicMethodCode)
    .filter(mapping => mapping.sourceProjectionSchemaVersion === PROJECTION_SCHEMA)
    .filter(mapping => mapping.productionEligible === true)
    .filter(mapping => mode === 'foundation_validation' || mapping.productionActivated === true)
    .filter(mapping => selectorMatches(projection, mapping.selector))
    .sort((a, b) => a.mappingCode.localeCompare(b.mappingCode));

  const projectionDigest = await sha256Canonical(projection);
  const items = [];
  for (const mapping of candidates) {
    const admission = admissions.get(mapping.targetMeaningCode);
    if (!admission || admission.productionAdmitted !== true) fail('CMP_MEANING_NOT_ADMITTED', mapping.targetMeaningCode);
    if (!admission.meaningId || !admission.meaningVersion || !admission.meaningCanonicalDigest) fail('CMP_MEANING_IDENTITY_INCOMPLETE', mapping.targetMeaningCode);
    const knowledge = admission.knowledgeAuthority;
    if (!knowledge?.primaryNodeCodes?.length) fail('CMP_KNOWLEDGE_AUTHORITY_MISSING', mapping.targetMeaningCode);

    items.push(Object.freeze({
      meaningId: admission.meaningId,
      meaningCode: admission.meaningCode,
      meaningVersion: admission.meaningVersion,
      meaningType: mapping.meaningType,
      canonicalTextKey: admission.canonicalTextKey,
      sourceProjectionRef: Object.freeze({
        projectionId: projection.projectionId,
        projectionSchemaVersion: projection.schemaVersion,
        publicMethodCode,
        projectionDigest,
        selector: structuredClone(mapping.selector)
      }),
      sourceFields: Object.freeze([...(mapping.sourceFields || [])]),
      mappingLineage: Object.freeze({
        mappingCode: mapping.mappingCode,
        mappingVersion: mapping.mappingVersion,
        mappingAuthority: mapping.mappingAuthority,
        predecessor: structuredClone(mapping.predecessorLineage)
      }),
      knowledgeAuthority: Object.freeze({
        primaryNodeCodes: Object.freeze([...(knowledge.primaryNodeCodes || [])]),
        supportingNodeCodes: Object.freeze([...(knowledge.supportingNodeCodes || [])])
      }),
      evidence: Object.freeze({
        meaningCanonicalDigest: admission.meaningCanonicalDigest,
        semanticHash: admission.semanticHash,
        knowledgeHash: admission.knowledgeHash
      }),
      status: mode === 'production' ? 'PRODUCTION' : 'FOUNDATION_VALIDATION_ONLY'
    }));
  }

  return Object.freeze({
    methodCode,
    publicMethodCode,
    projectionDigest,
    items: Object.freeze(items),
    unmatched: items.length === 0
  });
}

export default Object.freeze({ resolveCanonicalMeaningItems, assertCanonicalMethodProjectionBoundary, selectorMatches, sha256Canonical });
