import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { resolveVapW6aEditorialApprovals } from '../visual-article-production/vap-w6a-authority-resolution-v1.mjs';

export const C2_ROOT = 'content/knowledge/editorial/c2';
export const C2_CONTRACT = `${C2_ROOT}/canonical-thesis-boundary.contract.json`;
export const C2_INDEX = `${C2_ROOT}/canonical-thesis-boundary-index.json`;
export const C2_REPORT = `${C2_ROOT}/human-review-queue.json`;
export const C2_WAVE1_HUMAN_RESOLUTION = 'content/knowledge/production-planning/review/wave1-c2-human-editorial-freeze-resolution-v1.json';
export const slug = code => code.toLowerCase();
export const canonicalJson = value => JSON.stringify(sort(value));
export const contentHash = value => `sha256:${crypto.createHash('sha256').update(canonicalJson(value)).digest('hex')}`;

export function resolveHumanEditorialFreezeResolutions(root, resolutionOverride = null) {
  const resolutionPath = path.join(root, C2_WAVE1_HUMAN_RESOLUTION);
  if (resolutionOverride === null && !fs.existsSync(resolutionPath)) return { approvedByNode: new Map(), resolution: null };
  const resolution = resolutionOverride ?? JSON.parse(fs.readFileSync(resolutionPath, 'utf8'));
  if (resolution.resolutionCode !== 'PHI-OS-WAVE1-C2-HUMAN-EDITORIAL-FREEZE-RESOLUTION-v1') throw coded(
    'C2_HUMAN_RESOLUTION_CONTRACT_INVALID',
    'Wave 1 C2 Human Editorial Freeze resolution contract is invalid.'
  );
  if (!Array.isArray(resolution.entries) || resolution.entries.length !== 4) throw coded(
    'C2_HUMAN_RESOLUTION_SCOPE_INVALID',
    'Wave 1 C2 Human Editorial Freeze resolution must contain exactly four entries.'
  );
  const approvedByNode = new Map();
  const seen = new Set();
  for (const entry of resolution.entries) {
    if (!entry?.nodeCode || seen.has(entry.nodeCode)) throw coded(
      'C2_HUMAN_RESOLUTION_NODE_INVALID',
      'Wave 1 C2 Human Editorial Freeze resolution contains a missing or duplicate Node.'
    );
    seen.add(entry.nodeCode);
    if (entry.approvalState !== 'human_approved') continue;
    validateApprovedResolutionEntry(entry);
    approvedByNode.set(entry.nodeCode, entry);
  }
  return { approvedByNode, resolution };
}

export function buildC2(root) {
  const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
  const registry = read('content/knowledge/registry/nodes.json');
  const blueprint = read('content/knowledge/blueprints/book-1-knowledge-blueprint-v1.3.0.legacy.json');
  const legacy = read('content/knowledge/editorial/readiness/kn-preface-001-production-readiness.json');
  const { approvedByNode: wave1ApprovedByNode } = resolveHumanEditorialFreezeResolutions(root);
  const vapW6aApprovedByNode = resolveVapW6aEditorialApprovals(root);
  const approvedByNode = new Map([...wave1ApprovedByNode, ...vapW6aApprovedByNode]);
  const blueprintCodes = new Set(blueprint.nodes.map(node => node.nodeCode));
  const nodes = registry.nodes.filter(node => blueprintCodes.has(node.nodeCode));
  if (nodes.length !== 78 || blueprint.nodes.length !== 78) throw coded(
    'TOPOLOGY_CONFLICT',
    'Historical Book I C2 scope must contain 78 Blueprint identities inside the Universal Registry.'
  );
  const files = new Map();
  const entries = [];
  for (const node of nodes) {
    const code = node.nodeCode;
    if (code === 'KN-PREFACE-001') {
      if (!legacy.review?.humanFrozen || legacy.review?.status !== 'approved' || !legacy.review?.reviewedBy || !legacy.review?.reviewedAt) throw coded('INVALID_HUMAN_FREEZE', `${code} lacks valid inherited human authority.`);
      const content = {
        canonicalThesis: {
          statement: legacy.canonicalThesis.statement, mechanism: legacy.canonicalThesis.mechanism,
          necessity: legacy.canonicalThesis.necessity, systemRole: legacy.canonicalThesis.systemRole,
          continuity: legacy.canonicalThesis.continuity,
          partContribution: legacy.sequenceBoundary.partContribution,
          bookContribution: legacy.sequenceBoundary.bookContribution
        },
        boundaries: {
          article: legacy.articleBoundary, claims: legacy.claimBoundary,
          questions: legacy.supportingQuestionBoundary, sources: legacy.sourceBoundary,
          figures: legacy.figureBoundary, publicContent: legacy.publicContentBoundary
        }
      };
      const hash = contentHash(content);
      const frozenPath = `${C2_ROOT}/frozen/${slug(code)}.json`;
      const freezePath = `${C2_ROOT}/freezes/${slug(code)}-freeze.json`;
      files.set(frozenPath, { schemaVersion: 'PHI-OS-PJA-W2F-C2-FROZEN-v1.0.0', nodeCode: code, locale: 'zh-Hans', status: 'frozen', thesisState: 'frozen', boundaryState: 'frozen', humanFreezeState: 'approved', content, contentHash: hash, authority: { source: 'content/knowledge/editorial/readiness/kn-preface-001-production-readiness.json', migration: 'preserved_existing_human_freeze' } });
      files.set(freezePath, { schemaVersion: 'PHI-OS-PJA-W2F-C2-FREEZE-v1.0.0', nodeCode: code, decision: 'approved', reviewer: legacy.review.reviewedBy, reviewedAt: legacy.review.reviewedAt, contentHash: hash, sourceRecord: 'content/knowledge/editorial/readiness/kn-preface-001-production-readiness.json' });
      entries.push({ nodeCode: code, status: 'frozen', thesisState: 'frozen', boundaryState: 'frozen', humanFreezeState: 'approved', record: frozenPath, freezeRecord: freezePath });
    } else if (approvedByNode.has(code)) {
      const approved = approvedByNode.get(code);
      validateApprovedResolutionEntry(approved);
      const content = approved.proposedContent;
      const hash = contentHash(content);
      const frozenPath = `${C2_ROOT}/frozen/${slug(code)}.json`;
      const freezePath = `${C2_ROOT}/freezes/${slug(code)}-freeze.json`;
      const authoritySource = approved.authoritySource || C2_WAVE1_HUMAN_RESOLUTION;
      const migration = approved.authoritySource
        ? 'vap_w6a_human_editorial_freeze_resolution'
        : 'human_editorial_freeze_resolution';
      files.set(frozenPath, {
        schemaVersion: 'PHI-OS-PJA-W2F-C2-FROZEN-v1.0.0',
        nodeCode: code,
        locale: approved.locale,
        status: 'frozen',
        thesisState: 'frozen',
        boundaryState: 'frozen',
        humanFreezeState: 'approved',
        content,
        contentHash: hash,
        authority: {
          source: authoritySource,
          migration
        }
      });
      files.set(freezePath, {
        schemaVersion: 'PHI-OS-PJA-W2F-C2-FREEZE-v1.0.0',
        nodeCode: code,
        decision: 'approved',
        reviewer: approved.humanDecision.actor,
        reviewerRole: approved.humanDecision.actorRole,
        reviewedAt: approved.humanDecision.decidedAt,
        contentHash: hash,
        sourceRecord: authoritySource
      });
      entries.push({
        nodeCode: code,
        status: 'frozen',
        thesisState: 'frozen',
        boundaryState: 'frozen',
        humanFreezeState: 'approved',
        record: frozenPath,
        freezeRecord: freezePath
      });
    } else {
      const candidatePath = `${C2_ROOT}/candidates/${slug(code)}.json`;
      const legacyPath = code.startsWith('KN-PREFACE-') ? `content/knowledge/editorial/readiness/${slug(code)}-production-readiness.json` : null;
      files.set(candidatePath, {
        schemaVersion: 'PHI-OS-PJA-W2F-C2-CANDIDATE-v1.0.0', nodeCode: code, locale: 'zh-Hans',
        status: 'human_review_required', thesisState: 'not_assessed', boundaryState: 'not_assessed', humanFreezeState: 'required',
        authorityAssessment: { sufficientForCanonicalContent: false, sourcesInspected: [
          'content/knowledge/registry/nodes.json', 'content/knowledge/blueprints/book-1-knowledge-blueprint.json',
          ...(legacyPath && fs.existsSync(path.join(root, legacyPath)) ? [legacyPath] : [])
        ], finding: 'INSUFFICIENT_MANUSCRIPT_AUTHORITY' },
        candidateThesis: null, candidateBoundaries: null,
        unresolvedDecisions: ['Canonical Thesis requires manuscript or named human editorial authority.', 'All six boundary families require human editorial review.', 'Human freeze record with approved decision and content hash is required.'],
        blocking: ['CANONICAL_THESIS_NOT_READY', 'BOUNDARY_NOT_READY', 'HUMAN_FREEZE_REQUIRED'],
        protectedBoundary: { generatedFromBlueprintTitle: false, productionEligible: false, articleGenerationAllowed: false }
      });
      entries.push({ nodeCode: code, status: 'human_review_required', thesisState: 'not_assessed', boundaryState: 'not_assessed', humanFreezeState: 'required', record: candidatePath, freezeRecord: null });
    }
  }
  const index = { schemaVersion: 'PHI-OS-PJA-W2F-C2-INDEX-v1.0.0', stage: 'PJA-W2F-C2', nodeCount: 78, entries };
  const queueEntries = entries.filter(x => x.status !== 'frozen').map(x => ({ nodeCode: x.nodeCode, owner: 'human_editorial_authority', status: 'human_review_required', reason: 'INSUFFICIENT_MANUSCRIPT_AUTHORITY', candidateRecord: x.record }));
  files.set(C2_INDEX, index);
  files.set(C2_REPORT, {
    schemaVersion: 'PHI-OS-PJA-W2F-C2-REVIEW-QUEUE-v1.0.0',
    stageStatus: 'conditional_passed',
    summary: {
      assessed: entries.length,
      frozen: entries.filter(entry => entry.status === 'frozen').length,
      candidatePrepared: 0,
      humanReviewRequired: queueEntries.length,
      conflicted: 0
    },
    entries: queueEntries
  });
  return { files, index };
}

export function validateC2(root) {
  const errors = [];
  let expected;
  try { expected = buildC2(root); } catch (error) { return { valid: false, errors: [error.code || error.message] }; }
  for (const [relative, value] of expected.files) {
    const absolute = path.join(root, relative);
    if (!fs.existsSync(absolute)) errors.push(`MISSING:${relative}`);
    else {
      try { if (canonicalJson(JSON.parse(fs.readFileSync(absolute, 'utf8'))) !== canonicalJson(value)) errors.push(`CONFLICT:${relative}`); }
      catch { errors.push(`INVALID_JSON:${relative}`); }
    }
  }
  return { valid: errors.length === 0, errors };
}

export function resolveCanonicalThesisBoundary(root, nodeCode) {
  const indexPath = path.join(root, C2_INDEX);
  if (!fs.existsSync(indexPath)) throw coded('C2_INDEX_NOT_FOUND', 'C2 index not found.');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const entry = index.entries.find(x => x.nodeCode === nodeCode);
  if (!entry) throw coded('NODE_NOT_FOUND', nodeCode);
  return { exists: true, ...entry, blocking: entry.status === 'frozen' ? [] : ['CANONICAL_THESIS_NOT_READY', 'BOUNDARY_NOT_READY', 'HUMAN_FREEZE_REQUIRED'], productionReady: false };
}

function sort(value) { if (Array.isArray(value)) return value.map(sort); if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, sort(value[k])])); return value; }
function coded(code, message) { const error = new Error(message); error.code = code; return error; }

function validateApprovedResolutionEntry(entry) {
  const requiredThesisFields = ['statement', 'mechanism', 'necessity', 'systemRole', 'continuity', 'partContribution', 'bookContribution'];
  const requiredBoundaryFamilies = ['article', 'claims', 'questions', 'sources', 'figures', 'publicContent'];
  const requiredReviewDimensions = [
    'CANONICAL_THESIS',
    'ARTICLE_BOUNDARY',
    'SUPPORTING_QUESTION_BOUNDARY',
    'SEQUENCE_BOUNDARY',
    'CLAIM_BOUNDARY',
    'SOURCE_BOUNDARY',
    'FIGURE_BOUNDARY',
    'PUBLIC_CONTENT_BOUNDARY',
    'CROSS_NODE_BOUNDARY'
  ];
  const decision = entry.humanDecision ?? {};
  if (entry.promotionAllowed !== true || decision.decision !== 'freeze_approved') throw coded(
    'C2_HUMAN_APPROVAL_REQUIRED',
    `${entry.nodeCode} is not explicitly approved for C2 promotion.`
  );
  if (!decision.actor || ['ai', 'system', 'automation', 'chatgpt', 'codex'].includes(decision.actor.trim().toLowerCase())) throw coded(
    'C2_REAL_HUMAN_REVIEWER_REQUIRED',
    `${entry.nodeCode} requires a real Human Editorial reviewer.`
  );
  if (decision.actorRole !== 'HUMAN_EDITORIAL_AUTHORITY') throw coded(
    'C2_HUMAN_EDITORIAL_ROLE_REQUIRED',
    `${entry.nodeCode} requires HUMAN_EDITORIAL_AUTHORITY.`
  );
  if (!decision.decidedAt || Number.isNaN(Date.parse(decision.decidedAt))) throw coded(
    'C2_HUMAN_DECISION_TIMESTAMP_REQUIRED',
    `${entry.nodeCode} requires a valid Human decision timestamp.`
  );
  if (!decision.rationale) throw coded('C2_HUMAN_RATIONALE_REQUIRED', `${entry.nodeCode} requires Human rationale.`);
  if (!entry.manuscriptMappingReview?.humanVerified) throw coded(
    'C2_MANUSCRIPT_MAPPING_HUMAN_VERIFICATION_REQUIRED',
    `${entry.nodeCode} manuscript mapping requires Human verification.`
  );
  const content = entry.proposedContent;
  if (!content?.canonicalThesis || !content?.boundaries) throw coded('C2_CONTENT_REQUIRED', `${entry.nodeCode} lacks C2 content.`);
  if (!requiredThesisFields.every(field => content.canonicalThesis[field] !== undefined && content.canonicalThesis[field] !== '')) throw coded(
    'C2_CANONICAL_THESIS_INCOMPLETE',
    `${entry.nodeCode} Canonical Thesis is incomplete.`
  );
  if (!requiredBoundaryFamilies.every(family => content.boundaries[family] !== undefined)) throw coded(
    'C2_BOUNDARY_FAMILIES_INCOMPLETE',
    `${entry.nodeCode} C2 boundary families are incomplete.`
  );
  const hash = contentHash(content);
  if (entry.proposalContentHash !== hash || decision.contentHash !== hash) throw coded(
    'C2_CONTENT_HASH_MISMATCH',
    `${entry.nodeCode} Human decision is not bound to the exact proposed C2 content.`
  );
  const dimensions = entry.reviewDimensionProposals ?? [];
  if (dimensions.length !== requiredReviewDimensions.length || !requiredReviewDimensions.every(
    dimension => dimensions.some(item => item.dimension === dimension && item.state === 'HUMAN_APPROVED' && item.humanFinding)
  )) throw coded(
    'C2_HUMAN_REVIEW_DIMENSIONS_INCOMPLETE',
    `${entry.nodeCode} requires Human findings for all nine review dimensions.`
  );
}
