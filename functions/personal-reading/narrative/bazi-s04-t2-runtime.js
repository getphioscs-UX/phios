import {buildBaZiNarrativeClaimIR,EXPLANATORY_AUTHORITY_VERSION} from './bazi-explanatory-authority.js';
import {createReportSectionNarrativeContract} from './report-section-contract.js';
import {buildReportSectionNarrativeBrief} from './report-section-brief.js';
import {composeReportSectionT2} from './report-section-t2-composer.js';
import {evaluateReportEditorialQuality} from './report-editorial-quality-r3.js';

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

export async function buildBaZiS04T2({reading,locale,temporalSnapshot,registry,env={},fetcher,providerAdapters=null,requestId}={}){
 const richClaimIr=await buildBaZiNarrativeClaimIR({reading,sectionKey:'S04_CAREER',locale,temporalSnapshot});
 const sectionContract=contract(locale);
 const brief=await buildReportSectionNarrativeBrief({contract:sectionContract,richClaimIr,locale,sourceAuthorityVersion:EXPLANATORY_AUTHORITY_VERSION,styleIntent:{tone:'WARM_PROFESSIONAL',depth:'PROFESSIONAL',customerReadable:true,explanationFirst:true,governanceJargonDefault:false}});
 const composition=await composeReportSectionT2({brief,registry,env,fetcher,providerAdapters,requestId:requestId||('RNT2-BZR-S04-'+locale)});
 const blocks=composition.candidate?.blocks||[];
 const quality=evaluateReportEditorialQuality({paragraphs:blocks.map(b=>b.text),claimCoverage:composition.verification?.claimCoverage??null,requiredRoles:sectionContract.requiredClaimRoles,presentRoles:[...new Set(blocks.map(b=>b.role))]});
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
  internalOnly:composition.internalOnly,
  usageRecord:composition.usageRecord||null,
  ownerAcceptance:'PENDING'
 });
}
export default Object.freeze({buildBaZiS04T2});
