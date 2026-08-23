import { sha256 } from '../calculation-runtime/stable-digest.js';

export const PFR_RUNTIME_VERSION = '1.0.0';
export const PFR_RUNTIME_CODE = 'PFR';

const REVIEW_STATES = Object.freeze([
  'OPEN','IN_REVIEW','NEEDS_MORE_INFORMATION','RECOMMENDATION_DRAFTED',
  'CUSTOMER_DISCUSSION','APPROVED','SIGNED','SUPERSEDED'
]);
const TRANSITIONS = Object.freeze({
  OPEN:['IN_REVIEW'],
  IN_REVIEW:['NEEDS_MORE_INFORMATION','RECOMMENDATION_DRAFTED'],
  NEEDS_MORE_INFORMATION:['IN_REVIEW'],
  RECOMMENDATION_DRAFTED:['CUSTOMER_DISCUSSION'],
  CUSTOMER_DISCUSSION:['APPROVED'],
  APPROVED:['SIGNED'],
  SIGNED:['SUPERSEDED'],
  SUPERSEDED:[]
});
const ELIGIBILITY_STATES = new Set(['PENDING','ADMITTED','SUSPENDED','EXPIRED','REVOKED']);
const FACT_REVIEW_ACTIONS = new Set(['CONFIRM','QUESTION','REQUEST_EVIDENCE']);
const CALC_REVIEW_ACTIONS = new Set(['ACCEPT','CHALLENGE_ASSUMPTION','REQUEST_RECALCULATION']);
const FINDING_REVIEW_ACTIONS = new Set(['ACCEPT','REJECT','QUALIFY']);
const RECOMMENDATION_TYPES = new Set([
  'STRATEGIC_RECOMMENDATION','PRODUCT_RECOMMENDATION','NO_ACTION_RECOMMENDED',
  'DEFER_DECISION','MORE_INFORMATION_REQUIRED','TAX_CONSIDERATION',
  'LEGAL_REVIEW_REQUIRED','ESTATE_REVIEW','BUSINESS_SUCCESSION_REVIEW'
]);
const NO_ACTION_TYPES = new Set(['NO_ACTION_RECOMMENDED','DEFER_DECISION','MORE_INFORMATION_REQUIRED']);
const SIGNIFICANT_TYPES = new Set(['STRATEGIC_RECOMMENDATION','PRODUCT_RECOMMENDATION','ESTATE_REVIEW','BUSINESS_SUCCESSION_REVIEW']);
const AI_TASKS = new Set(['SUMMARIZE_FACTS','SURFACE_MISSING_EVIDENCE','DRAFT_NEUTRAL_WORDING','COMPARE_EXISTING_SCENARIOS']);
const SUITABILITY_DECISIONS = new Set(['SUITABLE','SUITABLE_WITH_LIMITATIONS','NOT_SUITABLE','INSUFFICIENT_DATA']);
const AFFORDABILITY_DECISIONS = new Set(['AFFORDABLE','STRETCHED','NOT_AFFORDABLE','INSUFFICIENT_DATA']);

const clone = value => value === undefined ? undefined : structuredClone(value);
function req(value, field){ if(value===undefined||value===null||value==='') throw new TypeError(`${field} is required.`); return value; }
function list(value, field, {min=1}={}){ if(!Array.isArray(value)||value.length<min) throw new TypeError(`${field} must contain at least ${min} item(s).`); return [...value]; }
function iso(value, field){ req(value,field); const t=Date.parse(value); if(!Number.isFinite(t)) throw new TypeError(`${field} must be an ISO date/time.`); return new Date(t).toISOString(); }
function assertNoKeys(input, keys, message){ for(const k of keys) if(Object.hasOwn(input||{},k)) throw new TypeError(`${message}: ${k}`); }
function assertHuman(professionalId, caseContext, input={}){
  req(professionalId,'professionalId');
  if(professionalId!==caseContext.professionalId) throw new TypeError('Professional author must match the assigned PFR professional.');
  if(input.aiAuthored===true || input.aiApproved===true || input.aiSigned===true) throw new TypeError('AI cannot claim Professional Financial authorship, approval or signature.');
}
async function withDigest(object, field){ const basis=clone(object); delete basis[field]; return Object.freeze({...object,[field]:await sha256(basis)}); }
function findFactReference(node, factReference){
  let found=false;
  (function walk(v){ if(found||!v||typeof v!=='object') return; if(v.factId===factReference||v.assetId===factReference||v.liabilityId===factReference||v.policyId===factReference||v.goalId===factReference) {found=true;return;} if(Array.isArray(v)) v.forEach(walk); else Object.values(v).forEach(walk); })(node);
  return found;
}

export async function createFinancialPlannerEligibility(input={}){
  for(const f of ['eligibilityId','professionalId','role','jurisdiction','status','effectiveFrom','governedAdmissionReference']) req(input[f],f);
  if(!ELIGIBILITY_STATES.has(input.status)) throw new TypeError('Unsupported planner eligibility status.');
  const scopes=list(input.scope,'scope');
  const credentials=list(input.credentials,'credentials');
  const effectiveFrom=iso(input.effectiveFrom,'effectiveFrom');
  const effectiveTo=input.effectiveTo?iso(input.effectiveTo,'effectiveTo'):null;
  if(effectiveTo && effectiveTo<=effectiveFrom) throw new TypeError('Eligibility effectiveTo must follow effectiveFrom.');
  return withDigest({
    schemaVersion:'PHI-OS-PFR-W1-PLANNER-ELIGIBILITY-v1.0.0',runtimeCode:PFR_RUNTIME_CODE,
    eligibilityId:input.eligibilityId,professionalId:input.professionalId,role:input.role,
    credentials:clone(credentials),jurisdiction:input.jurisdiction,scope:clone(scopes),status:input.status,
    effectiveFrom,effectiveTo,governedAdmissionReference:input.governedAdmissionReference,
    admissionAuthority:input.admissionAuthority||'PR/PWS_CREDENTIAL',
    legalQualificationInferredBySystem:false,eligibilityDigest:null
  },'eligibilityDigest');
}

export function assertPlannerEligible(eligibility,{professionalId,jurisdiction,requiredScope,at}){
  req(eligibility?.eligibilityDigest,'eligibility.eligibilityDigest');
  if(eligibility.status!=='ADMITTED') throw new TypeError('Planner eligibility is not ADMITTED.');
  if(eligibility.professionalId!==professionalId) throw new TypeError('Planner eligibility professional mismatch.');
  if(eligibility.jurisdiction!==jurisdiction) throw new TypeError('Planner eligibility jurisdiction mismatch.');
  if(!eligibility.scope.includes(requiredScope)) throw new TypeError('Planner eligibility does not include required scope.');
  const when=iso(at,'eligibility.at');
  if(when<eligibility.effectiveFrom || (eligibility.effectiveTo && when>=eligibility.effectiveTo)) throw new TypeError('Planner eligibility is outside effective dates.');
  return Object.freeze({decision:'GOVERNED_ADMISSION_RECORDED',legalQualificationInferred:false,eligibilityReference:eligibility.eligibilityId});
}

export async function createProfessionalFinancialReviewCase(input={}){
  for(const f of ['reviewCaseId','prCaseReference','assignmentReference','workspaceReference','customerReference','professionalId','jurisdiction','consentReference','createdAt','fdrSnapshot','fcrProjectionSet','farFindingSet','hfpCandidate','plannerEligibility']) req(input[f],f);
  if(!Array.isArray(input.consentPurposeScopes)||!input.consentPurposeScopes.includes('PROFESSIONAL_REVIEW')) throw new TypeError('PROFESSIONAL_REVIEW consent scope is required.');
  assertPlannerEligible(input.plannerEligibility,{professionalId:input.professionalId,jurisdiction:input.jurisdiction,requiredScope:'FINANCIAL_REVIEW',at:input.createdAt});
  const fdr=req(input.fdrSnapshot.digest,'fdrSnapshot.digest');
  const fcr=req(input.fcrProjectionSet.resultDigest,'fcrProjectionSet.resultDigest');
  const far=req(input.farFindingSet.resultDigest,'farFindingSet.resultDigest');
  const hfp=req(input.hfpCandidate.candidateDigest,'hfpCandidate.candidateDigest');
  if(input.fcrProjectionSet.fdrDigest!==fdr) throw new TypeError('PFR FCR/FDR lineage mismatch.');
  if(input.farFindingSet.fdrDigest!==fdr || input.farFindingSet.fcrResultDigest!==fcr) throw new TypeError('PFR FAR lineage mismatch.');
  const sourceFcr=(input.hfpCandidate.sourceLineage?.FCR||[]).map(x=>x.resultDigest);
  if(input.hfpCandidate.sourceLineage?.FDR?.digest!==fdr || !sourceFcr.includes(fcr) || input.hfpCandidate.sourceLineage?.FAR?.resultDigest!==far) throw new TypeError('PFR HFP source lineage mismatch.');
  return withDigest({
    schemaVersion:'PHI-OS-PFR-W2-REVIEW-CASE-v1.0.0',runtimeCode:PFR_RUNTIME_CODE,reviewCaseId:input.reviewCaseId,
    prCaseReference:input.prCaseReference,pwsCaseObjectCreated:false,assignmentReference:input.assignmentReference,workspaceReference:input.workspaceReference,
    customerReference:input.customerReference,professionalId:input.professionalId,jurisdiction:input.jurisdiction,
    consentReference:input.consentReference,consentPurposeScopes:[...input.consentPurposeScopes],plannerEligibilityReference:input.plannerEligibility.eligibilityId,plannerScope:clone(input.plannerEligibility.scope),
    sourceBindings:{FDR:{snapshotId:input.fdrSnapshot.snapshotId,digest:fdr},FCR:{calculationId:input.fcrProjectionSet.calculationId,resultDigest:fcr},FAR:{analysisId:input.farFindingSet.analysisId,resultDigest:far},HFP:{planCandidateId:input.hfpCandidate.planCandidateId,candidateDigest:hfp}},
    state:'OPEN',createdAt:iso(input.createdAt,'createdAt'),reviewEvents:[],caseDigest:null
  },'caseDigest');
}

export async function transitionProfessionalFinancialReviewCase(caseContext,toState,event={}){
  req(caseContext?.caseDigest,'caseContext.caseDigest'); req(toState,'toState');
  if(!REVIEW_STATES.includes(toState)) throw new TypeError('Unsupported PFR review state.');
  if(!(TRANSITIONS[caseContext.state]||[]).includes(toState)) throw new TypeError(`Illegal PFR transition ${caseContext.state} -> ${toState}.`);
  req(event.eventId,'event.eventId'); req(event.actorProfessionalId,'event.actorProfessionalId');
  assertHuman(event.actorProfessionalId,caseContext,event);
  const e={eventId:event.eventId,fromState:caseContext.state,toState,actorProfessionalId:event.actorProfessionalId,occurredAt:iso(event.occurredAt,'event.occurredAt'),reason:event.reason||null,previousCaseDigest:caseContext.caseDigest};
  e.eventDigest=await sha256(e);
  return withDigest({...clone(caseContext),state:toState,reviewEvents:[...(caseContext.reviewEvents||[]),e],caseDigest:null},'caseDigest');
}

export async function reviewFinancialFact(caseContext,fdrSnapshot,input={}){
  if(!['IN_REVIEW','NEEDS_MORE_INFORMATION'].includes(caseContext?.state)) throw new TypeError('Fact review requires IN_REVIEW or NEEDS_MORE_INFORMATION.');
  if(fdrSnapshot?.digest!==caseContext.sourceBindings.FDR.digest) throw new TypeError('Fact review FDR digest mismatch.');
  for(const f of ['reviewId','professionalId','factReference','action','reviewedAt']) req(input[f],f);
  assertHuman(input.professionalId,caseContext,input);
  if(!FACT_REVIEW_ACTIONS.has(input.action)) throw new TypeError('Unsupported fact review action.');
  assertNoKeys(input,['replacementValue','correctedValue','newValue','replacementFact','mutateFact'],'PFR cannot silently edit FDR facts');
  if(!findFactReference(fdrSnapshot.snapshotPayload,input.factReference)) throw new TypeError('Fact reference is not present in the bound FDR snapshot.');
  return withDigest({schemaVersion:'PHI-OS-PFR-W4-FACT-REVIEW-v1.0.0',reviewId:input.reviewId,reviewCaseId:caseContext.reviewCaseId,professionalId:input.professionalId,fdrSnapshotDigest:fdrSnapshot.digest,factReference:input.factReference,action:input.action,comment:input.comment||null,reviewedAt:iso(input.reviewedAt,'reviewedAt'),fdrFactMutated:false,correctionRoute:input.action==='QUESTION'?'FDR_CHANGE_EVENT_REQUIRED':input.action==='REQUEST_EVIDENCE'?'FDR_EVIDENCE_UPDATE_REQUIRED':null,reviewDigest:null},'reviewDigest');
}

export async function reviewFinancialCalculation(caseContext,fcrResult,input={}){
  if(!['IN_REVIEW','NEEDS_MORE_INFORMATION'].includes(caseContext?.state)) throw new TypeError('Calculation review requires IN_REVIEW or NEEDS_MORE_INFORMATION.');
  if(fcrResult?.resultDigest!==caseContext.sourceBindings.FCR.resultDigest) throw new TypeError('Calculation review FCR digest mismatch.');
  for(const f of ['reviewId','professionalId','calculationReference','action','reviewedAt']) req(input[f],f);
  assertHuman(input.professionalId,caseContext,input);
  if(!CALC_REVIEW_ACTIONS.has(input.action)) throw new TypeError('Unsupported calculation review action.');
  assertNoKeys(input,['replacementResult','manualResult','overrideValue','correctedResult'],'PFR cannot override FCR results');
  if(input.action==='CHALLENGE_ASSUMPTION') list(input.assumptionReferences,'assumptionReferences');
  return withDigest({schemaVersion:'PHI-OS-PFR-W5-CALCULATION-REVIEW-v1.0.0',reviewId:input.reviewId,reviewCaseId:caseContext.reviewCaseId,professionalId:input.professionalId,fcrResultDigest:fcrResult.resultDigest,calculationReference:input.calculationReference,action:input.action,assumptionReferences:clone(input.assumptionReferences||[]),comment:input.comment||null,reviewedAt:iso(input.reviewedAt,'reviewedAt'),fcrResultMutated:false,recalculationRoute:input.action==='ACCEPT'?null:'FCR_RERUN_REQUIRED',reviewDigest:null},'reviewDigest');
}

export async function reviewFinancialFinding(caseContext,farResult,input={}){
  if(!['IN_REVIEW','NEEDS_MORE_INFORMATION'].includes(caseContext?.state)) throw new TypeError('Finding review requires IN_REVIEW or NEEDS_MORE_INFORMATION.');
  if(farResult?.resultDigest!==caseContext.sourceBindings.FAR.resultDigest) throw new TypeError('Finding review FAR digest mismatch.');
  for(const f of ['reviewId','professionalId','findingReference','action','reviewedAt']) req(input[f],f);
  assertHuman(input.professionalId,caseContext,input);
  if(!FINDING_REVIEW_ACTIONS.has(input.action)) throw new TypeError('Unsupported finding review action.');
  assertNoKeys(input,['replacementFinding','rewrittenFinding','mutateFinding'],'PFR cannot rewrite FAR findings');
  if(!(farResult.findings||[]).some(f=>f.findingId===input.findingReference)) throw new TypeError('Finding reference is not present in bound FAR result.');
  if(input.action==='QUALIFY') req(input.qualification,'qualification');
  return withDigest({schemaVersion:'PHI-OS-PFR-W6-FINDING-REVIEW-v1.0.0',reviewId:input.reviewId,reviewCaseId:caseContext.reviewCaseId,professionalId:input.professionalId,farResultDigest:farResult.resultDigest,findingReference:input.findingReference,action:input.action,qualification:input.qualification||null,comment:input.comment||null,reviewedAt:iso(input.reviewedAt,'reviewedAt'),farFindingMutated:false,reviewDigest:null},'reviewDigest');
}

export async function createAffordabilityAssessment(caseContext,input={}){
  if(!['IN_REVIEW','RECOMMENDATION_DRAFTED','CUSTOMER_DISCUSSION'].includes(caseContext?.state)) throw new TypeError('Affordability review is not available in this state.');
  for(const f of ['assessmentId','professionalId','assessment','assessedAt']) req(input[f],f);
  assertHuman(input.professionalId,caseContext,input); if(!AFFORDABILITY_DECISIONS.has(input.assessment)) throw new TypeError('Unsupported affordability assessment.');
  const refs=list(input.sourceCalculationReferences,'sourceCalculationReferences');
  return withDigest({schemaVersion:'PHI-OS-PFR-W11-AFFORDABILITY-v1.0.0',assessmentId:input.assessmentId,reviewCaseId:caseContext.reviewCaseId,professionalId:input.professionalId,sourceCalculationReferences:refs,assessment:input.assessment,rationale:req(input.rationale,'rationale'),limitations:clone(input.limitations||[]),assessedAt:iso(input.assessedAt,'assessedAt'),professionalAssessment:true,independentCalculationPerformed:false,assessmentDigest:null},'assessmentDigest');
}

export async function createRiskCapacitySuitabilityAssessment(caseContext,input={}){
  if(!['IN_REVIEW','RECOMMENDATION_DRAFTED','CUSTOMER_DISCUSSION'].includes(caseContext?.state)) throw new TypeError('Suitability review is not available in this state.');
  for(const f of ['assessmentId','professionalId','riskProfileReference','experienceReference','capacityForLossReference','goalHorizonReference','liquidityCalculationReference','suitabilityDecision','assessedAt']) req(input[f],f);
  assertHuman(input.professionalId,caseContext,input); if(!SUITABILITY_DECISIONS.has(input.suitabilityDecision)) throw new TypeError('Unsupported suitability decision.');
  return withDigest({schemaVersion:'PHI-OS-PFR-W12-SUITABILITY-v1.0.0',assessmentId:input.assessmentId,reviewCaseId:caseContext.reviewCaseId,professionalId:input.professionalId,riskProfileReference:input.riskProfileReference,experienceReference:input.experienceReference,capacityForLossReference:input.capacityForLossReference,goalHorizonReference:input.goalHorizonReference,liquidityCalculationReference:input.liquidityCalculationReference,suitabilityDecision:input.suitabilityDecision,rationale:req(input.rationale,'rationale'),limitations:clone(input.limitations||[]),assessedAt:iso(input.assessedAt,'assessedAt'),professionalJudgment:true,assessmentDigest:null},'assessmentDigest');
}

export async function createProfessionalFinancialRecommendation(caseContext,input={}){
  if(!['IN_REVIEW','RECOMMENDATION_DRAFTED','CUSTOMER_DISCUSSION'].includes(caseContext?.state)) throw new TypeError('Recommendation cannot be authored in the current PFR state.');
  for(const f of ['recommendationId','professionalId','recommendationType','recommendation','rationale','confidence','authoredAt']) req(input[f],f);
  assertHuman(input.professionalId,caseContext,input);
  if(!RECOMMENDATION_TYPES.has(input.recommendationType)) throw new TypeError('Unsupported PFR recommendation type.');
  assertNoKeys(input,['willClause','legalClause','taxOpinion','estateDistributionInstruction','beneficiaryDistributionInstruction'],'PFR cannot author legal/tax/Will authority payload');
  const objectiveReferences=list(input.objectiveReferences,'objectiveReferences');
  const findingReferences=list(input.findingReferences,'findingReferences',{min:0});
  const alternatives=clone(input.alternatives||[]), disadvantages=clone(input.disadvantages||[]);
  if(SIGNIFICANT_TYPES.has(input.recommendationType) && (!alternatives.length || !disadvantages.length)) throw new TypeError('Significant recommendations require alternatives and disadvantages.');
  if(NO_ACTION_TYPES.has(input.recommendationType) && input.productReference) throw new TypeError('No-action/defer recommendations cannot carry a product reference.');
  if(input.recommendationType==='PRODUCT_RECOMMENDATION'){
    if(!caseContext.plannerScope?.includes('PRODUCT_RECOMMENDATION')) throw new TypeError('Product recommendation is outside governed planner admission scope.');
    req(input.productCategory,'productCategory'); req(input.productReference,'productReference'); req(input.productAdviceScopeReference,'productAdviceScopeReference');
    if(input.conflictDisclosureRecorded!==true || input.remunerationDisclosureRecorded!==true) throw new TypeError('Product recommendation requires conflict and remuneration disclosure records.');
  }
  if(input.recommendationType==='TAX_CONSIDERATION' && input.specialistEscalation!=='TAX_PROFESSIONAL_REVIEW_REQUIRED') throw new TypeError('Tax consideration requires tax specialist escalation.');
  if(input.recommendationType==='LEGAL_REVIEW_REQUIRED' && input.specialistEscalation!=='LEGAL_PROFESSIONAL_REVIEW_REQUIRED') throw new TypeError('Legal review requires legal specialist escalation.');
  const rec={schemaVersion:'PHI-OS-PFR-W7-RECOMMENDATION-v1.0.0',recommendationId:input.recommendationId,version:input.version||1,reviewCaseId:caseContext.reviewCaseId,professionalId:input.professionalId,recommendationType:input.recommendationType,objectiveReferences,findingReferences,recommendation:input.recommendation,rationale:input.rationale,alternatives,disadvantages,implementationDependencies:clone(input.implementationDependencies||[]),reviewCriteria:clone(input.reviewCriteria||[]),confidence:input.confidence,productCategory:input.productCategory||null,productReference:input.productReference||null,productAdviceScopeReference:input.productAdviceScopeReference||null,conflictDisclosureRecorded:input.conflictDisclosureRecorded===true,remunerationDisclosureRecorded:input.remunerationDisclosureRecorded===true,specialistEscalation:input.specialistEscalation||null,legalOrTaxAuthorityClaimed:false,authoredBy:{type:'HUMAN_PROFESSIONAL',professionalId:input.professionalId},authoredAt:iso(input.authoredAt,'authoredAt'),supersedesRecommendationDigest:input.supersedesRecommendationDigest||null,recommendationDigest:null};
  return withDigest(rec,'recommendationDigest');
}

export async function amendProfessionalFinancialRecommendation(caseContext,previous,input={}){
  req(previous?.recommendationDigest,'previous.recommendationDigest');
  if(previous.reviewCaseId!==caseContext.reviewCaseId) throw new TypeError('Recommendation amendment case mismatch.');
  assertHuman(input.professionalId,caseContext,input);
  if(input.recommendationId && input.recommendationId!==previous.recommendationId) throw new TypeError('Amendment must preserve recommendationId.');
  return createProfessionalFinancialRecommendation(caseContext,{...clone(previous),...clone(input),recommendationId:previous.recommendationId,version:Number(previous.version)+1,supersedesRecommendationDigest:previous.recommendationDigest,recommendationDigest:undefined});
}

export async function createCustomerDiscussionRecord(caseContext,input={}){
  if(caseContext?.state!=='CUSTOMER_DISCUSSION') throw new TypeError('Customer discussion record requires CUSTOMER_DISCUSSION state.');
  for(const f of ['discussionId','professionalId','discussedAt','customerPreference']) req(input[f],f);
  assertHuman(input.professionalId,caseContext,input);
  return withDigest({schemaVersion:'PHI-OS-PFR-W17-CUSTOMER-DISCUSSION-v1.0.0',discussionId:input.discussionId,reviewCaseId:caseContext.reviewCaseId,professionalId:input.professionalId,discussedAt:iso(input.discussedAt,'discussedAt'),questions:clone(input.questions||[]),customerPreference:input.customerPreference,rejectedRecommendations:clone(input.rejectedRecommendations||[]),acceptedRecommendations:clone(input.acceptedRecommendations||[]),discussionDigest:null},'discussionDigest');
}

export async function createProfessionalFinancialReviewSignature(caseContext,recommendations,input={}){
  if(caseContext?.state!=='APPROVED') throw new TypeError('Professional signature requires APPROVED review state.');
  for(const f of ['signatureId','signatureReference','professionalId','signedAt']) req(input[f],f);
  assertHuman(input.professionalId,caseContext,input);
  const recs=list(recommendations,'recommendations');
  for(const rec of recs){ req(rec.recommendationDigest,'recommendation.recommendationDigest'); if(rec.professionalId!==input.professionalId) throw new TypeError('All signed recommendations must be authored by the signing professional.'); }
  const recommendationDigest=await sha256(recs.map(r=>({recommendationId:r.recommendationId,version:r.version,digest:r.recommendationDigest})).sort((a,b)=>a.recommendationId.localeCompare(b.recommendationId)));
  return withDigest({schemaVersion:'PHI-OS-PFR-W19-SIGNATURE-v1.0.0',signatureId:input.signatureId,signatureReference:input.signatureReference,reviewCaseId:caseContext.reviewCaseId,professionalId:input.professionalId,reviewDigest:caseContext.caseDigest,recommendationDigest,hfpCandidateDigest:caseContext.sourceBindings.HFP.candidateDigest,signedAt:iso(input.signedAt,'signedAt'),aiSigned:false,signatureDigest:null},'signatureDigest');
}

export async function preparePfrAiAssistance(input={}){
  for(const f of ['assistanceId','task','sourceReferences','requestedAt']) req(input[f],f);
  if(!AI_TASKS.has(input.task)) throw new TypeError('AI task is outside the PFR assistance boundary.');
  assertNoKeys(input,['approval','signature','suitabilityDecision','recommendation','professionalAuthor','professionalId'],'AI cannot create Professional Financial Judgment');
  return withDigest({schemaVersion:'PHI-OS-PFR-W20-AI-ASSISTANCE-v1.0.0',assistanceId:input.assistanceId,task:input.task,sourceReferences:list(input.sourceReferences,'sourceReferences'),requestedAt:iso(input.requestedAt,'requestedAt'),outputCandidate:clone(input.outputCandidate||null),authority:'AI_ASSISTANCE_ONLY',professionalAuthorshipEffect:'NONE',mayApprove:false,maySign:false,mayCreateSuitabilityDecision:false,mayCreateRecommendation:false,assistanceDigest:null},'assistanceDigest');
}

function contributionTypeForRecommendation(rec){
  if(rec.recommendationType==='TAX_CONSIDERATION'||rec.recommendationType==='LEGAL_REVIEW_REQUIRED') return 'WARNING';
  return 'RECOMMENDATION';
}

export async function createProfessionalFinancialReviewContribution(caseContext,{recommendations=[],suitability=null,affordability=null,actions=[],signature,contributionId,createdAt}={}){
  if(caseContext?.state!=='SIGNED') throw new TypeError('PFR contribution requires SIGNED review state.');
  req(signature?.signatureDigest,'signature.signatureDigest'); req(contributionId,'contributionId');
  if(signature.reviewCaseId!==caseContext.reviewCaseId) throw new TypeError('Signature/review case mismatch.');
  const signedEvent=caseContext.reviewEvents.at(-1);
  if(!signedEvent || signedEvent.toState!=='SIGNED' || signature.reviewDigest!==signedEvent.previousCaseDigest) throw new TypeError('Signature is not bound to the approved review digest.');
  if(signature.hfpCandidateDigest!==caseContext.sourceBindings.HFP.candidateDigest) throw new TypeError('Signature/HFP candidate digest mismatch.');
  if(signature.professionalId!==caseContext.professionalId) throw new TypeError('Signature professional mismatch.');
  const recs=list(recommendations,'recommendations',{min:0});
  for(const rec of recs){ if(rec.professionalId!==caseContext.professionalId) throw new TypeError('Contribution recommendation author mismatch.'); req(rec.recommendationDigest,'recommendation.recommendationDigest'); }
  const expectedRecommendationDigest=await sha256(recs.map(r=>({recommendationId:r.recommendationId,version:r.version,digest:r.recommendationDigest})).sort((a,b)=>a.recommendationId.localeCompare(b.recommendationId)));
  if(signature.recommendationDigest!==expectedRecommendationDigest) throw new TypeError('Signature/recommendation digest mismatch.');
  if(suitability && suitability.professionalId!==caseContext.professionalId) throw new TypeError('Suitability author mismatch.');
  const alternatives=recs.flatMap(r=>(r.alternatives||[]).map((a,i)=>({recommendationId:r.recommendationId,index:i,...clone(a)})));
  const disadvantages=recs.flatMap(r=>(r.disadvantages||[]).map((d,i)=>({recommendationId:r.recommendationId,index:i,...clone(d)})));
  const contribution={schemaVersion:'PHI-OS-PFR-W21-CONTRIBUTION-v1.0.0',contributionId,reviewCaseId:caseContext.reviewCaseId,sourceAuthority:'PFR',professionalId:caseContext.professionalId,hfpCandidateReference:caseContext.sourceBindings.HFP.planCandidateId,hfpCandidateDigest:caseContext.sourceBindings.HFP.candidateDigest,recommendations:clone(recs),suitability:clone(suitability),affordability:clone(affordability),alternatives,disadvantages,actions:clone(actions),professionalAttribution:{authorReference:`PROFESSIONAL:${caseContext.professionalId}`,professionalId:caseContext.professionalId,prCaseReference:caseContext.prCaseReference,assignmentReference:caseContext.assignmentReference},signature:clone(signature),createdAt:iso(createdAt,'createdAt'),contributionDigest:null};
  const frozen=await withDigest(contribution,'contributionDigest');
  const hfpContributionReferences=[];
  for(const rec of recs){
    hfpContributionReferences.push({contributionId:`${contributionId}:${rec.recommendationId}`,contributionType:contributionTypeForRecommendation(rec),sourceAuthority:'PFR',sourceReference:`PFR:${contributionId}:RECOMMENDATION:${rec.recommendationId}:v${rec.version}`,sourceDigest:frozen.contributionDigest,authorReference:`PROFESSIONAL:${caseContext.professionalId}`,authoredAt:rec.authoredAt,content:{text:rec.recommendation,objectiveReferences:clone(rec.objectiveReferences),findingReferences:clone(rec.findingReferences),recommendationReference:rec.recommendationId,rationale:rec.rationale,recommendationType:rec.recommendationType}});
    for(let i=0;i<(rec.alternatives||[]).length;i++) hfpContributionReferences.push({contributionId:`${contributionId}:${rec.recommendationId}:ALT:${i+1}`,contributionType:'ALTERNATIVE',sourceAuthority:'PFR',sourceReference:`PFR:${contributionId}:ALTERNATIVE:${rec.recommendationId}:${i+1}`,sourceDigest:frozen.contributionDigest,authorReference:`PROFESSIONAL:${caseContext.professionalId}`,authoredAt:rec.authoredAt,content:clone(rec.alternatives[i])});
    for(let i=0;i<(rec.disadvantages||[]).length;i++) hfpContributionReferences.push({contributionId:`${contributionId}:${rec.recommendationId}:DIS:${i+1}`,contributionType:'DISADVANTAGE',sourceAuthority:'PFR',sourceReference:`PFR:${contributionId}:DISADVANTAGE:${rec.recommendationId}:${i+1}`,sourceDigest:frozen.contributionDigest,authorReference:`PROFESSIONAL:${caseContext.professionalId}`,authoredAt:rec.authoredAt,content:clone(rec.disadvantages[i])});
  }
  if(suitability){
    const primary=recs[0];
    hfpContributionReferences.push({contributionId:`${contributionId}:SUITABILITY`,contributionType:'SUITABILITY',sourceAuthority:'PFR',sourceReference:`PFR:${contributionId}:SUITABILITY`,sourceDigest:frozen.contributionDigest,authorReference:`PROFESSIONAL:${caseContext.professionalId}`,authoredAt:suitability.assessedAt,content:{objectiveReference:primary?.objectiveReferences?.[0]||'UNKNOWN',findingReference:primary?.findingReferences?.[0]||'UNKNOWN',recommendationReference:primary?.recommendationId||'NO_RECOMMENDATION',impactReference:`PFR:${contributionId}:IMPACT`,experienceReference:suitability.experienceReference,capacityReference:suitability.capacityForLossReference,alternativeReferences:alternatives.map(a=>`PFR:${contributionId}:ALT:${a.recommendationId}:${a.index+1}`),disadvantageReferences:disadvantages.map(d=>`PFR:${contributionId}:DIS:${d.recommendationId}:${d.index+1}`),suitabilityDecision:suitability.suitabilityDecision}});
  }
  for(const action of actions) hfpContributionReferences.push({contributionId:`${contributionId}:ACTION:${action.actionId}`,contributionType:'ACTION',sourceAuthority:'PFR',sourceReference:`PFR:${contributionId}:ACTION:${action.actionId}`,sourceDigest:frozen.contributionDigest,authorReference:`PROFESSIONAL:${caseContext.professionalId}`,authoredAt:frozen.createdAt,content:clone(action)});
  return Object.freeze({...frozen,hfpContributionReferences:Object.freeze(hfpContributionReferences)});
}

export { REVIEW_STATES, TRANSITIONS, RECOMMENDATION_TYPES, AI_TASKS };
