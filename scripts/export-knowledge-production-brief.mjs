import fs from 'node:fs/promises';
import path from 'node:path';
import {
  ALLOWED_PACKAGE_STATUSES,
  BRIEF_SCHEMA_VERSION,
  CONTENT_FILES,
  DEFAULT_BRIEF_OUTPUT,
  DEFAULT_LOCALE,
  PACKAGE_FILES,
  PACKAGE_SCHEMA_VERSION,
  PRODUCTION_TOOL_VERSION,
  SCHEMA_PATHS,
  SCHEMA_VERSIONS
} from './lib/knowledge-production/production-config.mjs';
import { parseArgs, resolveInside } from './lib/knowledge-production/cli.mjs';
import {
  loadCanonicalContext,
  readJson,
  repositoryCommit
} from './lib/knowledge-production/repository-loader.mjs';
import {
  formatError,
  ProductionError
} from './lib/knowledge-production/production-errors.mjs';
import { loadKnowledgeAuthority } from './lib/knowledge-readiness/authority-loader.mjs';
import { resolveKnowledgeScope } from './lib/knowledge-readiness/scope-resolver.mjs';

const root = process.cwd();
const bullet = values => values?.length
  ? values.map(value => `- ${typeof value === 'string' ? value : JSON.stringify(value)}`).join('\n')
  : '- None.';
const jsonBlock = value => `\`\`\`json\n${JSON.stringify(value ?? null, null, 2)}\n\`\`\``;

function mergeSourceReferences(references = [], sources = [], locale = DEFAULT_LOCALE) {
  const merged = new Map();
  const ensure = sourceCode => {
    if (!merged.has(sourceCode)) {
      merged.set(sourceCode, {
        sourceCode,
        relationships: [],
        title: null
      });
    }
    return merged.get(sourceCode);
  };
  for (const reference of references) {
    if (!reference?.sourceCode) continue;
    const target = ensure(reference.sourceCode);
    if (
      reference.relationship &&
      !target.relationships.includes(reference.relationship)
    ) {
      target.relationships.push(reference.relationship);
    }
  }
  for (const source of sources) {
    if (!source?.sourceCode) continue;
    const target = ensure(source.sourceCode);
    target.title = typeof source.title === 'object'
      ? source.title?.[locale] ?? source.title?.[DEFAULT_LOCALE] ?? null
      : source.title ?? null;
  }
  return [...merged.values()];
}

function normalizeMustEstablish(items = []) {
  return items.map((item, index) => {
    if (typeof item === 'string') {
      return { label: `Mechanism ${index + 1}`, requirement: item };
    }
    return {
      label: item.label ?? item.mechanismCode ?? `Mechanism ${index + 1}`,
      requirement: item.requirement ?? item.statement ?? JSON.stringify(item)
    };
  });
}

function renderDistinction(item) {
  if (typeof item === 'string') return item;
  if (item.left && item.right) {
    return `${item.left} ≠ ${item.right}: ${item.reason ?? ''}`.trim();
  }
  return item.statement ?? JSON.stringify(item);
}

function normalizeReadiness(readiness, context, locale) {
  if (!readiness.readinessSchemaVersion) {
    return {
      ...readiness,
      includedScope: readiness.articleBoundary ?? [],
      excludedScope: readiness.prohibitedClaims ?? []
    };
  }
  const boundary = readiness.articleBoundary;
  const figure = readiness.figureBoundary;
  const localizedState = context.localizedIdentity;
  return {
    recordVersion: readiness.contentVersions?.readinessVersion ?? null,
    articleIdentity: {
      nodeCode: readiness.nodeCode,
      canonicalLanguage: readiness.locale
    },
    canonicalQuestion: readiness.canonicalIdentity.canonicalQuestion,
    publicTitle: readiness.canonicalIdentity.canonicalTitle,
    centralThesis: readiness.canonicalThesis.statement,
    readerTransformation: {
      from: readiness.canonicalThesis.necessity,
      to: readiness.canonicalThesis.systemRole,
      personalOutcomePromised: false
    },
    requiredMechanisms: normalizeMustEstablish(boundary.mustEstablish),
    requiredDistinctions: boundary.requiredDistinctions ?? [],
    prohibitedClaims: [
      ...(boundary.mustNotClaim?.global ?? []),
      ...(boundary.mustNotClaim?.partSpecific ?? []),
      ...(boundary.mustNotClaim?.nodeSpecific ?? [])
    ],
    includedScope: boundary.includedScope ?? [],
    excludedScope: boundary.excludedScope ?? [],
    sourceRequirement: {
      registeredPrimarySourceCodes:
        readiness.sourceBoundary.internalCanonicalSources ?? [],
      externalSourceNeeds: readiness.sourceBoundary.externalSourceDomains ?? [],
      externalSourcePreference: readiness.sourceBoundary.preferredSourceTypes ?? [],
      sourceCodesMayBeInvented: false,
      sourcePresenceEqualsClaimSupport: false,
      unresolvedSourceNeedBlocksApproval: true
    },
    visualRequirement: {
      visualRequired: figure.figureRequirement === 'required',
      briefOnly: true,
      assetCreated: Boolean(
        figure.requiredFigures?.some(item => item.assetCreated === true)
      ),
      assetCode: figure.requiredFigures?.find(item => item.assetCode)?.assetCode ?? null,
      purpose: figure.visualMechanism,
      mustNotDo: figure.prohibitedVisualClaims ?? [],
      registryRequirement: {
        requiredBeforeArticleReference: true,
        requiredFields: figure.accessibilityRequirements ?? []
      },
      reviewStatus: readiness.review?.status ?? 'not_assessed',
      publicationStatus: 'not_published'
    },
    nextNodeRequirement: {
      nodeCode: readiness.sequenceBoundary.nextNode?.[0] ?? null,
      relationship: 'nextNode',
      semanticBridge: readiness.sequenceBoundary.nextNodePreparation,
      publicLinkAllowedOnlyWhenNextNodePublished: true
    },
    editorialOutline: {
      status: 'not_started',
      articleBodyCreated: false
    },
    publicationRequirement: {
      requiredFinalState: {
        contentStatus: 'content_reviewed',
        reviewStatus: 'approved',
        publicationStatus: 'published'
      },
      currentCanonicalLocaleState: {
        contentStatus: localizedState.contentStatus ?? 'not_started',
        reviewStatus: localizedState.reviewStatus ?? 'not_reviewed',
        publicationStatus: localizedState.publicationStatus ?? 'not_published'
      }
    },
    productionLifecycle: {
      currentStage: 'production_ready',
      canonicalDraftCreated: false,
      humanApprovalGranted: false,
      publicationAuthorityGranted: false
    },
    locale
  };
}

function briefName(nodeCode, locale) {
  return locale === DEFAULT_LOCALE
    ? `${nodeCode}-production-brief.md`
    : `${nodeCode}.${locale}-production-brief.md`;
}

async function buildBrief(nodeCode, locale) {
  const [
    context,
    commit,
    editorial,
    policy,
    articleSchema
  ] = await Promise.all([
    loadCanonicalContext(root, nodeCode, locale),
    repositoryCommit(root),
    readJson(root, 'docs/pja/pja-w2a-canonical-article-editorial-contract-v1.json'),
    readJson(root, 'content/knowledge/governance/policies/pja-w2c-claim-source-review-policy.json'),
    readJson(root, SCHEMA_PATHS.article)
  ]);
  const {
    node,
    localizedIdentity,
    blueprintNode,
    readiness: rawReadiness
  } = context;
  const readiness = normalizeReadiness(rawReadiness, context, locale);
  const previousNodes = node.relationships?.prerequisiteNodeCodes || [];
  const nextNodes = node.relationships?.nextNodeCodes || [];
  const allowedBlocks = articleSchema.$defs.articleBlock.oneOf.map(reference => {
    const key = reference.$ref.split('/').at(-1);
    return articleSchema.$defs[key].properties.type.const;
  });
  const generatedAt = new Date().toISOString();
  const availableSourceReferences = mergeSourceReferences(
    node.sourceReferences,
    context.availableSources,
    locale
  );
  const currentLocaleState = readiness.publicationRequirement?.currentCanonicalLocaleState ?? {
    contentStatus: 'not_started',
    reviewStatus: 'not_reviewed',
    publicationStatus: 'not_published'
  };
  const futurePublicationTarget = readiness.publicationRequirement?.requiredFinalState ?? {
    contentStatus: 'content_reviewed',
    reviewStatus: 'approved',
    publicationStatus: 'published'
  };
  const assetCreated = readiness.visualRequirement?.assetCreated === true;
  const mediaBriefRequired = readiness.visualRequirement?.visualRequired === true;
  const figureContract = {
    sequence: [
      'media_brief',
      'asset_registry',
      'article_figure'
    ],
    mediaBriefRequired,
    mediaBriefFileRequiredInPackage: true,
    figureBlockState: assetCreated ? 'eligible_after_registry_validation' : 'deferred',
    figureBlockRequiredInCurrentArticle: false,
    assetRegistryRequiredBeforeArticleReference: true,
    assetCreated,
    compatibilityRule: assetCreated
      ? 'A Figure Block remains optional until the Asset Registry entry is valid and approved for reference.'
      : 'Article JSON must not be required to contain or reference a Figure Block while the asset does not exist.'
  };
  const identity = {
    nodeCode: node.nodeCode,
    domainCode: node.domainCode ?? null,
    themeCode: node.themeCode,
    canonicalTitle: blueprintNode.titleZhHans,
    canonicalQuestion: readiness.canonicalQuestion,
    nodeType: node.nodeType,
    status: node.registryStatus,
    previousNode: previousNodes[0] ?? null,
    nextNode: nextNodes,
    relationships: node.relationships
  };
  const localized = {
    localizedTitle: readiness.publicTitle ?? localizedIdentity.displayQuestion,
    localizedQuestion: localizedIdentity.displayQuestion,
    localizedSummary: localizedIdentity.localizedSummary ?? null,
    searchAliases: localizedIdentity.searchAliases ?? [],
    slug: localizedIdentity.slug
  };
  const markdown = `# ${nodeCode} Canonical Article Production Brief

> Controlled input snapshot only. This document is not a Source of Truth,
> approval record, publication record, or public article body.

## 1. Brief Identity

${jsonBlock({
    briefType: 'canonical_article_production_brief',
    briefSchemaVersion: BRIEF_SCHEMA_VERSION,
    generatedAt,
    generatorVersion: PRODUCTION_TOOL_VERSION,
    repositoryCommit: commit,
    nodeCode,
    locale,
    productionTarget: 'governance_compatible_draft_package'
  })}

## 2. Canonical Node Identity

${jsonBlock(identity)}

## 3. Localized Identity

${jsonBlock(localized)}

## 4. Canonical Thesis

${readiness.centralThesis}

## 5. Article Boundary

### Must Establish

${bullet(readiness.requiredMechanisms.map(
    item => `${item.label}: ${item.requirement}`
  ))}

### Required Distinctions

${bullet(readiness.requiredDistinctions.map(
    renderDistinction
  ))}

### Must Not Claim

${bullet(readiness.prohibitedClaims)}

### Included Scope

${bullet(readiness.includedScope)}

### Excluded Scope

${bullet(readiness.excludedScope)}

### Previous / Next / Supporting Question Boundary

${jsonBlock({
    previousNode: previousNodes[0] ?? null,
    nextNode: nextNodes,
    nextNodeRequirement: readiness.nextNodeRequirement ?? null,
    supportingQuestions: context.supportingQuestions,
    supportingQuestionFieldSemantics: {
      canonicalNodeCode: 'Sole Canonical ownership of the Supporting Question.',
      sourceNodeCode: 'Legacy, consolidation, or origin trace only; never Canonical ownership.',
      ownershipCardinality: 'Exactly one canonicalNodeCode; sourceNodeCode does not create dual ownership.'
    },
    paidContentBoundary: 'Public article must not reproduce restricted paid content.',
    runtimeBoundary: 'No Runtime read or write, Provider invocation, or case input.',
    professionalBoundary: 'No personal diagnosis, recommendation, or professional conclusion.'
  })}

## 6. Editorial Contract

${jsonBlock({
    articlePurpose: {
      type: 'public_knowledge_explanation',
      canonicalQuestion: readiness.canonicalQuestion,
      readerTransformation: readiness.readerTransformation
    },
    audience: {
      primary: 'public_reader',
      personalOutcomePromised: readiness.readerTransformation?.personalOutcomePromised === true
    },
    editorialPrinciples: editorial.editorialContract.frozenRules,
    languagePolicy: {
      canonicalLanguage: readiness.articleIdentity.canonicalLanguage,
      requestedLocale: locale,
      englishOnlyFromReviewedChineseVersion:
        editorial.editorialContract.frozenRules.englishOnlyFromReviewedChineseVersion,
      machineTranslationDoesNotGrantProductionReadiness: true
    },
    canonicalContinuity: {
      authority: 'Canonical Node Registry relationships',
      previousNode: previousNodes[0] ?? null,
      nextNode: nextNodes,
      nextNodeRequirement: readiness.nextNodeRequirement ?? null
    },
    articleCompletionBoundary: {
      requiredMechanisms: readiness.requiredMechanisms.length,
      requiredDistinctions: readiness.requiredDistinctions.length,
      prohibitedClaims: readiness.prohibitedClaims.length,
      includedScope: readiness.includedScope,
      excludedScope: readiness.excludedScope,
      contentCompletionEqualsReviewCompletion:
        editorial.editorialContract.frozenRules.contentCompletionEqualsReviewCompletion,
      publicationRequirement: readiness.publicationRequirement
    },
    aiAuthorityBoundary: {
      aiHasPublicationAuthority:
        editorial.editorialContract.frozenRules.aiHasPublicationAuthority,
      aiMayAdvanceWithoutHumanAuthorityThrough:
        editorial.productionLifecycle.aiMayAdvanceWithoutHumanAuthorityThrough,
      aiMaySelfAssignHumanOnlyStages:
        editorial.productionLifecycle.aiMaySelfAssignHumanOnlyStages
    },
    humanApprovalBoundary: {
      authority: 'Human editorial authority only',
      aiMayApprove: false,
      automatedValidatorMayApprove: false,
      requiredFor: ['article_approval', 'publication_ready', 'published']
    }
  })}

## 7. Structured Article Contract

${jsonBlock({
    articleSchemaPath: SCHEMA_PATHS.article,
    articleSchemaVersion: SCHEMA_VERSIONS.article,
    requiredFiles: PACKAGE_FILES,
    requiredRootFields: articleSchema.required,
    allowedBlockTypes: allowedBlocks,
    blockRestrictions: [
      'No rawHtml, script, style, iframe, arbitrary embed or javascript URL',
      'All blockCode and sectionCode values are unique and ordered',
      'No external image URL or Base64 image'
    ],
    connectionRules: 'previousNode and nextNode must match the Canonical Registry',
    figureRules: figureContract,
    accessibilityRequirements: 'Figure alt text is mandatory',
    rendererRestrictions: 'PJA-W2D allowlist and safe DOM behavior remain authoritative'
  })}

## 8. Claim Governance

${jsonBlock({
    claimTypes: policy.claimGovernance.claimTypes,
    materialityLevels: policy.claimGovernance.materiality,
    evidenceRequirements: 'Externally verifiable claims and source-required claims require mapped sources',
    qualificationRules: 'Interpretation and inference must be explicitly qualified',
    unresolvedClaimHandling: 'Retain as draft finding; never approve automatically',
    canonicalInterpretationRules: policy.claimGovernance.phiOsInterpretationRequiresCanonicalTrace,
    externalFactRules: {
      currentDraftRules: {
        generatedPackageStatus: 'draft',
        claimStatus: 'draft',
        reviewStatus: 'not_reviewed',
        publicationStatus: 'not_published',
        sourcePresenceEqualsClaimSupport: false,
        automatedApprovalAllowed: false
      },
      futurePublicationRules: {
        humanPublicationTargetOnly: true,
        requiredHighAndCriticalClaimStatus:
          policy.publicationGate.requiredClaimStateForHighAndCritical,
        requiredReviewStatus: policy.publicationGate.requiredReviewDecision,
        requiredPublicationStatus: policy.publicationGate.articleState.publicationStatus
      }
    },
    contraryEvidenceRules: policy.sourceGovernance.contraryEvidenceMustBeRecordable
  })}

## 9. Source Governance

${jsonBlock({
    sourceTypes: 'Defined by the formal Source Schema',
    authorityRequirements: policy.sourceGovernance.authorityLevels,
    reliabilityRequirements: 'Record quality assessment; reference-only cannot support high/critical claims',
    sourceVerificationRules: 'Validator checks structure and mappings only; it does not browse or verify truth',
    publicCitationRules: policy.publicationGate.publicSourceStatuses,
    noFabricationRules: readiness.sourceRequirement,
    unavailableSourceHandling: 'Mark unresolved, identify missing metadata, and create a blocking review finding'
  })}

## 10. Review Governance

${jsonBlock({
    reviewDimensions: policy.reviewGovernance.dimensions,
    allowedDraftStatus: ['draft', 'ready_for_human_review', 'changes_required'],
    forbiddenStatus: ['approved', 'publication_ready', 'published', 'human_approved'],
    blockingFindingRules: policy.publicationGate.blockingFindingSeverities,
    humanApprovalRequirement: true,
    versionBindingRequirement: policy.versionBinding.required,
    stateSeparation: {
      productionReadyIsArticleApproved: false,
      articleApprovedIsPublicationReady: false,
      publicationReadyIsPublished: false
    },
    currentDraftState: {
      packageStatus: 'draft',
      contentStatus: currentLocaleState.contentStatus ?? null,
      reviewStatus: currentLocaleState.reviewStatus ?? 'not_reviewed',
      publicationStatus: currentLocaleState.publicationStatus ?? 'not_published',
      articleApproved: false,
      publicationReady: false,
      published: false
    },
    futurePublicationTarget: {
      ...futurePublicationTarget,
      humanAuthorityRequired: true,
      targetOnly: true,
      generatedPackageMayAssumeTargetReached: false
    }
  })}

## 11. Node-specific Inputs

${jsonBlock({
    supportingQuestions: context.supportingQuestions,
    searchAliases: localized.searchAliases,
    previousNode: identity.previousNode,
    nextNode: identity.nextNode,
    availableSourceReferences,
    knownUnresolvedQuestions: readiness.sourceRequirement.externalSourceNeeds,
    requiredFigures: assetCreated && mediaBriefRequired
      ? [readiness.visualRequirement]
      : [],
    deferredFigureBriefs: !assetCreated && mediaBriefRequired
      ? [readiness.visualRequirement]
      : [],
    optionalFigures: node.derivativePolicy?.figure === 'optional'
      ? ['One governed optional figure']
      : [],
    figureContract,
    productionReadinessFindings: {
      recordVersion: readiness.recordVersion,
      centralThesisPresent: true,
      outlineStatus: readiness.editorialOutline.status,
      articleBodyCreated: readiness.editorialOutline.articleBodyCreated,
      publicationRequirement: readiness.publicationRequirement
    }
  })}

## 12. Package Output Contract

${jsonBlock({
    manifestFile: 'package-manifest.json',
    packageSchemaVersion: PACKAGE_SCHEMA_VERSION,
    requiredFields: [
      'packageType',
      'packageSchemaVersion',
      'nodeCode',
      'locale',
      'articleSchemaVersion',
      'claimSchemaVersion',
      'sourceDossierSchemaVersion',
      'reviewSchemaVersion',
      'mediaBriefSchemaVersion',
      'files',
      'generatedAt',
      'generatorType',
      'status'
    ],
    allowedStatus: ALLOWED_PACKAGE_STATUSES,
    requiredFiles: PACKAGE_FILES,
    manifestFileList: {
      exactFiles: CONTENT_FILES,
      unknownFilesAllowed: false,
      manifestSelfListed: false
    },
    checksum: {
      algorithm: 'SHA-256',
      input: 'original_file_bytes',
      encoding: 'lowercase_64_character_hex',
      requiredFor: CONTENT_FILES,
      manifestSelfChecksumRequired: false
    },
    schemaVersions: SCHEMA_VERSIONS,
    stateBoundary: {
      validationMeaning: 'Structurally valid and governance-compatible draft only.',
      approvalGranted: false,
      publicationReadyGranted: false,
      publishedGranted: false
    }
  })}

## 13. Forbidden Actions

- Do not modify Schema, Registry, Blueprint, Canonical Thesis, Previous Node or Next Node.
- Do not create a Canonical Node or fabricate a Source.
- Do not output raw HTML, iframe, script, executable content, remote embeds, or binary media.
- Do not set approved, publication_ready, published, or human_approved.
- Do not commit, push, deploy, invoke an AI API, or write to Runtime.
`;
  return { markdown, generatedAt, commit, context };
}

async function writeBrief(nodeCode, locale, options, {
  skipExisting = false
} = {}) {
  const outputDirectory = resolveInside(root, options.output || DEFAULT_BRIEF_OUTPUT);
  const outputPath = path.join(outputDirectory, briefName(nodeCode, locale));
  const reportPath = outputPath.replace(/\.md$/, '.report.json');
  const { markdown, generatedAt, commit, context } = await buildBrief(nodeCode, locale);
  try {
    await fs.access(outputPath);
    if (!options.force) {
      if (skipExisting) {
        return {
          status: 'SKIPPED',
          nodeCode,
          reason: 'OUTPUT_ALREADY_EXISTS',
          outputPath: path.relative(root, outputPath)
        };
      }
      throw new ProductionError(
        'OUTPUT_ALREADY_EXISTS',
        `Brief already exists: ${path.relative(root, outputPath)}.`,
        'Use --force only when intentional regeneration is required.'
      );
    }
    console.log(`OVERWRITE: ${path.relative(root, outputPath)}`);
  } catch (error) {
    if (error instanceof ProductionError) throw error;
  }
  await fs.mkdir(outputDirectory, { recursive: true });
  await fs.writeFile(outputPath, markdown, 'utf8');
  if (options['json-report']) {
    await fs.writeFile(reportPath, `${JSON.stringify({
      success: true,
      nodeCode,
      locale,
      outputPath: path.relative(root, outputPath),
      repositoryCommit: commit,
      warnings: [],
      errors: [],
      inputFiles: context.inputFiles,
      generatedAt
    }, null, 2)}\n`);
  }
  console.log(`BRIEF EXPORTED: ${path.relative(root, outputPath)}`);
  return {
    status: 'EXPORTED',
    nodeCode,
    outputPath: path.relative(root, outputPath)
  };
}

async function main() {
  const { positionals, options } = parseArgs(process.argv.slice(2), 0);
  const nodeCode = positionals[0] ?? null;
  if (positionals.length > 1 || nodeCode && options.scope) {
    throw new ProductionError(
      'NODE_CODE_INVALID',
      'Provide one Canonical Node code or one --scope selector, not both.'
    );
  }
  if (!nodeCode && !options.scope) {
    throw new ProductionError(
      'NODE_CODE_REQUIRED',
      'A Canonical Node code or --scope selector is required.'
    );
  }
  const locale = options.locale || DEFAULT_LOCALE;
  if (nodeCode) {
    await writeBrief(nodeCode, locale, options);
    return;
  }

  const authority = await loadKnowledgeAuthority(root);
  const resolved = resolveKnowledgeScope(authority, {
    scope: options.scope
  });
  const results = [];
  for (const node of resolved.nodes) {
    try {
      results.push(await writeBrief(node.nodeCode, locale, options, {
        skipExisting: true
      }));
    } catch (error) {
      if ([
        'CANONICAL_THESIS_NOT_READY',
        'READINESS_FILE_NOT_FOUND',
        'NODE_NOT_PRODUCTION_READY'
      ].includes(error.code)) {
        results.push({
          status: 'BLOCKED',
          nodeCode: node.nodeCode,
          reason: error.code
        });
      } else {
        results.push({
          status: 'FAILED',
          nodeCode: node.nodeCode,
          reason: error.code ?? 'IMPORT_CONFLICT',
          message: error.message
        });
      }
    }
  }
  for (const planned of resolved.plannedNodes) {
    results.push({
      status: 'SKIPPED',
      nodeCode: planned.blueprintNode.nodeCode,
      reason: 'CANONICAL_NODE_NOT_REGISTERED'
    });
  }
  for (const result of results) {
    console.log(`${result.nodeCode}  ${result.status}  ${result.reason ?? ''}`.trim());
  }
  const summary = {
    selector: resolved.selector,
    locale,
    exported: results.filter(result => result.status === 'EXPORTED').length,
    skipped: results.filter(result => result.status === 'SKIPPED').length,
    blocked: results.filter(result => result.status === 'BLOCKED').length,
    failed: results.filter(result => result.status === 'FAILED').length,
    results
  };
  console.log(
    `BATCH RESULT: Exported ${summary.exported}; Skipped ${summary.skipped}; ` +
    `Blocked ${summary.blocked}; Failed ${summary.failed}.`
  );
  if (options['json-report']) {
    const outputDirectory = resolveInside(root, options.output || DEFAULT_BRIEF_OUTPUT);
    await fs.mkdir(outputDirectory, { recursive: true });
    await fs.writeFile(
      path.join(outputDirectory, `${resolved.selector}-batch-report.json`),
      `${JSON.stringify(summary, null, 2)}\n`
    );
  }
  if (summary.failed) process.exitCode = 2;
}

main().catch(error => {
  console.error(formatError(error));
  process.exitCode = 2;
});
