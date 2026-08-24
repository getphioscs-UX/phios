export function projectHealthDashboard(reality={}){
  if(reality.schemaVersion!=='PHI-OS-HEALTH-REALITY-v1.0.0')throw new Error('HRX_REALITY_REQUIRED');
  return {schemaVersion:'PHI-OS-HRX-DASHBOARD-PROJECTION-v1.0.0',caseRef:reality.caseRef,careState:reality.careState,concerns:reality.concerns||[],recentEvidence:(reality.evidence||[]).slice(-5),unknowns:reality.unknowns||[],nextReview:reality.nextReview||null,disclosure:'Using your saved Health Reality only with your authorization.',governance:{diagnosisDisplayedAsRuntimeConclusion:false,privateContextRequiresAuthorization:true,projectionReadOnly:true}};
}
