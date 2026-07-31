import fs from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { readJson } from './repository-loader.mjs';
import { ProductionError } from './production-errors.mjs';
import {
  DEFAULT_LOCALE,
  PRODUCTION_TOOL_VERSION,
  SCHEMA_VERSIONS
} from './production-config.mjs';

export const READINESS_SCHEMA_VERSION =
  'PHI-OS-CANONICAL-PRODUCTION-READINESS-v1.0.0';
export const READINESS_SCHEMA_PATH =
  'content/knowledge/editorial/schemas/canonical-production-readiness.schema.json';
export const READINESS_DIRECTORY = 'content/knowledge/editorial/readiness';
export const READINESS_INDEX_PATH =
  `${READINESS_DIRECTORY}/canonical-production-readiness-index.json`;
export const READINESS_STATUSES = Object.freeze([
  'not_assessed',
  'identity_ready',
  'thesis_draft',
  'boundary_draft',
  'ready_for_editorial_review',
  'changes_required',
  'production_ready',
  'production_blocked',
  'retired'
]);
export const READINESS_ERROR_CODES = Object.freeze([
  'KNOWLEDGE_SCOPE_INVALID',
  'KNOWLEDGE_SCOPE_EMPTY',
  'CANONICAL_NODE_NOT_FOUND',
  'CANONICAL_NODE_TYPE_INVALID',
  'CANONICAL_NODE_INVENTORY_EMPTY',
  'BOOK_NOT_FOUND',
  'PART_NOT_FOUND',
  'BLUEPRINT_NOT_FOUND',
  'BLUEPRINT_MEMBERSHIP_MISMATCH',
  'READINESS_FILE_NOT_FOUND',
  'READINESS_ALREADY_EXISTS',
  'READINESS_SCHEMA_INVALID',
  'CANONICAL_IDENTITY_MISMATCH',
  'CANONICAL_HIERARCHY_MISMATCH',
  'CANONICAL_THESIS_NOT_READY',
  'CANONICAL_THESIS_DUPLICATED',
  'PART_THESIS_NOT_READY',
  'BOOK_CONTINUITY_MISMATCH',
  'PART_CONTINUITY_MISMATCH',
  'NODE_CONTINUITY_MISMATCH',
  'PRODUCTION_BOUNDARY_NOT_READY',
  'MUST_ESTABLISH_MISSING',
  'MUST_NOT_CLAIM_MISSING',
  'INCLUDED_SCOPE_MISSING',
  'EXCLUDED_SCOPE_MISSING',
  'SUPPORTING_QUESTION_NOT_FOUND',
  'SUPPORTING_QUESTION_MAPPING_INCOMPLETE',
  'SUPPORTING_QUESTION_MULTI_ASSIGNED',
  'PREVIOUS_NODE_MISMATCH',
  'NEXT_NODE_MISMATCH',
  'LEARNING_PATH_MISMATCH',
  'CLAIM_BOUNDARY_NOT_READY',
  'SOURCE_BOUNDARY_NOT_READY',
  'FIGURE_BOUNDARY_NOT_READY',
  'PUBLIC_BOUNDARY_NOT_READY',
  'LOCALIZED_CONTENT_NOT_READY',
  'BLOCKING_FINDINGS_PRESENT',
  'PRODUCTION_STATUS_INVALID',
  'VERSION_BINDING_MISSING',
  'PRODUCTION_READY_REQUIREMENTS_NOT_MET'
]);

const romanToNumber = value => {
  const values = { I: 1, V: 5, X: 10, L: 50 };
  let result = 0;
  let previous = 0;
  for (const character of [...value].reverse()) {
    const current = values[character];
    if (!current) return null;
    result += current < previous ? -current : current;
    previous = current;
  }
  return result;
};

async function blueprintFiles(root) {
  const directory = path.join(root, 'content/knowledge/blueprints');
  const entries = await fs.readdir(directory);
  return entries.filter(file => file.endsWith('.json')).sort().map(file => (
    `content/knowledge/blueprints/${file}`
  ));
}

export async function loadKnowledgeInventory(root) {
  const [nodes, localized, questions, learningPaths, ...blueprints] =
    await Promise.all([
      readJson(root, 'content/knowledge/registry/nodes.json'),
      readJson(root, 'content/knowledge/registry/localized-content.json'),
      readJson(root, 'content/knowledge/registry/supporting-questions.json'),
      readJson(root, 'content/knowledge/registry/learning-paths.json'),
      ...await blueprintFiles(root).then(files => files.map(file => readJson(root, file)))
    ]);
  const blueprintMembership = new Map();
  const parts = new Map();
  blueprints.forEach((blueprint, bookIndex) => {
    const bookNumber = romanToNumber(
      blueprint.bookCode?.replace(/^BOOK-/, '') || ''
    ) || bookIndex + 1;
    for (const part of blueprint.parts || []) {
      parts.set(`${blueprint.bookCode}:${part.partCode}`, {
        ...part,
        bookCode: blueprint.bookCode,
        bookNumber,
        bookTitle: blueprint.bookTitleZhHans
      });
    }
    for (const blueprintNode of blueprint.nodes || []) {
      const part = parts.get(`${blueprint.bookCode}:${blueprintNode.partCode}`);
      blueprintMembership.set(blueprintNode.nodeCode, {
        blueprint,
        blueprintNode,
        part,
        bookNumber
      });
    }
  });
  const localizedMap = new Map(
    localized.localizedContent.map(item => [item.nodeCode, item])
  );
  const inventory = nodes.nodes.map((node, index) => {
    const membership = blueprintMembership.get(node.nodeCode);
    const localizedRecord = localizedMap.get(node.nodeCode);
    const supportingQuestions = questions.supportingQuestions.filter(question => (
      (question.canonicalNodeCode || question.primaryNodeCode) === node.nodeCode
    ));
    return {
      index,
      node,
      nodeCode: node.nodeCode,
      membership,
      blueprintNode: membership?.blueprintNode || null,
      blueprint: membership?.blueprint || null,
      part: membership?.part || null,
      bookCode: membership?.blueprint?.bookCode || null,
      bookNumber: membership?.bookNumber || null,
      partCode: membership?.blueprintNode?.partCode || null,
      localizedRecord,
      supportingQuestions,
      previousNode: node.relationships?.prerequisiteNodeCodes?.[0] || null,
      nextNode: node.relationships?.nextNodeCodes?.[0] || null,
      learningPaths: learningPaths.learningPaths.filter(item => (
        item.nodeCodes.includes(node.nodeCode)
      ))
    };
  });
  if (!inventory.length) {
    throw new ProductionError(
      'CANONICAL_NODE_INVENTORY_EMPTY',
      'Canonical Node Registry contains no knowledge nodes.'
    );
  }
  return {
    inventory,
    nodes,
    localized,
    questions,
    learningPaths,
    blueprints,
    parts: [...parts.values()]
  };
}

export function resolveKnowledgeScope(knowledge, {
  nodeCode = null,
  scope = null
} = {}) {
  if (nodeCode) {
    const match = knowledge.inventory.filter(item => item.nodeCode === nodeCode);
    if (!match.length) {
      throw new ProductionError(
        'CANONICAL_NODE_NOT_FOUND',
        `Canonical Node is not registered: ${nodeCode}.`
      );
    }
    return match;
  }
  const normalized = String(scope || 'ALL').toUpperCase();
  let result;
  if (normalized === 'ALL') {
    result = knowledge.inventory;
  } else if (normalized === 'PREFACE') {
    result = knowledge.inventory.filter(item => item.partCode === 'P0');
  } else if (/^BOOK-\d+$/.test(normalized)) {
    const number = Number(normalized.slice(5));
    result = knowledge.inventory.filter(item => item.bookNumber === number);
  } else if (/^PART-\d+$/.test(normalized)) {
    const partCode = `P${Number(normalized.slice(5))}`;
    result = knowledge.inventory.filter(item => item.partCode === partCode);
  } else if (/^KN-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(normalized)) {
    result = knowledge.inventory.filter(item => (
      item.nodeCode === normalized || item.nodeCode.startsWith(`${normalized}-`)
    ));
  } else {
    throw new ProductionError(
      'KNOWLEDGE_SCOPE_INVALID',
      `Unsupported knowledge scope: ${scope}.`
    );
  }
  if (!result.length) {
    throw new ProductionError(
      'KNOWLEDGE_SCOPE_EMPTY',
      `No registered Canonical Nodes match scope ${normalized}.`
    );
  }
  return result;
}

export function readinessPath(item, locale = DEFAULT_LOCALE) {
  const suffix = locale === DEFAULT_LOCALE ? '' : `.${locale}`;
  return `${READINESS_DIRECTORY}/${item.nodeCode.toLowerCase()}${suffix}-production-readiness.json`;
}

export function initializeReadinessRecord(item, knowledge, locale = DEFAULT_LOCALE) {
  const localized = item.localizedRecord?.locales?.[locale];
  if (!localized) {
    throw new ProductionError(
      'LOCALIZED_CONTENT_NOT_READY',
      `${item.nodeCode} has no ${locale} Localization Registry record.`
    );
  }
  const questionMappings = item.supportingQuestions.map(question => ({
    questionCode: question.questionCode || question.supportingQuestionCode,
    questionText: question.locales?.[locale]?.displayQuestion || '',
    primaryNodeCode: question.canonicalNodeCode || question.primaryNodeCode,
    relatedNodeCodes: question.relatedNodeCodes || [],
    relationshipType: question.questionType,
    coverageRole: question.publicationPolicy,
    articleTreatment: 'defer',
    searchAliasEligibility: false,
    supportingContentEligibility: true
  }));
  const missingFields = [
    'canonicalThesis.statement',
    'canonicalThesis.mechanism',
    'canonicalThesis.necessity',
    'canonicalThesis.systemRole',
    'articleBoundary.mustEstablish',
    'articleBoundary.mustNotClaim',
    'articleBoundary.includedScope',
    'articleBoundary.excludedScope',
    'claimBoundary',
    'sourceBoundary',
    'figureBoundary',
    'publicContentBoundary',
    'sequenceBoundary.editorialContinuity',
    'humanEditorialFreeze'
  ];
  return {
    readinessSchemaVersion: READINESS_SCHEMA_VERSION,
    nodeCode: item.nodeCode,
    locale,
    canonicalIdentity: {
      nodeCode: item.nodeCode,
      canonicalQuestionKey: item.node.canonicalQuestionKey,
      slug: localized.slug,
      localizedTitle: item.blueprintNode?.titleZhHans || localized.displayQuestion,
      localizedQuestion: localized.displayQuestion,
      registryStatus: item.node.registryStatus,
      blueprintStatus: item.blueprintNode?.status || 'not_registered'
    },
    hierarchy: {
      bookCode: item.bookCode,
      bookTitle: item.blueprint?.bookTitleZhHans || null,
      partCode: item.partCode,
      partTitle: item.part?.title || null,
      domainCode: item.node.domainCode || null,
      themeCode: item.node.themeCode || null,
      nodeCode: item.nodeCode,
      nodeType: item.node.nodeType
    },
    canonicalThesis: {
      thesisVersion: '0.1.0',
      statement: null,
      mechanism: null,
      necessity: null,
      systemRole: null,
      continuity: {
        fromPreviousNode: null,
        toNextNode: null
      }
    },
    articleBoundary: {
      boundaryVersion: '0.1.0',
      mustEstablish: [],
      requiredDistinctions: [],
      mustNotClaim: [],
      includedScope: [],
      excludedScope: [],
      assumptions: [],
      unresolvedQuestions: []
    },
    supportingQuestionBoundary: questionMappings,
    sequenceBoundary: {
      previousNode: item.previousNode,
      nextNode: item.nextNode,
      previousNodeContribution: null,
      currentNodeTransformation: null,
      nextNodePreparation: null,
      partContribution: null,
      bookContribution: null,
      systemContribution: null
    },
    claimBoundary: {
      requiredClaimFamilies: [],
      allowedClaimTypes: [],
      sourceRequiredClaims: [],
      internalCanonicalClaims: [],
      interpretiveClaims: [],
      analogyOnlyStatements: [],
      prohibitedClaims: [],
      qualificationRequirements: []
    },
    sourceBoundary: {
      sourcePlanVersion: '0.1.0',
      sourceRequirement: [],
      internalCanonicalSources: item.node.sourceReferences?.map(reference => reference.sourceCode) || [],
      externalSourceDomains: [],
      preferredSourceTypes: [],
      prohibitedSourceTypes: [],
      knownSources: item.node.sourceReferences?.map(reference => reference.sourceCode) || [],
      researchNeeded: [],
      verificationNeeded: [],
      citationSensitivity: null
    },
    figureBoundary: {
      figureRequirement: 'not_assessed',
      requiredFigures: [],
      optionalFigures: [],
      visualMechanism: null,
      prohibitedVisualClaims: [],
      accessibilityRequirements: [],
      assetSourceBoundary: []
    },
    publicContentBoundary: {
      publicKnowledgeBoundary: [],
      paidBookBoundary: [],
      runtimeJourneyBoundary: [],
      professionalServiceBoundary: [],
      enterpriseBoundary: [],
      developerBoundary: []
    },
    localizationReadiness: {
      localizedTitle: item.blueprintNode?.titleZhHans || localized.displayQuestion,
      localizedQuestion: localized.displayQuestion,
      canonicalThesis: 'not_ready',
      articleBoundary: 'not_ready',
      supportingQuestions: questionMappings.length
        ? 'ready_for_editorial_review'
        : 'not_ready',
      searchAliases: 'not_ready',
      terminologyReview: locale === DEFAULT_LOCALE ? 'not_ready' : 'pending',
      languageStatus: 'not_ready'
    },
    productionReadiness: {
      readinessVersion: '0.1.0',
      status: 'production_blocked',
      missingFields,
      blockingReasons: [
        'The initializer populated deterministic identity only.',
        'Canonical Thesis, boundaries and human editorial freeze are not complete.'
      ]
    },
    versionBinding: {
      registryVersion: knowledge.nodes.version,
      blueprintVersion: item.blueprint?.contract || 'not_defined',
      editorialContractVersion: 'PJA-W2A-v1.0.0',
      articleSchemaVersion: SCHEMA_VERSIONS.article,
      claimGovernanceVersion: 'PJA-W2C-v1.0.0',
      exporterVersion: PRODUCTION_TOOL_VERSION
    },
    review: {
      status: 'not_reviewed',
      humanFrozen: false,
      reviewedBy: null,
      reviewedAt: null,
      blockingFindings: [
        'Human editorial review has not frozen the theory or boundaries.'
      ]
    }
  };
}

export async function compileReadinessSchema(root) {
  const schema = await readJson(root, READINESS_SCHEMA_PATH);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  ajv.addFormat('date-time', value => !Number.isNaN(Date.parse(value)));
  return ajv.compile(schema);
}

export async function readReadiness(root, item, locale = DEFAULT_LOCALE) {
  const relative = readinessPath(item, locale);
  try {
    const record = await readJson(root, relative, 'READINESS_FILE_NOT_FOUND');
    return {
      relative,
      record,
      legacy: record.readinessSchemaVersion !== READINESS_SCHEMA_VERSION
    };
  } catch (error) {
    throw error;
  }
}

export function validateReadinessRecord(item, loaded, schemaValidator) {
  const errors = [];
  const { record, legacy } = loaded;
  if (legacy) {
    if (
      record.articleIdentity?.nodeCode !== item.nodeCode ||
      record.articleIdentity?.canonicalLanguage !== item.node.canonicalLanguage
    ) {
      errors.push('CANONICAL_IDENTITY_MISMATCH');
    }
    return {
      schemaValid: errors.length === 0,
      errors,
      status: record.productionLifecycle?.humanApprovalGranted
        ? 'production_ready'
        : 'ready_for_editorial_review',
      thesisStatus: record.centralThesis ? 'ready_for_editorial_review' : 'not_ready',
      boundaryStatus: record.articleBoundary?.length
        ? 'ready_for_editorial_review'
        : 'not_ready',
      exportability: record.centralThesis ? 'single_node_legacy_exportable' : 'blocked',
      blockingReason: record.productionLifecycle?.humanApprovalGranted
        ? null
        : 'HUMAN_EDITORIAL_FREEZE_REQUIRED',
      missingFields: record.productionLifecycle?.humanApprovalGranted
        ? []
        : ['humanEditorialFreeze']
    };
  }
  if (!schemaValidator(record)) errors.push('READINESS_SCHEMA_INVALID');
  if (record.nodeCode !== item.nodeCode || record.canonicalIdentity?.nodeCode !== item.nodeCode) {
    errors.push('CANONICAL_IDENTITY_MISMATCH');
  }
  if (
    record.hierarchy?.bookCode !== item.bookCode ||
    record.hierarchy?.partCode !== item.partCode ||
    record.hierarchy?.themeCode !== (item.node.themeCode || null)
  ) errors.push('CANONICAL_HIERARCHY_MISMATCH');
  if (record.sequenceBoundary?.previousNode !== item.previousNode) {
    errors.push('PREVIOUS_NODE_MISMATCH');
  }
  if (record.sequenceBoundary?.nextNode !== item.nextNode) {
    errors.push('NEXT_NODE_MISMATCH');
  }
  const registeredQuestions = new Set(
    item.supportingQuestions.map(question => (
      question.questionCode || question.supportingQuestionCode
    ))
  );
  if (record.supportingQuestionBoundary?.some(mapping => (
    !registeredQuestions.has(mapping.questionCode) ||
    mapping.primaryNodeCode !== item.nodeCode
  ))) errors.push('SUPPORTING_QUESTION_MAPPING_INCOMPLETE');
  const status = record.productionReadiness?.status;
  if (!READINESS_STATUSES.includes(status)) errors.push('PRODUCTION_STATUS_INVALID');
  if (
    record.locale !== item.node.canonicalLanguage &&
    !item.localizedRecord?.locales?.[record.locale]
  ) errors.push('LOCALIZED_CONTENT_NOT_READY');
  if (
    record.canonicalThesis?.statement &&
    [
      record.canonicalIdentity.localizedTitle,
      record.canonicalIdentity.localizedQuestion
    ].includes(record.canonicalThesis.statement)
  ) errors.push('CANONICAL_THESIS_NOT_READY');
  if (
    status === 'production_ready' &&
    (
      record.productionReadiness.missingFields.length ||
      record.productionReadiness.blockingReasons.length ||
      record.review.blockingFindings.length ||
      !record.review.humanFrozen ||
      !record.canonicalThesis.statement ||
      !record.articleBoundary.mustEstablish.length ||
      !record.articleBoundary.mustNotClaim.length ||
      !record.articleBoundary.includedScope.length ||
      !record.articleBoundary.excludedScope.length ||
      !record.claimBoundary.requiredClaimFamilies.length ||
      !record.sourceBoundary.sourceRequirement.length ||
      record.figureBoundary.figureRequirement === 'not_assessed' ||
      !record.publicContentBoundary.publicKnowledgeBoundary.length ||
      !record.sequenceBoundary.currentNodeTransformation ||
      Object.values(record.versionBinding).some(value => !value)
    )
  ) errors.push('PRODUCTION_READY_REQUIREMENTS_NOT_MET');
  return {
    schemaValid: errors.length === 0,
    errors,
    status,
    thesisStatus: record.canonicalThesis?.statement ? 'ready_for_editorial_review' : 'not_ready',
    boundaryStatus: record.articleBoundary?.mustEstablish?.length
      ? 'ready_for_editorial_review'
      : 'not_ready',
    exportability: status === 'production_ready' ? 'exportable' : 'blocked',
    blockingReason: record.productionReadiness?.blockingReasons?.[0] || errors[0] || null,
    missingFields: record.productionReadiness?.missingFields || []
  };
}
