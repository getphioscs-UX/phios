import {sha256Stable,stableStringify} from '../zi-wei-runtime/zwr-utils.js';
export const ZIWEI_PRODUCTION_CUTOVER_SCHEMA='PHI-OS-ZIWEI-PRODUCTION-CUTOVER-DECISION-v1.0.0';
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};const list=v=>Array.isArray(v)?v:[];
function fail(code){const e=new Error(code);e.code=code;throw e;}
export function evaluateZiweiProductionCutover({machineCampaign,humanReviewCampaign,humanReviewResults}={}){
  if(machineCampaign?.schemaVersion!=='PHI-OS-ZIWEI-FP-W21-MACHINE-CAMPAIGN-v1.0.0')fail('ZIWEI_FP_W23_MACHINE_CAMPAIGN_REQUIRED');
  if(humanReviewCampaign?.schemaVersion!=='PHI-OS-ZIWEI-FP-W22-HUMAN-REVIEW-CAMPAIGN-v1.0.0')fail('ZIWEI_FP_W23_HUMAN_REVIEW_CAMPAIGN_REQUIRED');
  if(humanReviewResults?.schemaVersion!=='PHI-OS-ZIWEI-FP-W22-HUMAN-REVIEW-RESULT-v1.0.0')fail('ZIWEI_FP_W23_HUMAN_REVIEW_RESULT_REQUIRED');
  const snaps=[machineCampaign,humanReviewCampaign,humanReviewResults].map(stableStringify);
  const machinePassed=machineCampaign.status==='MACHINE_ACCEPTED_96_OF_96'&&machineCampaign.summary?.passed===96&&machineCampaign.summary?.failed===0&&machineCampaign.summary?.deterministicReplayPassed===machineCampaign.summary?.deterministicReplayCases;
  const expectedIds=humanReviewCampaign.cases.map(x=>x.caseId);const decisions=list(humanReviewResults.decisions);const decisionIds=decisions.map(x=>x.caseId);const exactCaseSet=expectedIds.length===24&&decisions.length===24&&new Set(decisionIds).size===24&&expectedIds.every(id=>decisionIds.includes(id))&&decisionIds.every(id=>expectedIds.includes(id));
  const accepted=decisions.filter(x=>x.decision==='ACCEPT').length,needsRevision=decisions.filter(x=>x.decision==='NEEDS_REVISION').length,rejected=decisions.filter(x=>x.decision==='REJECT').length,pending=decisions.filter(x=>x.decision==='PENDING').length;
  const humanAccepted=exactCaseSet&&accepted===24&&needsRevision===0&&rejected===0&&pending===0&&humanReviewResults.reviewState==='HUMAN_ACCEPTED_24_OF_24';
  const productionAllowed=machinePassed&&humanAccepted;
  const blockers=[];if(!machinePassed)blockers.push('W21_MACHINE_CAMPAIGN_NOT_ACCEPTED_96_OF_96');if(!exactCaseSet)blockers.push('W22_HUMAN_REVIEW_CASE_SET_MISMATCH');if(!humanAccepted)blockers.push('W22_HUMAN_ACCEPTANCE_24_OF_24_REQUIRED');
  const base={schemaVersion:ZIWEI_PRODUCTION_CUTOVER_SCHEMA,work:'ZIWEI-FP-W23',decision:productionAllowed?'PRODUCTION_CUTOVER_ALLOWED':'PRODUCTION_CUTOVER_BLOCKED',productionAllowed,customerCutoverAllowed:productionAllowed,machineGate:{passed:machinePassed,required:'96/96',actual:`${machineCampaign.summary?.passed||0}/${machineCampaign.summary?.executedCaseCount||0}`},humanGate:{passed:humanAccepted,required:'24/24 ACCEPT',accepted,needsRevision,rejected,pending,exactCaseSet},blockers,boundaries:{machineMaySubstituteHumanAcceptance:false,partialHumanAcceptanceAllowsCutover:false,needsRevisionAllowsCutover:false,rejectionAllowsCutover:false,newCalculationAuthorityCreated:false,newMeaningCreated:false,newFindingCreated:false}};const decisionDigest=sha256Stable(base);if([machineCampaign,humanReviewCampaign,humanReviewResults].map(stableStringify).some((x,i)=>x!==snaps[i]))fail('ZIWEI_FP_W23_INPUT_MUTATION_FORBIDDEN');return freeze({...base,decisionDigest});
}
export default Object.freeze({evaluateZiweiProductionCutover});
