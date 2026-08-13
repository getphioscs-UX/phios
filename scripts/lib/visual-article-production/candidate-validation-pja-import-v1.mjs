import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildCanonicalBriefV2, serialize } from '../knowledge-production/canonical-brief-v2.mjs';
import { buildCandidateTemplate, validateZhHansCandidate, importZhHansCandidate } from '../knowledge-production/zh-hans-candidate-v1.mjs';
import { validateCandidate as validatePublicMarkdownCandidate } from '../knowledge-production/governed-editorial-generation.mjs';

export const VAP_W8_BASELINE = '78cd282f8677e8da45bc168a28e6e8e563c4a681';
export const VAP_W8_BATCH = 'VAP-ARTICLE-BATCH-001';
export const VAP_W8_LOCALE = 'zh-Hans';
export const VAP_W8_CONTRACT = 'content/production/visual-article/contracts/vap-w8-candidate-validation-pja-import-v1.json';
export const VAP_W8_POLICY = 'content/production/visual-article/policies/vap-w8-candidate-validation-policy-v1.json';
export const VAP_W8_VALIDATION = 'content/production/visual-article/validation/vap-article-batch-001-candidate-validation-v1.json';
export const VAP_W8_IMPORT = 'content/production/visual-article/import/vap-article-batch-001-pja-import-v1.json';
export const VAP_W8_ACTIVATION = 'content/production/visual-article/activation/vap-w8-candidate-validation-pja-import-v1.json';
export const VAP_W8_DECISIONS = 'content/production/visual-article/decisions/vap-w6a-batch-001-human-decisions-v1.json';
export const VAP_W8_REVIEW = 'content/production/visual-article/review/vap-w6a-batch-001-human-review-v1.json';
export const VAP_W8_ELIGIBILITY = 'content/production/visual-article/eligibility/vap-article-batch-001-execution-eligibility-v1.json';
export const VAP_W8_SESSION = 'dist/knowledge-production-candidates/VAP-ARTICLE-BATCH-001/session-generation-manifest.json';

const normalize = value => String(value).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const hex = value => crypto.createHash('sha256').update(value).digest('hex');
export const textDigest = value => `sha256:${hex(normalize(value))}`;
export const bytesDigest = value => `sha256:${hex(value)}`;
export const stableJson = value => serialize(value);
const exists = file => fs.access(file).then(() => true, () => false);
const fail = (code, message) => Object.assign(new Error(`${code}: ${message}`), { code });
const readJson = async (root, relative) => JSON.parse(await fs.readFile(path.join(root, relative), 'utf8'));

function normalizedText(value) {
  return String(value ?? '').replace(/[^\u3400-\u9fffA-Za-z0-9]/g, '');
}
function bigrams(value) {
  const source = normalizedText(value);
  const result = new Set();
  for (let index = 0; index < source.length - 1; index += 1) result.add(source.slice(index, index + 2));
  return result;
}
export function tokenCoverage(source, target) {
  const expected = bigrams(source);
  if (!expected.size) return 1;
  const actual = bigrams(target);
  const matched = [...expected].filter(token => actual.has(token)).length;
  return Number((matched / expected.size).toFixed(3));
}
function sameStrings(left = [], right = []) {
  return JSON.stringify(left.map(String)) === JSON.stringify(right.map(String));
}
function canonicalMustEstablish(brief) {
  return (brief.articleBoundary?.mustEstablish || []).map(item => typeof item === 'string' ? item : item.requirement);
}
function extractTitle(markdown) {
  return normalize(markdown).match(/^#\s+(.+)$/m)?.[1]?.trim() || null;
}
function extractHeadings(markdown) {
  return [...normalize(markdown).matchAll(/^#{2,4}\s+(.+)$/gm)].map(match => match[1].trim());
}
function extractSummary(markdown) {
  const lines = normalize(markdown).split('\n');
  let seenTitle = false;
  const paragraph = [];
  for (const line of lines) {
    if (!seenTitle) {
      if (/^#\s+/.test(line)) seenTitle = true;
      continue;
    }
    if (/^#{1,6}\s+/.test(line) && !paragraph.length) continue;
    if (!line.trim()) {
      if (paragraph.length) break;
      continue;
    }
    if (/^#{1,6}\s+/.test(line)) break;
    paragraph.push(line.trim());
  }
  return paragraph.join(' ').replace(/\s+/g, ' ').trim();
}
function terminologyUsed(brief, markdown) {
  return (brief.terminologyProjection?.terms || [])
    .filter(term => term['zh-Hans'] && markdown.includes(term['zh-Hans']))
    .map(term => term.termCode);
}
function externalFactIndicators(markdown) {
  const patterns = [
    ['URL', /https?:\/\//i],
    ['DOI', /\bdoi\s*:/i],
    ['NUMERIC_PERCENT', /\d+(?:\.\d+)?\s*%/],
    ['STUDY_CLAIM', /研究(?:显示|发现|指出)|数据显示|根据.{0,20}研究/],
    ['BRACKET_CITATION', /\[[0-9]{1,3}\]/]
  ];
  return patterns.filter(([, pattern]) => pattern.test(markdown)).map(([code]) => code);
}
function currentImportPath(nodeCode) {
  return `content/knowledge/production/candidates/zh-Hans/${nodeCode}/candidate.v1.json`;
}

function successorEquivalentCandidate(existing, proposed) {
  return existing?.candidateCode === proposed?.candidateCode &&
    existing?.nodeCode === proposed?.nodeCode &&
    existing?.locale === proposed?.locale &&
    existing?.candidateState === proposed?.candidateState &&
    serialize(existing?.article) === serialize(proposed?.article) &&
    existing?.sourceBrief?.briefCode === proposed?.sourceBrief?.briefCode &&
    existing?.sourceBrief?.briefSchemaVersion === proposed?.sourceBrief?.briefSchemaVersion;
}

async function validateOne(root, { sessionEntry, decision, proposal, eligibility, policy }) {
  const blockers = [], warnings = [];
  const candidatePath = sessionEntry.candidatePath;
  const generationRecordPath = sessionEntry.generationRecordPath;
  const candidateAbsolute = path.join(root, candidatePath);
  const generationAbsolute = path.join(root, generationRecordPath);
  if (!(await exists(candidateAbsolute))) blockers.push('PROVIDER_CANDIDATE_MISSING');
  if (!(await exists(generationAbsolute))) blockers.push('PROVIDER_GENERATION_RECORD_MISSING');
  if (blockers.length) return { nodeCode: sessionEntry.nodeCode, blockers, warnings, importEligible: false };

  const [markdown, generation] = await Promise.all([
    fs.readFile(candidateAbsolute, 'utf8'),
    readJson(root, generationRecordPath)
  ]);
  const providerDigest = textDigest(markdown);
  if (providerDigest !== sessionEntry.candidateDigest) blockers.push('SESSION_CANDIDATE_DIGEST_MISMATCH');
  if (generation.candidateDigest !== sessionEntry.candidateDigest) blockers.push('GENERATION_RECORD_DIGEST_MISMATCH');
  if (generation.nodeCode !== sessionEntry.nodeCode || generation.locale !== VAP_W8_LOCALE) blockers.push('GENERATION_RECORD_IDENTITY_MISMATCH');
  if (generation.candidateAuthority !== false || generation.humanReviewRequired !== true || generation.publicationAllowed !== false) blockers.push('PROVIDER_AUTHORITY_BOUNDARY_INVALID');
  if (generation.controllingAuthority?.proposalContentHash !== decision.proposalContentHash) blockers.push('GENERATION_PROPOSAL_HASH_MISMATCH');
  if (decision.decisionState !== 'human_approved' || decision.productionDecision !== 'approve_for_production' || decision.productionRole !== 'ARTICLE' || decision.dispatchTarget !== 'PJA') blockers.push('HUMAN_ARTICLE_DECISION_NOT_APPROVED');
  if (decision.c2FreezeDecision !== 'freeze_approved' || decision.manuscriptMappingDecision !== 'range_approved') blockers.push('HUMAN_C2_OR_MANUSCRIPT_DECISION_NOT_APPROVED');
  if (eligibility?.articleExecutionEligible !== true) blockers.push('W6A_EXECUTION_ELIGIBILITY_NOT_ESTABLISHED');
  if (proposal.proposalContentHash !== decision.proposalContentHash) blockers.push('PROPOSAL_DECISION_HASH_MISMATCH');

  try { validatePublicMarkdownCandidate(markdown, sessionEntry.nodeCode, root); }
  catch (error) { blockers.push(error.code || 'PUBLIC_MARKDOWN_CANDIDATE_INVALID'); }

  const title = extractTitle(markdown);
  if (title !== proposal.titleZhHans) blockers.push('CANONICAL_TITLE_MISMATCH');
  const headings = extractHeadings(markdown);
  if (headings.length < policy.minimumSectionHeadingCount) blockers.push('ARTICLE_STRUCTURE_TOO_SHALLOW');
  const summary = extractSummary(markdown);
  if (summary.length < policy.minimumSummaryCharacters) blockers.push('ARTICLE_SUMMARY_TOO_SHORT');
  if (normalize(markdown).length < policy.minimumBodyCharacters) blockers.push('ARTICLE_BODY_TOO_SHORT');

  const canonicalBrief = await buildCanonicalBriefV2(root, sessionEntry.nodeCode, { commit: VAP_W8_BASELINE });
  const approvedThesis = proposal.proposedContent.canonicalThesis.statement;
  const approvedMustEstablish = proposal.proposedContent.boundaries.article.mustEstablish || [];
  const approvedDistinctions = proposal.proposedContent.boundaries.article.requiredDistinctions || [];
  const approvedMustNotClaim = proposal.proposedContent.boundaries.article.mustNotClaim || [];
  const approvedClaimProhibitions = proposal.proposedContent.boundaries.claims?.prohibitedClaims || [];
  if (canonicalBrief.canonicalMeaning.centralThesis !== approvedThesis) blockers.push('PJA_BRIEF_C2_THESIS_DRIFT');
  if (!sameStrings(canonicalMustEstablish(canonicalBrief), approvedMustEstablish)) blockers.push('PJA_BRIEF_C2_MUST_ESTABLISH_DRIFT');
  if (!sameStrings(canonicalBrief.articleBoundary.requiredDistinctions || [], approvedDistinctions)) blockers.push('PJA_BRIEF_C2_DISTINCTION_DRIFT');
  for (const statement of [...approvedMustNotClaim, ...approvedClaimProhibitions]) {
    if (!(canonicalBrief.articleBoundary.mustNotClaim || []).includes(statement)) blockers.push('PJA_BRIEF_C2_PROHIBITION_DRIFT');
  }

  const thesisCoverage = tokenCoverage(approvedThesis, markdown);
  const mustEstablishCoverage = approvedMustEstablish.map(statement => ({ statement, coverage: tokenCoverage(statement, markdown) }));
  const requiredDistinctionCoverage = approvedDistinctions.map(statement => ({ statement, coverage: tokenCoverage(statement, markdown) }));
  if (thesisCoverage < policy.canonicalThesisBigramCoverageMinimum) blockers.push('CANONICAL_THESIS_COVERAGE_LOW');
  if (mustEstablishCoverage.some(item => item.coverage < policy.mustEstablishBigramCoverageMinimumPerStatement)) blockers.push('MUST_ESTABLISH_COVERAGE_LOW');
  const factIndicators = externalFactIndicators(markdown);
  if (factIndicators.length) warnings.push('EXTERNAL_FACT_OR_CITATION_INDICATOR_REQUIRES_HUMAN_REVIEW');

  const pjaCandidate = buildCandidateTemplate(canonicalBrief, {
    title,
    summary,
    bodyMarkdown: normalize(markdown).trim(),
    sectionHeadings: headings,
    terminologyTermsUsed: terminologyUsed(canonicalBrief, markdown),
    producer: `VAP-W7S openai_chatgpt_session / GPT-5.6 Sol; VAP-W8 integrity + C2 bridge validation; source=${providerDigest}`,
    candidateState: 'ready_for_human_review'
  });
  const pjaValidation = await validateZhHansCandidate(root, pjaCandidate, { commit: VAP_W8_BASELINE });
  if (!pjaValidation.valid) blockers.push(...pjaValidation.errors.map(error => `PJA_${error.code}`));

  const briefReportPath = `dist/knowledge-production-briefs/${sessionEntry.nodeCode}-production-brief.report.json`;
  const briefMarkdownPath = `dist/knowledge-production-briefs/${sessionEntry.nodeCode}-production-brief.md`;
  const briefReport = await exists(path.join(root, briefReportPath)) ? await readJson(root, briefReportPath) : null;
  const generationBrief = await exists(path.join(root, briefMarkdownPath)) ? await fs.readFile(path.join(root, briefMarkdownPath), 'utf8') : null;
  if (!briefReport?.success || briefReport.nodeCode !== sessionEntry.nodeCode || briefReport.locale !== VAP_W8_LOCALE) blockers.push('W6_PRODUCTION_BRIEF_REPORT_INVALID');
  if (!generationBrief) blockers.push('W6_PRODUCTION_BRIEF_MISSING');

  return {
    nodeCode: sessionEntry.nodeCode,
    titleZhHans: proposal.titleZhHans,
    locale: VAP_W8_LOCALE,
    providerCandidate: {
      path: candidatePath,
      digest: providerDigest,
      generationRecordPath,
      providerCode: generation.providerCode,
      model: generation.model
    },
    controllingAuthority: {
      decisionCode: decision.decisionCode,
      proposalContentHash: decision.proposalContentHash,
      humanActor: decision.actor,
      c2FreezeDecision: decision.c2FreezeDecision,
      manuscriptMappingDecision: decision.manuscriptMappingDecision,
      executionEligible: eligibility?.articleExecutionEligible === true
    },
    generationBrief: {
      path: briefMarkdownPath,
      reportPath: briefReportPath,
      repositoryCommit: briefReport?.repositoryCommit ?? null,
      digest: generationBrief ? bytesDigest(Buffer.from(normalize(generationBrief), 'utf8')) : null,
      schemaVersion: 'PHI-OS-KNOWLEDGE-PRODUCTION-BRIEF-v1.1.0'
    },
    pjaImportBridge: {
      bridgeReason: 'Existing PJA zh-Hans Candidate Import requires Canonical Production Brief v2; W8 rebinds only after exact current C2 Thesis/Boundary equivalence is verified.',
      canonicalBriefCode: canonicalBrief.briefCode,
      canonicalBriefSchemaVersion: canonicalBrief.briefSchemaVersion,
      canonicalBriefDigest: canonicalBrief.briefDigest,
      canonicalBriefRepositoryCommit: canonicalBrief.repositoryCommit,
      providerWasNotClaimedToHaveUsedCanonicalBriefV2: true
    },
    automatedValidation: {
      integrityPassed: !blockers.some(code => /DIGEST|IDENTITY|MISSING|HASH/.test(code)),
      publicBodySafetyPassed: !blockers.some(code => /UNSAFE|INTERNAL_CODE|PUBLIC_MARKDOWN/.test(code)),
      titlePassed: title === proposal.titleZhHans,
      thesisCoverage,
      mustEstablishCoverage,
      requiredDistinctionCoverage,
      externalFactIndicators: factIndicators,
      semanticHumanReviewStillRequired: true,
      factualTruthValidated: false,
      sourceTruthValidated: false
    },
    pjaCandidate: {
      candidateCode: pjaCandidate.candidateCode,
      candidateDigest: pjaCandidate.candidateDigest,
      candidateState: pjaCandidate.candidateState,
      sourceBriefDigest: pjaCandidate.sourceBrief.briefDigest,
      targetPath: currentImportPath(sessionEntry.nodeCode),
      schemaValidationPassed: pjaValidation.valid
    },
    blockers: [...new Set(blockers)],
    warnings: [...new Set(warnings)],
    importEligible: blockers.length === 0,
    candidateObject: pjaCandidate
  };
}

export async function buildVapW8Plan(root) {
  const [session, decisions, review, eligibility, policy] = await Promise.all([
    readJson(root, VAP_W8_SESSION),
    readJson(root, VAP_W8_DECISIONS),
    readJson(root, VAP_W8_REVIEW),
    readJson(root, VAP_W8_ELIGIBILITY),
    readJson(root, VAP_W8_POLICY)
  ]);
  if (policy.expectedCandidateCount !== session.entries.length) throw fail('VAP_W8_POLICY_CANDIDATE_COUNT_MISMATCH', `${policy.expectedCandidateCount} != ${session.entries.length}`);
  if (session.batchCode !== VAP_W8_BATCH || session.locale !== VAP_W8_LOCALE) throw fail('VAP_W8_SESSION_IDENTITY_INVALID', session.batchCode);
  const decisionByNode = new Map(decisions.entries.map(entry => [entry.nodeCode, entry]));
  const proposalByNode = new Map(review.entries.map(entry => [entry.nodeCode, entry]));
  const eligibilityByNode = new Map(eligibility.entries.map(entry => [entry.nodeCode, entry]));
  const entries = [];
  for (const sessionEntry of session.entries) {
    const decision = decisionByNode.get(sessionEntry.nodeCode);
    const proposal = proposalByNode.get(sessionEntry.nodeCode);
    if (!decision || !proposal) throw fail('VAP_W8_UPSTREAM_AUTHORITY_MISSING', sessionEntry.nodeCode);
    entries.push(await validateOne(root, { sessionEntry, decision, proposal, eligibility: eligibilityByNode.get(sessionEntry.nodeCode), policy }));
  }
  let pjaImportPresentCount = 0;
  for (const entry of entries) {
    if (!entry.pjaCandidate?.targetPath) continue;
    const target = path.join(root, entry.pjaCandidate.targetPath);
    if (!(await exists(target))) continue;
    const current = JSON.parse(await fs.readFile(target, 'utf8'));
    if (
      serialize(current) === serialize(entry.candidateObject) ||
      successorEquivalentCandidate(current, entry.candidateObject)
    ) pjaImportPresentCount += 1;
  }
  const eligible = entries.filter(entry => entry.importEligible);
  return {
    schemaVersion: 'PHI-OS-VAP-W8-CANDIDATE-VALIDATION-v1.0.0',
    work: 'VAP-W8', phase: 'VAP-B_ARTICLE_PRODUCTION_ACTIVATION', baselineCommit: VAP_W8_BASELINE,
    batchCode: VAP_W8_BATCH, locale: VAP_W8_LOCALE,
    status: eligible.length === entries.length ? 'ALL_PROVIDER_CANDIDATES_VALID_FOR_PJA_IMPORT' : 'CANDIDATE_VALIDATION_BLOCKED',
    summary: {
      providerCandidateCount: entries.length,
      validationPassedCount: eligible.length,
      validationBlockedCount: entries.length - eligible.length,
      pjaSchemaCompatibleCount: entries.filter(entry => entry.pjaCandidate?.schemaValidationPassed).length,
      semanticHumanReviewRequiredCount: entries.length,
      pjaImportPresentCount
    },
    validationBoundary: {
      establishes: ['lineage_integrity', 'candidate_digest_binding', 'public_body_safety', 'canonical_title_binding', 'minimum_thesis_and_must_establish_coverage', 'c2_to_pja_brief_equivalence', 'pja_candidate_schema_compatibility'],
      doesNotEstablish: ['factual_truth', 'source_truth', 'complete_semantic_fidelity', 'human_editorial_approval', 'article_approval', 'publication_readiness', 'publication']
    },
    entries
  };
}

export function validationProjection(plan) {
  return { ...plan, entries: plan.entries.map(({ candidateObject, ...entry }) => entry) };
}

export async function applyVapW8Imports(root, { apply = false } = {}) {
  const plan = await buildVapW8Plan(root);
  if (plan.summary.validationBlockedCount) throw fail('VAP_W8_VALIDATION_BLOCKED', plan.entries.filter(entry => !entry.importEligible).map(entry => `${entry.nodeCode}:${entry.blockers.join(',')}`).join('; '));
  const results = [];
  for (const entry of plan.entries) {
    const relative = entry.pjaCandidate.targetPath;
    const absolute = path.join(root, relative);
    if (await exists(absolute)) {
      const existing = JSON.parse(await fs.readFile(absolute, 'utf8'));
      const byteEquivalent = serialize(existing) === serialize(entry.candidateObject);
      const successorEquivalent = successorEquivalentCandidate(existing, entry.candidateObject);
      if (!byteEquivalent && !successorEquivalent) throw fail('PJA_CANDIDATE_CONFLICT', relative);
      results.push({ nodeCode: entry.nodeCode, targetPath: relative, status: byteEquivalent ? 'already_imported_byte_equivalent' : 'already_imported_successor_lineage_equivalent', applied: false, candidateDigest: existing.candidateDigest, successorBriefDigest: successorEquivalent ? entry.pjaCandidate.sourceBriefDigest : null });
      continue;
    }
    if (!apply) {
      const dry = await importZhHansCandidate(root, entry.candidateObject, { apply: false });
      results.push({ nodeCode: entry.nodeCode, targetPath: dry.targetPath, status: 'import_planned', applied: false, candidateDigest: entry.pjaCandidate.candidateDigest });
      continue;
    }
    const imported = await importZhHansCandidate(root, entry.candidateObject, { apply: true });
    results.push({ nodeCode: entry.nodeCode, targetPath: imported.targetPath, status: 'imported', applied: true, candidateDigest: entry.pjaCandidate.candidateDigest });
  }
  return {
    schemaVersion: 'PHI-OS-VAP-W8-PJA-IMPORT-v1.0.0', work: 'VAP-W8', phase: 'VAP-B_ARTICLE_PRODUCTION_ACTIVATION',
    baselineCommit: VAP_W8_BASELINE, batchCode: VAP_W8_BATCH, locale: VAP_W8_LOCALE,
    mode: apply ? 'apply' : 'dry-run', status: 'PJA_CANDIDATE_IMPORT_COMPLETE',
    importedOrEquivalentCount: results.length,
    newlyAppliedCount: results.filter(result => result.applied).length,
    candidateAuthority: false, humanReviewRequired: true, approvalRecorded: false, publicationRecorded: false,
    candidateRegistryMutated: false, canonicalRegistryMutated: false,
    results
  };
}

export async function buildVapW8Activation(root) {
  const plan = await buildVapW8Plan(root);
  let imported = 0;
  const entries = [];
  for (const entry of plan.entries) {
    const target = path.join(root, entry.pjaCandidate.targetPath);
    let state = 'NOT_IMPORTED';
    if (await exists(target)) {
      const current = JSON.parse(await fs.readFile(target, 'utf8'));
      state = serialize(current) === serialize(entry.candidateObject)
        ? 'IMPORTED_BYTE_EQUIVALENT'
        : successorEquivalentCandidate(current, entry.candidateObject)
          ? 'IMPORTED_SUCCESSOR_LINEAGE_EQUIVALENT'
          : 'IMPORT_CONFLICT';
      if (state !== 'IMPORT_CONFLICT') imported += 1;
    }
    entries.push({ nodeCode: entry.nodeCode, validationPassed: entry.importEligible, pjaImportState: state, targetPath: entry.pjaCandidate.targetPath, candidateDigest: entry.pjaCandidate.candidateDigest });
  }
  return {
    schemaVersion: 'PHI-OS-VAP-W8-ACTIVATION-v1.0.0', work: 'VAP-W8', baselineCommit: VAP_W8_BASELINE,
    batchCode: VAP_W8_BATCH, locale: VAP_W8_LOCALE,
    status: imported === plan.entries.length && plan.summary.validationBlockedCount === 0 ? 'BATCH_001_CANDIDATES_VALIDATED_AND_IMPORTED_AWAITING_HUMAN_EDITORIAL_REVIEW' : 'VAP_W8_IMPORT_INCOMPLETE',
    validationPassedCount: plan.summary.validationPassedCount,
    pjaImportedCount: imported,
    humanEditorialReviewCount: 0,
    editorialApprovalCount: 0,
    publicationCount: 0,
    nextWork: 'VAP-W9_HUMAN_EDITORIAL_REVIEW_AND_CANDIDATE_PROMOTION',
    entries
  };
}
