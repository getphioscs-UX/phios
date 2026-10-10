const FIXTURE_CLASSES=['REFERENCE_FIXTURE','EDGE_FIXTURE','NEGATIVE_FIXTURE','REGRESSION_FIXTURE'];
export function evaluateEvidenceMaturity({evidenceObjects=[],pilotCases=[],operationalCases=[],longitudinalCases=[],validationResults=[],metricBindings=[],researchBindings=[],productionEvidence=[]}){
  const classes=new Set(evidenceObjects.filter(e=>e.evidenceState==='CURRENT').map(e=>e.evidenceClass));
  let em='NOT_ASSESSED'; const blocked=[];
  if(classes.has('ARCHITECTURE')) em='EM-0'; else return {evaluatedEM:em,blockedBy:['ARCHITECTURE_EVIDENCE_MISSING']};
  if(classes.has('DETERMINISM')) em='EM-1'; else return {evaluatedEM:em,blockedBy:['DETERMINISM_EVIDENCE_MISSING_OR_NOT_APPLICABLE_POLICY_UNRESOLVED']};
  if(FIXTURE_CLASSES.every(c=>classes.has(c))) em='EM-2'; else return {evaluatedEM:em,blockedBy:['REQUIRED_FIXTURE_CLASSES_INCOMPLETE']};
  if(pilotCases.some(c=>c.qualifying===true&&c.completionState==='COMPLETED')) em='EM-3'; else return {evaluatedEM:em,blockedBy:['NO_QUALIFYING_PILOT_CASE']};
  if(operationalCases.filter(c=>c.qualifying===true).length>1) em='EM-4'; else return {evaluatedEM:em,blockedBy:['MULTI_CASE_OPERATIONAL_EVIDENCE_INCOMPLETE']};
  if(longitudinalCases.some(c=>c.qualifying===true&&Array.isArray(c.timepoints)&&['t0','t1','t2'].every(t=>c.timepoints.includes(t)))) em='EM-5'; else return {evaluatedEM:em,blockedBy:['LONGITUDINAL_T0_T1_T2_EVIDENCE_MISSING']};
  if(validationResults.some(v=>v.qualifying===true)) em='EM-6'; else return {evaluatedEM:em,blockedBy:['FORMAL_VALIDATION_MISSING']};
  if(metricBindings.some(m=>m.eligible===true)) em='EM-7'; else return {evaluatedEM:em,blockedBy:['METRIC_ELIGIBILITY_MISSING']};
  if(researchBindings.some(r=>r.qualifying===true)) em='EM-8'; else return {evaluatedEM:em,blockedBy:['RESEARCH_GOVERNANCE_EVIDENCE_MISSING']};
  if(productionEvidence.some(p=>p.qualifying===true&&p.monitoring&&p.drift&&p.recovery)) em='EM-9'; else blocked.push('PRODUCTION_MONITORING_DRIFT_RECOVERY_INCOMPLETE');
  return {evaluatedEM:em,blockedBy:blocked};
}
export { FIXTURE_CLASSES };
