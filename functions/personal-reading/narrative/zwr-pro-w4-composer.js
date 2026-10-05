import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {createReportSectionNarrativeContract} from './report-section-contract.js';
import {buildReportSectionNarrativeBrief} from './report-section-brief.js';
import {composeReferenceGovernedDraftR1} from './report-pro-composer-r1.js';
import {ZIWEI_R5_PAI_REGISTRY} from './ziwei-r5-provider-registry.js';
import {createPublicationProviderAdapters} from './narrative-provider.js';
import {createReportSemanticReview} from './report-section-semantic-review.js';
import {verifyReportSectionComposition} from './report-section-semantic-verifier.js';
import {selectPaiRoute,createPaiUsageRecord,estimatePaiProviderCost} from '../../_lib/pai-r1-economics.js';

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
async function finalizeVerifiedComposition({authorityPack,section,sectionId,locale,composition,providerAuditOverride=null}){
 const blocks=composition.candidate.blocks.map(b=>({role:b.role,text:b.text,claimRefs:uniq(b.claimRefs),supportRefs:uniq(b.supportRefs)}));
 const usedClaimRefs=uniq(blocks.flatMap(b=>b.claimRefs));
 const usage=visibleUsage(section,blocks);
 const providerAudit=providerAuditOverride||{provider:composition.internalOnly?.provider||null,model:composition.internalOnly?.model||null,actualTier:composition.internalOnly?.actualTier||null,transportCalls:composition.internalOnly?.transportCalls||0,semanticReviewCalls:composition.internalOnly?.semanticReviewCalls||0,providerAttemptCount:composition.internalOnly?.providerAttemptCount||0,repairCount:composition.internalOnly?.repairCount||0,usageRecord:composition.usageRecord||null,verificationUsageRecords:composition.verificationUsageRecords||[]};
 const seed={schemaVersion:'ZWR-PRO-W4-CANDIDATE-v1',status:'PASS',composerVersion:ZWR_PRO_W4_COMPOSER_VERSION,promptVersion:ZWR_PRO_W4_PROMPT_VERSION,subjectBinding:authorityPack.subjectBinding,locale,sectionId,title:locale==='zh-Hans'?SECTION_OWNERSHIP[sectionId].titleZh:SECTION_OWNERSHIP[sectionId].titleEn,paragraphs:blocks,usedClaimRefs,...usage,authorityPackVersion:authorityPack.schemaVersion,sourceBriefDigest:composition.governedBrief.briefSemanticDigest,provider:providerAudit,upstreamSemanticVerification:composition.verification};
 return deepFreeze({...seed,candidateDigest:await sha256Stable(seed)});
}


const W4_ROLES=['STRUCTURE','MEANING','CONDITIONS','COUNTERWEIGHTS','OBSERVABLE_EXPRESSION','TIMING_RELEVANCE','NAVIGATION'];
function repairRolesFromReview(verification,candidate){
 const reasons=verification?.semanticReview?.reasons||[],roles=new Set();
 const joined=reasons.join('\n');
 for(const role of W4_ROLES)if(new RegExp('\\b'+role+'\\b','u').test(joined))roles.add(role);
 const chineseRoleHints=[
  ['结构段','STRUCTURE'],['开篇','STRUCTURE'],['命身轴','STRUCTURE'],
  ['意义段','MEANING'],['三方四正','MEANING'],
  ['条件段','CONDITIONS'],
  ['反向表现','COUNTERWEIGHTS'],['压力下','COUNTERWEIGHTS'],
  ['时序段','TIMING_RELEVANCE'],['时序','TIMING_RELEVANCE'],
  ['现实检验','OBSERVABLE_EXPRESSION'],['对照来检验','OBSERVABLE_EXPRESSION'],
  ['导航段','NAVIGATION'],['实际运用','NAVIGATION']
 ];
 for(const [hint,role] of chineseRoleHints)if(joined.includes(hint))roles.add(role);
 for(const reason of reasons){
  const quoted=[...String(reason).matchAll(/[“”]([^“”]{3,80})[“”]/gu)].map(m=>m[1]);
  for(const q of quoted){
   const hit=(candidate?.blocks||[]).find(b=>String(b.text||'').includes(q));
   if(hit?.role)roles.add(hit.role);
  }
 }
 return roles.size?[...roles]:null;
}
function targetedRepairSchema(brief,candidate){
 return {
  type:'object',additionalProperties:false,required:['sourceBriefDigest','blocks'],properties:{
   sourceBriefDigest:{type:'string',enum:[brief.briefSemanticDigest]},
   blocks:{type:'array',minItems:candidate.blocks.length,maxItems:candidate.blocks.length,items:{
    type:'object',additionalProperties:false,required:['role','text','claimRefs','supportRefs'],properties:{
     role:{type:'string',enum:W4_ROLES},
     text:{type:'string',minLength:20,maxLength:2600},
     claimRefs:{type:'array',minItems:1,items:{type:'string',enum:brief.claims.map(c=>c.claimId)}},
     supportRefs:{type:'array',minItems:1,items:{type:'string',enum:[...new Set(brief.claims.flatMap(c=>c.sourceRefs))]}}
    }
   }}
  }
 };
}
function assertTargetedRepairPreserved(before,after,allowedRoles){
 if(after?.sourceBriefDigest!==before?.sourceBriefDigest)throw Error('ZWR_PRO_W4_TARGETED_REPAIR_DIGEST_DRIFT');
 if(!Array.isArray(after?.blocks)||after.blocks.length!==before.blocks.length)throw Error('ZWR_PRO_W4_TARGETED_REPAIR_BLOCK_COUNT_DRIFT');
 let changed=0;
 for(let i=0;i<before.blocks.length;i++){
  const a=before.blocks[i],b=after.blocks[i];
  if(a.role!==b.role)throw Error('ZWR_PRO_W4_TARGETED_REPAIR_ROLE_DRIFT:'+i);
  if(JSON.stringify(a.claimRefs)!==JSON.stringify(b.claimRefs))throw Error('ZWR_PRO_W4_TARGETED_REPAIR_CLAIM_REF_DRIFT:'+i);
  if(JSON.stringify(a.supportRefs)!==JSON.stringify(b.supportRefs))throw Error('ZWR_PRO_W4_TARGETED_REPAIR_SUPPORT_REF_DRIFT:'+i);
  if(a.text!==b.text){
   if(!allowedRoles.includes(a.role))throw Error('ZWR_PRO_W4_TARGETED_REPAIR_UNAUTHORIZED_BLOCK_CHANGE:'+i);
   changed++;
  }
 }
 if(changed<1)throw Error('ZWR_PRO_W4_TARGETED_REPAIR_NO_CHANGE');
 return changed;
}
function sumProviderUsage(records){
 const out={inputTokens:0,cachedInputTokens:0,outputTokens:0};
 for(const r of records){
  const u=r?.usage||{};
  out.inputTokens+=u.input_tokens||u.inputTokens||0;
  out.cachedInputTokens+=u.input_tokens_details?.cached_tokens||u.cachedInputTokens||0;
  out.outputTokens+=u.output_tokens||u.outputTokens||0;
 }
 return out;
}
export async function resumeZwrProSectionW4FromSavedComposition({authorityPack,sectionId,locale,savedW4,env={},fetcher,providerAdapters,registry=ZIWEI_R5_PAI_REGISTRY,timeoutMs=180000}={}){
 if(authorityPack?.schemaVersion!=='ZIWEI-R5-AUTHORING-PACK-v2')throw Error('ZWR_PRO_W4_RESUME_AUTHORITY_PACK_REQUIRED');
 if(authorityPack.locale!==locale)throw Error('ZWR_PRO_W4_RESUME_LOCALE_MISMATCH');
 const section=authorityPack.sections.find(s=>s.sectionId===sectionId);
 if(!section)throw Error('ZWR_PRO_W4_RESUME_SECTION_REQUIRED');
 const currentBrief=await governedAuthorityBrief(authorityPack,section,locale);
 const savedComposition=savedW4?.composition||savedW4;
 const governedBrief=savedComposition?.governedBrief,candidate=savedComposition?.candidate;
 if(!governedBrief||!candidate)throw Error('ZWR_PRO_W4_RESUME_SAVED_COMPOSITION_REQUIRED');
 if(governedBrief.predecessorBriefSemanticDigest!==currentBrief.briefSemanticDigest)throw Error('ZWR_PRO_W4_RESUME_BRIEF_DRIFT');
 if(candidate.sourceBriefDigest!==governedBrief.briefSemanticDigest)throw Error('ZWR_PRO_W4_RESUME_CANDIDATE_DIGEST_MISMATCH');
 const route=selectPaiRoute({aiExecutionClass:'T3_DEEP_COMPOSITION',deterministicFallbackAvailable:false},registry||{});
 const provider=savedComposition?.internalOnly?.provider||route.selectedProvider,model=savedComposition?.internalOnly?.model||route.selectedModel;
 if(!provider||!model)throw Error('ZWR_PRO_W4_RESUME_PROVIDER_ROUTE_REQUIRED');
 const adapter=(providerAdapters||createPublicationProviderAdapters({env,fetcher}))[provider];
 if(typeof adapter!=='function')throw Error('ZWR_PRO_W4_RESUME_PROVIDER_ADAPTER_REQUIRED');
 if(!providerAdapters&&!String(env.OPENAI_API_KEY||'').trim())throw Error('ZWR_PRO_W4_RESUME_OPENAI_API_KEY_REQUIRED');
 const providerResults=[];let transportCalls=0,semanticReviewCalls=0;
 const invoke=async request=>{
  const controller=new AbortController();let timer;transportCalls++;if(request.taskType==='REPORT_SECTION_SEMANTIC_VERIFICATION')semanticReviewCalls++;
  try{
   const result=await Promise.race([adapter({...request,signal:controller.signal}),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Object.assign(new Error('NARRATIVE_PROVIDER_TIMEOUT'),{code:'NARRATIVE_PROVIDER_TIMEOUT'}));},timeoutMs);})]);
   providerResults.push({...result,taskType:request.taskType});return result;
  }finally{clearTimeout(timer);}
 };
 const semanticReview=createReportSemanticReview({invoke,model});
 let workingCandidate=candidate;
 let verification=await verifyReportSectionComposition({brief:governedBrief,candidate:workingCandidate,semanticReview});
 let repairCount=0,targetedRepairRoles=[];
 if(!verification.accepted){
  const roles=repairRolesFromReview(verification,workingCandidate);
  if(roles?.length){
   targetedRepairRoles=roles;
   const repairResult=await invoke({
    model,executionClass:'T3_DEEP_COMPOSITION',taskType:'REPORT_SECTION_COMPOSITION',
    language:locale,evidencePack:governedBrief,
    compositionPolicy:{version:'ZWR-PRO-W4-TARGETED-SPAN-REPAIR-v1',calculate:false,targetedRepairOnly:true,allowedRoles:roles,preserveUnchangedBlocksByteForByte:true,preserve:['claims','supportRefs','conditions','counterweights','certainty','timing','boundaries','semanticOperators']},
    systemPrompt:[
     'You are repairing a previously written Zi Wei paid-report section after independent semantic review.',
     'Repair ONLY the blocks whose role is listed in allowedRoles. Every other block text must be returned byte-for-byte unchanged.',
     'Do not change block order, role, claimRefs, supportRefs or sourceBriefDigest.',
     'Remove only the unsupported inference identified by semanticReviewReasons. Do not add replacement facts, new causation, stronger certainty, new palace interactions, new timing claims or new lived events.',
     'Preserve the supported meaning and professional prose quality of the affected block. Return the complete structured candidate JSON.'
    ].join('\n'),
    schema:targetedRepairSchema(governedBrief,workingCandidate),
    payload:{allowedRoles:roles,semanticReviewReasons:verification.semanticReview?.reasons||[],previousCandidate:workingCandidate,sourceBriefDigest:governedBrief.briefSemanticDigest}
   });
   const repaired=repairResult?.output||repairResult;
   assertTargetedRepairPreserved(workingCandidate,repaired,roles);
   workingCandidate=repaired;
   repairCount=1;
   verification=await verifyReportSectionComposition({brief:governedBrief,candidate:workingCandidate,semanticReview});
  }
 }
 const costModel=(registry?.models||[]).find(m=>m.modelId===model)||{};
 const reviewUsage=providerResults.filter(r=>r.taskType==='REPORT_SECTION_SEMANTIC_VERIFICATION').map((r,i)=>{
  const u=sumProviderUsage([r]);
  return createPaiUsageRecord({requestId:'ZWR-PRO-W4-RESUME:'+authorityPack.subjectBinding.subjectKey+':'+sectionId+':'+locale+':VERIFY:'+i,timestamp:new Date().toISOString(),estimatedProviderCost:estimatePaiProviderCost(costModel,u),aiExecutionClass:'T3_DEEP_COMPOSITION',provider:r.provider||provider,model,...u,requestType:'QA_REVIEW',providerAttemptCount:1,success:true,fallbackUsed:false});
 });
 const repairProviderResults=providerResults.filter(r=>r.taskType==='REPORT_SECTION_COMPOSITION');
 const repairUsageRaw=sumProviderUsage(repairProviderResults);
 const repairUsage=repairProviderResults.length?createPaiUsageRecord({requestId:'ZWR-PRO-W4-RESUME:'+authorityPack.subjectBinding.subjectKey+':'+sectionId+':'+locale+':TARGETED_REPAIR',timestamp:new Date().toISOString(),estimatedProviderCost:estimatePaiProviderCost(costModel,repairUsageRaw),aiExecutionClass:'T3_DEEP_COMPOSITION',provider:repairProviderResults.at(-1)?.provider||provider,model,...repairUsageRaw,requestType:'QA_REVIEW',providerAttemptCount:repairProviderResults.length,success:verification.accepted===true,fallbackUsed:verification.accepted!==true}):null;
 if(!verification.accepted)return deepFreeze({status:'CONTROLLED_NOT_READY',reason:repairCount?'TARGETED_REPAIR_SEMANTIC_REJECTED':'RESUMED_SEMANTIC_VERIFIER_REJECTED',sectionId,locale,subjectBinding:authorityPack.subjectBinding,brief:currentBrief,composition:{...savedComposition,candidate:workingCandidate,verification,usageRecord:repairUsage,verificationUsageRecords:reviewUsage,internalOnly:{...(savedComposition.internalOnly||{}),provider,model,transportCalls:1+transportCalls,semanticReviewCalls,providerAttemptCount:1+repairProviderResults.length,repairCount,resumedFromSavedComposition:true,historicalCompositionCalls:1,historicalCompositionUsageUnavailable:true,currentResumeCalls:transportCalls,targetedRepairRoles}}});
 const resumed={status:'PASS',governedBrief,candidate:workingCandidate,verification,usageRecord:repairUsage,verificationUsageRecords:reviewUsage,internalOnly:{provider,model,actualTier:'T3_GOVERNED_DEEP_COMPOSITION',transportCalls:1+transportCalls,semanticReviewCalls,providerAttemptCount:1+repairProviderResults.length,repairCount,resumedFromSavedComposition:true,historicalCompositionCalls:1,historicalCompositionUsageUnavailable:true,currentResumeCalls:transportCalls,targetedRepairRoles}};
 return finalizeVerifiedComposition({authorityPack,section,sectionId,locale,composition:resumed,providerAuditOverride:{provider,model,actualTier:'T3_GOVERNED_DEEP_COMPOSITION',transportCalls:1+transportCalls,semanticReviewCalls,providerAttemptCount:1+repairProviderResults.length,repairCount,usageRecord:repairUsage,verificationUsageRecords:reviewUsage,resumedFromSavedComposition:true,historicalCompositionCalls:1,historicalCompositionUsageUnavailable:true,currentResumeCalls:transportCalls,targetedRepairRoles}});
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
 return finalizeVerifiedComposition({authorityPack,section,sectionId,locale,composition});
}
export default Object.freeze({composeZwrProSectionW4,ZWR_PRO_W4_COMPOSER_VERSION});
