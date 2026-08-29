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

export function buildBaziProfessionalSurfaceModules({readingIR,report,temporalState='UNAVAILABLE'}={}){
 if(readingIR?.schemaVersion!=='PHI-OS-BAZI-FULL-READING-IR-v1.0.0')throw Object.assign(new Error('PPR_C1_W7_W9_BAZI_READING_IR_REQUIRED'),{code:'PPR_C1_W7_W9_BAZI_READING_IR_REQUIRED'});
 return freeze({
  schemaVersion:'PHI-OS-PPR-C1-BAZI-PROFESSIONAL-SURFACE-MODULES-v1.0.0',moduleVersion:'PPR-C1-W7-W9-v1.0.0',
  pattern:patternModule(readingIR),schools:schoolModules(readingIR,report),timing:timingModule(readingIR,temporalState),
  boundaries:freeze({createsMeaning:false,recalculatesBazi:false,mergesSchools:false,resolvesUnresolvedPattern:false,infersTemporalContext:false})
 });
}
export default Object.freeze({buildBaziProfessionalSurfaceModules});
