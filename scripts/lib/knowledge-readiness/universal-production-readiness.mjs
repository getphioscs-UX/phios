import fs from 'node:fs';
import path from 'node:path';
import { contentHash, C2_WAVE1_HUMAN_RESOLUTION, resolveHumanEditorialFreezeResolutions } from './canonical-thesis-boundary.mjs';
import { C3R1_PATHS, resolveProductionReadinessClosure } from './preface-production-readiness-closure.mjs';
import { WAVE1_C3_CLOSURE, resolveWave1C3ReadinessClosure } from './wave1-c3-readiness-closure.mjs';
import { WAVE1_C3_HUMAN_APPROVAL, WAVE1_HUMAN_DECISION, resolveWave1HumanProductionDecision } from '../knowledge-production-planning/wave1-production-authorization.mjs';
import { VAP_W6A_DECISIONS, resolveVapW6aEditorialApprovals, resolveVapW6aProductionDecision } from '../visual-article-production/vap-w6a-authority-resolution-v1.mjs';

export const C3_ROOT = 'content/knowledge/editorial/c3';
export const C3_CONTRACT = `${C3_ROOT}/universal-production-readiness.contract.json`;
export const C3_INDEX = `${C3_ROOT}/universal-production-readiness-index.json`;
export const C3_SUMMARY = `${C3_ROOT}/production-readiness-summary.json`;
export const recordPath = nodeCode => `${C3_ROOT}/assessments/${nodeCode.toLowerCase()}-production-readiness.json`;

export function buildProductionReadiness(root) {
  const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
  const registry = read('content/knowledge/registry/nodes.json');
  const c1 = read('content/knowledge/readiness/canonical-readiness-index.json');
  const c2 = read('content/knowledge/editorial/c2/canonical-thesis-boundary-index.json');
  const contract = read(C3_CONTRACT);
  const wave1HumanEditorialApprovals = resolveHumanEditorialFreezeResolutions(root).approvedByNode;
  const vapW6aHumanEditorialApprovals = resolveVapW6aEditorialApprovals(root);
  const humanEditorialApprovals = new Map([...wave1HumanEditorialApprovals, ...vapW6aHumanEditorialApprovals]);
  const registryCodeSet = new Set(registry.nodes.map(node => node.nodeCode));
  const registryCodes = c1.entries.map(entry => entry.nodeCode);
  if (!registryCodes.every(nodeCode => registryCodeSet.has(nodeCode))) {
    throw coded('C1_TOPOLOGY_CONFLICT', 'Historical C1 identities must remain in the Universal Registry.');
  }
  assertSameCodes(registryCodes, c2.entries.map(entry => entry.nodeCode), 'C2_TOPOLOGY_CONFLICT');

  const files = new Map(), entries = [];
  for (const nodeCode of registryCodes) {
    const c2Entry = c2.entries.find(entry => entry.nodeCode === nodeCode);
    const assessment = c2Entry.status === 'frozen'
      ? assessFrozen(root, nodeCode, c2Entry, contract, humanEditorialApprovals)
      : assessBlockedByC2(nodeCode, c2Entry, contract);
    const relative = recordPath(nodeCode);
    files.set(relative, assessment);
    entries.push({ nodeCode, status: assessment.status, productionReady: assessment.productionReady, humanProductionDecisionEligible: assessment.humanProductionDecisionEligible === true, exportability: assessment.exportability, assessmentFile: relative, blocking: assessment.blocking });
  }
  const counts = countBy(entries, entry => entry.status);
  const index = {
    schemaVersion: 'PHI-OS-PJA-W2F-C3-INDEX-v1.0.0', stage: 'PJA-W2F-C3',
    systemStatus: 'frozen', freezeLabel: contract.freezeLabel, nodeCount: entries.length,
    productionReadyCount: entries.filter(entry => entry.productionReady).length,
    productionBlockedCount: entries.filter(entry => !entry.productionReady).length,
    entries
  };
  files.set(C3_INDEX, index);
  files.set(C3_SUMMARY, {
    schemaVersion: 'PHI-OS-PJA-W2F-C3-SUMMARY-v1.0.0', stage: 'PJA-W2F-C3',
    systemStatus: 'frozen', assessed: entries.length,
    c2Frozen: c2.entries.filter(entry => entry.status === 'frozen').length,
    c2Blocked: c2.entries.filter(entry => entry.status !== 'frozen').length,
    productionReady: index.productionReadyCount, productionBlocked: index.productionBlockedCount,
    humanProductionDecisionEligible: entries.filter(entry => entry.humanProductionDecisionEligible).length,
    states: counts, exportGenerated: false, published: false
  });
  return { files, index };
}

function assessBlockedByC2(nodeCode, c2Entry, contract) {
  return {
    schemaVersion: 'PHI-OS-PJA-W2F-C3-ASSESSMENT-v1.0.0', nodeCode, locale: 'zh-Hans', status: 'blocked_by_c2',
    productionReady: false, exportability: 'blocked', publicationState: 'not_published',
    gates: Object.fromEntries(contract.requiredGates.map(gate => [gate, ['c0RegistryIdentity', 'c1ReadinessIdentity'].includes(gate) ? pass() : gate === 'c2FrozenThesisBoundary' ? fail('C2_NOT_FROZEN') : notAssessed('C2_PREREQUISITE_NOT_MET')])),
    blocking: ['C2_THESIS_BOUNDARY_NOT_FROZEN', 'HUMAN_PRODUCTION_APPROVAL_REQUIRED', 'EXPORTABILITY_NOT_ALLOWED'],
    authority: { c2Status: c2Entry.status, c2Record: c2Entry.record, c2FreezeRecord: null },
    effects: { articleGenerated: false, productionExportGenerated: false, published: false }
  };
}

function assessFrozen(root, nodeCode, c2Entry, contract, humanEditorialApprovals) {
  const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
  const frozen = read(c2Entry.record), freeze = read(c2Entry.freezeRecord);
  const hashValid = frozen.contentHash === freeze.contentHash && frozen.contentHash === contentHash(frozen.content);
  const boundaries = frozen.content?.boundaries || {};
  const claims = boundaries.claims || {};
  const sources = boundaries.sources || {};
  const questions = boundaries.questions;
  const figures = boundaries.figures || {};
  const legacyPath = frozen.authority?.source;
  const legacy = legacyPath && fs.existsSync(path.join(root, legacyPath)) ? read(legacyPath) : null;
  const blockingFindings = legacy?.review?.blockingFindings || [];
  const closure = nodeCode === 'KN-PREFACE-001' ? resolveProductionReadinessClosure(root) : null;
  const closurePassed = closure?.status === 'production_ready';
  const wave1Closure = resolveWave1C3ReadinessClosure(root, nodeCode);
  const wave1ProductionDecision = resolveWave1HumanProductionDecision(root, nodeCode);
  const wave1ProductionApproved = wave1ProductionDecision?.approved === true;
  const vapW6aProductionDecision = resolveVapW6aProductionDecision(root, nodeCode);
  const vapW6aProductionApproved = vapW6aProductionDecision?.approved === true;
  const humanEditorialApproval = humanEditorialApprovals.get(nodeCode) ?? null;
  const humanEditorialPassed = Boolean(humanEditorialApproval) || legacy?.review?.status === 'approved';
  const existingPublishedContentReferences = Array.isArray(sources.knownPublishedContent) ? sources.knownPublishedContent : [];
  const gates = {
    c0RegistryIdentity: pass(), c1ReadinessIdentity: pass(),
    c2FrozenThesisBoundary: hashValid && freeze.decision === 'approved' ? pass() : fail('C2_FREEZE_HASH_INVALID'),
    claimSufficiency: closurePassed || (Array.isArray(claims.requiredClaimFamilies) && claims.requiredClaimFamilies.length > 0) ? pass() : fail('CLAIM_BOUNDARY_INSUFFICIENT'),
    sourceSufficiency: closurePassed || wave1Closure?.entry?.sourceSufficiency?.status === 'passed' || sourcesComplete(sources) ? pass() : fail('UNRESOLVED_CRITICAL_SOURCE_NEED'),
    supportingQuestionTreatment: Array.isArray(questions) && questions.every(question => typeof question.articleTreatment === 'string' && question.articleTreatment.length > 0) ? pass() : fail('QUESTION_TREATMENT_INCOMPLETE'),
    figureDecision: wave1Closure?.entry?.figureDecision?.status === 'passed' || figureComplete(figures) ? pass() : fail('FIGURE_DECISION_INCOMPLETE'),
    editorialReview: humanEditorialPassed ? pass() : fail('EDITORIAL_REVIEW_REQUIRED'),
    humanProductionApproval: (closurePassed || wave1ProductionApproved || vapW6aProductionApproved) ? pass() : fail('HUMAN_PRODUCTION_APPROVAL_REQUIRED'),
    noBlockingFindings: blockingFindings.length === 0 ? pass() : fail('BLOCKING_REVIEW_FINDING'),
    exportability: (closurePassed || wave1ProductionApproved || vapW6aProductionApproved) ? pass() : fail('EXPORTABILITY_NOT_ALLOWED')
  };
  const blocking = Object.values(gates).filter(gate => gate.status === 'failed').map(gate => gate.code);
  const productionReady = contract.requiredGates.every(name => gates[name]?.status === 'passed');
  const preHumanGateNames = contract.requiredGates.filter(name => !['humanProductionApproval', 'exportability'].includes(name));
  const humanProductionDecisionEligible = !productionReady && preHumanGateNames.every(name => gates[name]?.status === 'passed') && gates.humanProductionApproval.status === 'failed' && gates.exportability.status === 'failed';
  return {
    schemaVersion: 'PHI-OS-PJA-W2F-C3-ASSESSMENT-v1.0.0', nodeCode, locale: 'zh-Hans',
    status: productionReady ? 'production_ready' : humanProductionDecisionEligible ? 'human_approval_required' : 'production_blocked', productionReady,
    ...(wave1Closure ? { humanProductionDecisionEligible } : {}),
    exportability: productionReady ? 'allowed' : 'blocked', publicationState: 'not_published', gates, blocking,
    authority: {
      c2Status: c2Entry.status, c2Record: c2Entry.record, c2FreezeRecord: c2Entry.freezeRecord, c2ContentHash: frozen.contentHash, c2FreezeHashMatched: hashValid,
      editorialRecord: humanEditorialApproval
        ? (humanEditorialApproval.authoritySource || C2_WAVE1_HUMAN_RESOLUTION)
        : (legacyPath || null),
      ...(humanEditorialApproval ? {
        humanEditorialApproved: true,
        existingPublicationReconciliation: existingPublishedContentReferences.length ? 'EXISTING_PUBLISHED_CONTENT_RECONCILED_NO_NEW_PUBLICATION' : 'NO_EXISTING_PUBLICATION',
        existingPublishedContentReferences
      } : {}),
      c3r1ClosureRecord: closurePassed ? C3R1_PATHS.approval : null, c3r1EvidenceHash: closurePassed ? closure.review.evidenceBundleHash : null,
      ...(vapW6aProductionApproved ? {
        humanProductionDecisionRecord: VAP_W6A_DECISIONS,
        humanProductionDecisionDigest: vapW6aProductionDecision.proposalContentHash || null,
        humanProductionApproved: true,
        humanProductionAuthoritySource: 'VAP-W6A'
      } : {}),
      ...(wave1Closure ? {
        wave1C3ClosureRecord: WAVE1_C3_CLOSURE,
        wave1SourceClosureState: wave1Closure.entry.sourceSufficiency?.status || null,
        wave1FigureDecisionState: wave1Closure.entry.figureDecision?.status || null,
        humanProductionDecisionEligible,
        ...(wave1ProductionApproved ? {
          humanProductionDecisionRecord: WAVE1_HUMAN_DECISION,
          humanProductionDecisionDigest: wave1ProductionDecision.decisionDigest,
          humanProductionApproved: true,
          c3HumanProductionApprovalRecord: WAVE1_C3_HUMAN_APPROVAL
        } : {})
      } : {})
    },
    effects: { articleGenerated: false, productionExportGenerated: false, published: false }
  };
}

function sourcesComplete(sources) {
  const researchNeeded = Array.isArray(sources.researchNeeded) ? sources.researchNeeded : [];
  const verificationNeeded = Array.isArray(sources.verificationNeeded) ? sources.verificationNeeded : [];
  const hasKnownSources = Array.isArray(sources.knownSources) && sources.knownSources.length > 0;
  const hasInternalCanonicalSources = Array.isArray(sources.internalCanonicalSources) && sources.internalCanonicalSources.length > 0;
  return (hasKnownSources || hasInternalCanonicalSources) && researchNeeded.length === 0 && verificationNeeded.length === 0;
}
function figureComplete(figures) {
  if (['optional', 'not_required', 'not_required_by_c2', 'recommended_subject_to_human_production_decision'].includes(figures.figureRequirement)) return true;
  if (figures.figureRequirement === 'required') return Array.isArray(figures.requiredFigures) && figures.requiredFigures.length > 0;
  return false;
}
function pass() { return { status: 'passed', code: null }; }
function fail(code) { return { status: 'failed', code }; }
function notAssessed(code) { return { status: 'not_assessed', code }; }
function countBy(items, key) { return items.reduce((counts, item) => { const value = key(item); counts[value] = (counts[value] || 0) + 1; return counts; }, {}); }
function assertSameCodes(expected, actual, code) { if (expected.length !== actual.length || expected.some(value => !actual.includes(value)) || new Set(actual).size !== actual.length) { const error = new Error(code); error.code = code; throw error; } }

export function validateProductionReadiness(root) {
  const expected = buildProductionReadiness(root), errors = [];
  for (const [relative, value] of expected.files) {
    const absolute = path.join(root, relative);
    if (!fs.existsSync(absolute)) errors.push(`MISSING:${relative}`);
    else if (JSON.stringify(JSON.parse(fs.readFileSync(absolute, 'utf8'))) !== JSON.stringify(value)) errors.push(`CONFLICT:${relative}`);
  }
  return { valid: errors.length === 0, errors };
}

export function resolveProductionReadiness(root, nodeCode) {
  const indexPath = path.join(root, C3_INDEX);
  if (!fs.existsSync(indexPath)) throw coded('C3_INDEX_NOT_FOUND');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const entry = index.entries.find(item => item.nodeCode === nodeCode);
  if (!entry) throw coded('NODE_NOT_FOUND');
  const assessment = JSON.parse(fs.readFileSync(path.join(root, entry.assessmentFile), 'utf8'));
  return { exists: true, node: nodeCode, ...entry, source: assessment.gates.sourceSufficiency, claims: assessment.gates.claimSufficiency, review: assessment.gates.editorialReview, approval: assessment.gates.humanProductionApproval, blocking: assessment.blocking };
}
function coded(code) { const error = new Error(code); error.code = code; return error; }
