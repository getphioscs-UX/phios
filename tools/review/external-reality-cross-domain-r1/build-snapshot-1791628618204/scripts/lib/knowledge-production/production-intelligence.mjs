import fs from 'node:fs';
import path from 'node:path';
import { loadSemanticGraphRuntime } from '../knowledge-runtime/semantic-graph.mjs';
import { resolvePublicationContext } from './publication-context.mjs';
import { loadKnowledgeRegistryAuthorities } from '../knowledge-blueprint/registry-authority.mjs';

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const coded = (code, details = null) => Object.assign(new Error(code), { code, details });
const uniq = values => [...new Set(values.filter(Boolean))];
const relationshipBuckets = new Map([
  ['supports', 'supportingNodes'], ['extends', 'supportingNodes'], ['related_to', 'relatedNodes'],
  ['same_concept_different_scope', 'distinctionNodes'], ['contrasts_with', 'conflictNodes'],
  ['prerequisite_of', 'requiredPrerequisites'], ['depends_on', 'requiredPrerequisites']
]);

export function loadProductionIntelligenceAuthorities(root = process.cwd()) {
  const base = path.join(root, 'content/knowledge');
  return Object.freeze({
    approvedMappings: readJson(path.join(base, 'manuscripts/approved-mapping-registry.json')),
    c2: readJson(path.join(base, 'manuscripts/phase-e/pja-c2-canonical-content-freeze-registry.json')),
    c3: readJson(path.join(base, 'manuscripts/phase-e/pja-c3-production-readiness-registry.json')),
    terminology: readJson(path.join(base, 'registry/terminology.json')),
    semantic: loadSemanticGraphRuntime(root)
  });
}

export function resolveSupportingNodes({ nodeCode, approvedMappings = [], semantic }) {
  if (!approvedMappings.some(item => item.nodeCode === nodeCode && item.authorityStatus === 'approved')) throw coded('PRODUCTION_INTELLIGENCE_APPROVED_MAPPING_REQUIRED', { nodeCode });
  const resolved = semantic.resolve(nodeCode);
  const result = { primaryNode: nodeCode, supportingNodes: [], relatedNodes: [], distinctionNodes: [], conflictNodes: [], requiredPrerequisites: [] };
  for (const edge of resolved.relationships) {
    const other = edge.sourceNodeCode === nodeCode ? edge.targetNodeCode : edge.sourceNodeCode;
    const bucket = relationshipBuckets.get(edge.relationshipType) || 'relatedNodes';
    result[bucket].push(other);
  }
  for (const key of Object.keys(result)) if (Array.isArray(result[key])) result[key] = uniq(result[key]).sort();
  return Object.freeze(result);
}

export function detectDuplicateAndScopeConflicts({ nodeCode, semantic, c2Freezes = [], publicationContext = null }) {
  const current = semantic.resolve(nodeCode);
  const thesis = c2Freezes.find(item => item.nodeCode === nodeCode)?.canonicalThesis || null;
  const duplicateThesis = thesis ? c2Freezes.filter(item => item.nodeCode !== nodeCode && item.canonicalThesis === thesis).map(item => item.nodeCode) : [];
  const sameTitleDifferentScope = [...semantic.profiles.values()].filter(profile => profile.nodeCode !== nodeCode && profile.canonicalQuestion === current.semanticProfile.canonicalQuestion && profile.mechanismScope !== current.semanticProfile.mechanismScope).map(profile => profile.nodeCode);
  const boundaryCollision = current.relationships.filter(edge => ['contrasts_with','same_concept_different_scope'].includes(edge.relationshipType)).map(edge => edge.sourceNodeCode === nodeCode ? edge.targetNodeCode : edge.sourceNodeCode);
  const crossBookDuplicatePurpose = c2Freezes.filter(item => item.nodeCode !== nodeCode && item.canonicalThesis && thesis && item.canonicalThesis === thesis && item.publicationBookCode && publicationContext && item.publicationBookCode !== publicationContext.publicationBookCode).map(item => item.nodeCode);
  const articleReplacementRisk = uniq([...duplicateThesis, ...sameTitleDifferentScope, ...boundaryCollision, ...crossBookDuplicatePurpose]);
  return Object.freeze({ duplicateThesis, sameTitleDifferentScope, crossBookDuplicatePurpose, boundaryCollision, articleReplacementRisk, riskStatus: articleReplacementRisk.length ? 'human_review_required' : 'clear' });
}

export function planCanonicalAssembly({ mapping, resolver, conflicts }) {
  if (mapping.authorityStatus !== 'approved') throw coded('ASSEMBLY_APPROVED_MAPPING_REQUIRED');
  return Object.freeze({
    nodeCode: mapping.nodeCode,
    primaryRanges: [mapping.sectionCode],
    supportingNodes: resolver.supportingNodes.filter(code => !conflicts.articleReplacementRisk.includes(code)),
    distinctionNodes: resolver.distinctionNodes,
    excludedNodes: uniq([...resolver.conflictNodes, ...conflicts.articleReplacementRisk]),
    authority: 'approved_mapping_plus_semantic_graph',
    status: 'planned'
  });
}

export async function generateProductionRecommendation({ root = process.cwd(), nodeCode }) {
  const authorities = loadProductionIntelligenceAuthorities(root);
  const mapping = authorities.approvedMappings.mappings.find(item => item.nodeCode === nodeCode && item.authorityStatus === 'approved');
  if (!mapping) throw coded('PRODUCTION_RECOMMENDATION_APPROVED_MAPPING_REQUIRED', { nodeCode });
  const c2 = authorities.c2.freezes.find(item => item.nodeCode === nodeCode && item.status === 'human_frozen');
  if (!c2) throw coded('PRODUCTION_RECOMMENDATION_APPROVED_C2_REQUIRED', { nodeCode });
  const registryAuthorities = await loadKnowledgeRegistryAuthorities(root);
  const publicationContext = await resolvePublicationContext(root, nodeCode, { authorities: registryAuthorities });
  const resolver = resolveSupportingNodes({ nodeCode, approvedMappings: authorities.approvedMappings.mappings, semantic: authorities.semantic });
  const conflicts = detectDuplicateAndScopeConflicts({ nodeCode, semantic: authorities.semantic, c2Freezes: authorities.c2.freezes, publicationContext });
  const assembly = planCanonicalAssembly({ mapping, resolver, conflicts });
  const profile = authorities.semantic.resolve(nodeCode).semanticProfile;
  return Object.freeze({
    recommendedProductionNode: nodeCode,
    productionPurpose: c2.canonicalThesis,
    supportingNodes: assembly.supportingNodes,
    relatedNodes: resolver.relatedNodes,
    missingSupport: resolver.requiredPrerequisites.filter(code => !authorities.approvedMappings.mappings.some(item => item.nodeCode === code && item.authorityStatus === 'approved')),
    risk: conflicts,
    terminology: authorities.terminology.terms || [],
    boundary: { profileBoundary: profile.boundary, publicBoundary: c2.publicBoundary },
    prohibitedClaims: c2.mustNotClaim || [],
    publicationContext,
    assembly,
    status: 'recommendation'
  });
}

export async function generateProductionBriefV2({ root = process.cwd(), nodeCode, localeContract, terminologyContract }) {
  const authorities = loadProductionIntelligenceAuthorities(root);
  const recommendation = await generateProductionRecommendation({ root, nodeCode });
  const mapping = authorities.approvedMappings.mappings.find(item => item.nodeCode === nodeCode && item.authorityStatus === 'approved');
  const c2 = authorities.c2.freezes.find(item => item.nodeCode === nodeCode && item.status === 'human_frozen');
  const readiness = authorities.c3.records.find(item => item.nodeCode === nodeCode && item.status === 'production_ready');
  if (!readiness) throw coded('PRODUCTION_BRIEF_V2_READINESS_REQUIRED', { nodeCode });
  if (!localeContract?.ready) throw coded('PRODUCTION_BRIEF_V2_LOCALE_CONTRACT_REQUIRED', { nodeCode });
  if (!terminologyContract?.ready) throw coded('PRODUCTION_BRIEF_V2_TERMINOLOGY_CONTRACT_REQUIRED', { nodeCode });
  return Object.freeze({
    contract: 'PHI-OS-PRODUCTION-BRIEF-v2.0.0',
    nodeCode,
    approvedMapping: mapping,
    semanticProfile: authorities.semantic.resolve(nodeCode).semanticProfile,
    knowledgeGraph: recommendation,
    approvedC2: c2,
    readiness,
    publicationContext: recommendation.publicationContext,
    localeContract,
    terminologyContract,
    articleGenerated: false,
    publicationChanged: false,
    status: 'export_ready'
  });
}
