import fs from 'node:fs';
import path from 'node:path';

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const freezeMap = map => Object.freeze(map);

export function loadSemanticGraphRuntime(root = process.cwd()) {
  const semanticRoot = path.join(root, 'content/knowledge/semantic');
  const nodeRegistry = readJson(path.join(root, 'content/knowledge/registry/nodes.json'));
  const profileRegistry = readJson(path.join(semanticRoot, 'semantic-profile-registry.json'));
  const relationshipRegistry = readJson(path.join(semanticRoot, 'relationship-graph-registry.json'));
  const mechanisms = readJson(path.join(semanticRoot, 'registries/mechanisms.json'));
  const distinctions = readJson(path.join(semanticRoot, 'registries/distinctions.json'));
  const boundaries = readJson(path.join(semanticRoot, 'registries/boundaries.json'));
  const conceptFamilies = readJson(path.join(semanticRoot, 'registries/concept-families.json'));

  const nodes = new Map((nodeRegistry.nodes || []).map(node => [node.nodeCode, node]));
  const profiles = new Map((profileRegistry.profiles || []).map(profile => [profile.nodeCode, profile]));
  if (nodes.size !== profiles.size || [...nodes.keys()].some(code => !profiles.has(code))) {
    throw new Error('SEMANTIC_PROFILE_COVERAGE_MISMATCH');
  }
  for (const profile of profiles.values()) {
    if (profile.status === 'approved' && profile.humanReviewed !== true) throw new Error(`SEMANTIC_PROFILE_AUTO_APPROVAL_FORBIDDEN:${profile.nodeCode}`);
  }
  const allowed = new Set(relationshipRegistry.allowedRelationshipTypes || []);
  for (const edge of relationshipRegistry.relationships || []) {
    if (!nodes.has(edge.sourceNodeCode) || !nodes.has(edge.targetNodeCode)) throw new Error('SEMANTIC_RELATIONSHIP_UNKNOWN_NODE');
    if (!allowed.has(edge.relationshipType)) throw new Error('SEMANTIC_RELATIONSHIP_TYPE_UNCONTROLLED');
  }
  const resolve = nodeCode => {
    const node = nodes.get(nodeCode);
    const semanticProfile = profiles.get(nodeCode);
    if (!node || !semanticProfile) throw new Error(`SEMANTIC_NODE_NOT_FOUND:${nodeCode}`);
    const relationships = (relationshipRegistry.relationships || []).filter(edge => edge.sourceNodeCode === nodeCode || edge.targetNodeCode === nodeCode);
    return Object.freeze({ node, semanticProfile, mechanisms, distinctions, boundaries, conceptFamilies, relationships });
  };
  return Object.freeze({
    contract: 'PHI-OS-CANONICAL-SEMANTIC-GRAPH-RUNTIME-v1.0.0',
    nodes: freezeMap(nodes), profiles: freezeMap(profiles), relationshipRegistry,
    mechanisms, distinctions, boundaries, conceptFamilies, resolve
  });
}
