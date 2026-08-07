const CMR_VERSION = '1.0.0';
const CANONICAL_PROJECTION_SCHEMA = 'PHI-OS-CANONICAL-PROJECTION-v1.0.0';

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])]));
  return value;
}

export async function sha256Canonical(value) {
  const source = JSON.stringify(stable(value));
  if (globalThis.crypto?.subtle) {
    const buf = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(source).digest('hex');
}

function fail(code, message = code) { const e = new Error(`${code}: ${message}`); e.code = code; throw e; }
function getPath(obj, path) { return path.split('.').reduce((v,k) => v?.[k], obj); }
function matchesPredicate(projection, p) {
  const value = getPath(projection, p.path);
  if (p.operator === 'equals') return value === p.value;
  if (p.operator === 'contains') {
    if (!Array.isArray(value)) return false;
    if (p.field) return value.some(item => item?.[p.field] === p.value);
    return value.includes(p.value);
  }
  return false;
}
function projectionBoundary(projection) {
  if (!projection || projection.schemaVersion !== CANONICAL_PROJECTION_SCHEMA) fail('CMR_PROJECTION_SCHEMA_INVALID');
  for (const [k, expected] of Object.entries({ deterministic:true, providerUsed:false, aiUsed:false, interpretationCreated:false, knowledgeCreated:false, realityConclusionCreated:false, professionalConclusionCreated:false })) {
    if (projection[k] !== expected) fail('CMR_PROJECTION_BOUNDARY_INVALID', k);
  }
  if (!projection.projectionSource?.methodCode) fail('CMR_PROJECTION_LINEAGE_INCOMPLETE');
}
function mappingPool(registries, methodCode) {
  const pools = registries.mappingRegistries || [];
  return pools.flatMap(r => Array.isArray(r?.mappings) ? r.mappings : []).filter(m => m.sourceMethodCode === methodCode && m.status === 'active' && m.boundary === 'validation_only');
}
function buildDimensions(family, dimensionRegistry) {
  const set = dimensionRegistry.familyDimensionSets?.find(x => x.familyCode === family);
  if (!set) fail('CMR_DIMENSION_SET_MISSING', family);
  return Object.fromEntries(set.requiredDimensionCodes.map(code => [code, 'not_populated']));
}
function knowledgeFor(code, knowledgeMap, codeRecord) {
  const entry = knowledgeMap.mappings?.find(x => x.meaningCode === code);
  const authority = entry?.knowledgeAuthority || codeRecord?.knowledgeAuthority;
  if (!authority?.primaryNodeCodes?.length) fail('CMR_KNOWLEDGE_AUTHORITY_MISSING', code);
  return { primaryNodeCodes:[...authority.primaryNodeCodes], supportingNodeCodes:[...(authority.supportingNodeCodes||[])], publishedFragmentDigests:[...(authority.publishedFragmentDigests||[])] };
}

export async function buildCanonicalMeaningBundle({ projection, registries, locale = 'zh-Hans' }) {
  projectionBoundary(projection);
  const methodCode = projection.projectionSource.methodCode;
  const candidates = mappingPool(registries, methodCode).filter(m => m.projectionType === projection.projectionType && m.sourceProjectionSchemaVersion === projection.schemaVersion && matchesPredicate(projection, m.projectionPredicate));
  if (!candidates.length) fail('CMR_MAPPING_NOT_FOUND');
  const projectionDigest = await sha256Canonical(projection);
  const meanings = [];
  for (const mapping of candidates.sort((a,b) => a.mappingCode.localeCompare(b.mappingCode))) {
    for (const meaningCode of [...mapping.targetMeaningCodes].sort()) {
      const code = registries.meaningCodeRegistry.meaningCodes.find(x => x.meaningCode === meaningCode);
      if (!code) fail('CMR_TARGET_MEANING_NOT_REGISTERED', meaningCode);
      if (code.status !== 'validation_only') fail('CMR_MEANING_STATUS_INVALID', meaningCode);
      const family = registries.meaningFamilyRegistry.families.find(x => x.familyCode === code.meaningFamily);
      if (!family) fail('CMR_MEANING_FAMILY_MISSING', code.meaningFamily);
      meanings.push({
        meaningCode: code.meaningCode,
        meaningVersion: code.meaningVersion,
        meaningFamily: code.meaningFamily,
        meaningDimensions: buildDimensions(code.meaningFamily, registries.meaningDimensionRegistry),
        sourceProjection:{ methodCode, projectionType:projection.projectionType, projectionCode:projection.projectionCode, projectionVersion:projection.projectionVersion, projectionDigest },
        mappingLineage:{ mappingCode:mapping.mappingCode, mappingVersion:mapping.mappingVersion, mappingAuthority:'registry_led', mappingDigest:mapping.mappingDigest },
        knowledgeReferences: knowledgeFor(code.meaningCode, registries.knowledgeMap, code),
        confidence:{ level:mapping.mappingConfidence === 'validated' ? 'validated' : 'bounded', basis:['registered_mapping','canonical_projection','registered_meaning_identity'] },
        boundaries:{ mustNotClaim:['Meaning is not a reality fact.','Meaning does not constitute Method interpretation.','Meaning does not constitute Professional conclusion.'], limitations:['Meaning dimensions may remain not_populated until an authorized Meaning value registry exists.','Knowledge references are external authority references only.'], prohibitedAuthorities:['method_projection','article','reality_fact','professional_conclusion'] },
        status:'validation_only'
      });
    }
  }
  const lineage = meanings.map(m => `${m.sourceProjection.methodCode}:${m.sourceProjection.projectionCode}:${m.mappingLineage.mappingCode}`).sort();
  const seed = { projectionDigest, lineage, meaningCodes:meanings.map(m=>m.meaningCode).sort(), locale };
  const digest = await sha256Canonical(seed);
  return Object.freeze({
    schemaVersion:'PHI-OS-CANONICAL-MEANING-BUNDLE-v1.0.0',
    bundleCode:`CMB-${digest.slice(0,24).toUpperCase()}`,
    bundleVersion:CMR_VERSION,
    projectionLineage:lineage,
    meanings,
    supportingSignals:[], contradictingSignals:[], unresolvedSignals:[], sourceIndependence:true,
    knowledgeCoverage:{ status:'partial', nodeCount:new Set(meanings.flatMap(m=>[...m.knowledgeReferences.primaryNodeCodes,...m.knowledgeReferences.supportingNodeCodes])).size, publishedFragmentCount:new Set(meanings.flatMap(m=>m.knowledgeReferences.publishedFragmentDigests)).size, locale },
    limitations:['Canonical Meaning is semantic projection, not interpretation.','No Provider, AI or Prompt is used.','No Professional conclusion or Reality decision is created.'],
    status:'validation_only'
  });
}

export default Object.freeze({ buildCanonicalMeaningBundle, sha256Canonical });
