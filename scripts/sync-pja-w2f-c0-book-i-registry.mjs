import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { isDeepStrictEqual } from 'node:util';

const root = process.cwd();
const apply = process.argv.includes('--apply');
const explicitDryRun = process.argv.includes('--dry-run');
if (apply && explicitDryRun) fail('ARGUMENT_CONFLICT', '--apply and --dry-run are mutually exclusive.');

const scope = process.argv.find(value => /^BOOK-/i.test(value)) || 'BOOK-1';
if (scope.toUpperCase() !== 'BOOK-1') fail('SCOPE_NOT_SUPPORTED', scope);

const paths = {
  blueprint: 'content/knowledge/blueprints/book-1-knowledge-blueprint.json',
  policy: 'content/knowledge/governance/book-1-registry-population-policy.json',
  nodes: 'content/knowledge/registry/nodes.json',
  localized: 'content/knowledge/registry/localized-content.json',
  collections: 'content/knowledge/registry/collections.json',
  themes: 'content/knowledge/registry/themes.json',
  sources: 'content/knowledge/registry/sources.json',
  supporting: 'content/knowledge/registry/supporting-questions.json'
};
const readJson = key => JSON.parse(fs.readFileSync(path.join(root, paths[key]), 'utf8'));
const documents = Object.fromEntries(Object.keys(paths).map(key => [key, readJson(key)]));
const clone = value => structuredClone(value);
const targetBlueprintNodes = documents.blueprint.nodes.filter(node => node.partCode !== 'P0');
const prefaceCodes = new Set(documents.blueprint.nodes.filter(node => node.partCode === 'P0').map(node => node.nodeCode));
const targetCodes = new Set(targetBlueprintNodes.map(node => node.nodeCode));
const finalCodes = new Set(documents.blueprint.nodes.map(node => node.nodeCode));
const policyByCode = uniqueMap(documents.policy.nodes, 'nodeCode', 'DUPLICATE_POLICY_NODE_CODE');
const currentNodes = uniqueMap(documents.nodes.nodes, 'nodeCode', 'DUPLICATE_NODE_CODE');
const currentLocalized = uniqueMap(documents.localized.localizedContent, 'nodeCode', 'DUPLICATE_LOCALIZED_IDENTITY');
const collectionByCode = uniqueMap(documents.collections.collections, 'collectionCode', 'DUPLICATE_COLLECTION_CODE');
const themeByCode = uniqueMap(documents.themes.themes, 'themeCode', 'DUPLICATE_THEME_CODE');
const sourceByCode = uniqueMap(documents.sources.sources, 'sourceCode', 'DUPLICATE_SOURCE_CODE');
const questionItems = documents.supporting.supportingQuestions || [];
const questionByCode = uniqueMap(questionItems, item => item.questionCode || item.supportingQuestionCode, 'DUPLICATE_SUPPORTING_QUESTION');
const explicitQuestionsByNode = new Map();
for (const question of questionItems) {
  const owner = question.canonicalNodeCode || question.primaryNodeCode || question.sourceNodeCode;
  const code = question.questionCode || question.supportingQuestionCode;
  if (owner && code) explicitQuestionsByNode.set(owner, [...(explicitQuestionsByNode.get(owner) || []), code]);
}

const conflicts = [];
const unresolvedSupportingQuestionMappings = [];
const unresolvedSourceMappings = [];
const nextNodes = clone(documents.nodes);
const nextLocalized = clone(documents.localized);
const nextNodeByCode = new Map(nextNodes.nodes.map(node => [node.nodeCode, node]));
const nextLocalizedByCode = new Map(nextLocalized.localizedContent.map(item => [item.nodeCode, item]));
const nodesToCreate = [];
const nodesToNormalize = [];
const localizedIdentitiesToCreate = [];
const localizedIdentitiesToNormalize = [];
let relationshipMappings = 0;
let supportingQuestionMappings = 0;
let sourceMappings = 0;

validatePolicy();
for (const [index, blueprintNode] of documents.blueprint.nodes.entries()) {
  if (!targetCodes.has(blueprintNode.nodeCode)) continue;
  const population = policyByCode.get(blueprintNode.nodeCode);
  if (!population) {
    addConflict('UNEXPECTED_EXISTING_TARGET_RECORD', blueprintNode.nodeCode, 'populationPolicy', null, null, 'populationPolicy', true);
    continue;
  }
  const collection = collectionByCode.get(population.collectionCode);
  const theme = themeByCode.get(population.themeCode);
  if (!collection) addConflict('COLLECTION_NOT_FOUND', blueprintNode.nodeCode, 'collectionCode', null, population.collectionCode, 'Collection Registry', true);
  if (!theme) addConflict('THEME_NOT_FOUND', blueprintNode.nodeCode, 'themeCode', null, population.themeCode, 'Theme Registry', true);
  if (theme && theme.collectionCode !== population.collectionCode) {
    addConflict('COLLECTION_THEME_ASSIGNMENT_CONFLICT', blueprintNode.nodeCode, 'themeCode', theme.collectionCode, population.collectionCode, 'Theme Registry', true);
  }

  const explicitQuestions = [...new Set(explicitQuestionsByNode.get(blueprintNode.nodeCode) || [])].sort();
  for (const code of explicitQuestions) if (!questionByCode.has(code)) {
    addConflict('EXPLICIT_SUPPORTING_QUESTION_MAPPING_TARGET_NOT_FOUND', blueprintNode.nodeCode, 'supportingQuestionCodes', null, code, 'Supporting Question Registry', true);
  }
  const explicitSources = (population.sourceReferences || []).map(reference => clone(reference));
  for (const reference of explicitSources) if (!sourceByCode.has(reference.sourceCode)) {
    addConflict('EXPLICIT_SOURCE_MAPPING_TARGET_NOT_FOUND', blueprintNode.nodeCode, 'sourceReferences', null, reference.sourceCode, 'Source Registry', true);
  }
  if (!explicitQuestions.length) unresolvedSupportingQuestionMappings.push(blueprintNode.nodeCode);
  if (!explicitSources.length) unresolvedSourceMappings.push(blueprintNode.nodeCode);
  supportingQuestionMappings += explicitQuestions.length;
  sourceMappings += explicitSources.length;

  const previous = documents.blueprint.nodes[index - 1]?.nodeCode || null;
  const next = documents.blueprint.nodes[index + 1]?.nodeCode || null;
  for (const target of [previous, next, ...(population.relatedNodeCodes || [])].filter(Boolean)) {
    if (!finalCodes.has(target)) addConflict('RELATIONSHIP_TARGET_NOT_FOUND', blueprintNode.nodeCode, 'relationships', null, target, 'Blueprint/Population Policy', true);
    if (target === blueprintNode.nodeCode) addConflict('RELATIONSHIP_SELF_REFERENCE', blueprintNode.nodeCode, 'relationships', target, target, 'Population Policy', true);
  }
  relationshipMappings += Number(Boolean(previous)) + Number(Boolean(next)) + (population.relatedNodeCodes || []).length;
  const proposedNode = buildNode(blueprintNode, population, previous, next, explicitSources, explicitQuestions);
  const proposedLocalized = buildLocalized(population);
  const existingNode = currentNodes.get(blueprintNode.nodeCode);
  const existingLocalized = currentLocalized.get(blueprintNode.nodeCode);
  if (!existingNode) {
    nodesToCreate.push(blueprintNode.nodeCode);
    nextNodes.nodes.push(proposedNode);
    nextNodeByCode.set(blueprintNode.nodeCode, proposedNode);
  } else if (!isDeepStrictEqual(existingNode, proposedNode)) {
    if (!isSafeC0Record(existingNode, blueprintNode.nodeCode)) {
      addConflict('UNEXPECTED_EXISTING_TARGET_RECORD', blueprintNode.nodeCode, 'nodeRecord', existingNode, proposedNode, 'Canonical Node Registry', true);
    } else {
      nodesToNormalize.push(blueprintNode.nodeCode);
      Object.assign(existingNode, proposedNode);
      const position = nextNodes.nodes.findIndex(node => node.nodeCode === blueprintNode.nodeCode);
      nextNodes.nodes[position] = proposedNode;
    }
  }
  if (!existingLocalized) {
    localizedIdentitiesToCreate.push(blueprintNode.nodeCode);
    nextLocalized.localizedContent.push(proposedLocalized);
    nextLocalizedByCode.set(blueprintNode.nodeCode, proposedLocalized);
  } else if (!isDeepStrictEqual(existingLocalized, proposedLocalized)) {
    if (!isSafeC0Localized(existingLocalized)) {
      addConflict('LOCALIZED_IDENTITY_CONFLICT', blueprintNode.nodeCode, 'localizedIdentity', existingLocalized, proposedLocalized, 'Localized Content Registry', true);
    } else {
      localizedIdentitiesToNormalize.push(blueprintNode.nodeCode);
      const position = nextLocalized.localizedContent.findIndex(item => item.nodeCode === blueprintNode.nodeCode);
      nextLocalized.localizedContent[position] = proposedLocalized;
    }
  }
}

nextNodes.nodes.sort((a, b) => orderOf(a.nodeCode) - orderOf(b.nodeCode));
nextLocalized.localizedContent.sort((a, b) => orderOf(a.nodeCode) - orderOf(b.nodeCode));
validateFinalState(nextNodes, nextLocalized);

const filesThatWouldChange = [];
if (!isDeepStrictEqual(documents.nodes, nextNodes)) filesThatWouldChange.push(paths.nodes);
if (!isDeepStrictEqual(documents.localized, nextLocalized)) filesThatWouldChange.push(paths.localized);
const report = {
  stage: 'PJA-W2F-C0', mode: apply ? 'apply' : 'dry-run', baselineNodeCount: documents.nodes.nodes.length,
  targetBlueprintOnlyCount: targetCodes.size,
  existingTargetCount: [...targetCodes].filter(code => currentNodes.has(code)).length,
  nodesToCreate, nodesToNormalize, localizedIdentitiesToCreate, localizedIdentitiesToNormalize,
  relationshipMappings, supportingQuestionMappings, sourceMappings,
  unresolvedSupportingQuestionMappings, unresolvedSourceMappings, conflicts, filesThatWouldChange
};
console.log(JSON.stringify(report, null, 2));
if (conflicts.length) process.exit(2);
if (!apply || filesThatWouldChange.length === 0) {
  if (apply) console.log('PJA-W2F-C0 apply no-op; Registry is byte-stable.');
  process.exit(0);
}

atomicWrite(paths.nodes, nextNodes);
atomicWrite(paths.localized, nextLocalized);
const rereadNodes = JSON.parse(fs.readFileSync(path.join(root, paths.nodes), 'utf8'));
const rereadLocalized = JSON.parse(fs.readFileSync(path.join(root, paths.localized), 'utf8'));
if (!isDeepStrictEqual(rereadNodes, nextNodes) || !isDeepStrictEqual(rereadLocalized, nextLocalized)) {
  fail('POST_WRITE_VERIFICATION_FAILED', 'Registry differs after atomic write.');
}
console.log('PJA-W2F-C0 Book I Canonical Registry Population applied.');

function buildNode(blueprintNode, population, previous, next, sources, questions) {
  const defaults = documents.policy.populationDefaults;
  return {
    nodeCode: blueprintNode.nodeCode,
    collectionCode: population.collectionCode,
    themeCode: population.themeCode,
    canonicalQuestionKey: population.canonicalQuestionKey,
    nodeType: defaults.nodeType,
    knowledgeLevel: defaults.knowledgeLevel,
    productionTier: defaults.productionTier,
    primaryAssetType: defaults.primaryAssetType,
    canonicalLanguage: documents.policy.canonicalLanguage,
    registryStatus: defaults.registryStatus,
    sourceReferences: sources,
    supportingQuestionCodes: questions,
    legacyNodeCodes: [],
    relationships: {
      prerequisiteNodeCodes: previous ? [previous] : [],
      nextNodeCodes: next ? [next] : [],
      relatedNodeCodes: [...new Set(population.relatedNodeCodes || [])].sort(),
      parentNodeCodes: [], childNodeCodes: []
    },
    version: defaults.recordVersion
  };
}

function buildLocalized(population) {
  const identity = population.localizedIdentity['zh-Hans'];
  return { nodeCode: population.nodeCode, locales: { 'zh-Hans': {
    locale: 'zh-Hans', displayTitle: identity.displayTitle,
    displayQuestion: identity.displayQuestion, slug: identity.slug
  } } };
}

function validatePolicy() {
  if (documents.policy.stage !== 'PJA-W2F-C0' || documents.policy.status !== 'population-policy-frozen') {
    fail('POPULATION_POLICY_NOT_FROZEN', documents.policy.stage);
  }
  if (targetCodes.size !== 65 || prefaceCodes.size !== 13 || finalCodes.size !== 78 || policyByCode.size !== 65) {
    fail('TARGET_SET_CONFLICT', `preface=${prefaceCodes.size}; target=${targetCodes.size}; planned=${finalCodes.size}; policy=${policyByCode.size}`);
  }
}

function validateFinalState(nodes, localized) {
  const nodeCodes = nodes.nodes.map(node => node.nodeCode);
  const localizedCodes = localized.localizedContent.map(item => item.nodeCode);
  if (new Set(nodeCodes).size !== nodeCodes.length) addConflict('DUPLICATE_NODE_CODE', null, 'nodeCode', null, null, 'Canonical Node Registry', true);
  if (new Set(localizedCodes).size !== localizedCodes.length) addConflict('DUPLICATE_LOCALIZED_IDENTITY', null, 'nodeCode', null, null, 'Localized Content Registry', true);
  if (nodeCodes.length !== 78 || ![...finalCodes].every(code => nodeCodes.includes(code))) addConflict('FINAL_NODE_SET_CONFLICT', null, 'nodes', nodeCodes.length, 78, 'Book I Blueprint', true);
  if (localizedCodes.length !== 78 || ![...finalCodes].every(code => localizedCodes.includes(code))) addConflict('FINAL_LOCALIZED_SET_CONFLICT', null, 'localizedContent', localizedCodes.length, 78, 'Book I Blueprint', true);
}

function isSafeC0Record(record, nodeCode) {
  if (!targetCodes.has(nodeCode)) return false;
  const forbidden = documents.policy.forbiddenWrites || [];
  return !forbidden.some(field => field in record && !['publicLanguagePlan', 'productionPriority'].includes(field));
}
function isSafeC0Localized(record) {
  return Object.keys(record.locales || {}).every(locale => locale === 'zh-Hans');
}
function addConflict(code, nodeCode, field, currentValue, proposedValue, authoritySource, resolutionRequired) {
  conflicts.push({ code, nodeCode, field, currentValue, proposedValue, authoritySource, resolutionRequired });
}
function orderOf(code) { const index = documents.blueprint.nodes.findIndex(node => node.nodeCode === code); return index < 0 ? Number.MAX_SAFE_INTEGER : index; }
function uniqueMap(items, key, conflictCode) {
  const map = new Map();
  for (const item of items || []) {
    const value = typeof key === 'function' ? key(item) : item[key];
    if (map.has(value)) fail(conflictCode, value);
    map.set(value, item);
  }
  return map;
}
function atomicWrite(relative, value) {
  const target = path.join(root, relative);
  const temporary = `${target}.pja-w2f-c0.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temporary, target);
}
function fail(code, detail) { console.error(`${code}: ${detail}`); process.exit(2); }
