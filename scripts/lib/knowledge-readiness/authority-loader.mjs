import fs from 'node:fs/promises';
import path from 'node:path';
import { sha256 } from '../knowledge-production/checksum.mjs';
import {
  ReadinessError,
  canonicalNodePattern
} from './readiness-config.mjs';

async function readJson(root, relativePath, code = 'BLUEPRINT_NOT_FOUND') {
  try {
    return JSON.parse(await fs.readFile(path.join(root, relativePath), 'utf8'));
  } catch (error) {
    throw new ReadinessError(
      code,
      `Cannot read valid JSON from ${relativePath}.`,
      null,
      error.message
    );
  }
}

async function discoverBlueprints(root) {
  const relativeDirectory = 'content/knowledge/blueprints';
  let names;
  try {
    names = await fs.readdir(path.join(root, relativeDirectory));
  } catch {
    throw new ReadinessError(
      'BLUEPRINT_NOT_FOUND',
      `Blueprint directory is missing: ${relativeDirectory}.`
    );
  }
  const blueprints = [];
  for (const name of names.filter(name => name.endsWith('.json')).sort()) {
    const relativePath = path.posix.join(relativeDirectory, name);
    const value = await readJson(root, relativePath);
    if (!Array.isArray(value.nodes) || !Array.isArray(value.parts)) continue;
    blueprints.push({ relativePath, value });
  }
  if (!blueprints.length) {
    throw new ReadinessError(
      'BLUEPRINT_NOT_FOUND',
      'No knowledge Blueprint with nodes and parts was discovered.'
    );
  }
  return blueprints;
}

function buildMembership(blueprints) {
  const membership = new Map();
  const planned = new Map();
  for (const blueprintEntry of blueprints) {
    const blueprint = blueprintEntry.value;
    const partByCode = new Map(blueprint.parts.map(part => [part.partCode, part]));
    for (const blueprintNode of blueprint.nodes) {
      if (!canonicalNodePattern(blueprintNode.nodeCode)) continue;
      const record = {
        blueprintPath: blueprintEntry.relativePath,
        blueprint,
        blueprintNode,
        part: partByCode.get(blueprintNode.partCode) ?? null,
        bookCode: blueprint.bookCode ?? null,
        bookTitle: blueprint.bookTitleZhHans ?? null
      };
      if (blueprintNode.status === 'registered') membership.set(blueprintNode.nodeCode, record);
      else planned.set(blueprintNode.nodeCode, record);
    }
  }
  return { membership, planned };
}

export async function loadKnowledgeAuthority(root) {
  const [
    nodes,
    localizedContent,
    supportingQuestions,
    learningPaths,
    searchAliases,
    sources,
    editorial,
    claimGovernance,
    articleSchema,
    blueprints
  ] = await Promise.all([
    readJson(root, 'content/knowledge/registry/nodes.json', 'CANONICAL_NODE_INVENTORY_EMPTY'),
    readJson(root, 'content/knowledge/registry/localized-content.json', 'LOCALIZED_CONTENT_NOT_READY'),
    readJson(root, 'content/knowledge/registry/supporting-questions.json', 'SUPPORTING_QUESTION_NOT_FOUND'),
    readJson(root, 'content/knowledge/registry/learning-paths.json', 'LEARNING_PATH_MISMATCH'),
    readJson(root, 'content/knowledge/registry/search-aliases.json', 'LOCALIZED_CONTENT_NOT_READY'),
    readJson(root, 'content/knowledge/registry/sources.json', 'SOURCE_BOUNDARY_NOT_READY'),
    readJson(root, 'docs/pja/pja-w2a-canonical-article-editorial-contract-v1.json', 'VERSION_BINDING_MISSING'),
    readJson(root, 'content/knowledge/governance/policies/pja-w2c-claim-source-review-policy.json', 'VERSION_BINDING_MISSING'),
    readJson(root, 'content/knowledge/schemas/article-v2.schema.json', 'VERSION_BINDING_MISSING'),
    discoverBlueprints(root)
  ]);
  if (!Array.isArray(nodes.nodes) || !nodes.nodes.length) {
    throw new ReadinessError(
      'CANONICAL_NODE_INVENTORY_EMPTY',
      'Canonical Node Registry contains no Nodes.'
    );
  }
  const { membership, planned } = buildMembership(blueprints);
  const localizedByNode = new Map(
    localizedContent.localizedContent.map(record => [record.nodeCode, record])
  );
  const questionsByCode = new Map(
    supportingQuestions.supportingQuestions.map(question => [question.questionCode, question])
  );
  const sourcesByCode = new Map(sources.sources.map(source => [source.sourceCode, source]));
  const aliasesByNode = new Map();
  for (const alias of searchAliases.searchAliases ?? []) {
    const nodeCode = alias.canonicalNodeCode ?? alias.nodeCode;
    if (!nodeCode) continue;
    if (!aliasesByNode.has(nodeCode)) aliasesByNode.set(nodeCode, []);
    aliasesByNode.get(nodeCode).push(alias);
  }
  const registryBytes = await fs.readFile(
    path.join(root, 'content/knowledge/registry/nodes.json')
  );
  const blueprintBindings = Object.fromEntries(blueprints.map(entry => [
    entry.relativePath,
    entry.value.contract ?? entry.value.version ?? null
  ]));
  return {
    root,
    nodes,
    registeredNodes: nodes.nodes,
    localizedContent,
    localizedByNode,
    supportingQuestions,
    questionsByCode,
    learningPaths,
    searchAliases,
    aliasesByNode,
    sources,
    sourcesByCode,
    editorial,
    claimGovernance,
    articleSchema,
    blueprints,
    membership,
    planned,
    versions: {
      registryVersion: nodes.version ?? null,
      registryHash: sha256(registryBytes),
      blueprintVersion: blueprintBindings,
      editorialContractVersion: editorial.contractId ?? editorial.version ?? null,
      articleSchemaVersion:
        articleSchema.properties?.schemaVersion?.const ??
        articleSchema.$id ??
        articleSchema.version ??
        null,
      claimGovernanceVersion:
        claimGovernance.contractId ?? claimGovernance.version ?? null
    }
  };
}

export function contextForNode(authority, nodeCode, locale) {
  const node = authority.registeredNodes.find(item => item.nodeCode === nodeCode);
  if (!node) {
    throw new ReadinessError(
      'CANONICAL_NODE_NOT_FOUND',
      `${nodeCode} is not present in the Canonical Node Registry.`
    );
  }
  const localizedRecord = authority.localizedByNode.get(nodeCode);
  const localized = localizedRecord?.locales?.[locale] ?? null;
  const membership = authority.membership.get(nodeCode) ?? null;
  const questions = (node.supportingQuestionCodes ?? []).map(questionCode => {
    const question = authority.questionsByCode.get(questionCode);
    if (!question) {
      throw new ReadinessError(
        'SUPPORTING_QUESTION_NOT_FOUND',
        `${nodeCode} references missing Supporting Question ${questionCode}.`
      );
    }
    return question;
  });
  return {
    node,
    localizedRecord,
    localized,
    membership,
    questions,
    aliases: authority.aliasesByNode.get(nodeCode) ?? [],
    sources: (node.sourceReferences ?? [])
      .map(reference => authority.sourcesByCode.get(reference.sourceCode))
      .filter(Boolean)
  };
}
