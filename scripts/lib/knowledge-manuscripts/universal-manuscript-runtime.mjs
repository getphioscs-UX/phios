
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const coded = (code, details = null) => Object.assign(new Error(code), { code, details });

export function loadUniversalManuscriptRuntime(root = process.cwd()) {
  const registryPath = path.join(root, 'content/knowledge/manuscripts/manuscript-registry.json');
  if (!fs.existsSync(registryPath)) throw coded('MANUSCRIPT_REGISTRY_MISSING');
  const registry = readJson(registryPath);
  const nodes = readJson(path.join(root, 'content/knowledge/registry/nodes.json'));
  const profiles = readJson(path.join(root, 'content/knowledge/semantic/semantic-profile-registry.json'));
  const nodeList = Array.isArray(nodes) ? nodes : (nodes.nodes || []);
  const profileList = Array.isArray(profiles) ? profiles : (profiles.profiles || []);
  const nodeMap = new Map(nodeList.map(node => [node.nodeCode, node]));
  const profileMap = new Map(profileList.map(profile => [profile.nodeCode, profile]));
  if (nodeMap.size !== profileMap.size) throw coded('SEMANTIC_PROFILE_COVERAGE_MISMATCH');

  const manifests = new Map();
  const inventories = new Map();
  for (const item of registry.manuscripts || []) {
    const manifest = readJson(path.join(root, item.manifestPath));
    const inventory = readJson(path.join(root, item.inventoryPath));
    if (inventory.sourceBookCode !== item.sourceBookCode) throw coded('MANUSCRIPT_BOOK_MISMATCH', { manuscriptCode: item.manuscriptCode });
    manifests.set(item.manuscriptCode, { ...item, manifest });
    inventories.set(item.manuscriptCode, inventory);
  }

  const candidateRegistry = readJson(path.join(root, 'content/knowledge/manuscripts/mapping-candidate-registry.json'));
  const approvedRegistry = readJson(path.join(root, 'content/knowledge/manuscripts/approved-mapping-registry.json'));

  function listManuscripts({ bookCode = null } = {}) {
    const values = [...manifests.values()];
    return bookCode ? values.filter(item => item.sourceBookCode === bookCode) : values;
  }

  function resolveSection(sectionCode) {
    for (const [manuscriptCode, inventory] of inventories) {
      const section = inventory.sections.find(item => item.sectionCode === sectionCode);
      if (section) return { manuscriptCode, inventory, section };
    }
    throw coded('SECTION_NOT_FOUND', { sectionCode });
  }

  function explainCandidate(nodeCode, sectionCode, role = 'supporting') {
    const node = nodeMap.get(nodeCode);
    const profile = profileMap.get(nodeCode);
    if (!node || !profile) throw coded('CANONICAL_NODE_NOT_FOUND', { nodeCode });
    const { section } = resolveSection(sectionCode);
    const heading = [section.startHeading, section.endHeading].filter(Boolean).join(' ');
    const concepts = [...(profile.searchConcepts || []), ...(profile.searchAliases || [])].filter(Boolean);
    const matched = concepts.filter(concept => heading.includes(concept));
    return {
      primaryReason: matched.length ? `Heading matches semantic concepts: ${matched.join(', ')}` : 'No exact semantic concept match; human review is required.',
      supportingReason: `Node ${nodeCode} is evaluated within ${section.partCode} without changing canonical identity.`,
      alternativeReason: 'Alternative status must be retained when mechanism or scope cannot be distinguished deterministically.',
      exclusionReason: 'Exclude when boundary, mechanism scope, or notThisNodeWhen conditions conflict.',
      mergeBoundary: 'Similarity never creates Canonical Authority or permits automatic merging.',
      role
    };
  }

  function generateCandidate({ nodeCode, sectionCode, role = 'supporting', confidence = 0.5 }) {
    const explanation = explainCandidate(nodeCode, sectionCode, role);
    return {
      candidateCode: `MC-${nodeCode}-${sectionCode}`,
      nodeCode,
      sectionCode,
      role,
      confidence,
      explanation: explanation.primaryReason,
      explanationDetail: explanation,
      status: 'human_review_required',
      humanReviewed: false
    };
  }

  return {
    registry,
    nodeMap,
    profileMap,
    manifests,
    inventories,
    candidateRegistry,
    approvedRegistry,
    listManuscripts,
    resolveSection,
    explainCandidate,
    generateCandidate
  };
}

export function reviewMappingCandidate(candidate, action, reviewer) {
  const allowed = new Set(['approve','reject','change_primary','add_supporting','remove_supporting','split_range','merge_range','request_reanalysis']);
  if (!allowed.has(action)) throw coded('MAPPING_REVIEW_ACTION_INVALID', { action });
  if (!reviewer || typeof reviewer !== 'string') throw coded('MAPPING_REVIEWER_REQUIRED');
  if (action !== 'approve') return { ...candidate, reviewAction: action, reviewer, authorityStatus: 'human_review_required' };
  return {
    mappingCode: `MAP-${candidate.nodeCode}-${candidate.sectionCode}`,
    nodeCode: candidate.nodeCode,
    sectionCode: candidate.sectionCode,
    authorityStatus: 'approved',
    approvedBy: reviewer,
    approvedAt: new Date().toISOString(),
    sourceRangeHash: candidate.sourceRangeHash || null
  };
}
