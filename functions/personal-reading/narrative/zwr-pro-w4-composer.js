import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {createReportSectionNarrativeContract} from './report-section-contract.js';
import {buildReportSectionNarrativeBrief} from './report-section-brief.js';
import {composeReferenceGovernedDraftR1} from './report-pro-composer-r1.js';
import {ZIWEI_R5_PAI_REGISTRY} from './ziwei-r5-provider-registry.js';

export const ZWR_PRO_W4_COMPOSER_VERSION='ZWR-PRO-W4-LLM-PROFESSIONAL-COMPOSER-v1';
export const ZWR_PRO_W4_PROMPT_VERSION='ZWR-PRO-W4-PROMPT-v1';

const SECTION_OWNERSHIP=Object.freeze({
 S02:{titleZh:'核心运行方式',titleEn:'Core Orientation',owns:['LIFE_BODY_AXIS','DECISION_LOGIC','WHOLE_CHART_ORIENTATION']},
 S03:{titleZh:'内部结构',titleEn:'Inner Structure',owns:['WELLBEING','INNER_ACTIVATION','BOUNDARY_TENSION','RECOVERY_CONDITIONS']},
 S04:{titleZh:'工作与方向',titleEn:'Work & Direction',owns:['CAREER','WORK_STRUCTURE','EXTERNAL_EXECUTION','CAREER_TIMING_RELEVANCE']},
 S05:{titleZh:'资源与财富',titleEn:'Resources & Wealth',owns:['WEALTH','RESOURCE_ACQUISITION','ALLOCATION','RETENTION','OPTIONALITY']},
 S06:{titleZh:'关系运行',titleEn:'Relationships',owns:['SPOUSE','RELATIONSHIP_ROLES','RECIPROCITY','COMMUNICATION_REPAIR']},
 S07:{titleZh:'家庭与支持',titleEn:'Family & Support',owns:['PARENTS','SIBLINGS','FRIENDS','SUPPORT_RECEIVING','RESPONSIBILITY_DISTRIBUTION']},
 S08:{titleZh:'压力与脆弱点',titleEn:'Pressure & Vulnerability',owns:['HEALTH_PALACE_SYMBOLIC_PRESSURE','LOAD','BOUNDARY_PRESSURE','OUTPUT_RESERVE','RECOVERY']},
 S09:{titleZh:'长期周期',titleEn:'Long-term Cycles',owns:['DA_XIAN','LONG_CYCLE_FOREGROUND','LONG_CYCLE_TRANSFORMATIONS','PERSISTENT_PATTERN']},
 S10:{titleZh:'当前时序',titleEn:'Current Timing',owns:['LIU_NIAN','ANNUAL_FOREGROUND','ANNUAL_TRANSFORMATIONS','CURRENT_OBSERVATION_WINDOW']},
 S11:{titleZh:'现实导航',titleEn:'Reality Navigation',owns:['WHOLE_CHART_INTEGRATION','DECISION_NAVIGATION','REALITY_VALIDATION','REVISION_RULE']}
});
const uniq=a=>[...new Set((Array.isArray(a)?a:[]).filter(Boolean).map(String))];
const txKey=t=>[t.layer,t.palaceCode,t.targetStarCode,t.transformationCode].join(':');

async function governedAuthorityBrief(authorityPack,section,locale){
 const roles=uniq(section.claims.map(c=>c.role));
 const contract=createReportSectionNarrativeContract({
  methodId:'ZWR',sectionKey:section.sectionId,
  customerQuestion:section.keyInsights?.[0]||section.title,
  customerOutcome:locale==='zh-Hans'?'形成达到金标准深度、但只属于当前客户命盘的专业紫微斗数长文。':'Produce gold-standard-depth professional Zi Wei prose grounded only in this customer chart.',
  requiredClaimRoles:roles,optionalClaimRoles:['CONDITIONS','COUNTERWEIGHTS','OBSERVABLE_EXPRESSION','TIMING_RELEVANCE','NAVIGATION'],
  timingPolicy:'WHEN_AUTHORITY_PRESENT',
  boundaryPolicy:'KEEP_UNCERTAINTY_LOCAL_NOT_DISCLAIMER_HEAVY',
  realityBridgePolicy:'QUESTIONS_AND_COMPARISONS_ONLY_UNLESS_OBSERVED_REALITY_SOURCE_ADMITTED',
  forbiddenInferenceClasses:['PROFESSION_PREDICTION','WEALTH_EVENT_PREDICTION','MARRIAGE_EVENT_PREDICTION','HEALTH_EVENT_PREDICTION','REFERENCE_FACT_COPYING'],
  depthTarget:{minimumMeaningfulUnits:0,maximumMeaningfulUnits:0,calibrationState:'ZWR_PRO_W3_REFERENCE_PROFILE'}
 });
 const richClaimIr={version:authorityPack.sourceVersion,claims:section.claims.map(c=>({...c,explanationRole:c.role})),reflectionQuestions:[],counterPrompts:[]};
 const base=await buildReportSectionNarrativeBrief({
  contract,richClaimIr,locale,sourceAuthorityVersion:authorityPack.sourceVersion,
  styleIntent:{tone:'PROFESSIONAL_ZIWEI_PERSONAL_READING',depth:'REFERENCE_GOLD_STANDARD',customerReadable:true,explanationFirst:true,methodStyleProfile:'ZIWEI_PROFESSIONAL_SYNTHESIS_R5',sectionSpecific:true,avoidGlossaryProse:true,synthesizePalaceNetwork:true,synthesizeTransformations:true,timingLayersStayDistinct:true}
 });
 const {briefSemanticDigest:previous,...rest}=base;
 const technicalAuthorityPack=Object.freeze({
  subjectBinding:authorityPack.subjectBinding,
  sectionIdentity:{sectionId:section.sectionId,title:section.title,primaryPalaces:section.primaryPalaces,contextPalaces:section.contextPalaces},
  technicalEvidence:section.technicalEvidence,
  wholeChartTechnicalSnapshot:authorityPack.wholeChartTechnicalSnapshot,
  authoringContract:section.authoringContract
 });
 const seed={...rest,preProductionBriefDigest:previous,successorPromptVersion:ZWR_PRO_W4_PROMPT_VERSION,technicalAuthorityPack,sectionOwnership:SECTION_OWNERSHIP[section.sectionId],referenceQualityProfile:{qualityOnly:true,lexicalCopyTarget:false,dimensions:['CONTENT_DEPTH','SECTION_ISOLATION','NARRATIVE_DENSITY','CUSTOMER_VOICE','TECHNICAL_GROUNDING','MULTI_PLACEMENT_SYNTHESIS','INTERPRETATION_TO_TECHNICAL_RATIO','PARAGRAPH_RHYTHM','UNKNOWN_PRESERVATION','NO_GOVERNANCE_PROSE']}};
 return deepFreeze({...seed,briefSemanticDigest:await sha256Stable(seed)});
}
function visibleUsage(section,blocks){
 const body=blocks.map(b=>b.text).join('\n');
 const usedPalaceCodes=(section.technicalEvidence.palaces||[]).filter(p=>body.includes(p.label)).map(p=>p.palaceCode);
 const usedTransformationKeys=(section.technicalEvidence.transformations||[]).filter(t=>{
  const state=t.label&&body.includes(t.label);
  const star=t.targetStarLabel&&body.includes(t.targetStarLabel);
  return state&&star;
 }).map(txKey);
 return {usedPalaceCodes:uniq(usedPalaceCodes),usedTransformationKeys:uniq(usedTransformationKeys)};
}
export async function composeZwrProSectionW4({authorityPack,sectionId,locale,env={},fetcher,providerAdapters,registry=ZIWEI_R5_PAI_REGISTRY,requestId,cache}={}){
 if(authorityPack?.schemaVersion!=='ZIWEI-R5-AUTHORING-PACK-v2')throw Error('ZWR_PRO_W4_AUTHORITY_PACK_REQUIRED');
 if(!authorityPack.subjectBinding?.subjectId||!authorityPack.subjectBinding?.inputFingerprint)throw Error('ZWR_PRO_W4_SUBJECT_BINDING_REQUIRED');
 if(authorityPack.locale!==locale||!['zh-Hans','en'].includes(locale))throw Error('ZWR_PRO_W4_LOCALE_MISMATCH');
 const section=authorityPack.sections.find(s=>s.sectionId===sectionId);
 if(!section||!SECTION_OWNERSHIP[sectionId])throw Error('ZWR_PRO_W4_SECTION_UNSUPPORTED');
 const brief=await governedAuthorityBrief(authorityPack,section,locale);
 const composition=await composeReferenceGovernedDraftR1({
  brief,registry,env,fetcher,providerAdapters,
  requestId:requestId||'ZWR-PRO-W4:'+authorityPack.subjectBinding.subjectKey+':'+sectionId+':'+locale,
  cache,timeoutMs:180000
 });
 if(composition.status!=='PASS'||composition.verification?.accepted!==true) return deepFreeze({status:'CONTROLLED_NOT_READY',sectionId,locale,subjectBinding:authorityPack.subjectBinding,brief,composition});
 const blocks=composition.candidate.blocks.map(b=>({role:b.role,text:b.text,claimRefs:uniq(b.claimRefs),supportRefs:uniq(b.supportRefs)}));
 const usedClaimRefs=uniq(blocks.flatMap(b=>b.claimRefs));
 const usage=visibleUsage(section,blocks);
 const seed={schemaVersion:'ZWR-PRO-W4-CANDIDATE-v1',status:'PASS',composerVersion:ZWR_PRO_W4_COMPOSER_VERSION,promptVersion:ZWR_PRO_W4_PROMPT_VERSION,subjectBinding:authorityPack.subjectBinding,locale,sectionId,title:locale==='zh-Hans'?SECTION_OWNERSHIP[sectionId].titleZh:SECTION_OWNERSHIP[sectionId].titleEn,paragraphs:blocks,usedClaimRefs,...usage,authorityPackVersion:authorityPack.schemaVersion,sourceBriefDigest:composition.governedBrief.briefSemanticDigest,provider:{provider:composition.internalOnly?.provider||null,model:composition.internalOnly?.model||null,actualTier:composition.internalOnly?.actualTier||null,transportCalls:composition.internalOnly?.transportCalls||0,semanticReviewCalls:composition.internalOnly?.semanticReviewCalls||0},upstreamSemanticVerification:composition.verification};
 return deepFreeze({...seed,candidateDigest:await sha256Stable(seed)});
}
export default Object.freeze({composeZwrProSectionW4,ZWR_PRO_W4_COMPOSER_VERSION});
