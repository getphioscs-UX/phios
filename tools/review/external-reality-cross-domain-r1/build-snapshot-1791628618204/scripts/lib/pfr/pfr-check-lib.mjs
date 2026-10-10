import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { runHfpFixture } from '../hfp/hfp-check-lib.mjs';
import {
  createFinancialPlannerEligibility,createProfessionalFinancialReviewCase,
  transitionProfessionalFinancialReviewCase,reviewFinancialFact,reviewFinancialCalculation,reviewFinancialFinding,
  createAffordabilityAssessment,createRiskCapacitySuitabilityAssessment,createProfessionalFinancialRecommendation,
  amendProfessionalFinancialRecommendation,createCustomerDiscussionRecord,createProfessionalFinancialReviewSignature,
  preparePfrAiAssistance,createProfessionalFinancialReviewContribution
} from '../../../functions/financial/professional-review/professional-financial-review-runtime.js';

export const ROOT=process.cwd(); export const PFR='content/financial/professional-review';
export const readJson=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
export const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
export const sha256File=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,p))).digest('hex');
export function walk(dir){ const out=[]; for(const e of fs.readdirSync(path.join(ROOT,dir),{withFileTypes:true})){const p=path.posix.join(dir,e.name); if(e.isDirectory())out.push(...walk(p)); else out.push(p);} return out.sort(); }
export function deepFreezeJson(x){ return JSON.parse(JSON.stringify(x)); }

export async function buildPfrBase({productScope=true}={}){
  const upstream=await runHfpFixture('retirement-heavy.json');
  const professionalId='PRO-PFR-001';
  const eligibility=await createFinancialPlannerEligibility({eligibilityId:'PFR-ELIG-001',professionalId,role:'FINANCIAL_PLANNER',credentials:[{credentialReference:'PWS-CREDENTIAL:FIXTURE-001',credentialType:'FINANCIAL_PLANNING',status:'VERIFIED_BY_GOVERNED_ADMISSION'}],jurisdiction:'MY',scope:['FINANCIAL_REVIEW',...(productScope?['PRODUCT_RECOMMENDATION']:[])],status:'ADMITTED',effectiveFrom:'2026-01-01T00:00:00Z',effectiveTo:'2027-01-01T00:00:00Z',governedAdmissionReference:'PR:ADMISSION:FIXTURE-001'});
  const caseOpen=await createProfessionalFinancialReviewCase({reviewCaseId:'PFR-CASE-001',prCaseReference:'PR-CASE:FIXTURE-001',assignmentReference:'PWS-ASSIGNMENT:FIXTURE-001',workspaceReference:'PWS-WORKSPACE:FIXTURE-001',customerReference:upstream.candidate.customerReference,professionalId,jurisdiction:'MY',consentReference:'CONSENT:FIXTURE-PROFESSIONAL-REVIEW',consentPurposeScopes:['FINANCIAL_PLANNING','PROFESSIONAL_REVIEW'],createdAt:'2026-08-23T06:00:00Z',fdrSnapshot:upstream.input.fdrSnapshot,fcrProjectionSet:upstream.input.fcrResult,farFindingSet:upstream.input.farResult,hfpCandidate:upstream.candidate,plannerEligibility:eligibility});
  const caseInReview=await transitionProfessionalFinancialReviewCase(caseOpen,'IN_REVIEW',{eventId:'PFR-EVT-OPEN',actorProfessionalId:professionalId,occurredAt:'2026-08-23T06:01:00Z'});
  const factReference='F-EPF';
  const findingReference=upstream.input.farResult.findings.find(f=>f.findingCode==='RETIREMENT_FUNDING_GAP')?.findingId || upstream.input.farResult.findings[0].findingId;
  const calculationReference=`${upstream.input.fcrResult.calculationId}:RETIREMENT:shortfall`;
  return {upstream,professionalId,eligibility,caseOpen,caseInReview,factReference,findingReference,calculationReference};
}

export function recommendationInput(base,{type='STRATEGIC_RECOMMENDATION',professionalId=base.professionalId,id='PFR-REC-001',text='Maintain a staged funding strategy aligned to the reviewed retirement objective.',specialistEscalation=null}={}){
  const significant=['STRATEGIC_RECOMMENDATION','PRODUCT_RECOMMENDATION','ESTATE_REVIEW','BUSINESS_SUCCESSION_REVIEW'].includes(type);
  const input={recommendationId:id,professionalId,recommendationType:type,objectiveReferences:['GOAL-RETIREMENT'],findingReferences:[base.findingReference],recommendation:text,rationale:'Professional judgment based on the reviewed FCR projection and FAR finding within the recorded service scope.',alternatives:significant?[{alternative:'Defer implementation and review at the next planning cycle.',reasonNotSelected:'Current objective remains active.',tradeOff:'Preserves liquidity but delays funding progress.'}]:[],disadvantages:significant?[{disadvantage:'Implementation can reduce near-term liquidity.',impact:'Lower immediately available cash.',mitigationDependency:'Review liquidity before implementation.'}]:[],implementationDependencies:['CUSTOMER_CONFIRMATION'],reviewCriteria:['REVIEW_IF_FDR_OR_FCR_CHANGES'],confidence:'MODERATE',authoredAt:'2026-08-23T06:10:00Z',specialistEscalation};
  if(type==='PRODUCT_RECOMMENDATION') Object.assign(input,{productCategory:'UNIT_TRUST',productReference:'PRODUCT:FIXTURE-001',productAdviceScopeReference:'PFR-ELIG-001:PRODUCT_RECOMMENDATION',conflictDisclosureRecorded:true,remunerationDisclosureRecorded:true});
  return input;
}

export async function fullSignedContribution({type='STRATEGIC_RECOMMENDATION'}={}){
  const base=await buildPfrBase();
  const fact=await reviewFinancialFact(base.caseInReview,base.upstream.input.fdrSnapshot,{reviewId:'PFR-FR-001',professionalId:base.professionalId,factReference:base.factReference,action:'CONFIRM',reviewedAt:'2026-08-23T06:02:00Z'});
  const calc=await reviewFinancialCalculation(base.caseInReview,base.upstream.input.fcrResult,{reviewId:'PFR-CR-001',professionalId:base.professionalId,calculationReference:base.calculationReference,action:'ACCEPT',reviewedAt:'2026-08-23T06:03:00Z'});
  const finding=await reviewFinancialFinding(base.caseInReview,base.upstream.input.farResult,{reviewId:'PFR-FIND-001',professionalId:base.professionalId,findingReference:base.findingReference,action:'ACCEPT',reviewedAt:'2026-08-23T06:04:00Z'});
  const affordability=await createAffordabilityAssessment(base.caseInReview,{assessmentId:'PFR-AFF-001',professionalId:base.professionalId,sourceCalculationReferences:[base.calculationReference],assessment:'STRETCHED',rationale:'Professional assessment of the reviewed projection; no independent calculation was performed.',limitations:['Depends on current FCR assumptions.'],assessedAt:'2026-08-23T06:05:00Z'});
  const suitability=await createRiskCapacitySuitabilityAssessment(base.caseInReview,{assessmentId:'PFR-SUIT-001',professionalId:base.professionalId,riskProfileReference:'RISK-PROFILE:FIXTURE-001',experienceReference:'EXPERIENCE:FIXTURE-001',capacityForLossReference:'CAPACITY:FIXTURE-001',goalHorizonReference:'GOAL-RETIREMENT:HORIZON',liquidityCalculationReference:`${base.upstream.input.fcrResult.calculationId}:LIQUIDITY:monthsOfExpenses`,suitabilityDecision:'SUITABLE_WITH_LIMITATIONS',rationale:'Professional suitability judgment after reviewing risk, experience, capacity, horizon and liquidity references.',limitations:['Subject to updated customer information.'],assessedAt:'2026-08-23T06:06:00Z'});
  const recommendation=await createProfessionalFinancialRecommendation(base.caseInReview,recommendationInput(base,{type}));
  const drafted=await transitionProfessionalFinancialReviewCase(base.caseInReview,'RECOMMENDATION_DRAFTED',{eventId:'PFR-EVT-DRAFT',actorProfessionalId:base.professionalId,occurredAt:'2026-08-23T06:11:00Z'});
  const discussionState=await transitionProfessionalFinancialReviewCase(drafted,'CUSTOMER_DISCUSSION',{eventId:'PFR-EVT-DISCUSS',actorProfessionalId:base.professionalId,occurredAt:'2026-08-23T06:12:00Z'});
  const discussion=await createCustomerDiscussionRecord(discussionState,{discussionId:'PFR-DISC-001',professionalId:base.professionalId,discussedAt:'2026-08-23T06:13:00Z',questions:['How would this affect liquidity?'],customerPreference:'Proceed only after reviewing implementation dependencies.',rejectedRecommendations:[],acceptedRecommendations:[recommendation.recommendationId]});
  const approved=await transitionProfessionalFinancialReviewCase(discussionState,'APPROVED',{eventId:'PFR-EVT-APPROVE',actorProfessionalId:base.professionalId,occurredAt:'2026-08-23T06:14:00Z'});
  const signature=await createProfessionalFinancialReviewSignature(approved,[recommendation],{signatureId:'PFR-SIG-001',signatureReference:'PWS-SIGNATURE:FIXTURE-PFR-001',professionalId:base.professionalId,signedAt:'2026-08-23T06:15:00Z'});
  const signed=await transitionProfessionalFinancialReviewCase(approved,'SIGNED',{eventId:'PFR-EVT-SIGN',actorProfessionalId:base.professionalId,occurredAt:'2026-08-23T06:15:00Z'});
  const actions=[{actionId:'PFR-ACTION-001',owner:base.upstream.candidate.customerReference,due:'2026-10-01',dependency:recommendation.recommendationId,status:'PROPOSED',relatedGoal:'GOAL-RETIREMENT',professionalSource:recommendation.recommendationId}];
  const contribution=await createProfessionalFinancialReviewContribution(signed,{recommendations:[recommendation],suitability,affordability,actions,signature,contributionId:'PFR-CONTRIB-001',createdAt:'2026-08-23T06:16:00Z'});
  return {base,fact,calc,finding,affordability,suitability,recommendation,drafted,discussionState,discussion,approved,signature,signed,actions,contribution};
}

export {createFinancialPlannerEligibility,createProfessionalFinancialReviewCase,transitionProfessionalFinancialReviewCase,reviewFinancialFact,reviewFinancialCalculation,reviewFinancialFinding,createAffordabilityAssessment,createRiskCapacitySuitabilityAssessment,createProfessionalFinancialRecommendation,amendProfessionalFinancialRecommendation,createCustomerDiscussionRecord,createProfessionalFinancialReviewSignature,preparePfrAiAssistance,createProfessionalFinancialReviewContribution};
