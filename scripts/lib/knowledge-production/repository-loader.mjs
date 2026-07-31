import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  DEFAULT_LOCALE,
  SCHEMA_PATHS
} from './production-config.mjs';
import { ProductionError } from './production-errors.mjs';

const execFileAsync = promisify(execFile);
const NODE_PATTERN = /^KN-[A-Z0-9]+(?:-[A-Z0-9]+)*$/;

export async function readJson(root, relativePath, errorCode = 'SCHEMA_NOT_FOUND') {
  try {
    return JSON.parse(await fs.readFile(path.join(root, relativePath), 'utf8'));
  } catch (error) {
    throw new ProductionError(
      errorCode,
      `Cannot read valid JSON from ${relativePath}.`,
      'Confirm the authoritative repository file exists and contains valid JSON.',
      error.message
    );
  }
}

export async function repositoryCommit(root) {
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], {
      cwd: root,
      windowsHide: true
    });
    const commit = stdout.trim();
    if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('invalid SHA');
    return commit;
  } catch {
    throw new ProductionError(
      'IMPORT_CONFLICT',
      'Repository commit cannot be resolved.',
      'Run the tool inside a Git worktree with a valid HEAD.'
    );
  }
}

export function validateNodeCode(nodeCode) {
  if (!nodeCode) {
    throw new ProductionError('NODE_CODE_REQUIRED', 'A Canonical Node code is required.');
  }
  if (!NODE_PATTERN.test(nodeCode)) {
    throw new ProductionError(
      'NODE_CODE_INVALID',
      `Invalid Canonical Node code: ${nodeCode}.`,
      'Use the exact KN-... identifier from the Node Registry.'
    );
  }
}

export async function loadCanonicalContext(root, nodeCode, locale = DEFAULT_LOCALE, {
  requireReadiness = true
} = {}) {
  validateNodeCode(nodeCode);
  const [nodes, localized, blueprint, questions, sources] = await Promise.all([
    readJson(root, 'content/knowledge/registry/nodes.json', 'NODE_NOT_FOUND'),
    readJson(root, 'content/knowledge/registry/localized-content.json', 'LOCALIZED_CONTENT_NOT_FOUND'),
    readJson(root, 'content/knowledge/blueprints/book-1-knowledge-blueprint.json', 'NODE_NOT_FOUND'),
    readJson(root, 'content/knowledge/registry/supporting-questions.json', 'NODE_NOT_FOUND'),
    readJson(root, 'content/knowledge/registry/sources.json', 'NODE_NOT_FOUND')
  ]);
  const node = nodes.nodes.find(item => item.nodeCode === nodeCode);
  if (!node) throw new ProductionError('NODE_NOT_FOUND', `Node ${nodeCode} is not registered.`);
  const localizationRecord = localized.localizedContent.find(item => item.nodeCode === nodeCode);
  const localizedIdentity = localizationRecord?.locales?.[locale];
  if (!localizedIdentity) {
    throw new ProductionError(
      'LOCALIZED_CONTENT_NOT_FOUND',
      `Locale ${locale} is not registered for ${nodeCode}.`
    );
  }
  const blueprintNode = blueprint.nodes.find(item => item.nodeCode === nodeCode);
  if (!blueprintNode) {
    throw new ProductionError('NODE_NOT_FOUND', `${nodeCode} is absent from the Book I Blueprint.`);
  }
  const readinessRelative = `content/knowledge/editorial/readiness/${nodeCode.toLowerCase()}-production-readiness.json`;
  let readiness = null;
  try {
    readiness = await readJson(root, readinessRelative, 'READINESS_FILE_NOT_FOUND');
  } catch (error) {
    if (!requireReadiness && error.code === 'READINESS_FILE_NOT_FOUND') {
      readiness = null;
    } else if (error.code === 'READINESS_FILE_NOT_FOUND') {
      throw new ProductionError(
        'CANONICAL_THESIS_NOT_READY',
        `${nodeCode} has no frozen Canonical Thesis or Production Readiness.`,
        'Freeze the node thesis and readiness in a separate authorized governance stage.'
      );
    } else {
      throw error;
    }
  }
  if (requireReadiness && (!readiness?.centralThesis?.trim())) {
    if (
      readiness?.readinessSchemaVersion ===
      'PHI-OS-CANONICAL-PRODUCTION-READINESS-v1.0.0' &&
      readiness.canonicalThesis?.statement?.trim()
    ) {
      if (readiness.productionReadiness?.status !== 'production_ready') {
        throw new ProductionError(
          'NODE_NOT_PRODUCTION_READY',
          `${nodeCode} has not passed the human Production Readiness gate.`
        );
      }
      readiness = adaptUniversalReadiness(readiness);
    } else {
    throw new ProductionError(
      'CANONICAL_THESIS_NOT_READY',
      `${nodeCode} has no complete Canonical Thesis.`,
      'Do not infer a thesis from the title, question, another node, or a fixture.'
    );
    }
  }
  if (
    readiness &&
    (
      readiness.articleIdentity?.nodeCode !== nodeCode ||
      readiness.articleIdentity?.canonicalLanguage !== locale
    )
  ) {
    throw new ProductionError(
      'NODE_NOT_PRODUCTION_READY',
      `Production Readiness identity does not match ${nodeCode}/${locale}.`
    );
  }
  const supportingQuestions = questions.supportingQuestions.filter(
    question => node.supportingQuestionCodes?.includes(
      question.questionCode || question.supportingQuestionCode
    )
  );
  const availableSources = sources.sources.filter(source => (
    node.sourceReferences?.some(reference => reference.sourceCode === source.sourceCode)
  ));
  return {
    node,
    localizedIdentity,
    localizationRecord,
    blueprintNode,
    readiness,
    supportingQuestions,
    availableSources,
    inputFiles: [
      'content/knowledge/registry/nodes.json',
      'content/knowledge/registry/localized-content.json',
      'content/knowledge/registry/supporting-questions.json',
      'content/knowledge/registry/sources.json',
      'content/knowledge/blueprints/book-1-knowledge-blueprint.json',
      ...(readiness ? [readinessRelative] : [])
    ]
  };
}

function adaptUniversalReadiness(record) {
  return {
    recordVersion: record.productionReadiness.readinessVersion,
    articleIdentity: {
      nodeCode: record.nodeCode,
      canonicalLanguage: record.locale
    },
    canonicalQuestion: record.canonicalIdentity.localizedQuestion,
    publicTitle: record.canonicalIdentity.localizedTitle,
    centralThesis: record.canonicalThesis.statement,
    whyThisNodeExists:
      record.canonicalThesis.necessity || record.canonicalThesis.systemRole,
    requiredMechanisms: (record.articleBoundary.mustEstablish || []).map(
      requirement => ({ label: null, requirement })
    ),
    requiredDistinctions: record.articleBoundary.requiredDistinctions || [],
    prohibitedClaims: [...new Set([
      ...(record.articleBoundary.mustNotClaim || []),
      ...(record.claimBoundary.prohibitedClaims || [])
    ])],
    articleBoundary: [
      ...(record.articleBoundary.includedScope || []),
      ...(record.articleBoundary.excludedScope || [])
    ],
    includedScope: record.articleBoundary.includedScope || [],
    excludedScope: record.articleBoundary.excludedScope || [],
    sourceRequirement: {
      internalCanonicalSources: record.sourceBoundary.internalCanonicalSources,
      externalSourceNeeds: record.sourceBoundary.researchNeeded,
      preferredSourceTypes: record.sourceBoundary.preferredSourceTypes,
      sourceCodesMayBeInvented: false
    },
    visualRequirement: {
      figureRequirement: record.figureBoundary.figureRequirement,
      visualRequired: ['required', 'brief_required_asset_reference_deferred']
        .includes(record.figureBoundary.figureRequirement),
      mediaBriefRequired: ['required', 'brief_required_asset_reference_deferred']
        .includes(record.figureBoundary.figureRequirement),
      articleFigureBlockAllowed: false,
      assetCreated: false,
      assetCode: null,
      requiredFigures: record.figureBoundary.requiredFigures,
      registryRequirement: {
        requiredBeforeArticleReference: true
      },
      reviewStatus: record.review.status
    },
    nextNodeRequirement: {
      nodeCode: record.sequenceBoundary.nextNode,
      semanticBridge: record.canonicalThesis.continuity.toNextNode
    },
    editorialOutline: {
      status: record.review.status,
      articleBodyCreated: false
    },
    publicationRequirement: {
      productionReadiness: record.productionReadiness.status,
      humanFrozen: record.review.humanFrozen,
      published: false
    }
  };
}

export async function loadSchemas(root) {
  const entries = await Promise.all(Object.entries(SCHEMA_PATHS).map(async ([name, file]) => (
    [name, await readJson(root, file)]
  )));
  return Object.fromEntries(entries);
}
