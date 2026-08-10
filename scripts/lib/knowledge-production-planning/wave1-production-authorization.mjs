import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const WAVE1_HUMAN_DECISION = 'content/knowledge/production-planning/production/wave1/human-production-decision-v1.json';
export const WAVE1_C3_HUMAN_APPROVAL = 'content/knowledge/editorial/c3/closures/wave1-human-production-approval-v1.json';
export const WAVE1_FROZEN_PLAN = 'content/knowledge/production-planning/production/wave1/frozen-production-plan-v1.json';
export const WAVE1_FROZEN_WAVE = 'content/knowledge/production-planning/production/wave1/frozen-production-wave-v1.json';
export const WAVE1_EXECUTION_RECONCILIATION = 'content/knowledge/production-planning/production/wave1/execution-authority-reconciliation-v1.json';
export const WAVE1_PJA_HANDOFF = 'content/knowledge/production-planning/production/wave1/handoffs/pja-handoff-v1.json';
export const WAVE1_CAR_HANDOFF = 'content/knowledge/production-planning/production/wave1/handoffs/car-handoff-v1.json';
export const WAVE1_AUTHORIZED_PREFLIGHT = 'content/knowledge/production-planning/activation/wave1-production-authorized-v1.json';
export const WAVE1_AUTHORIZATION_CONTRACT = 'content/knowledge/production-planning/contracts/wave1-governed-production-authorization-v1.json';
export const WAVE1_SCOPE = ['KN-PREFACE-004','KN-B1-P1-003','KN-B1-P4-003','KN-B1-P4-004'];

const forbiddenHumanActors = new Set(['AI','ai','system','automation','ChatGPT','chatgpt']);
const read = (root, relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const canonical = value => JSON.stringify(sort(value));
export const canonicalSha256 = value => `sha256:${crypto.createHash('sha256').update(canonical(value), 'utf8').digest('hex')}`;

export function resolveWave1HumanProductionDecision(root, nodeCode) {
  const decisionPath = path.join(root, WAVE1_HUMAN_DECISION);
  if (!fs.existsSync(decisionPath)) return null;
  const decision = read(root, WAVE1_HUMAN_DECISION);
  validateHumanDecision(root, decision);
  const entry = decision.entries.find(item => item.nodeCode === nodeCode);
  if (!entry) return null;
  return { decision, entry, approved: entry.decision === 'approve_for_production', decisionDigest: decision.decisionDigest };
}

export function validateWave1ProductionAuthorization(root) {
  const errors = [];
  try {
    const contract = read(root, WAVE1_AUTHORIZATION_CONTRACT);
    if (contract.preservesFrozenValidationRegistries !== true) throw coded('WAVE1_FROZEN_VALIDATION_REGISTRY_MUTATION_ALLOWED');
    const decision = read(root, WAVE1_HUMAN_DECISION);
    validateHumanDecision(root, decision);
    const approval = read(root, WAVE1_C3_HUMAN_APPROVAL);
    if (approval.status !== 'APPROVED' || approval.approvedBy !== decision.actor || approval.humanDecisionDigest !== decision.decisionDigest) throw coded('WAVE1_C3_HUMAN_APPROVAL_INVALID');
    if (approval.approvalDigest !== canonicalSha256(without(approval,'approvalDigest'))) throw coded('WAVE1_C3_HUMAN_APPROVAL_DIGEST_MISMATCH');
    assertSameScope(approval.entries.map(x=>x.nodeCode));
    const plan = read(root, WAVE1_FROZEN_PLAN);
    if (plan.status !== 'FROZEN' || plan.humanDecisionDigest !== decision.decisionDigest) throw coded('WAVE1_PLAN_NOT_FROZEN');
    const planCore = {
      eligibleNodes: plan.eligibleNodes, productionRoles: plan.productionRoles, priorityProjection: plan.priorityProjection,
      waves: plan.waves, handoffTargets: plan.handoffTargets, localeTargets: plan.localeTargets,
      inputDigest: plan.inputDigest, policyDigest: plan.policyDigest
    };
    if (plan.planDigest !== canonicalSha256(planCore)) throw coded('WAVE1_PLAN_DIGEST_MISMATCH');
    const wave = read(root, WAVE1_FROZEN_WAVE);
    if (wave.status !== 'FROZEN' || wave.planDigest !== plan.planDigest || wave.humanDecisionDigest !== decision.decisionDigest) throw coded('WAVE1_WAVE_NOT_FROZEN');
    if (wave.resultDigest !== canonicalSha256({items: wave.items.map(({nodeCode,productionRole,dispatchTarget,requiredOutputs,priority})=>({nodeCode,productionRole,dispatchTarget,requiredOutputs,priority})), planDigest: plan.planDigest})) throw coded('WAVE1_WAVE_REPLAY_MISMATCH');
    const execution = read(root, WAVE1_EXECUTION_RECONCILIATION);
    if (execution.conclusion !== 'KPE_NOT_REQUIRED_KPP_WAVE1_SCOPED_DISPATCH_AUTHORIZATION') throw coded('WAVE1_EXECUTION_AUTHORITY_UNRESOLVED');
    if (execution.executionAuthority.dispatchAllowed !== true || execution.executionAuthority.providerInvocationAllowed !== false || execution.executionAuthority.publicationAllowed !== false) throw coded('WAVE1_EXECUTION_BOUNDARY_INVALID');
    if (execution.reconciliationDigest !== canonicalSha256(without(execution,'reconciliationDigest'))) throw coded('WAVE1_EXECUTION_DIGEST_MISMATCH');
    const pja = read(root, WAVE1_PJA_HANDOFF), car = read(root, WAVE1_CAR_HANDOFF);
    if (pja.status !== 'AUTHORIZED' || pja.createsCandidate !== false || pja.createsPublication !== false) throw coded('WAVE1_PJA_HANDOFF_BOUNDARY_INVALID');
    if (car.status !== 'AUTHORIZED' || car.createsAssetBrief !== false || car.createsCandidate !== false || car.createsPublication !== false) throw coded('WAVE1_CAR_HANDOFF_BOUNDARY_INVALID');
    if (pja.handoffDigest !== canonicalSha256(without(pja,'handoffDigest')) || car.handoffDigest !== canonicalSha256(without(car,'handoffDigest'))) throw coded('WAVE1_HANDOFF_DIGEST_MISMATCH');
    const pre = read(root, WAVE1_AUTHORIZED_PREFLIGHT);
    if (pre.status !== 'AUTHORIZED_FOR_GOVERNED_PRODUCTION_BRIEF_GENERATION' || pre.gateSnapshot.dispatchAllowed !== true || pre.gateSnapshot.briefGenerationAllowed !== true) throw coded('WAVE1_AUTHORIZED_PREFLIGHT_INVALID');
    if (pre.gateSnapshot.candidateCreationAllowed !== false || pre.gateSnapshot.providerInvocationAllowed !== false || pre.gateSnapshot.publicationAllowed !== false) throw coded('WAVE1_AUTHORIZED_PREFLIGHT_OVERREACH');
    for (const relative of contract.frozenValidationRegistries) {
      const doc = read(root, relative);
      if (doc.status !== 'validation_only') throw coded('WAVE1_VALIDATION_REGISTRY_STATUS_CHANGED');
      for (const key of ['decisions','plans','waves','handoffs']) if (Array.isArray(doc[key]) && doc[key].length !== 0) throw coded('WAVE1_VALIDATION_REGISTRY_NOT_EMPTY');
      if (Array.isArray(doc.revisions) && doc.revisions.length !== 0) throw coded('WAVE1_VALIDATION_REGISTRY_REVISION_NOT_EMPTY');
    }
    return { valid: true, errors: [], decision, approval, plan, wave, execution, pja, car, pre };
  } catch (error) {
    errors.push(error.code || error.message);
    return { valid: false, errors };
  }
}

function validateHumanDecision(root, decision) {
  if (decision.status !== 'APPROVED_FOR_PRODUCTION') throw coded('WAVE1_HUMAN_DECISION_NOT_APPROVED');
  if (!decision.actor || forbiddenHumanActors.has(decision.actor) || decision.actorRole !== 'HUMAN_PRODUCTION_AUTHORITY') throw coded('WAVE1_HUMAN_DECISION_ACTOR_INVALID');
  if (Number.isNaN(Date.parse(decision.timestamp))) throw coded('WAVE1_HUMAN_DECISION_TIMESTAMP_INVALID');
  if (decision.decisionDigest !== canonicalSha256(without(decision,'decisionDigest'))) throw coded('WAVE1_HUMAN_DECISION_DIGEST_MISMATCH');
  assertSameScope(decision.entries.map(x=>x.nodeCode));
  for (const entry of decision.entries) {
    if (entry.decision !== 'approve_for_production') throw coded('WAVE1_HUMAN_DECISION_ENTRY_NOT_APPROVED');
    const c2 = read(root, `content/knowledge/editorial/c2/frozen/${entry.nodeCode.toLowerCase()}.json`);
    if (c2.contentHash !== entry.c2ContentHash) throw coded('WAVE1_HUMAN_DECISION_C2_HASH_MISMATCH');
    const eligibility = read(root, entry.eligibilityReference);
    const eligible = eligibility.selectedExecutionScope.find(item => item.nodeCode === entry.nodeCode);
    if (!eligible || eligible.humanProductionDecisionEligible !== true || eligible.productionRole !== entry.productionRole || eligible.dispatchTarget !== entry.dispatchTarget) throw coded('WAVE1_HUMAN_DECISION_ELIGIBILITY_MISMATCH');
    validatePerNodeDecisionRecord(root, decision, entry);
  }
}
function validatePerNodeDecisionRecord(root, aggregateDecision, entry) {
  if (!entry.decisionRecord || !entry.decisionRecordDigest) throw coded('WAVE1_NODE_DECISION_RECORD_REFERENCE_MISSING');
  const record = read(root, entry.decisionRecord);
  const expected = {
    nodeCode: entry.nodeCode, knowledgeVersion: entry.knowledgeVersion, productionRole: entry.productionRole,
    requiredOutputs: entry.requiredOutputs, priority: entry.priority, waveCode: entry.waveCode,
    actor: aggregateDecision.actor, actorRole: aggregateDecision.actorRole, timestamp: aggregateDecision.timestamp,
    planVersion: aggregateDecision.planVersion, decision: entry.decision, dispatchTarget: entry.dispatchTarget,
    c2ContentHash: entry.c2ContentHash
  };
  for (const [key, value] of Object.entries(expected)) {
    if (canonical(record[key]) !== canonical(value)) throw coded(`WAVE1_NODE_DECISION_RECORD_${key.toUpperCase()}_MISMATCH`);
  }
  if (!record.productionDecisionCode || record.productionDecisionVersion !== '1.0.0' || !record.reason) throw coded('WAVE1_NODE_DECISION_RECORD_CONTRACT_INVALID');
  if (!Array.isArray(record.supportingEvidence) || !record.supportingEvidence.includes(entry.eligibilityReference) || !record.supportingEvidence.includes(entry.c3AssessmentReference)) throw coded('WAVE1_NODE_DECISION_RECORD_EVIDENCE_INVALID');
  const digest = canonicalSha256(without(record, 'decisionDigest'));
  if (record.decisionDigest !== digest || entry.decisionRecordDigest !== digest) throw coded('WAVE1_NODE_DECISION_RECORD_DIGEST_MISMATCH');
}
function assertSameScope(codes) {
  if (codes.length !== WAVE1_SCOPE.length || new Set(codes).size !== WAVE1_SCOPE.length || WAVE1_SCOPE.some(code => !codes.includes(code))) throw coded('WAVE1_SCOPE_MISMATCH');
}
function without(value,key){const clone=structuredClone(value);delete clone[key];return clone;}
function sort(value){if(Array.isArray(value))return value.map(sort);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,sort(value[k])]));return value;}
function coded(code){const error=new Error(code);error.code=code;return error;}
