import fs from 'node:fs/promises';
import path from 'node:path';
import {
  BRIEF_SCHEMA_VERSION,
  DEFAULT_BRIEF_OUTPUT,
  DEFAULT_LOCALE,
  PACKAGE_FILES,
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

const root = process.cwd();
const bullet = values => values?.length
  ? values.map(value => `- ${typeof value === 'string' ? value : JSON.stringify(value)}`).join('\n')
  : '- not_defined';
const jsonBlock = value => `\`\`\`json\n${JSON.stringify(value ?? 'not_defined', null, 2)}\n\`\`\``;

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
  const { node, localizedIdentity, blueprintNode, readiness } = context;
  const previousNodes = node.relationships?.prerequisiteNodeCodes || [];
  const nextNodes = node.relationships?.nextNodeCodes || [];
  const allowedBlocks = articleSchema.$defs.articleBlock.oneOf.map(reference => {
    const key = reference.$ref.split('/').at(-1);
    return articleSchema.$defs[key].properties.type.const;
  });
  const generatedAt = new Date().toISOString();
  const identity = {
    nodeCode: node.nodeCode,
    domainCode: node.domainCode ?? 'not_defined',
    themeCode: node.themeCode,
    canonicalTitle: blueprintNode.titleZhHans,
    canonicalQuestion: readiness.canonicalQuestion,
    nodeType: node.nodeType,
    status: node.registryStatus,
    previousNode: previousNodes.length ? previousNodes : 'not_defined',
    nextNode: nextNodes.length ? nextNodes : 'not_defined',
    relationships: node.relationships
  };
  const localized = {
    localizedTitle: readiness.publicTitle ?? localizedIdentity.displayQuestion,
    localizedQuestion: localizedIdentity.displayQuestion,
    localizedSummary: localizedIdentity.localizedSummary ?? 'not_defined',
    searchAliases: localizedIdentity.searchAliases ?? 'not_defined',
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

${bullet([
    ...readiness.requiredMechanisms.map(item => `${item.label}: ${item.requirement}`),
    ...readiness.requiredDistinctions.map(item => `${item.left} ≠ ${item.right}: ${item.reason}`)
  ])}

### Must Not Claim

${bullet(readiness.prohibitedClaims)}

### Included / Excluded Scope

${bullet(readiness.articleBoundary)}

### Previous / Next / Supporting Question Boundary

${jsonBlock({
    previousNode: previousNodes.length ? previousNodes : 'not_defined',
    nextNode: readiness.nextNodeRequirement,
    supportingQuestions: context.supportingQuestions,
    paidContentBoundary: 'Public article must not reproduce restricted paid content.',
    runtimeBoundary: 'No Runtime read or write, Provider invocation, or case input.',
    professionalBoundary: 'No personal diagnosis, recommendation, or professional conclusion.'
  })}

## 6. Editorial Contract

${jsonBlock({
    articlePurpose: editorial.editorialContract?.articlePurpose ?? 'public_knowledge_explanation',
    audience: editorial.editorialContract?.audience ?? 'public_reader',
    editorialPrinciples: editorial.authority?.contentAuthority ?? editorial.authority,
    languagePolicy: editorial.localization,
    canonicalContinuity: editorial.canonicalIdentity,
    articleCompletionBoundary: editorial.publication,
    aiAuthorityBoundary: editorial.aiAuthority,
    humanApprovalAuthority: 'Human editorial authority only'
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
    figureRules: 'Every figure reference must map to the package Media Brief; no binary media is accepted',
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
    externalFactRules: policy.publicationGate.requiredClaimStateForHighAndCritical,
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
    versionBindingRequirement: policy.versionBinding.required
  })}

## 11. Node-specific Inputs

${jsonBlock({
    supportingQuestions: context.supportingQuestions,
    searchAliases: localized.searchAliases,
    previousNode: identity.previousNode,
    nextNode: identity.nextNode,
    availableSourceReferences: [
      ...node.sourceReferences,
      ...context.availableSources.map(source => ({
        sourceCode: source.sourceCode,
        title: source.title
      }))
    ],
    knownUnresolvedQuestions: readiness.sourceRequirement.externalSourceNeeds,
    requiredFigures: readiness.visualRequirement.visualRequired
      ? [readiness.visualRequirement]
      : [],
    optionalFigures: node.derivativePolicy?.figure === 'optional'
      ? ['One governed optional figure']
      : [],
    productionReadinessFindings: {
      recordVersion: readiness.recordVersion,
      centralThesisPresent: true,
      outlineStatus: readiness.editorialOutline.status,
      articleBodyCreated: readiness.editorialOutline.articleBodyCreated,
      publicationRequirement: readiness.publicationRequirement
    }
  })}

## 12. Package Output Contract

${bullet(PACKAGE_FILES)}

- Manifest checksums use SHA-256 over original file bytes.
- Package status may be only draft, ready_for_human_review, or changes_required.
- Validation means structurally valid and governance-compatible draft only.

## 13. Forbidden Actions

- Do not modify Schema, Registry, Blueprint, Canonical Thesis, Previous Node or Next Node.
- Do not create a Canonical Node or fabricate a Source.
- Do not output raw HTML, iframe, script, executable content, remote embeds, or binary media.
- Do not set approved, publication_ready, published, or human_approved.
- Do not commit, push, deploy, invoke an AI API, or write to Runtime.
`;
  return { markdown, generatedAt, commit, context };
}

async function main() {
  const { positionals, options } = parseArgs(process.argv.slice(2), 1);
  const nodeCode = positionals[0];
  const locale = options.locale || DEFAULT_LOCALE;
  const outputDirectory = resolveInside(root, options.output || DEFAULT_BRIEF_OUTPUT);
  const outputPath = path.join(outputDirectory, briefName(nodeCode, locale));
  const reportPath = outputPath.replace(/\.md$/, '.report.json');
  const { markdown, generatedAt, commit, context } = await buildBrief(nodeCode, locale);
  try {
    await fs.access(outputPath);
    if (!options.force) {
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
}

main().catch(error => {
  console.error(formatError(error));
  process.exitCode = 2;
});
