import { sha256 } from './checksum.mjs';
import { ProductionError } from './production-errors.mjs';

export const ARTICLE_GENERATOR_VERSION = 'PJA-W2F-B2-v1.0.0';
export const ARTICLE_DRAFT_SCHEMA_VERSION =
  'PHI-OS-GOVERNED-CANONICAL-ARTICLE-DRAFT-v1.0.0';
export const ARTICLE_PACKAGE_SCHEMA_VERSION =
  'PHI-OS-KNOWLEDGE-PACKAGE-v1.0.0';
export const ARTICLE_PACKAGE_ROOT = 'content/knowledge/production/articles';
export const ARTICLE_PACKAGE_FILES = Object.freeze([
  'article.md',
  'article.json',
  'claim-ledger.json',
  'source-ledger.json',
  'supporting-question-coverage.json',
  'media-brief.json',
  'package-manifest.json'
]);
export const ARTICLE_CONTENT_FILES = Object.freeze(
  ARTICLE_PACKAGE_FILES.filter(file => file !== 'package-manifest.json')
);
export const ARTICLE_LOCALES = Object.freeze(['zh-Hans', 'en']);
export const ARTICLE_STATES = Object.freeze({
  article: 'draft',
  review: 'not_reviewed',
  approval: 'not_approved',
  publication: 'not_publication_ready',
  package: 'draft'
});

const requiredBriefArrays = [
  ['articleBoundary', 'mustEstablish'],
  ['articleBoundary', 'requiredDistinctions'],
  ['articleBoundary', 'mustNotClaim'],
  ['articleBoundary', 'includedScope'],
  ['articleBoundary', 'excludedScope']
];

export function stableJson(value) {
  return `${JSON.stringify(sortValue(value), null, 2)}\n`;
}

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value).sort().map(key => [key, sortValue(value[key])])
  );
}

export function slugifyCode(nodeCode) {
  return nodeCode.toLowerCase();
}

export function localeCode(locale) {
  return locale === 'zh-Hans' ? 'ZH-HANS' : locale.toUpperCase();
}

export function stableArticleCode(nodeCode, locale) {
  return `ART-${nodeCode}-${localeCode(locale)}`;
}

export function stablePackageCode(nodeCode, locale, version) {
  return `PKG-${nodeCode}-${localeCode(locale)}-V${version.replaceAll('.', '-')}`;
}

export function stableMediaBriefCode(nodeCode, locale) {
  return `MBR-${nodeCode}-${localeCode(locale)}`;
}

export function evaluateArticleEligibility(item, loaded, assessment, locale) {
  const record = loaded.record;
  const legacy = loaded.legacy;
  const registeredState = item?.node?.registryStatus || null;
  const humanEditorialFreeze = legacy
    ? record.productionLifecycle?.humanApprovalGranted === true
    : record.review?.humanFrozen === true;
  const canonicalThesisState = legacy
    ? Boolean(record.centralThesis?.trim())
    : Boolean(record.canonicalThesis?.statement?.trim());
  const languageReady = legacy
    ? locale === record.articleIdentity?.canonicalLanguage
    : (
        locale === record.locale &&
        record.localizationReadiness?.languageStatus === 'production_ready'
      );
  const productionState = assessment.status;
  const blockingReasons = [];
  if (!registeredState) blockingReasons.push('CANONICAL_NODE_NOT_REGISTERED');
  if (!canonicalThesisState) blockingReasons.push('CANONICAL_THESIS_NOT_READY');
  if (!languageReady) blockingReasons.push('LOCALE_NOT_READY');
  if (!humanEditorialFreeze) {
    blockingReasons.push('HUMAN_EDITORIAL_FREEZE_REQUIRED');
  }
  if (productionState !== 'production_ready') {
    blockingReasons.push('NODE_NOT_PRODUCTION_READY');
  }
  return {
    canonicalNodeCode: item.nodeCode,
    locale,
    registeredState,
    canonicalThesisState: canonicalThesisState ? 'ready' : 'not_ready',
    readinessState: assessment.status,
    humanEditorialFreeze,
    productionState,
    briefExportState: blockingReasons.length ? 'blocked' : 'required',
    articleProductionEligibility: blockingReasons.length ? 'blocked' : 'eligible',
    blockingReasons: [...new Set(blockingReasons)]
  };
}

function section(markdown, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`^##\\s+${escaped}\\s*$`, 'm').exec(markdown);
  if (!match) return null;
  const tail = markdown.slice(match.index + match[0].length);
  const next = /^##\s/m.exec(tail);
  return (next ? tail.slice(0, next.index) : tail).trim() || null;
}

function subsection(markdown, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`^###\\s+${escaped}\\s*$`, 'm').exec(markdown);
  if (!match) return null;
  const tail = markdown.slice(match.index + match[0].length);
  const next = /^(?:###|##)\s/m.exec(tail);
  return (next ? tail.slice(0, next.index) : tail).trim() || null;
}

function jsonFromSection(markdown, heading) {
  const content = section(markdown, heading);
  const block = content?.match(/```json\s*([\s\S]*?)```/);
  if (!block) {
    throw new ProductionError(
      'PRODUCTION_BRIEF_CONTRACT_INVALID',
      `Production Brief section is missing JSON: ${heading}.`
    );
  }
  try {
    return JSON.parse(block[1]);
  } catch {
    throw new ProductionError(
      'PRODUCTION_BRIEF_CONTRACT_INVALID',
      `Production Brief JSON is invalid: ${heading}.`
    );
  }
}

function bulletValues(content) {
  if (!content) return [];
  return content.split(/\r?\n/)
    .map(line => line.match(/^\s*-\s+(.+?)\s*$/)?.[1])
    .filter(value => value && value !== 'None');
}

function normalizeQuestion(question, nodeCode) {
  return {
    supportingQuestionCode:
      question.questionCode || question.supportingQuestionCode,
    canonicalNodeCode:
      question.canonicalNodeCode || question.primaryNodeCode || nodeCode,
    questionText:
      question.locales?.['zh-Hans']?.displayQuestion ||
      question.questionText ||
      question.displayQuestion ||
      '',
    treatment:
      question.articleTreatment ||
      question.treatment ||
      'integrate',
    eligibility:
      question.supportingContentEligibility === false
        ? 'not_eligible'
        : 'eligible'
  };
}

export function parseProductionBrief(markdown) {
  if (typeof markdown !== 'string' || markdown.trim() === '') {
    throw new ProductionError(
      'PRODUCTION_BRIEF_CONTRACT_INVALID',
      'Production Brief is empty.'
    );
  }
  if (markdown.includes('not_defined')) {
    throw new ProductionError(
      'PRODUCTION_BRIEF_CONTRACT_INVALID',
      'Production Brief contains the forbidden not_defined sentinel.'
    );
  }
  const briefIdentity = jsonFromSection(markdown, '1. Brief Identity');
  const canonicalIdentity = jsonFromSection(markdown, '2. Canonical Node Identity');
  const localizedIdentity = jsonFromSection(markdown, '3. Localized Identity');
  const editorialContract = jsonFromSection(markdown, '6. Editorial Contract');
  const claimGovernance = jsonFromSection(markdown, '8. Claim Governance');
  const sourceGovernance = jsonFromSection(markdown, '9. Source Governance');
  const reviewGovernance = jsonFromSection(markdown, '10. Review Governance');
  const nodeInputs = jsonFromSection(markdown, '11. Node-specific Inputs');
  const outputContract = jsonFromSection(markdown, '12. Package Output Contract');
  const canonicalProposition = section(markdown, '4. Canonical Thesis');
  const articleBoundary = {
    mustEstablish: bulletValues(subsection(markdown, 'Must Establish')),
    requiredDistinctions: bulletValues(
      subsection(markdown, 'Required Distinctions')
    ),
    mustNotClaim: bulletValues(subsection(markdown, 'Must Not Claim')),
    includedScope: bulletValues(
      subsection(markdown, 'Included / Excluded Scope')
    ),
    excludedScope: []
  };
  const boundaryJson = subsection(
    markdown,
    'Previous / Next / Supporting Question Boundary'
  )?.match(/```json\s*([\s\S]*?)```/);
  let sequenceBoundary = {};
  if (boundaryJson) {
    try {
      sequenceBoundary = JSON.parse(boundaryJson[1]);
    } catch {
      throw new ProductionError(
        'PRODUCTION_BRIEF_CONTRACT_INVALID',
        'Production Brief sequence boundary JSON is invalid.'
      );
    }
  }
  const scopeValues = articleBoundary.includedScope;
  const included = [];
  const excluded = [];
  for (const value of scopeValues) {
    const mixed = value.match(/^(.*?)(?:，|；)\s*((?:不|不得|No |not |without).*)$/i);
    if (mixed && mixed[1].trim()) {
      included.push(mixed[1].trim());
      excluded.push(mixed[2].trim());
    } else if (/(?:不|不得|No |not |without)/i.test(value)) {
      excluded.push(value);
    } else {
      included.push(value);
    }
  }
  articleBoundary.includedScope = included;
  articleBoundary.excludedScope = excluded;
  const supportingQuestions = (
    sequenceBoundary.supportingQuestions ||
    nodeInputs.supportingQuestions ||
    []
  ).map(question => normalizeQuestion(question, canonicalIdentity.nodeCode));
  const sourceReferences = deduplicateBy(
    nodeInputs.availableSourceReferences || [],
    'sourceCode'
  );
  const mechanism = articleBoundary.mustEstablish.join('；');
  const normalized = {
    briefSchemaVersion: briefIdentity.briefSchemaVersion,
    productionBriefVersion:
      nodeInputs.productionReadinessFindings?.recordVersion ||
      briefIdentity.briefSchemaVersion,
    canonicalIdentity: {
      canonicalNodeCode: canonicalIdentity.nodeCode,
      canonicalTitle: canonicalIdentity.canonicalTitle,
      canonicalQuestion: canonicalIdentity.canonicalQuestion,
      locale: briefIdentity.locale,
      domainCode: canonicalIdentity.domainCode,
      themeCode: canonicalIdentity.themeCode,
      nodeType: canonicalIdentity.nodeType,
      slug: localizedIdentity.slug
    },
    canonicalProposition,
    whyThisNodeExists:
      localizedIdentity.localizedQuestion ||
      canonicalIdentity.canonicalQuestion,
    mechanism,
    articleBoundary,
    sequenceBoundary: {
      previousNode: sequenceBoundary.previousNode ?? null,
      nextNode:
        sequenceBoundary.nextNode?.nodeCode ??
        canonicalIdentity.nextNode?.[0] ??
        null,
      entryBoundary:
        sequenceBoundary.previousNode === null
          ? 'Canonical sequence entry'
          : `Continue from ${sequenceBoundary.previousNode}`,
      completionBoundary:
        editorialContract.articleCompletionBoundary,
      handoffBoundary:
        sequenceBoundary.nextNode?.semanticBridge ?? null
    },
    claimBoundary: claimGovernance,
    supportingQuestions,
    supportingQuestionFieldSemantics:
      sequenceBoundary.supportingQuestionFieldSemantics,
    sourcePlan: {
      ...sourceGovernance,
      sourceReferences
    },
    figureContract: nodeInputs.figureProductionContract,
    editorialContract,
    draftRules: {
      allowedStatus: reviewGovernance.allowedDraftStatus,
      forbiddenStatus: reviewGovernance.forbiddenStatus,
      humanApprovalRequirement: reviewGovernance.humanApprovalRequirement
    },
    futurePublicationGate: {
      claimGate: claimGovernance.futurePublicationGate,
      target:
        nodeInputs.productionReadinessFindings?.futureHumanPublicationTarget,
      informationalOnly:
        nodeInputs.productionReadinessFindings
          ?.futurePublicationTargetIsInformationalOnly === true
    },
    packageManifestContract: outputContract.packageManifestContract
  };
  normalized.productionBriefHash = sha256(Buffer.from(markdown));
  validateProductionBriefContract(normalized);
  return normalized;
}

export function validateProductionBriefContract(brief) {
  const requiredStrings = [
    ['briefSchemaVersion', brief.briefSchemaVersion],
    ['productionBriefVersion', brief.productionBriefVersion],
    ['canonicalIdentity.canonicalNodeCode',
      brief.canonicalIdentity?.canonicalNodeCode],
    ['canonicalIdentity.canonicalTitle', brief.canonicalIdentity?.canonicalTitle],
    ['canonicalIdentity.canonicalQuestion',
      brief.canonicalIdentity?.canonicalQuestion],
    ['canonicalIdentity.locale', brief.canonicalIdentity?.locale],
    ['canonicalProposition', brief.canonicalProposition],
    ['whyThisNodeExists', brief.whyThisNodeExists],
    ['mechanism', brief.mechanism],
    ['productionBriefHash', brief.productionBriefHash]
  ];
  for (const [name, value] of requiredStrings) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new ProductionError(
        'PRODUCTION_BRIEF_CONTRACT_INVALID',
        `Production Brief field is missing: ${name}.`
      );
    }
  }
  if (!ARTICLE_LOCALES.includes(brief.canonicalIdentity.locale)) {
    throw new ProductionError(
      'LOCALE_NOT_READY',
      `Unsupported article locale: ${brief.canonicalIdentity.locale}.`
    );
  }
  for (const [objectKey, arrayKey] of requiredBriefArrays) {
    if (!Array.isArray(brief[objectKey]?.[arrayKey])
      || brief[objectKey][arrayKey].length === 0) {
      throw new ProductionError(
        'PRODUCTION_BRIEF_CONTRACT_INVALID',
        `Production Brief array is incomplete: ${objectKey}.${arrayKey}.`
      );
    }
  }
  const objects = [
    'claimBoundary',
    'sourcePlan',
    'figureContract',
    'editorialContract',
    'draftRules',
    'futurePublicationGate',
    'packageManifestContract',
    'sequenceBoundary'
  ];
  for (const key of objects) {
    if (!brief[key] || typeof brief[key] !== 'object' || Array.isArray(brief[key])) {
      throw new ProductionError(
        'PRODUCTION_BRIEF_CONTRACT_INVALID',
        `Production Brief object is incomplete: ${key}.`
      );
    }
  }
  if (
    brief.draftRules.humanApprovalRequirement !== true ||
    brief.futurePublicationGate.informationalOnly !== true
  ) {
    throw new ProductionError(
      'PRODUCTION_BRIEF_CONTRACT_INVALID',
      'Draft and future publication authority are not separated.'
    );
  }
  if (
    !Array.isArray(brief.packageManifestContract.requiredFields) ||
    !Array.isArray(brief.packageManifestContract.requiredFiles) ||
    brief.packageManifestContract.checksumAlgorithm !== 'sha256'
  ) {
    throw new ProductionError(
      'PRODUCTION_BRIEF_CONTRACT_INVALID',
      'Package Manifest Contract is incomplete.'
    );
  }
  return true;
}

export function deduplicateBy(values, key) {
  const merged = new Map();
  for (const value of values || []) {
    const identity = value?.[key];
    if (!identity) continue;
    merged.set(identity, { ...(merged.get(identity) || {}), ...value });
  }
  return [...merged.values()].sort((a, b) => (
    String(a[key]).localeCompare(String(b[key]))
  ));
}
