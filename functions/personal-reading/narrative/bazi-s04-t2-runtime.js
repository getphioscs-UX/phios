import {buildBaZiNarrativeClaimIR,EXPLANATORY_AUTHORITY_VERSION} from './bazi-explanatory-authority.js';
import {createReportSectionNarrativeContract} from './report-section-contract.js';
import {buildReportSectionNarrativeBrief} from './report-section-brief.js';
import {composePublicationNarrative} from './narrative-writer.js';
import {evaluateReportEditorialQuality} from './report-editorial-quality-r3.js';
import {extendCareerBrief} from './bazi-s04-career-ir.js';
import {evaluateCustomerEditorialR4} from './report-editorial-quality-r4.js';
import {careerReviewState} from './bazi-s04-customer-value.js';

export const BAZI_S04_T2_RUNTIME_VERSION='PHI-OS-BAZI-S04-T2-RUNTIME-v1.0.0';

function contract(locale){
 return createReportSectionNarrativeContract({
  methodId:'BZR',
  sectionKey:'S04_CAREER',
  customerQuestion:locale==='zh-Hans'?'这张命盘在事业中怎样承接责任、资源、支持与当前阶段变化？':'How does this chart carry responsibility, resources, support and current timing in career?',
  customerOutcome:locale==='zh-Hans'?'读懂什么工作结构更容易发挥、什么条件更容易消耗，以及当前阶段应该观察什么。':'Understand which work conditions are more sustainable, which are more draining, and what matters in the current timing window.',
  requiredClaimRoles:['STRUCTURE','MEANING','CONDITIONS','COUNTERWEIGHTS','OBSERVABLE_EXPRESSION','TIMING_RELEVANCE','NAVIGATION'],
  timingPolicy:'WHEN_AUTHORITY_PRESENT',
  boundaryPolicy:'KEEP_UNCERTAINTY_LOCAL_NOT_DISCLAIMER_HEAVY',
  realityBridgePolicy:'QUESTIONS_AND_COMPARISONS_ONLY_UNLESS_OBSERVED_REALITY_SOURCE_ADMITTED',
  forbiddenInferenceClasses:['PROFESSION_PREDICTION','JOB_CHANGE_PREDICTION','SUCCESS_FAILURE_PREDICTION'],
  depthTarget:{minimumMeaningfulUnits:0,maximumMeaningfulUnits:0,calibrationState:'S04_OWNER_ACCEPTANCE_REQUIRED'}
 });
}

export async function prepareBaZiS04T2({reading,locale,temporalSnapshot,successor=false}={}){
 const richClaimIr=await buildBaZiNarrativeClaimIR({reading,sectionKey:'S04_CAREER',locale,temporalSnapshot});
 const sectionContract=contract(locale);
 let brief=await buildReportSectionNarrativeBrief({contract:sectionContract,richClaimIr,locale,sourceAuthorityVersion:EXPLANATORY_AUTHORITY_VERSION,styleIntent:{tone:'WARM_PROFESSIONAL',depth:'PROFESSIONAL',customerReadable:true,explanationFirst:true,governanceJargonDefault:false}});
 if(successor)brief=await extendCareerBrief(brief);
 return {richClaimIr,sectionContract,brief};
}

export async function buildBaZiS04T2({reading,locale,temporalSnapshot,registry,env={},fetcher,providerAdapters=null,requestId,successor=false}={}){
 const {richClaimIr,sectionContract,brief}=await prepareBaZiS04T2({reading,locale,temporalSnapshot,successor});
 if(successor&&!brief.careerNarrativeIR.eligibility.eligible)return {status:'NOT_ELIGIBLE',locale,brief,richClaimIr,sectionContract,ownerAcceptance:'PENDING',internalOnly:{providerCalled:false,actualTier:'NOT_RUN',fallbackUsed:false,reasons:brief.careerNarrativeIR.eligibility.reasons}};
 const composition=await composePublicationNarrative({sectionBrief:brief,registry,env,fetcher,providerAdapters,requestId:requestId||('RNT2-BZR-S04-'+locale)});
 const blocks=composition.candidate?.blocks||[];
 const quality=evaluateReportEditorialQuality({blocks,paragraphs:blocks.map(b=>b.text),claimCoverage:composition.verification?.claimCoverage??null,requiredRoles:sectionContract.requiredClaimRoles,presentRoles:[...new Set(blocks.map(b=>b.role))],sectionSpecificTerms:locale==='zh-Hans'?['事业','责任','支持','资源','工作','大运','流年']:['career','responsibility','support','resources','work','Da Yun','annual']});
 return Object.freeze({
  schemaVersion:'PHI-OS-BAZI-S04-T2-CANDIDATE-v1.0.0',
  runtimeVersion:BAZI_S04_T2_RUNTIME_VERSION,
  locale,
  status:composition.status,
  richClaimIr,
  sectionContract,
  brief,
  candidate:composition.candidate,
  verification:composition.verification,
  quality,
  ...(successor?{careerNarrativeIR:brief.careerNarrativeIR,editorialQuality:evaluateCustomerEditorialR4({brief,candidate:composition.candidate,verification:composition.verification}),reviewState:careerReviewState({technicalPass:composition.verification?.technicalAccepted===true,editorialPass:composition.verification?.editorialQuality?.accepted===true}),reviewOnly:true}:{}),
  internalOnly:composition.internalOnly,
  usageRecord:composition.usageRecord||null,
  verificationUsageRecords:composition.verificationUsageRecords||[],
  ownerAcceptance:'PENDING'
 });
}
export default Object.freeze({buildBaZiS04T2});
