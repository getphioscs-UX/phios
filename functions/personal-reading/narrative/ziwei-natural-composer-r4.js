import {buildZiweiContentDepthR3Sections} from './ziwei-production-composer-r3.js';
import {createReportSectionNarrativeContract} from './report-section-contract.js';
import {buildReportSectionNarrativeBrief} from './report-section-brief.js';
import {composePublicationNarrative} from './narrative-writer.js';

export const ZIWEI_NATURAL_COMPOSER_R4_VERSION='ZIWEI-NATURAL-COMPOSER-R4';

const QUESTIONS={
 S02:['这张命盘做决定时，真正反复使用的运行顺序是什么？','What decision sequence does this chart repeatedly use?'],
 S03:['这张命盘的内在满足、张力与恢复条件怎样组织？','How are inner satisfaction, tension and recovery conditions organized?'],
 S04:['这张命盘怎样形成工作价值、承担责任并把成果留下来？','How does this chart create work value, carry responsibility and make results durable?'],
 S05:['资源怎样进入、被分配、被留存，又在哪里容易过度承诺？','How do resources enter, get allocated and retained, and where can commitments exceed capacity?'],
 S06:['关系中的互惠、边界、协商与修复怎样运作？','How do reciprocity, boundaries, negotiation and repair operate in relationships?'],
 S07:['支持怎样给予、接收与分工，责任又在哪里容易失衡？','How are support, receiving and responsibility distributed, and where can they become imbalanced?'],
 S08:['压力如何累积，什么条件有助于恢复，哪些部分必须保持医学边界？','How does pressure accumulate, what supports recovery, and where must medical boundaries remain?'],
 S09:['当前大限真正放大的长期问题是什么，它与本命怎样区分？','What longer-cycle question is the current Da Xian foregrounding, and how is it distinct from the natal baseline?'],
 S10:['今年新增的强调是什么，哪些只是长期主题在年度层变得更明显？','What is newly emphasized this year, and what is simply a longer-term theme becoming more visible?'],
 S11:['把前面所有结构收拢后，现在最值得保护、改变与持续观察的是什么？','After integrating the report, what is most worth protecting, changing and observing now?']
};
const OUTCOMES={
 S02:['形成可辨认的决策顺序与压力切换条件。','Recognize the decision sequence and its stress switches.'],
 S03:['读懂内在恢复、投入与张力的条件，而不是人格标签。','Understand conditions for inner recovery, engagement and tension rather than a personality label.'],
 S04:['形成接近专业命理解读的事业主轴、优势、代价、场景与导航。','Produce a professional career reading with thesis, advantages, costs, scenarios and navigation.'],
 S05:['区分取得、分配、留存、所有权、选择空间与过度承诺。','Separate acquisition, allocation, retention, ownership, optionality and overcommitment.'],
 S06:['把关系写成真实互动结构，而不是星曜词典或伴侣预测。','Read relationships as lived interaction structure rather than a star glossary or partner prediction.'],
 S07:['把家庭、同辈、朋友的支持功能写成可理解的责任网络。','Explain family, peer and friend support as a usable responsibility network.'],
 S08:['形成专业、非医疗化的压力与恢复读取。','Produce a professional non-medical pressure and recovery reading.'],
 S09:['清楚区分本命、长期周期与当前修饰，并给出可观察的问题。','Distinguish natal baseline, long-cycle emphasis and current modifiers with observable questions.'],
 S10:['清楚区分年度新增与长期持续，并给出当前观察重点。','Distinguish annual differences from persistent structure and identify current observations.'],
 S11:['形成具体、有限、可复盘的现实导航，而不是通用建议。','Produce specific, bounded, reviewable navigation rather than generic advice.']
};
const ROLE_MAP={
 STRUCTURAL_MAP:'STRUCTURE',LIFE_BODY_RELATION:'MEANING',STRUCTURAL_CHECK:'NAVIGATION',
 DECISION_SEQUENCE:'STRUCTURE',BODY_MODIFICATION:'MEANING',STRESS_SWITCH:'COUNTERWEIGHTS',
 INNER_EXPECTATION:'STRUCTURE',SATISFACTION_CONDITIONS:'CONDITIONS',WITHDRAWAL_RECOVERY:'COUNTERWEIGHTS',INNER_OUTER_DISTINCTION:'NAVIGATION',
 WORK_THESIS:'MEANING',DELIVERY_CONDITIONS:'CONDITIONS',WORK_FAILURE_MODE:'COUNTERWEIGHTS',WORK_NAVIGATION:'NAVIGATION',
 ACQUISITION:'STRUCTURE',ALLOCATION:'MEANING',RETENTION_OWNERSHIP:'CONDITIONS',OPTIONALITY_TEST:'COUNTERWEIGHTS',
 INTERACTION_STYLE:'STRUCTURE',RECIPROCITY:'MEANING',BOUNDARY_AND_REPAIR:'COUNTERWEIGHTS',RELATIONSHIP_NETWORK:'NAVIGATION',
 SUPPORT_OFFERED:'STRUCTURE',SUPPORT_RECEIVED:'MEANING',OWNERSHIP_AND_DEPENDENCY:'COUNTERWEIGHTS',SUPPORT_NETWORK_TEST:'NAVIGATION',
 PRESSURE_LOAD:'STRUCTURE',ACCUMULATION_PATTERN:'MEANING',RECOVERY_CONDITION:'CONDITIONS',MEDICAL_BOUNDARY:'COUNTERWEIGHTS',
 LONG_CYCLE_FOREGROUND:'TIMING_RELEVANCE',NATAL_VS_CYCLE:'STRUCTURE',CYCLE_MODIFIERS:'MEANING',PERSISTENT_QUESTION:'OBSERVABLE_EXPRESSION',
 CURRENT_YEAR_FOREGROUND:'TIMING_RELEVANCE',YEAR_ONLY_VS_PERSISTENT:'STRUCTURE',YEAR_MODIFIERS:'MEANING',OBSERVATION_WINDOW:'OBSERVABLE_EXPRESSION',
 WHAT_TO_PROTECT:'STRUCTURE',WHAT_TO_CHANGE:'MEANING',WHAT_NOT_TO_OVERCOMMIT:'COUNTERWEIGHTS',WHAT_TO_OBSERVE_NOW:'OBSERVABLE_EXPRESSION',REVISION_EVIDENCE:'NAVIGATION'
};

function sectionContract(section,locale,roles){
 const q=QUESTIONS[section.sectionId]||[section.title,section.title],o=OUTCOMES[section.sectionId]||q;
 return createReportSectionNarrativeContract({
  methodId:'ZWR',sectionKey:section.sectionId,
  customerQuestion:locale==='zh-Hans'?q[0]:q[1],
  customerOutcome:locale==='zh-Hans'?o[0]:o[1],
  requiredClaimRoles:[...new Set(roles)],
  optionalClaimRoles:['CONDITIONS','COUNTERWEIGHTS','OBSERVABLE_EXPRESSION','TIMING_RELEVANCE','NAVIGATION'],
  timingPolicy:'WHEN_AUTHORITY_PRESENT',
  boundaryPolicy:'KEEP_UNCERTAINTY_LOCAL_NOT_DISCLAIMER_HEAVY',
  realityBridgePolicy:'QUESTIONS_AND_COMPARISONS_ONLY_UNLESS_OBSERVED_REALITY_SOURCE_ADMITTED',
  forbiddenInferenceClasses:['PROFESSION_PREDICTION','WEALTH_EVENT_PREDICTION','MARRIAGE_EVENT_PREDICTION','HEALTH_EVENT_PREDICTION'],
  depthTarget:{minimumMeaningfulUnits:0,maximumMeaningfulUnits:0,calibrationState:'ZIWEI_R4_OWNER_REVIEW_REQUIRED'}
 });
}

function richClaimIr(section){
 const blocks=section.publicationIr.blocks;
 const claims=section.claims.map((claim,i)=>{
  const role=ROLE_MAP[blocks[i]?.role]||'STRUCTURE';
  return {
   id:claim.claimId,claimId:claim.claimId,text:claim.meaning.text,
   claimType:claim.claimType,explanationRole:role,
   sourceRefs:claim.sourceRefs,semanticOperators:claim.semanticOperators,
   conditions:claim.conditions,counterweights:claim.counterweights,
   timing:claim.timingRelevance,certainty:claim.certainty,
   license:{allowsObservedReality:false,allowedSemanticOperators:claim.semanticOperators}
  };
 });
 return {version:ZIWEI_NATURAL_COMPOSER_R4_VERSION,claims,reflectionQuestions:[]};
}

export async function buildZiweiNaturalComposerR4({evidence,locale,registry,env={},fetcher,providerAdapters=null,requestIdPrefix='ZIWEI-R4'}={}){
 const base=await buildZiweiContentDepthR3Sections({evidence,locale});
 const sections=[];
 for(const section of base){
  if(!QUESTIONS[section.sectionId]){sections.push({...section,naturalComposition:{status:'NOT_REQUESTED',reason:'STRUCTURAL_OR_APPENDIX_SECTION'}});continue;}
  const ir=richClaimIr(section),roles=ir.claims.map(c=>c.explanationRole),contract=sectionContract(section,locale,roles);
  const brief=await buildReportSectionNarrativeBrief({contract,richClaimIr:ir,locale,sourceAuthorityVersion:section.editorialVersion,styleIntent:{
   tone:'PROFESSIONAL_PERSONAL_READING',depth:'LONG_FORM_PROFESSIONAL',customerReadable:true,explanationFirst:true,governanceJargonDefault:false,
   sectionSpecific:true,avoidGlossaryProse:true,avoidRepeatedTemplates:true,realWorldScenes:'CONDITIONAL_ONLY'
  }});
  const composition=await composePublicationNarrative({sectionBrief:brief,registry,env,fetcher,providerAdapters,requestId:`${requestIdPrefix}-${section.sectionId}-${locale}`});
  const candidate=composition.status==='PASS'?composition.candidate?.blocks||[]:[];
  const paragraphs=candidate.length?candidate.map(b=>b.text):section.paragraphs;
  const publicationIr={...section.publicationIr,blocks:paragraphs.map((prose,i)=>({
   blockId:`ZWR-R4:${section.sectionId}:${i+1}`,role:candidate[i]?.role||section.publicationIr.blocks[i]?.role||'MEANING',
   prose,claimRefs:candidate[i]?.claimRefs||section.claims.map(c=>c.claimId),supportRefs:candidate[i]?.supportRefs||[]
  }))};
  sections.push({...section,paragraphs,publicationIr,editorialVersion:ZIWEI_NATURAL_COMPOSER_R4_VERSION,naturalComposition:{
   status:composition.status,providerCalled:composition.internalOnly?.providerCalled===true,actualTier:composition.internalOnly?.actualTier,
   verificationAccepted:composition.verification?.accepted===true,editorialQuality:composition.verification?.editorialQuality||null,
   fallbackReason:composition.internalOnly?.fallbackReason||null,usageRecord:composition.usageRecord||null
  }});
 }
 return sections;
}
export default Object.freeze({buildZiweiNaturalComposerR4});
