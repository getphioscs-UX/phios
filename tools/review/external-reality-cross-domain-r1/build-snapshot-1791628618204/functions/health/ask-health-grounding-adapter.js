import { planAskHealthBridge } from './ask-health-bridge.js';
import { admitHealthSource } from './health-authority-runtime.js';

const text = value => String(value ?? '').trim();

export function groundAskHealthEvidence(input = {}, env = {}, authorityRegistry = {}) {
  const plan = planAskHealthBridge(input, env);
  if (!plan.healthIntent) return { route:'CKA_STANDARD', healthGroundingApplied:false };
  if (['EMERGENCY','URGENT_EVALUATION'].includes(plan.safety?.careState)) {
    return { schemaVersion:'PHI-OS-ASK-HRX-GROUNDING-v1.0.0', answerState:'SAFETY_FIRST', plan, claims:[], sources:[], unknowns:['Clinical cause is not established by PHI OS.'], governance:baseGovernance() };
  }
  const sourceAdmissions = (Array.isArray(input.sources) ? input.sources : []).map(source => admitHealthSource(source, authorityRegistry));
  const admitted = sourceAdmissions.filter(item => item.admissionState === 'ADMITTED');
  const factualClaims = (Array.isArray(input.claims) ? input.claims : []).map((claim,index)=>({ claimId:text(claim.claimId||`HRX-CLAIM-${index+1}`), text:text(claim.text), sourceId:text(claim.sourceId) }));
  const admittedIds = new Set(admitted.map(item=>item.source.sourceId));
  const ungrounded = factualClaims.filter(claim=>!claim.sourceId || !admittedIds.has(claim.sourceId));
  if (factualClaims.length && ungrounded.length) {
    return { schemaVersion:'PHI-OS-ASK-HRX-GROUNDING-v1.0.0', answerState:'AUTHORITY_REQUIRED', plan, claims:[], sources:admitted.map(x=>x.source), unknowns:['One or more health fact claims lack an admitted authority source.'], governance:baseGovernance() };
  }
  const state = plan.intent === 'HEALTH_DOCUMENT_UNDERSTANDING' ? 'GROUNDED_DOCUMENT_UNDERSTANDING'
    : plan.intent === 'HEALTH_INFORMATION' ? (factualClaims.length ? 'GROUNDED_HEALTH_INFORMATION' : 'AUTHORITY_REQUIRED')
    : 'GUIDED_HEALTH_REALITY';
  return {
    schemaVersion:'PHI-OS-ASK-HRX-GROUNDING-v1.0.0', answerState:state, plan,
    claims:factualClaims, sources:admitted.map(x=>x.source),
    evidence:Array.isArray(input.evidence) ? input.evidence : [], unknowns:Array.isArray(input.unknowns) ? input.unknowns : [], governance:baseGovernance()
  };
}

function baseGovernance(){return { generalModelMaySubstituteForMissingHealthAuthority:false, diagnosisEstablished:false, treatmentPrescribed:false, professionalJudgmentCreated:false, symbolicMethodUsedAsHealthAuthority:false };}
