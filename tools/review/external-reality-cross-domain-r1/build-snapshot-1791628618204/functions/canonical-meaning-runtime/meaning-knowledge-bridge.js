import { sha256Canonical } from './canonical-meaning-runtime.js';

function fail(code, message = code) { const e = new Error(`${code}: ${message}`); e.code = code; throw e; }
function uniq(values) { return [...new Set(values)].sort(); }
function byCode(list, key, value) { return list?.find(x => x?.[key] === value); }

function validateMeaningBundle(bundle) {
  if (!bundle || bundle.schemaVersion !== 'PHI-OS-CANONICAL-MEANING-BUNDLE-v1.0.0') fail('CMR_BRIDGE_BUNDLE_SCHEMA_INVALID');
  if (bundle.status !== 'validation_only') fail('CMR_BRIDGE_BUNDLE_STATUS_INVALID');
  if (!Array.isArray(bundle.meanings) || !bundle.meanings.length) fail('CMR_BRIDGE_MEANINGS_REQUIRED');
}

export async function queryMeaningKnowledge({ meaningBundle, knowledge, locale = 'zh-Hans', purpose = 'deep_reading' }) {
  validateMeaningBundle(meaningBundle);
  if (!knowledge?.nodesRegistry?.nodes) fail('CMR_BRIDGE_NODE_REGISTRY_REQUIRED');
  if (!knowledge?.semanticProfiles?.profiles) fail('CMR_BRIDGE_SEMANTIC_PROFILES_REQUIRED');
  if (!knowledge?.knowledgeGraph?.nodes) fail('CMR_BRIDGE_GRAPH_REQUIRED');
  if (!knowledge?.canonicalAssembly?.assemblies) fail('CMR_BRIDGE_ASSEMBLY_REQUIRED');
  if (!knowledge?.adaptiveProjection?.profiles) fail('CMR_BRIDGE_ADAPTIVE_PROJECTION_REQUIRED');

  const meaningCodes = meaningBundle.meanings.map(x => x.meaningCode).sort();
  const referencedNodeCodes = uniq(meaningBundle.meanings.flatMap(m => [
    ...(m.knowledgeReferences?.primaryNodeCodes || []),
    ...(m.knowledgeReferences?.supportingNodeCodes || [])
  ]));

  const nodes = referencedNodeCodes.map(nodeCode => {
    const registryNode = byCode(knowledge.nodesRegistry.nodes, 'nodeCode', nodeCode);
    if (!registryNode) fail('CMR_BRIDGE_KNOWLEDGE_REFERENCE_INVALID', nodeCode);
    const profiles = knowledge.semanticProfiles.profiles.filter(p => p.nodeCode === nodeCode && p.locale === locale);
    const graphMember = knowledge.knowledgeGraph.nodes.some(n => n.kind === 'canonical_node' && n.nodeCode === nodeCode);
    const assemblies = knowledge.canonicalAssembly.assemblies.filter(a => a.locale === locale && a.nodeCodes?.includes(nodeCode));
    const projections = knowledge.adaptiveProjection.profiles.filter(p => p.locale === locale && p.nodeCode === nodeCode && (p.purpose === purpose || purpose === 'auto'));
    return {
      nodeCode,
      registryStatus: registryNode.registryStatus,
      published: profiles.length > 0 && graphMember,
      semanticProfileCodes: profiles.map(p => p.profileCode).sort(),
      graphMember,
      assemblyCodes: assemblies.map(a => a.assemblyCode).sort(),
      adaptiveProjectionProfileCodes: projections.map(p => p.projectionProfileCode).sort()
    };
  });

  const publishedNodes = nodes.filter(x => x.published);
  const total = nodes.length;
  const published = publishedNodes.length;
  const status = total === 0 ? 'no_coverage' : published === total ? 'full_coverage' : published > 0 ? 'partial_coverage' : 'no_coverage';
  const sufficientForInterpretation = status === 'full_coverage';

  const seed = { meaningBundleCode: meaningBundle.bundleCode, meaningCodes, referencedNodeCodes, locale, purpose, status, nodes };
  const queryDigest = await sha256Canonical(seed);
  return Object.freeze({
    schemaVersion: 'PHI-OS-MEANING-KNOWLEDGE-QUERY-v1.0.0',
    queryCode: `MKQ-${queryDigest.slice(0,24).toUpperCase()}`,
    queryVersion: '1.0.0',
    meaningBundleCode: meaningBundle.bundleCode,
    meaningCodes,
    locale,
    purpose,
    references: nodes,
    semanticProfiles: publishedNodes.flatMap(n => n.semanticProfileCodes),
    relationshipGraph: { consulted: true, publishedNodeCodes: publishedNodes.filter(n => n.graphMember).map(n => n.nodeCode) },
    canonicalAssemblies: publishedNodes.flatMap(n => n.assemblyCodes),
    adaptiveKnowledgeProjections: publishedNodes.flatMap(n => n.adaptiveProjectionProfileCodes),
    knowledgeCoverage: {
      status,
      referencedNodeCount: total,
      publishedNodeCount: published,
      unpublishedOrUnavailableNodeCount: total - published,
      sufficientForInterpretation
    },
    authority: {
      connectionMode: 'reference_query_contract',
      meaningRegistryMergedWithKnowledgeRegistry: false,
      knowledgeAuthorityRewritten: false,
      unpublishedKnowledgeExposed: false,
      providerUsed: false,
      aiUsed: false
    },
    limitations: [
      'Knowledge references remain external authority references; registries are not merged.',
      'Only published semantic profiles, graph membership, assemblies and adaptive projections are exposed.',
      'Insufficient coverage blocks interpretation eligibility.'
    ],
    queryDigest,
    status: 'validation_only'
  });
}

export default Object.freeze({ queryMeaningKnowledge });
