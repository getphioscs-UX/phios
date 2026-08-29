import {buildBaziCustomerSafeStructureGraph} from './bazi-customer-safe-graph-projection.js';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const x of Object.values(value))freeze(x)}return value};
const list=value=>Array.isArray(value)?value:[];
const ownerFor=(readingIR,type,schoolCode=null)=>list(readingIR?.renderOwners).find(x=>x.compositionType===type&&(!schoolCode||x.schoolCode===schoolCode))||null;
const reportBlock=(report,schoolCode)=>list(list(report?.sections).find(x=>x.code==='SCHOOLS')?.blocks).find(x=>x.schoolCode===schoolCode)||null;

function patternModule(readingIR){
 const section=readingIR?.sections?.patterns||{},owner=ownerFor(readingIR,'PATTERN_CANDIDATE_SET');
 return freeze({
  schemaVersion:'PHI-OS-PPR-C1-BAZI-PATTERN-PROFESSIONAL-SURFACE-v1.0.0',
  state:owner?.resolutionState||'ALTERNATIVES_OPEN',qualifierCodes:list(owner?.qualifierCodes),unknownRefs:list(owner?.unknownRefs),counterEvidenceRefs:list(owner?.counterEvidenceRefs),evidenceRefs:list(owner?.evidenceRefs),authorityRefs:list(owner?.authorityRefs),
  candidates:list(section.candidates).map(c=>freeze({...c,
   supportEvidence:freeze({monthCommandCandidate:true,visibleStemMatch:c.visibleStemMatch===true,visiblePillars:list(c.visiblePillars),treatmentClass:c.treatmentClass||null}),
   defeatEvaluation:freeze({state:'NOT_CASE_SPECIFICALLY_ESTABLISHED',reasonCode:'PPR_C1_W7_DEFEAT_CONDITION_NOT_EXPOSED_BY_CURRENT_READING_IR'}),
   rescueEvaluation:freeze({state:'NOT_CASE_SPECIFICALLY_ESTABLISHED',reasonCode:'PPR_C1_W7_RESCUE_CONDITION_NOT_EXPOSED_BY_CURRENT_READING_IR'}),
   unresolved:freeze({primaryPatternAssigned:Boolean(section.verdict?.primaryPattern),priorityVerdict:c.priorityVerdict??null})
  })),
  verdict:freeze({...section.verdict}),
  boundaries:freeze({rulesetPresenceIsNotCaseMatch:true,defeatInvented:false,rescueInvented:false,primaryPatternInvented:false})
 });
}

function schoolModules(readingIR,report){
 const views=list(readingIR?.sections?.schoolViews?.views);
 return freeze(views.map(view=>{const owner=ownerFor(readingIR,'SCHOOL_QUALIFIED_VIEW',view.schoolCode),block=reportBlock(report,view.schoolCode);return freeze({
  schoolCode:view.schoolCode,rulesetId:view.rulesetId,rulesetRef:view.rulesetRef,sourceAuthorityState:view.sourceAuthorityState,sourceClaimRefs:list(view.sourceClaimRefs),evidence:freeze({...view.evidence}),verdict:freeze({...view.verdict}),customerText:block?.text||'',customerTitle:block?.title||'',resolutionState:owner?.resolutionState||'SCHOOL_VIEW_OPEN',qualifierCodes:list(owner?.qualifierCodes),unknownRefs:list(owner?.unknownRefs),evidenceRefs:list(owner?.evidenceRefs),authorityRefs:list(owner?.authorityRefs)
 })}));
}

function timingModule(readingIR,temporalState){
 const section=readingIR?.sections?.timing||{},owner=ownerFor(readingIR,'CURRENT_TEMPORAL_STRUCTURE');
 return freeze({
  schemaVersion:'PHI-OS-PPR-C1-BAZI-TEMPORAL-EXPERIENCE-v1.0.0',state:temporalState,targetContext:section.targetContext||null,currentDaYun:section.currentDaYun||null,annual:section.annual||null,allDaYun:freeze(list(section.allDaYun)),interactions:freeze(section.interactions||{liuNianToNatal:[],liuNianToCurrentDaYun:[],currentDaYunToNatal:[],crossLayerGroups:[]}),summary:freeze(section.summary||{}),resolutionState:owner?.resolutionState||'PARTIAL',qualifierCodes:list(owner?.qualifierCodes),unknownRefs:list(owner?.unknownRefs),evidenceRefs:list(owner?.evidenceRefs),authorityRefs:list(owner?.authorityRefs),boundaries:freeze({currentDateInferred:false,browserTimezoneInferred:false,combinationEqualsTransformation:false,eventPredictionCreated:false,goodBadScoreCreated:false})
 });
}

const REALITY_COMPARISON_ORDER=Object.freeze([
 Object.freeze({compositionType:'NATAL_FOUNDATION',questionKey:'FOUNDATION'}),
 Object.freeze({compositionType:'NATAL_RELATIONSHIP_STRUCTURE',questionKey:'RELATIONSHIPS'}),
 Object.freeze({compositionType:'PATTERN_CANDIDATE_SET',questionKey:'PATTERN'}),
 Object.freeze({compositionType:'SCHOOL_QUALIFIED_VIEW',schoolCode:'ZI_PING_MONTH_COMMAND_USE_v1',questionKey:'SCHOOL_ZIPING'}),
 Object.freeze({compositionType:'SCHOOL_QUALIFIED_VIEW',schoolCode:'DI_TIAN_SUI_TI_YONG_BALANCE_v1',questionKey:'SCHOOL_TIYONG'}),
 Object.freeze({compositionType:'SCHOOL_QUALIFIED_VIEW',schoolCode:'DI_TIAN_SUI_CLIMATE_TIAOHOU_v1',questionKey:'SCHOOL_TIAOHOU'}),
 Object.freeze({compositionType:'CURRENT_TEMPORAL_STRUCTURE',questionKey:'TIMING'})
]);

function realityComparisonModule(readingIR,temporalState){
 const owners=list(readingIR?.renderOwners).filter(owner=>owner?.renderMode==='PRIMARY_EXPLANATION');
 const byCluster=new Map();for(const owner of owners){if(!owner?.semanticClusterId)continue;if(byCluster.has(owner.semanticClusterId))throw Object.assign(new Error('PPR_C1_W11_DUPLICATE_PRIMARY_SEMANTIC_OWNER'),{code:'PPR_C1_W11_DUPLICATE_PRIMARY_SEMANTIC_OWNER',semanticClusterId:owner.semanticClusterId});byCluster.set(owner.semanticClusterId,owner)}
 const questions=[];
 for(const spec of REALITY_COMPARISON_ORDER){
  const owner=owners.find(item=>item.compositionType===spec.compositionType&&(!spec.schoolCode||item.schoolCode===spec.schoolCode));if(!owner)continue;
  questions.push(freeze({
   questionKey:spec.questionKey,compositionType:owner.compositionType,schoolCode:owner.schoolCode||null,sourceSemanticClusterId:owner.semanticClusterId,resolutionState:owner.resolutionState,
   temporalCorrespondenceEnabled:spec.questionKey==='TIMING'&&temporalState==='EXPLICIT',
   trace:freeze({evidenceCount:list(owner.evidenceRefs).length,authorityCount:list(owner.authorityRefs).length,unknownCount:list(owner.unknownRefs).length,counterEvidenceCount:list(owner.counterEvidenceRefs).length,qualifierCount:list(owner.qualifierCodes).length}),
   boundaries:freeze({customerResponseBecomesEvidence:false,customerResponseChangesMethodVerdict:false,repeatedPillarPromptCreated:false,sourceSemanticOwnerDuplicated:false})
  }));
 }
 const sourcePrimaryOwners=owners.filter(owner=>REALITY_COMPARISON_ORDER.some(spec=>spec.compositionType===owner.compositionType&&(!spec.schoolCode||spec.schoolCode===owner.schoolCode)));
 if(new Set(questions.map(x=>x.sourceSemanticClusterId)).size!==questions.length)throw Object.assign(new Error('PPR_C1_W11_REALITY_COMPARISON_CLUSTER_DUPLICATION'),{code:'PPR_C1_W11_REALITY_COMPARISON_CLUSTER_DUPLICATION'});
 return freeze({
  schemaVersion:'PHI-OS-PPR-C1-BAZI-REALITY-COMPARISON-v1.0.0',work:'PPR-C1-W11',sourceReadingIrSchema:readingIR?.schemaVersion||null,sourceReadingDigest:readingIR?.readingDigest||null,
  questionCount:questions.length,sourcePrimaryOwnerCount:sourcePrimaryOwners.length,questions:freeze(questions),
  boundaries:freeze({derivedFromDeduplicatedSemanticOwners:true,observableSignalsConsumed:false,pillarByPillarQuestionGeneration:false,customerResonanceIsEvidence:false,customerAnswerPromotesVerdict:false,eventPredictionCreated:false,goodBadScoreCreated:false})
 });
}

export function buildBaziProfessionalSurfaceModules({readingIR,report,temporalState='UNAVAILABLE'}={}){
 if(readingIR?.schemaVersion!=='PHI-OS-BAZI-FULL-READING-IR-v1.0.0')throw Object.assign(new Error('PPR_C1_W7_W12_BAZI_READING_IR_REQUIRED'),{code:'PPR_C1_W7_W12_BAZI_READING_IR_REQUIRED'});
 return freeze({
  schemaVersion:'PHI-OS-PPR-C1-BAZI-PROFESSIONAL-SURFACE-MODULES-v1.0.0',moduleVersion:'PPR-C1-W12-v1.0.0',
  pattern:patternModule(readingIR),schools:schoolModules(readingIR,report),timing:timingModule(readingIR,temporalState),
  customerSafeGraph:buildBaziCustomerSafeStructureGraph({readingIR,temporalState}),
  realityComparison:realityComparisonModule(readingIR,temporalState),
  boundaries:freeze({createsMeaning:false,recalculatesBazi:false,mergesSchools:false,resolvesUnresolvedPattern:false,infersTemporalContext:false,recalculatesEvidenceGraph:false,exposesRawEvidenceGraphIds:false,usesPprR3SpecialistPort:true,modifiesSharedPersonalRealitySurface:false})
 });
}
export default Object.freeze({buildBaziProfessionalSurfaceModules});
