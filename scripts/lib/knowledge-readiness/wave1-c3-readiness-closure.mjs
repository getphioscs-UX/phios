import fs from 'node:fs';
import path from 'node:path';
import { contentHash } from './canonical-thesis-boundary.mjs';

export const WAVE1_C3_CLOSURE_CONTRACT = 'content/knowledge/editorial/c3/wave1-c3-readiness-closure.contract.json';
export const WAVE1_C3_CLOSURE = 'content/knowledge/editorial/c3/closures/wave1-c3-readiness-closure-v1.json';
export const WAVE1_C3_SCOPE = ['KN-PREFACE-004','KN-B1-P1-003','KN-B1-P4-003','KN-B1-P4-004'];

export function resolveWave1C3ReadinessClosure(root, nodeCode) {
  if (!WAVE1_C3_SCOPE.includes(nodeCode)) return null;
  const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
  const contract = read(WAVE1_C3_CLOSURE_CONTRACT);
  const closure = read(WAVE1_C3_CLOSURE);
  if (contract.status !== 'active') throw coded('WAVE1_C3_CLOSURE_CONTRACT_INACTIVE');
  if (closure.status !== 'NON_HUMAN_GATES_CLOSED_PENDING_HUMAN_PRODUCTION_DECISION') throw coded('WAVE1_C3_CLOSURE_STATE_INVALID');
  if (closure.entries.length !== WAVE1_C3_SCOPE.length) throw coded('WAVE1_C3_CLOSURE_SCOPE_INVALID');
  const entry = closure.entries.find(item => item.nodeCode === nodeCode);
  if (!entry) throw coded('WAVE1_C3_CLOSURE_ENTRY_NOT_FOUND');
  const c2Index = read('content/knowledge/editorial/c2/canonical-thesis-boundary-index.json');
  const c2Entry = c2Index.entries.find(item => item.nodeCode === nodeCode);
  if (!c2Entry || c2Entry.status !== 'frozen' || !c2Entry.freezeRecord) throw coded('WAVE1_C3_REQUIRES_FROZEN_C2');
  const frozen = read(c2Entry.record), freeze = read(c2Entry.freezeRecord);
  const c2HashValid = frozen.contentHash === freeze.contentHash && frozen.contentHash === contentHash(frozen.content) && frozen.contentHash === entry.c2ContentHash;
  if (!c2HashValid) throw coded('WAVE1_C3_C2_HASH_MISMATCH');

  const mapping = read(closure.manuscriptMappingReconciliationReference);
  const mappingItem = mapping.items.find(item => item.nodeCode === nodeCode);
  if (!mappingItem || mapping.status !== 'HUMAN_VERIFIED' || mappingItem.humanDecision !== 'APPROVED_FOR_C2_MAPPING_VERIFICATION' || mappingItem.partHashMatched !== true) {
    throw coded('WAVE1_C3_MAPPING_NOT_HUMAN_VERIFIED');
  }

  const source = entry.sourceSufficiency;
  if (source.status === 'passed') {
    if (source.candidateScope !== 'C2_INTERNAL_CANONICAL_FRAMEWORK_ONLY') throw coded('WAVE1_C3_SOURCE_SCOPE_TOO_BROAD');
    if (source.externalResearchBlocksUnsourcedExternalClaim !== true || source.publicationSourceReviewStillRequired !== true) throw coded('WAVE1_C3_EXTERNAL_SOURCE_BOUNDARY_WEAKENED');
    if (source.legacySupportingSourceIsCanonicalAuthority !== false) throw coded('WAVE1_C3_LEGACY_AUTHORITY_ESCALATION');
  }
  const figure = entry.figureDecision;
  if (figure.status === 'passed') {
    if (figure.assetBriefCreated !== false || figure.assetCreated !== false || figure.carExecutionAllowed !== false) throw coded('WAVE1_C3_FIGURE_EXECUTION_ESCALATION');
    if (figure.decision !== 'REQUIRED_FOR_WAVE1_VISUAL_ARTICLE_RELEASE') throw coded('WAVE1_C3_FIGURE_DECISION_INVALID');
  }
  if (entry.humanProductionApproval?.status !== 'not_recorded') throw coded('WAVE1_C3_HUMAN_PRODUCTION_APPROVAL_ESCALATION');
  if (entry.exportability?.status !== 'blocked_until_human_production_decision') throw coded('WAVE1_C3_EXPORTABILITY_ESCALATION');
  return { contract, closure, entry, c2Entry, frozen, freeze, mapping, mappingItem, c2HashValid };
}

export function validateWave1C3ReadinessClosure(root) {
  const errors = [];
  for (const nodeCode of WAVE1_C3_SCOPE) {
    try { resolveWave1C3ReadinessClosure(root, nodeCode); }
    catch (error) { errors.push(`${nodeCode}:${error.code || error.message}`); }
  }
  return { valid: errors.length === 0, errors };
}

function coded(code) { const error = new Error(code); error.code = code; return error; }
