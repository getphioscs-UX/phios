import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { isDeepStrictEqual } from 'node:util';

const root = process.cwd();
const apply = process.argv.includes('--apply');
const scope = process.argv.find(value => value.toUpperCase() === 'BOOK-1') || 'BOOK-1';
if (scope !== 'BOOK-1') {
  console.error(`Unsupported scope: ${scope}`);
  process.exit(1);
}

const relative = {
  blueprint: 'content/knowledge/blueprints/book-1-knowledge-blueprint.json',
  policy: 'content/knowledge/governance/book-1-registry-population-policy.json',
  nodes: 'content/knowledge/registry/nodes.json',
  localized: 'content/knowledge/registry/localized-content.json',
  collections: 'content/knowledge/registry/collections.json',
  themes: 'content/knowledge/registry/themes.json',
  sources: 'content/knowledge/registry/sources.json',
  supporting: 'content/knowledge/registry/supporting-questions.json'
};
const file = key => path.join(root, relative[key]);
const readJson = key => JSON.parse(fs.readFileSync(file(key), 'utf8'));
const writeJson = (key, value) => fs.writeFileSync(
  file(key), `${JSON.stringify(value, null, 2)}\n`, 'utf8'
);

const documents = Object.fromEntries(
  Object.keys(relative).map(key => [key, readJson(key)])
);
const blueprintNodes = documents.blueprint.nodes || [];
const policyNodes = documents.policy.nodes || [];
const policyByNode = new Map(policyNodes.map(item => [item.nodeCode, item]));
const blueprintByNode = new Map(blueprintNodes.map(item => [item.nodeCode, item]));
const registeredByNode = new Map(documents.nodes.nodes.map(item => [item.nodeCode, item]));
const localizedByNode = new Map(
  documents.localized.localizedContent.map(item => [item.nodeCode, item])
);
const collectionsByCode = new Map(
  documents.collections.collections.map(item => [item.collectionCode, item])
);
const themesByCode = new Map(
  documents.themes.themes.map(item => [item.themeCode, item])
);
const sourceCodes = new Set(documents.sources.sources.map(item => item.sourceCode));
const questionsByNode = new Map();
for (const question of documents.supporting.supportingQuestions || []) {
  const nodeCode = question.canonicalNodeCode || question.primaryNodeCode;
  if (!nodeCode) continue;
  const questionCode = question.questionCode || question.supportingQuestionCode;
  if (!questionCode) continue;
  questionsByNode.set(nodeCode, [...(questionsByNode.get(nodeCode) || []), questionCode]);
}

const defaults = documents.policy.populationDefaults;
const expectedNode = (blueprintNode, population) => {
  const index = blueprintNodes.findIndex(item => item.nodeCode === blueprintNode.nodeCode);
  const previousNode = blueprintNodes[index - 1]?.nodeCode || null;
  const nextNode = blueprintNodes[index + 1]?.nodeCode || null;
  const registeredQuestions = [...new Set(questionsByNode.get(blueprintNode.nodeCode) || [])].sort();
  const explicitSources = population.sourceReferences || [];
  const validSources = explicitSources.filter(reference => sourceCodes.has(reference.sourceCode));
  return {
    nodeCode: blueprintNode.nodeCode,
    collectionCode: population.collectionCode,
    themeCode: population.themeCode,
    canonicalQuestionKey: population.canonicalQuestionKey,
    nodeType: defaults.nodeType,
    knowledgeLevel: defaults.knowledgeLevel,
    productionTier: blueprintNode.articleRequiredNow ? 'tier_a' : 'tier_c',
    primaryAssetType: defaults.primaryAssetType,
    canonicalLanguage: documents.blueprint.canonicalLanguage,
    requiredPublicLanguages: blueprintNode.publicLanguagePlan,
    registryStatus: defaults.registryStatus,
    productionQueue: defaults.productionQueue,
    productionEffort: defaults.productionEffort,
    publicationPriority: blueprintNode.productionPriority,
    sourceReferences: validSources,
    supportingQuestionCodes: registeredQuestions,
    legacyNodeCodes: [],
    relationships: {
      prerequisiteNodeCodes: previousNode ? [previousNode] : [],
      nextNodeCodes: nextNode ? [nextNode] : [],
      relatedNodeCodes: [],
      parentNodeCodes: [],
      childNodeCodes: []
    },
    assetPolicy: defaults.assetPolicy,
    derivativePolicy: defaults.derivativePolicy,
    version: '1.0.0'
  };
};
const expectedLocalized = population => ({
  nodeCode: population.nodeCode,
  locales: {
    'zh-Hans': {
      locale: 'zh-Hans',
      contentRole: 'canonical',
      displayTitle: population.localizedIdentity['zh-Hans'].displayTitle,
      displayQuestion: population.localizedIdentity['zh-Hans'].displayQuestion,
      slug: population.localizedIdentity['zh-Hans'].slug,
      contentStatus: 'not_started',
      reviewStatus: 'not_reviewed',
      publicationStatus: 'not_published',
      articleAssetCode: null,
      masterMediaPostAssetCode: null
    }
  }
});

const additions = {
  collections: [], themes: [], nodes: [], localized: []
};
const conflicts = [];
const missingPolicyMapping = [];
let existingSourceMappings = 0;
let unresolvedSourceMappings = 0;
let existingQuestionMappings = 0;
let unresolvedQuestionMappings = 0;

for (const binding of documents.policy.collectionThemePolicy || []) {
  const existingCollection = collectionsByCode.get(binding.collection.collectionCode);
  if (!existingCollection) additions.collections.push(binding.collection);
  else if (!isDeepStrictEqual(existingCollection, binding.collection)) {
    conflicts.push({ code: 'COLLECTION_POLICY_CONFLICT', value: binding.collection.collectionCode });
  }
  const existingTheme = themesByCode.get(binding.theme.themeCode);
  if (!existingTheme) additions.themes.push(binding.theme);
  else if (!isDeepStrictEqual(existingTheme, binding.theme)) {
    conflicts.push({ code: 'THEME_POLICY_CONFLICT', value: binding.theme.themeCode });
  }
}

for (const blueprintNode of blueprintNodes.filter(item => item.partCode !== 'P0')) {
  const population = policyByNode.get(blueprintNode.nodeCode);
  if (!population) {
    missingPolicyMapping.push(blueprintNode.nodeCode);
    continue;
  }
  const node = expectedNode(blueprintNode, population);
  const localized = expectedLocalized(population);
  const existingNode = registeredByNode.get(node.nodeCode);
  const existingLocalized = localizedByNode.get(node.nodeCode);
  if (!existingNode) additions.nodes.push(node);
  else if (!isDeepStrictEqual(existingNode, node)) {
    conflicts.push({ code: 'REGISTRY_RECORD_CONFLICT', nodeCode: node.nodeCode });
  }
  if (!existingLocalized) additions.localized.push(localized);
  else if (!isDeepStrictEqual(existingLocalized, localized)) {
    conflicts.push({ code: 'LOCALIZED_IDENTITY_CONFLICT', nodeCode: node.nodeCode });
  }
  if (node.sourceReferences.length) existingSourceMappings += 1;
  else unresolvedSourceMappings += 1;
  if (node.supportingQuestionCodes.length) existingQuestionMappings += 1;
  else unresolvedQuestionMappings += 1;
}

const summary = {
  stage: 'PJA-W2F-C0',
  mode: apply ? 'apply' : 'dry-run',
  blueprintNodes: blueprintNodes.length,
  alreadyRegistered: blueprintNodes.filter(item => registeredByNode.has(item.nodeCode)).length,
  nodesToAdd: additions.nodes.length,
  localizationToAdd: additions.localized.length,
  collectionsToAdd: additions.collections.length,
  themesToAdd: additions.themes.length,
  missingPolicyMapping: missingPolicyMapping.length,
  existingSourceMappings,
  unresolvedSourceMappings,
  existingQuestionMappings,
  unresolvedQuestionMappings,
  conflicts
};
console.log(JSON.stringify(summary, null, 2));
if (missingPolicyMapping.length || conflicts.length) process.exit(2);
if (!apply) process.exit(0);

if (additions.collections.length) documents.collections.collections.push(...additions.collections);
if (additions.themes.length) documents.themes.themes.push(...additions.themes);
if (additions.nodes.length) documents.nodes.nodes.push(...additions.nodes);
if (additions.localized.length) documents.localized.localizedContent.push(...additions.localized);
writeJson('collections', documents.collections);
writeJson('themes', documents.themes);
writeJson('nodes', documents.nodes);
writeJson('localized', documents.localized);
console.log('PJA-W2F-C0 Book I Canonical Registry Population applied.');
