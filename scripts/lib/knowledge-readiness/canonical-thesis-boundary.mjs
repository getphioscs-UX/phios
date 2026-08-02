import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const C2_ROOT = 'content/knowledge/editorial/c2';
export const C2_CONTRACT = `${C2_ROOT}/canonical-thesis-boundary.contract.json`;
export const C2_INDEX = `${C2_ROOT}/canonical-thesis-boundary-index.json`;
export const C2_REPORT = `${C2_ROOT}/human-review-queue.json`;
export const slug = code => code.toLowerCase();
export const canonicalJson = value => JSON.stringify(sort(value));
export const contentHash = value => `sha256:${crypto.createHash('sha256').update(canonicalJson(value)).digest('hex')}`;

export function buildC2(root) {
  const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
  const registry = read('content/knowledge/registry/nodes.json');
  const blueprint = read('content/knowledge/blueprints/book-1-knowledge-blueprint.json');
  const legacy = read('content/knowledge/editorial/readiness/kn-preface-001-production-readiness.json');
  const nodes = registry.nodes;
  if (nodes.length !== 78 || blueprint.nodes.length !== 78) throw coded('TOPOLOGY_CONFLICT', 'C0 Registry and Blueprint must each contain 78 nodes.');
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
  files.set(C2_REPORT, { schemaVersion: 'PHI-OS-PJA-W2F-C2-REVIEW-QUEUE-v1.0.0', stageStatus: 'conditional_passed', summary: { assessed: 78, frozen: 1, candidatePrepared: 0, humanReviewRequired: 77, conflicted: 0 }, entries: queueEntries });
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
