import { routeHealthSafety, classifyHealthIntent } from './health-reality-runtime.js';
export function buildHealthGuidedContext(input={}){
  const question=String(input.question||'').trim(); const intent=classifyHealthIntent({question}); const safety=routeHealthSafety({question});
  if(intent==='NON_HEALTH')return {applicable:false};
  if(['EMERGENCY','URGENT_EVALUATION'].includes(safety.careState))return {applicable:true,mode:'SAFETY_ONLY',safety,prompts:[],governance:{continuedInterviewBeforeUrgentRouting:false}};
  const prompts=[
    {code:'OBSERVED_CHANGE',label:'What exactly have you noticed or measured?'},
    {code:'START_AND_PATTERN',label:'When did it start, and how has the pattern changed?'},
    {code:'EVIDENCE_AVAILABLE',label:'Do you have measurements, test results, reports, or clinician findings?'},
    {code:'CURRENT_MEDICATIONS',label:'Are there current medicines or recent medication changes relevant to this concern?'},
    {code:'WHAT_CHANGED',label:'What else changed around the same time?'}
  ];
  return {schemaVersion:'PHI-OS-HRX-GUIDED-CONTEXT-v1.0.0',applicable:true,mode:'GUIDED_HEALTH_CONTEXT',intent,safety,prompts,governance:{differentialDiagnosisGenerated:false,causalityInferred:false,answerOptional:true,unknownAllowed:true}};
}
