// Subject-aware source successor proposal inside the existing Financial owner.
// Original personal/household formula, draft, grants and composer stay untouched.
import {authorizeBusinessCandidateR6} from '../../profile/business-subject-authorization-candidate-r6.js';
import {requireR3,assertLocalR3} from '../../profile/subject-bft-authority-candidate-r3.js';
import {BUSINESS_FIELDS,INTAKE_R3} from './business-intake-candidate-r3.js';
import {createBusinessOwnerAdmissionCandidate} from './business-owner-admission-candidate-r5.js';
export const FINANCIAL_SOURCE_R6='BUSINESS_FINANCIAL_SOURCE_SUCCESSOR_R6';
export const READING_SOURCE_CLASSES_R6=Object.freeze(['OBSERVED_BUSINESS_FACT','REVIEWED_FINANCIAL_SOURCE','CALCULATED_METRIC','USER_STATEMENT','PROFESSIONAL_INTERPRETATION','SCENARIO_ASSUMPTION','MISSING_EVIDENCE']);
export function financialSourceDispatchR6(subjectType){
 requireR3(['PERSONAL','HOUSEHOLD','BUSINESS'].includes(subjectType),'R6_FINANCIAL_SUBJECT_TYPE_REQUIRED',422);
 return subjectType==='BUSINESS'?{subjectType,sourceKind:'BUSINESS_STATEMENT_SOURCE',sourceOwner:'functions/professional/financial/business-intake-candidate-r3.js',calculationOwner:'businessSummary / existing range-arithmetic',legacyHouseholdFormulaApplicable:false,existingPersonalReportApplicable:false,formalAdmission:false}:{subjectType,sourceKind:'EXISTING_ACCOUNT_FINANCIAL_SOURCE',sourceOwner:'functions/account/financial-will-draft-store.js',calculationOwner:'functions/professional/financial/financial-formula-registry.js',legacyHouseholdFormulaApplicable:true,payloadTransformation:'NONE',additionalBusinessFieldsRequired:false,formalAdmission:false};
}
export function legacyFinancialIdentityR6(subjectType,payload){
 requireR3(['PERSONAL','HOUSEHOLD'].includes(subjectType),'R6_LEGACY_BUSINESS_COERCION_FORBIDDEN',422);
 requireR3(payload&&typeof payload==='object'&&payload.subjectType!=='BUSINESS'&&payload.sourceKind!=='BUSINESS_STATEMENT_SOURCE'&&payload.schemaVersion!==INTAKE_R3&&payload.schemaVersion!==FINANCIAL_SOURCE_R6,'R6_BUSINESS_SOURCE_NOT_LEGACY_INPUT',422);
 // Identity projection only, not a replacement validator, data reader or grant.
 return payload;
}
export function continuityPolicyProposalR6(){return {version:'SUBJECT-BFT-CONTINUITY-POLICY-PROPOSAL-R6',state:'HUMAN_DECISION_REQUIRED',caseOwner:'Native PWS case; Subject is not the custodian Account',reopen:'Current authenticated account + current Subject/purpose/resource/member permission; native snapshot version and integrity checks',localRetentionDays:[7,30],formalRetentionDays:null,permanentRetention:false,formalCaseClasses:['DRAFT_QA','APPROVED_DELIVERY','AUDIT_REFERENCE'],formalClassRetention:'Explicit purpose/jurisdiction/source-owner decision required per class',consultantDeparture:'Deny new access on expiry/revocation; no residual client-file right',grantRevocation:'Deny access immediately; do not silently delete retained delivery/audit records',versionPin:'Pin Subject, source, formula, review, Reading and output versions; formal grant-version pin needs Owner-approved metadata adaptation',duplicateSave:'Existing native request reservation and request digest; conflicting reuse rejected',concurrency:'Existing native reservation; cross-process contention must not be claimed as fully recovered',pendingRecovery:'Keep PENDING explicit; reconcile native reference/encrypted-object pair; no blind overwrite or synthetic COMPLETE',expiry:'Deny reopen; cleanup remains a separately authorized, auditable owner operation',legalHold:'Policy review required; never infer deletion permission',deletionExecutorAuthorized:false,newStore:false,production:false};}
export function evaluateOwnerAdmissionR6(){return {subject:'PENDING_EXACT_OWNER_DECISION_AND_REAL_MANDATE',financial:'TYPED_SOURCE_CONFLICT_RESOLVED_LOCALLY_NOT_ADMITTED',reading:{data:'PENDING',interpretation:'PENDING',publication:'PENDING'},navigation:{family:'FINANCIAL',newSubjectFamily:false,sourceContractAccepted:false,financialContextValid:false,readingVersionAdmitted:false,userDecisionAuthorityValid:false,actionScopeValid:false,ownerBoundPass:false},continuity:'POLICY_PROPOSED_NOT_ADMITTED',firstFormalBlocker:'SUBJECT_PRODUCTION_OWNER_POLICY',production:'NOT_AUTHORIZED'};}
export function createSubjectAwareFinancialCandidateR6(o){
 const native=createBusinessOwnerAdmissionCandidate(o);
 async function read(subjectId,identity,input){
  const a=await authorizeBusinessCandidateR6(o.deps,subjectId,identity,'reading:probe');
  const p=await native.read(subjectId,identity,input),s=await o.intakes.read(input.intakeRef,identity),r=s.record;
  requireR3(s.sourceVersion===p.source.sourceVersion&&s.sourceVersion===input.expectedSourceVersion,'R6_EXACT_SOURCE_VERSION_REQUIRED',409);
  requireR3(r.legalForm===a.restrictedContract.businessType,'R6_FINANCIAL_BUSINESS_TYPE_MISMATCH',409);
  requireR3(r.review?.reviewedBy&&r.review.reviewedBy!==s.preparedByAccount&&['REVIEWED','RECONCILED'].includes(r.dataQuality),'R6_INDEPENDENT_REVIEW_REQUIRED',409);
  const source={schemaVersion:FINANCIAL_SOURCE_R6,subjectType:'BUSINESS',sourceKind:'BUSINESS_STATEMENT_SOURCE',subjectId,accountId:identity.userId,subjectVersion:a.subject.metadata.version,
   common:{currency:r.context.currency,reportingPeriod:{id:r.context.period,start:r.context.startDate,end:r.context.endDate},source:{owner:p.source.owner,referenceId:s.referenceId,sourceVersion:s.sourceVersion,sourceDate:r.context.sourceDate},dataQuality:r.dataQuality,reviewState:r.dataQuality,reviewer:{accountId:r.review.reviewedBy,at:r.review.at,reviewVersion:s.version}},
   business:{legalForm:r.legalForm,reportingScope:r.context.reportingScope,operatingScope:r.context.operatingScope,accountingBasis:r.context.basis,sourceFields:Object.fromEntries(BUSINESS_FIELDS.map(k=>[k,r.facts[k]?structuredClone(r.facts[k]):null])),calculationReferences:p.profile.financial.metrics.map(({id,formulaId,formulaVersion,inputReferences,period,currency,unit})=>({id,formulaId,formulaVersion,inputReferences,period,currency,unit})),ownerTransactions:structuredClone(r.ownerTransactions),formulaVersions:[...new Set(p.profile.financial.metrics.map(m=>m.formulaVersion))]},
   authorization:{nativeGrantId:a.grantId,...a.restrictedContract},personalIncomeProjection:null,personalCashProjection:null,distributableProfit:null,householdMerge:false,existingPersonalReportApplicable:false,formalAdmission:false};
  const classification={observedBusinessFacts:[],reviewedFinancialSources:p.classification.sourceFacts,calculatedMetrics:p.classification.computedMetrics,userStatements:[],professionalInterpretations:[],scenarioAssumptions:[],scenarioCandidates:p.classification.scenarios,missingEvidence:p.classification.missingEvidence};
  return {candidate:FINANCIAL_SOURCE_R6,source,classification,
   reading:{native:p.reading,link:{subjectId,authorizedSource:s.referenceId,evidenceVersion:s.sourceVersion,applicableReading:'EXISTING_RULE_FIRST_REPORTED_SOURCE_ONLY',outputVersion:p.reading.result?.schemaVersion||'EXISTING_RULE_FIRST_RESULT',professionalReviewReference:r.review,professionalInterpretationApproved:false},admission:{data:false,interpretation:false,publication:false}},
   navigation:{...p.navigation,family:'FINANCIAL',ownerBoundPass:false,sourceContractAccepted:false,readingVersionAdmitted:false,userDecisionAuthorityValid:false,actionScopeValid:false},
   admission:evaluateOwnerAdmissionR6(),sourceTypeConflict:'RESOLVED_IN_LOCAL_TYPED_ADAPTER',firstFormalBlocker:'SUBJECT_PRODUCTION_OWNER_POLICY',production:false};
 }
 async function reopen(subjectId,identity,referenceId){
  await authorizeBusinessCandidateR6(o.deps,subjectId,identity,'continuity:reopen');
  const prior=await native.reopen(subjectId,identity,referenceId);
  // A preserved R5 snapshot is not silently upgraded to an R6/formal lifecycle.
  return {...prior,lifecycleVersion:'PRESERVED_R5_SNAPSHOT_NOT_MIGRATED',formalGrantVersionPinned:false,formalLifecycleAdmitted:false,policy:continuityPolicyProposalR6()};
 }
 async function formalOperation(){assertLocalR3(o.deps);requireR3(false,'R6_FORMAL_ISSUANCE_PUBLICATION_AND_LIFECYCLE_NOT_ADMITTED',503);}
 return {read,reopen,issue:formalOperation,publish:formalOperation,saveFormalCase:formalOperation};
}
