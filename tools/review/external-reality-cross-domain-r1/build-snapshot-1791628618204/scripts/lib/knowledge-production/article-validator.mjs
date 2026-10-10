import fs from 'node:fs/promises';
import path from 'node:path';
import {
  ARTICLE_CONTENT_FILES,
  ARTICLE_DRAFT_SCHEMA_VERSION,
  ARTICLE_PACKAGE_FILES,
  ARTICLE_PACKAGE_SCHEMA_VERSION,
  ARTICLE_STATES
} from './article-package.mjs';
import { sha256 } from './checksum.mjs';

const finalStates = new Set([
  'approved',
  'publication_ready',
  'published',
  'human_approved',
  'editorially_approved'
]);
const internalMarkdownTokens = [
  'canonicalNodeCode',
  'claimCode',
  'sourceCode',
  'productionBriefHash',
  'reviewState',
  'internal path',
  'Governance Rule Code',
  'blockingReason'
];
const forbiddenPublicFields = new Set([
  'runtimeCaseOutput',
  'professionalRecommendationState',
  'individualProfile',
  'personalMedicalConclusion',
  'personalLegalConclusion',
  'personalTaxConclusion',
  'personalInvestmentConclusion',
  'paidBookOriginalText'
]);

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value).sort().map(key => [key, canonical(value[key])])
  );
}

function deepEqual(left, right) {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

function values(value) {
  if (Array.isArray(value)) return value.flatMap(values);
  if (value && typeof value === 'object') return Object.values(value).flatMap(values);
  return [value];
}

function keys(value) {
  if (Array.isArray(value)) return value.flatMap(keys);
  if (!value || typeof value !== 'object') return [];
  return [
    ...Object.keys(value),
    ...Object.values(value).flatMap(keys)
  ];
}

function parseJson(files, name, errors) {
  try {
    return JSON.parse(files.get(name).toString('utf8'));
  } catch {
    errors.push(`${name}: INVALID_JSON`);
    return null;
  }
}

async function readFiles(packageDirectory, errors) {
  let entries = [];
  try {
    entries = await fs.readdir(packageDirectory, { withFileTypes: true });
  } catch {
    errors.push('ARTICLE_PACKAGE_NOT_FOUND');
    return new Map();
  }
  const files = new Map();
  for (const entry of entries) {
    if (entry.isSymbolicLink() || !entry.isFile()) {
      errors.push(`${entry.name}: PACKAGE_ENTRY_NOT_REGULAR_FILE`);
      continue;
    }
    if (!ARTICLE_PACKAGE_FILES.includes(entry.name)) {
      errors.push(`${entry.name}: PACKAGE_UNKNOWN_FILE`);
      continue;
    }
    files.set(entry.name, await fs.readFile(path.join(packageDirectory, entry.name)));
  }
  for (const file of ARTICLE_PACKAGE_FILES) {
    if (!files.has(file)) errors.push(`${file}: PACKAGE_FILE_MISSING`);
  }
  return files;
}

function validateIdentity(objects, nodeCode, locale, articleCode, errors) {
  for (const [name, object] of objects) {
    if (!object) continue;
    if (object.canonicalNodeCode !== nodeCode) {
      errors.push(`${name}: CANONICAL_NODE_MISMATCH`);
    }
    if (object.locale && object.locale !== locale) {
      errors.push(`${name}: LOCALE_MISMATCH`);
    }
    if (object.articleCode && object.articleCode !== articleCode) {
      errors.push(`${name}: ARTICLE_CODE_MISMATCH`);
    }
  }
}

export async function validateArticleDraftPackage({
  packageDirectory,
  nodeCode,
  locale,
  brief = null,
  eligibility = null
}) {
  const errors = [];
  const warnings = [];
  const files = await readFiles(packageDirectory, errors);
  if (errors.length) return result();
  const article = parseJson(files, 'article.json', errors);
  const claims = parseJson(files, 'claim-ledger.json', errors);
  const sources = parseJson(files, 'source-ledger.json', errors);
  const coverage = parseJson(
    files,
    'supporting-question-coverage.json',
    errors
  );
  const media = parseJson(files, 'media-brief.json', errors);
  const manifest = parseJson(files, 'package-manifest.json', errors);
  if (errors.length) return result();
  const markdown = files.get('article.md').toString('utf8');
  if (eligibility && eligibility.articleProductionEligibility !== 'eligible') {
    errors.push('NODE_NOT_PRODUCTION_READY');
  }
  if (article.schemaVersion !== ARTICLE_DRAFT_SCHEMA_VERSION) {
    errors.push('ARTICLE_SCHEMA_VERSION_INVALID');
  }
  if (
    article.articleState !== ARTICLE_STATES.article ||
    article.reviewState !== ARTICLE_STATES.review ||
    article.approvalState !== ARTICLE_STATES.approval ||
    article.publicationState !== ARTICLE_STATES.publication
  ) errors.push('ARTICLE_STATE_ESCALATION');
  if (
    !Array.isArray(article.sections) ||
    article.sections.length < 6 ||
    new Set(article.sections.map(item => item.sectionCode)).size !==
      article.sections.length
  ) errors.push('ARTICLE_STRUCTURE_INCOMPLETE');
  validateIdentity([
    ['article.json', article],
    ['claim-ledger.json', claims],
    ['source-ledger.json', sources],
    ['supporting-question-coverage.json', coverage],
    ['media-brief.json', media],
    ['package-manifest.json', manifest]
  ], nodeCode, locale, article.articleCode, errors);
  const exposed = internalMarkdownTokens.filter(token => markdown.includes(token));
  if (exposed.length) {
    errors.push(`MARKDOWN_INTERNAL_FIELD_EXPOSED:${exposed.join(',')}`);
  }
  if (/CLM-KN-|SRC-[A-Z0-9-]+|PKG-KN-|MBR-KN-/.test(markdown)) {
    errors.push('MARKDOWN_INTERNAL_IDENTIFIER_EXPOSED');
  }
  const publicFields = keys(article).filter(key => forbiddenPublicFields.has(key));
  if (publicFields.length) errors.push('PUBLIC_PAID_BOUNDARY_VIOLATION');
  const allValues = [
    article,
    claims,
    sources,
    coverage,
    media,
    manifest
  ].flatMap(values);
  if (allValues.some(value => finalStates.has(value))) {
    errors.push('FINAL_AUTHORITY_STATE_FORBIDDEN');
  }
  const claimCodes = (claims.claims || []).map(claim => claim.claimCode);
  if (
    !claimCodes.length ||
    new Set(claimCodes).size !== claimCodes.length ||
    !deepEqual(article.claimCodes, claimCodes)
  ) errors.push('CLAIM_LEDGER_INVALID');
  for (const claim of claims.claims || []) {
    if (
      claim.canonicalNodeCode !== nodeCode ||
      claim.articleCode !== article.articleCode ||
      claim.reviewState !== 'not_reviewed' ||
      claim.approvalState !== 'not_approved'
    ) errors.push(`CLAIM_CONTRACT_INVALID:${claim.claimCode}`);
    if (
      claim.sourceRequirement === 'required' &&
      claim.sourceCodes.length === 0 &&
      claim.sourceState !== 'source_pending'
    ) errors.push(`CLAIM_SOURCE_STATE_INVALID:${claim.claimCode}`);
  }
  const sourceCodes = (sources.sources || []).map(source => source.sourceCode);
  if (
    new Set(sourceCodes).size !== sourceCodes.length ||
    !deepEqual(article.sourceCodes, sourceCodes)
  ) errors.push('SOURCE_LEDGER_INVALID');
  for (const source of sources.sources || []) {
    if (
      source.verificationState !== 'not_verified' ||
      source.reviewState !== 'not_reviewed'
    ) errors.push(`SOURCE_STATE_ESCALATION:${source.sourceCode}`);
  }
  const questionCodes = (coverage.questions || []).map(
    question => question.supportingQuestionCode
  );
  if (new Set(questionCodes).size !== questionCodes.length) {
    errors.push('SUPPORTING_QUESTION_DUPLICATED');
  }
  if (!deepEqual(
    article.supportingQuestionCoverage,
    (coverage.questions || []).map(item => ({
      supportingQuestionCode: item.supportingQuestionCode,
      coverageState: item.coverageState,
      articlePlacement: item.articlePlacement
    }))
  )) errors.push('SUPPORTING_QUESTION_COVERAGE_MISMATCH');
  if (media.assetState !== 'not_created' || media.assetCode !== null) {
    errors.push('FIGURE_ASSET_AUTHORITY_VIOLATION');
  }
  if (
    media.mediaBriefState === 'required' &&
    (
      media.articleFigureState !== 'deferred' ||
      article.figureReferences.length !== 0
    )
  ) errors.push('FIGURE_DEFERRED_SEQUENCE_INVALID');
  if (
    manifest.schemaVersion !== ARTICLE_PACKAGE_SCHEMA_VERSION ||
    manifest.packageSchemaVersion !== ARTICLE_PACKAGE_SCHEMA_VERSION ||
    manifest.packageStatus !== 'draft' ||
    manifest.status !== 'draft' ||
    manifest.checksum?.algorithm !== 'sha256' ||
    !deepEqual(manifest.requiredFiles, ARTICLE_PACKAGE_FILES)
  ) errors.push('PACKAGE_MANIFEST_INVALID');
  if (
    !Array.isArray(manifest.files) ||
    manifest.files.length !== ARTICLE_CONTENT_FILES.length
  ) errors.push('PACKAGE_MANIFEST_FILE_SET_INVALID');
  for (const file of manifest.files || []) {
    const bytes = files.get(file.path);
    if (
      !bytes ||
      file.sha256 !== sha256(bytes) ||
      file.sizeBytes !== bytes.length ||
      file.required !== true
    ) errors.push(`PACKAGE_CHECKSUM_MISMATCH:${file.path}`);
  }
  if (brief) {
    if (
      article.productionBriefHash !== brief.productionBriefHash ||
      manifest.productionBriefHash !== brief.productionBriefHash ||
      article.productionBriefVersion !== brief.productionBriefVersion ||
      manifest.productionBriefVersion !== brief.productionBriefVersion
    ) errors.push('PRODUCTION_BRIEF_BINDING_MISMATCH');
    for (const field of [
      'mustEstablish',
      'requiredDistinctions',
      'mustNotClaim',
      'includedScope',
      'excludedScope'
    ]) {
      if (!deepEqual(
        article.contractCoverage?.[field],
        brief.articleBoundary[field]
      )) errors.push(`ARTICLE_CONTRACT_COVERAGE_MISMATCH:${field}`);
    }
    if (
      media.articleFigureState === 'deferred' &&
      brief.figureContract.mediaBriefRequired !== true &&
      !['required', 'brief_required_asset_reference_deferred']
        .includes(brief.figureContract.figureRequirement)
    ) errors.push('FIGURE_CONTRACT_MISMATCH');
    const expectedQuestions = brief.supportingQuestions.map(
      question => question.supportingQuestionCode
    );
    if (!deepEqual(questionCodes, expectedQuestions)) {
      errors.push('SUPPORTING_QUESTION_TREATMENT_MISMATCH');
    }
  }
  if ((sources.sourceGaps || []).length) {
    warnings.push('SOURCE_GAPS_PRESENT');
  }
  return result({
    article,
    claims,
    sources,
    coverage,
    media,
    manifest
  });

  function result(parsed = null) {
    return {
      valid: errors.length === 0,
      nodeCode,
      locale,
      packageDirectory,
      errors,
      warnings,
      stateBoundary: {
        article: ARTICLE_STATES.article,
        review: ARTICLE_STATES.review,
        approval: ARTICLE_STATES.approval,
        publication: ARTICLE_STATES.publication
      },
      parsed
    };
  }
}
