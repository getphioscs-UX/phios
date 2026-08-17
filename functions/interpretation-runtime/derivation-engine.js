import { getDerivationOperator } from './operators.js';
import { isInterpretationConfidence } from './confidence.js';
export function validateDerivationEdge(edge){
  if(!edge || !getDerivationOperator(edge.operatorId)) return {valid:false,reason:'UNKNOWN_OPERATOR'};
  if(!isInterpretationConfidence(edge.confidenceClass)) return {valid:false,reason:'INVALID_CONFIDENCE'};
  if(!Array.isArray(edge.evidenceRefs) || edge.evidenceRefs.length===0) return {valid:false,reason:'EVIDENCE_REQUIRED'};
  return {valid:true,canonicalDerivationExecuted:false,authorityTransfer:false};
}
export function executeCanonicalDerivation(){ throw new Error('MIR-5 is governance foundation only; canonical derivation execution is reserved for MIR-6'); }
