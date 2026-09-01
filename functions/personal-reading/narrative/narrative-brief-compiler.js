import {deepFreeze, sha256Stable} from '../../interpretation-runtime/mir7-utils.js';

export const NARRATIVE_BRIEF_SCHEMA='PHI-OS-NARRATIVE-BRIEF-v1.0.0';
const REPORT_SCHEMA='PHI-OS-PERSONAL-READING-REPORT-IR-v2.0.0';
const W53_SCHEMA='PHI-OS-PERSONAL-READING-EVIDENCE-WRITING-RULES-v2.0.0';
const W54_SCHEMA='PHI-OS-NO-UNSUPPORTED-FACTUAL-PERSONALITY-CLAIM-v1.0.0';
const METHOD_SECTIONS=Object.freeze(['ECR_PERSPECTIVE','AST_PERSPECTIVE','BZR_PERSPECTIVE','ZWR_PERSPECTIVE','HD_PERSPECTIVE','NUM_PERSPECTIVE']);
const CROSS_SECTIONS=Object.freeze(['COMMON_EMPHASIS','COMPLEMENTARY_VIEWS','TENSIONS','NON_CONVERGENCE']);
const CROSS_SOURCE_SECTIONS=Object.freeze(['CROSS_SOURCE_ALIGNMENT','SOURCE_TENSIONS']);
const REALITY_SECTIONS=Object.freeze(['CURRENT_STATE','CURRENT_LOAD','CURRENT_RESONANCE','CURRENT_MISMATCH']);
const FORBIDDEN_INPUT_KEYS=new Set(['rawPlanets','rawPillars','rawPalaces','rawNumbers','rawEcrStructures','rawHumanDesign','rawAssessmentAnswers','rawExternalProfileLabels','methodRegistries','semanticCorpora','providerSecrets','modelConfig']);
const STYLE_KEYS=new Set(['tone','depth','phiOsLens','explanationFirst','customerReadable','governanceJargonDefault']);
const DEFAULT_STYLE=Object.freeze({tone:'WARM_PROFESSIONAL',depth:'PROFESSIONAL',phiOsLens:'SPARING',explanationFirst:true,customerReadable:true,governanceJargonDefault:false});
const DEFAULT_FREEDOM=Object.freeze({
  mayVary:['chapter architecture','paragraph order','transitions','metaphor','narrative flow','customer-readable phrasing','PHI OS Lens placement'],
  mustPreserve:['source facts','source classes','uncertainty','counter-evidence','unsupported areas','Current Reality customer-control','prohibited claim boundary'],
  mayRecalculateFacts:false,
  mayInventLifeEvents:false,
  mayInventCurrentReality:false,
  mayDiagnose:false,
  mayGuaranteeFuture:false,
  mayInferPartnerHiddenState:false,
  mayCreateCompatibilityScore:false,
  mayCreateScientificValidationFromCrossSourceAlignment:false
});
const clean=v=>String(v??'').trim();
const arr=v=>Array.isArray(v)?v:[];
const uniq=v=>[...new Set(arr(v).filter(Boolean).map(String))];
const clip=(v,n=900)=>{const s=clean(v).replace(/\s+/g,' ');return s.length<=n?s:`${s.slice(0,n-1)}…`};
const freeze=deepFreeze;
function fail(code,details={}){throw Object.assign(new Error(code),{code,...details})}
function assertDigest(value,code){const d=clean(value);if(!/^[a-f0-9]{64}$/.test(d))fail(code);return d}
function sectionMap(report){return new Map(arr(report.sections).map(s=>[s.sectionId,s]))}
function signalFromSection(section,kind,sourceClasses=[]){
  if(!section||section.status!=='ELIGIBLE'||!clean(section.summary||section.headline))return null;
  const refs=uniq([
    ...arr(section.singleMethodReadingRefs),...arr(section.crossMethodClaimRefs),...arr(section.profileSignalRefs),...arr(section.selfAssessmentRefs),...arr(section.reasoningTaskRefs),...arr(section.currentRealityRefs),...arr(section.realityComparisonRefs),...arr(section.supportRefs),...arr(section.tensionRefs),...arr(section.openRefs)
  ]);
  return freeze({signalId:`${kind}:${section.sectionId}`,kind,statement:clip(section.summary||section.headline),refs,sourceClasses:uniq(sourceClasses)});
}
function themeSignal(theme,kind='CORE_THEME'){
  if(!theme||!clean(theme.statement))return null;
  const sourceClasses=theme.sourceKind==='METHOD'?['SYMBOLIC_INTERPRETATION']:theme.sourceKind==='PROFILE'?['PROFILE_SOURCE_CLASS_PRESERVED']:theme.sourceKind==='REALITY'?['CURRENT_REALITY_OBSERVATION']:[];
  return freeze({signalId:clean(theme.themeId)||`${kind}:${clean(theme.statement).slice(0,32)}`,kind,statement:clip(theme.statement),refs:uniq(theme.refs),sourceClasses});
}
function compactSignals(values,max){const seen=new Set();return arr(values).filter(Boolean).filter(x=>{const k=`${x.kind}|${x.statement}|${x.refs.join('|')}`;if(seen.has(k))return false;seen.add(k);return true}).slice(0,max)}
function sourceClassLocks(report){
  const rows=[];
  for(const src of arr(report.sourceIndex)){
    if(!clean(src?.sourceClass)||!clean(src?.sourceRef))continue;
    rows.push({sourceClass:clean(src.sourceClass),sourceRef:clean(src.sourceRef),semanticDigest:src.semanticDigest?clean(src.semanticDigest):null,mayBecomeOtherSourceClass:false});
  }
  for(const lock of arr(report.technicalAppendix?.factLocks)){
    const m=/^PROFILE_SIGNAL:([^:]+):([^:]+):([a-f0-9]{64})$/.exec(String(lock));
    if(m)rows.push({sourceClass:m[2],sourceRef:`PROFILE_SIGNAL:${m[1]}`,semanticDigest:m[3],mayBecomeOtherSourceClass:false});
  }
  const seen=new Set();
  return rows.filter(x=>{const k=`${x.sourceClass}|${x.sourceRef}`;if(seen.has(k))return false;seen.add(k);return true});
}
function stylePolicy(input){
  if(input==null)return {...DEFAULT_STYLE};
  if(typeof input!=='object'||Array.isArray(input))fail('W54N0_STYLE_INTENT_INVALID');
  for(const key of Object.keys(input))if(!STYLE_KEYS.has(key))fail('W54N0_STYLE_INTENT_KEY_NOT_ALLOWED',{key});
  const out={...DEFAULT_STYLE,...input};
  for(const key of ['tone','depth','phiOsLens'])out[key]=clip(out[key],80);
  for(const key of ['explanationFirst','customerReadable','governanceJargonDefault'])if(typeof out[key]!=='boolean')fail('W54N0_STYLE_INTENT_BOOLEAN_REQUIRED',{key});
  return out;
}
function customerContextPolicy(input){
  if(input==null)return null;
  if(typeof input==='string')return {sourceClass:'CUSTOMER_SUPPLIED_CONTEXT',text:clip(input,1200),factualAuthority:false,hiddenStateInferenceAllowed:false};
  if(typeof input!=='object'||Array.isArray(input))fail('W54N0_CUSTOMER_CONTEXT_INVALID');
  const text=clip(input.text??input.statement??'',1200);
  if(!text)fail('W54N0_CUSTOMER_CONTEXT_TEXT_REQUIRED');
  return {sourceClass:'CUSTOMER_SUPPLIED_CONTEXT',text,factualAuthority:false,hiddenStateInferenceAllowed:false};
}
function prohibitedClasses(w53,w54){
  const out=[...arr(w54.forbiddenAlways)];
  for(const rule of arr(w53.rules))for(const cls of arr(rule.forbiddenClaims))out.push(cls);
  out.push('NEW_LIFE_EVENT_WITHOUT_SOURCE','OBJECTIVE_RELATIONSHIP_FACT_WITHOUT_SOURCE','OBJECTIVE_PROFILE_IDENTITY_FROM_SELF_REPORT','METHOD_PROOF_FROM_CURRENT_REALITY','METHOD_DISPROOF_FROM_CURRENT_REALITY');
  return uniq(out).sort();
}
function sensitiveBoundaries(report,w54){
  const out=['CURRENT_REALITY_REMAINS_CUSTOMER_CONTROLLED','PROFILE_SOURCE_CLASS_MUST_REMAIN_VISIBLE','NO_HIDDEN_PARTNER_STATE_INFERENCE','NO_DIAGNOSIS','NO_GUARANTEED_FUTURE'];
  for(const section of arr(report.sections))for(const ref of arr(section.boundaryRefs))if(/SENSITIVE|CONSENT|PRIVACY/i.test(String(ref)))out.push(String(ref));
  for(const cls of arr(w54.forbiddenAlways))if(/PARTNER|DIAGNOSIS|FUTURE|DESTINY|COMPATIBILITY/i.test(cls))out.push(cls);
  return uniq(out).sort();
}
function factLocks(report){
  const out=[{lockType:'SOURCE_REPORT_ID',value:clean(report.reportId)},{lockType:'SOURCE_SEMANTIC_DIGEST',value:assertDigest(report.semanticDigest,'W54N0_SOURCE_SEMANTIC_DIGEST_INVALID')}];
  for(const lock of arr(report.technicalAppendix?.factLocks))out.push({lockType:'UPSTREAM_FACT_LOCK',value:clip(lock,1400)});
  for(const src of arr(report.sourceIndex))if(clean(src?.sourceRef))out.push({lockType:'SOURCE_CLASS_LOCK',value:`${clean(src.sourceClass)}:${clean(src.sourceRef)}`});
  for(const section of arr(report.sections))for(const ref of arr(section.boundaryRefs))if(clean(ref))out.push({lockType:'UPSTREAM_BOUNDARY_REF',value:clip(ref,1400)});
  const seen=new Set();return out.filter(x=>x.value).filter(x=>{const k=`${x.lockType}|${x.value}`;if(seen.has(k))return false;seen.add(k);return true});
}
function reportEligibility(report){
  if(report?.schemaVersion!==REPORT_SCHEMA)fail('W54N0_W51_REPORT_IR_V2_REQUIRED');
  if(report?.governance?.authority!=='FREE_GOVERNED_PERSONAL_READING'||report?.governance?.oneSemanticIrAcrossWebPrintPdf!==true)fail('W54N0_FREE_GOVERNED_REPORT_AUTHORITY_REQUIRED');
  if(report?.governance?.paidNarrativeGenerated!==false)fail('W54N0_SOURCE_REPORT_ALREADY_GENERATIVE');
  if(report?.executiveReading?.paidNarrativeEligibility!=='READY_FOR_W54N0_BRIEF')fail('W54N0_SOURCE_REPORT_NOT_NARRATIVE_ELIGIBLE');
  if(!clean(report.reportId))fail('W54N0_SOURCE_REPORT_ID_REQUIRED');
  assertDigest(report.semanticDigest,'W54N0_SOURCE_SEMANTIC_DIGEST_INVALID');
  return report;
}
function rulesEligibility(w53,w54){
  if(w53?.schemaVersion!==W53_SCHEMA||w53?.rulesetBoundaries?.postGenerationVerifierAuthority!==true)fail('W54N0_W53_EVIDENCE_RULES_REQUIRED');
  if(w53?.rulesetBoundaries?.symbolicScientificValidationTransferAllowed!==false||w53?.rulesetBoundaries?.profileMayBecomeObjectivePersonalityFact!==false)fail('W54N0_W53_BOUNDARY_DRIFT');
  if(w54?.schemaVersion!==W54_SCHEMA||!arr(w54.forbiddenAlways).length)fail('W54N0_W54_FACTUAL_GUARD_REQUIRED');
}
export async function compileNarrativeBrief(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input))fail('W54N0_INPUT_OBJECT_REQUIRED');
  for(const key of Object.keys(input))if(FORBIDDEN_INPUT_KEYS.has(key))fail('W54N0_RAW_OR_PROVIDER_INPUT_FORBIDDEN',{key});
  const report=reportEligibility(input.sourceReport),w53=input.evidenceWritingRules,w54=input.factualGuard;rulesEligibility(w53,w54);
  const sections=sectionMap(report);
  const methodSignals=compactSignals(METHOD_SECTIONS.map(id=>signalFromSection(sections.get(id),'METHOD_SIGNAL',['SYMBOLIC_INTERPRETATION'])),12);
  const profileSourceClasses=uniq(report.inputSummary?.profileSourceClasses);
  const profileClassBySection={
    PROFILE_OVERVIEW:profileSourceClasses,
    EXTERNAL_PROFILE:['EXTERNAL_PROFILE_RESULT'],
    SELF_ASSESSMENT:['CUSTOMER_SELF_REPORT'],
    REASONING_TASKS:['MEASURED_TASK_PERFORMANCE']
  };
  const profileSignals=compactSignals(['PROFILE_OVERVIEW','EXTERNAL_PROFILE','SELF_ASSESSMENT','REASONING_TASKS'].map(id=>signalFromSection(sections.get(id),'PROFILE_SIGNAL',profileClassBySection[id])),12);
  const crossPerspectiveSignals=compactSignals(CROSS_SECTIONS.map(id=>signalFromSection(sections.get(id),'CROSS_PERSPECTIVE_SIGNAL',['SYMBOLIC_INTERPRETATION'])),12);
  const crossSourceSignals=compactSignals(CROSS_SOURCE_SECTIONS.map(id=>signalFromSection(sections.get(id),'CROSS_SOURCE_SIGNAL',uniq(['SYMBOLIC_INTERPRETATION',...profileSourceClasses]))),12);
  const currentRealitySignals=compactSignals(REALITY_SECTIONS.map(id=>signalFromSection(sections.get(id),'CURRENT_REALITY_SIGNAL',['CURRENT_REALITY_OBSERVATION'])),12);
  const importantRelationships=compactSignals([
    ...crossPerspectiveSignals.map(x=>({...x,signalId:`IMPORTANT:${x.signalId}`,kind:'IMPORTANT_RELATIONSHIP'})),
    ...crossSourceSignals.map(x=>({...x,signalId:`IMPORTANT:${x.signalId}`,kind:'IMPORTANT_RELATIONSHIP'})),
    signalFromSection(sections.get('RELATIONSHIP_AND_EXCHANGE'),'IMPORTANT_RELATIONSHIP',['SYMBOLIC_INTERPRETATION'])
  ],8);
  const coreThemes=compactSignals(arr(report.executiveReading?.coreThemes).map(x=>themeSignal(x,'CORE_THEME')),5);
  const priorityFindings=compactSignals(arr(report.executiveReading?.coreThemes).slice(0,5).map(x=>themeSignal(x,'PRIORITY_FINDING')),5);
  const unsupportedAreas=arr(report.sections).filter(s=>['NOT_ESTABLISHED','SUPPRESSED'].includes(s.status)).map(s=>({sectionId:String(s.sectionId),status:s.status}));
  const seed={
    schemaVersion:NARRATIVE_BRIEF_SCHEMA,
    briefId:`NBR-${report.semanticDigest.slice(0,24).toUpperCase()}`,
    sourceReportId:report.reportId,
    sourceSemanticDigest:report.semanticDigest,
    locale:report.locale==='zh-Hans'?'zh-Hans':'en',
    coreThemes,
    priorityFindings,
    importantRelationships,
    methodSignals,
    profileSignals,
    crossPerspectiveSignals,
    crossSourceSignals,
    currentRealitySignals,
    timingContext:uniq(report.technicalAppendix?.timingContext).slice(0,24),
    tensions:uniq([...arr(report.technicalAppendix?.sourceTensions),...arr(report.sections).flatMap(s=>arr(s.tensionRefs))]).slice(0,24),
    counterEvidence:uniq(report.technicalAppendix?.counterEvidence).slice(0,24),
    openQuestions:uniq(report.openQuestions).slice(0,12),
    factsAiMustNotAlter:factLocks(report),
    sourceClassLocks:sourceClassLocks(report),
    unsupportedAreas,
    sensitiveBoundaries:sensitiveBoundaries(report,w54),
    styleIntent:stylePolicy(input.styleIntent),
    customerContext:customerContextPolicy(input.customerContext),
    narrativeFreedom:{...DEFAULT_FREEDOM},
    prohibitedClaimClasses:prohibitedClasses(w53,w54)
  };
  const briefSemanticDigest=await sha256Stable(seed);
  return freeze({...seed,briefSemanticDigest});
}
export default Object.freeze({compileNarrativeBrief});
