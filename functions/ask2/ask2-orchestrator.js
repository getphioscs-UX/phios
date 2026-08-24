import { routeLensQuestion } from '../lens-router/lens-router-runtime.js';
import { routeRelationalQuestion } from '../relational/relational-route-runtime.js';
import { classifyCurrentnessRequirement } from '../current-web-authority/current-web-authority-runtime.js';

export const ASK2_PLAN_SCHEMA = 'PHI-OS-ASK2-ORCHESTRATION-PLAN-v1.0.0';
export const ASK2_COMPOSITION_SCHEMA = 'PHI-OS-ASK2-BOUNDED-COMPOSITION-v1.0.0';

const EVIDENCE_FIRST = new Set(['CURRENT','DECISION','RELATIONSHIP','REALITY_FACT']);
const ORIGINS = new Set(['DETERMINISTIC_RUNTIME','GOVERNED_RUNTIME','PROFESSIONAL_MANUAL_INPUT']);
const ROUTE_LABELS = Object.freeze({
  'AST:NATAL':'Astrology Function Lens',
  'AST:CURRENT_DYNAMIC':'Astrology Current / Transit Lens',
  'BZR:TEMPORAL':'BaZi Temporal Lens',
  'ZWR:NATAL':'Zi Wei Domain Lens',
  'ZWR:DYNAMIC_DOMAIN':'Zi Wei Dynamic Domain Lens',
  'HDR:OPERATING_READING':'Internal Operating Lens',
  'NUM:':'Numeric Rhythm Lens',
  'RELATIONAL_RUNTIME:':'Relational Runtime'
});
const WHY = Object.freeze({
 STRUCTURE:'I am using the Astrology Function Lens because your question is mainly structural.',
 TIME:'I am using the BaZi Temporal Lens because your question is mainly temporal.',
 CURRENT:'I am using the Astrology Current / Transit Lens because your question is mainly about current dynamics.',
 DOMAIN:'I am using the Zi Wei Domain Lens because your question is mainly about a life area.',
 DECISION:'I am using the Internal Operating Lens because your question is mainly about how a decision is processed.',
 RHYTHM:'I am using the Numeric Rhythm Lens because your question is mainly about rhythm or cycle.',
 RELATIONSHIP:'I am using the Relational Runtime because your question is about interaction between two explicitly identified people.',
 REALITY_FACT:'No symbolic lens is primary because this question is asking for reality evidence.',
 PROFESSIONAL:'Professional authority is required; a symbolic lens cannot replace professional judgment.',
 NEEDS_CONTEXT:'More context is needed before PHI OS selects a lens.'
});
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v;}
function fail(code,status=422){const e=new Error(code);e.code=code;e.status=status;throw e;}
function routeKey(candidate){return `${candidate?.pluginCode||''}:${candidate?.subCapability||''}`;}
function disclosureFor(candidate, role){
  if(!candidate)return null;
  const key=routeKey(candidate);
  return freeze({role,label:ROUTE_LABELS[key]||`${candidate.pluginCode} ${candidate.subCapability||candidate.lensCode} Lens`,pluginCode:candidate.pluginCode,lensCode:candidate.lensCode,subCapability:candidate.subCapability??null});
}
function normalizeAsk2TaxonomyHint(question,taxonomyHint){
 if(taxonomyHint!=null)return taxonomyHint;
 const q=String(question||'').normalize('NFKC');
 if(/怎样做决定|如何做决定/.test(q))return 'DECISION';
 return null;
}
function currentEvidenceValid(item){return item?.schemaVersion==='PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0'&&item?.boundaries?.searchRankUsedAsAuthority===false&&item?.boundaries?.sourceVotingUsed===false&&item?.boundaries?.lensMutationAllowed===false;}
function ccrValid(snapshot){return snapshot?.schemaVersion==='PHI-OS-CURRENT-CONTEXT-SNAPSHOT-v1.0.0';}
export function createLensDisclosure(routePlan){
  const primary=routePlan?.primary?.candidate?disclosureFor(routePlan.primary.candidate,'PRIMARY'):null;
  const supporting=(routePlan?.supporting||[]).map(x=>disclosureFor(x.candidate,x.candidate?.role||'SUPPORTING')).filter(Boolean);
  return freeze({schemaVersion:'PHI-OS-ASK2-LENS-DISCLOSURE-v1.0.0',primary,supporting,visibleConsumedLensCount:Number(Boolean(primary))+supporting.length,silentLensConsumption:false});
}
export function explainLensSelection(routePlan){
  const taxonomy=routePlan?.classification?.taxonomy||'NEEDS_CONTEXT';
  return freeze({schemaVersion:'PHI-OS-ASK2-WHY-THIS-LENS-v1.0.0',taxonomy,reason:WHY[taxonomy]||WHY.NEEDS_CONTEXT,authority:'LRR_QUESTION_TAXONOMY_AND_ROUTE_PLAN',methodSuperiorityClaimed:false,truthProofClaimed:false});
}
export function buildAsk2OrchestrationPlan({
 question,
 taxonomyHint=null,
 domain='GENERAL_CURRENT',
 publicRequest=true,
 internalAccessClass=null,
 currentContextSnapshot=null,
 currentExternalEvidence=[],
 externalCurrentRequired=null
}={}){
 if(!String(question||'').trim())fail('ASK2_QUESTION_REQUIRED',400);
 const currentnessRequirement=classifyCurrentnessRequirement({question,domain});
 const effectiveTaxonomyHint=normalizeAsk2TaxonomyHint(question,taxonomyHint);
 let routePlan=routeLensQuestion({question,taxonomyHint:effectiveTaxonomyHint,publicRequest,internalAccessClass});
 let relationalPlan=null;
 if(routePlan.classification?.taxonomy==='RELATIONSHIP'){
   relationalPlan=routeRelationalQuestion({question,taxonomyHint:'RELATIONSHIP',publicRequest,internalAccessClass});
 }
 const taxonomy=routePlan.classification?.taxonomy;
 const external=Array.isArray(currentExternalEvidence)?currentExternalEvidence:[];
 if(external.some(x=>!currentEvidenceValid(x)))fail('ASK2_CURRENT_EXTERNAL_EVIDENCE_NOT_ADMITTED',409);
 const externalSignals=/(external|market|economy|economic|interest rate|opr|policy|regulation|news|weather|outbreak|cases|外部|市场|经济|利率|政策|新闻|天气|病例|疫情)/i.test(String(question));
 const mustUseExternal=externalCurrentRequired===true||(externalCurrentRequired!==false&&taxonomy==='REALITY_FACT'&&currentnessRequirement!=='CURRENTNESS_NONE')||(externalCurrentRequired!==false&&externalSignals&&currentnessRequirement!=='CURRENTNESS_NONE');
 if(mustUseExternal&&external.length===0){
   return freeze({schemaVersion:ASK2_PLAN_SCHEMA,question,domain,taxonomy,currentnessRequirement,routePlan,relationalPlan,orchestrationState:'CURRENT_EXTERNAL_EVIDENCE_REQUIRED',currentReality:{internal:currentContextSnapshot||null,external:[]},executionRequests:[],lensDisclosure:createLensDisclosure(routePlan),whyThisLens:explainLensSelection(routePlan),boundaries:freeze({runtimeFirst:true,modelCalculationAllowed:false,rawWebResultAllowed:false,lensMayMutateEvidence:false,methodVotingAllowed:false})});
 }
 if(currentContextSnapshot!=null&&!ccrValid(currentContextSnapshot))fail('ASK2_CCR_SNAPSHOT_INVALID',409);
 const evidenceRequired=EVIDENCE_FIRST.has(taxonomy);
 if(evidenceRequired&&taxonomy!=='REALITY_FACT'&&!currentContextSnapshot){
   return freeze({schemaVersion:ASK2_PLAN_SCHEMA,question,domain,taxonomy,currentnessRequirement,routePlan,relationalPlan,orchestrationState:'CURRENT_CONTEXT_REQUIRED',currentReality:{internal:null,external},executionRequests:[],lensDisclosure:createLensDisclosure(routePlan),whyThisLens:explainLensSelection(routePlan),boundaries:freeze({runtimeFirst:true,modelCalculationAllowed:false,rawWebResultAllowed:false,lensMayMutateEvidence:false,methodVotingAllowed:false})});
 }
 if(routePlan.routeState==='PROFESSIONAL_HANDOFF_REQUIRED'){
   return freeze({schemaVersion:ASK2_PLAN_SCHEMA,question,domain,taxonomy,currentnessRequirement,routePlan,relationalPlan,orchestrationState:'PROFESSIONAL_HANDOFF_REQUIRED',currentReality:{internal:currentContextSnapshot||null,external},executionRequests:[],lensDisclosure:createLensDisclosure(routePlan),whyThisLens:explainLensSelection(routePlan),boundaries:freeze({runtimeFirst:true,modelCalculationAllowed:false,rawWebResultAllowed:false,lensMayMutateEvidence:false,methodVotingAllowed:false})});
 }
 if(routePlan.routeState==='REALITY_EVIDENCE_ONLY'){
   return freeze({schemaVersion:ASK2_PLAN_SCHEMA,question,domain,taxonomy,currentnessRequirement,routePlan,relationalPlan,orchestrationState:'REALITY_EVIDENCE_ONLY',currentReality:{internal:currentContextSnapshot||null,external},executionRequests:[],lensDisclosure:createLensDisclosure(routePlan),whyThisLens:explainLensSelection(routePlan),boundaries:freeze({runtimeFirst:true,modelCalculationAllowed:false,rawWebResultAllowed:false,lensMayMutateEvidence:false,methodVotingAllowed:false})});
 }
 const executionRequests=[];
 if(relationalPlan){
   executionRequests.push(freeze({requestId:'ASK2-RUNTIME-001',routeKey:'RELATIONAL_RUNTIME',runtimeCode:'PHI_OS_RELATIONAL_RUNTIME',role:'PRIMARY',originRequired:'GOVERNED_RUNTIME',modelMayExecute:false}));
 } else if(routePlan.primary?.gate?.allowed===true){
   const c=routePlan.primary.candidate;
   executionRequests.push(freeze({requestId:'ASK2-RUNTIME-001',routeKey:`${c.pluginCode}.${c.subCapability||''}`.replace(/\.$/,''),runtimeCode:c.pluginCode,role:'PRIMARY',originRequired:c.pluginCode==='HDR'?'GOVERNED_RUNTIME':'DETERMINISTIC_RUNTIME',modelMayExecute:false}));
   for(const [i,s] of (routePlan.supporting||[]).entries()){
     const c2=s.candidate;
     executionRequests.push(freeze({requestId:`ASK2-RUNTIME-${String(i+2).padStart(3,'0')}`,routeKey:`${c2.pluginCode}.${c2.subCapability||''}`.replace(/\.$/,''),runtimeCode:c2.pluginCode,role:c2.role||'SUPPORTING',originRequired:c2.pluginCode==='HDR'?'GOVERNED_RUNTIME':'DETERMINISTIC_RUNTIME',modelMayExecute:false}));
   }
 }
 const state=executionRequests.length?'READY_FOR_RUNTIME_EXECUTION':routePlan.routeState;
 return freeze({schemaVersion:ASK2_PLAN_SCHEMA,question,domain,taxonomy,currentnessRequirement,routePlan,relationalPlan,orchestrationState:state,currentReality:{internal:currentContextSnapshot||null,external},executionRequests,lensDisclosure:createLensDisclosure(routePlan),whyThisLens:explainLensSelection(routePlan),boundaries:freeze({runtimeFirst:true,modelCalculationAllowed:false,rawWebResultAllowed:false,lensMayMutateEvidence:false,methodVotingAllowed:false,realityEvidenceFinalAuthority:true})});
}
export function validateRuntimeExecutionResult(result,request){
 if(!request)fail('ASK2_EXECUTION_REQUEST_REQUIRED',400);
 if(!result||typeof result!=='object')fail('ASK2_RUNTIME_RESULT_REQUIRED',400);
 if(!ORIGINS.has(result.origin))fail('ASK2_RUNTIME_RESULT_ORIGIN_INVALID',409);
 if(result.origin!==request.originRequired&&!(request.originRequired==='GOVERNED_RUNTIME'&&result.origin==='PROFESSIONAL_MANUAL_INPUT'))fail('ASK2_RUNTIME_RESULT_ORIGIN_MISMATCH',409);
 if(!String(result.sourceArtifactId||'').trim()||!String(result.sourceSchemaVersion||'').trim())fail('ASK2_RUNTIME_PROVENANCE_REQUIRED',409);
 if(result.modelGeneratedCalculation===true)fail('ASK2_MODEL_GENERATED_CALCULATION_FORBIDDEN',409);
 return freeze({requestId:request.requestId,routeKey:request.routeKey,role:request.role,origin:result.origin,sourceArtifactId:result.sourceArtifactId,sourceSchemaVersion:result.sourceSchemaVersion,readingIr:result.readingIr??null});
}
export function composeAsk2BoundedState({plan,runtimeResults=[]}={}){
 if(plan?.schemaVersion!==ASK2_PLAN_SCHEMA)fail('ASK2_PLAN_REQUIRED',400);
 if(!['READY_FOR_RUNTIME_EXECUTION','REALITY_EVIDENCE_ONLY'].includes(plan.orchestrationState))fail('ASK2_PLAN_NOT_COMPOSABLE',409);
 const results=Array.isArray(runtimeResults)?runtimeResults:[];
 const validated=[];
 if(plan.orchestrationState==='READY_FOR_RUNTIME_EXECUTION'){
   if(results.length!==plan.executionRequests.length)fail('ASK2_RUNTIME_RESULT_COUNT_MISMATCH',409);
   for(const req of plan.executionRequests){
     const r=results.find(x=>x.requestId===req.requestId);validated.push(validateRuntimeExecutionResult(r,req));
   }
 }
 return freeze({schemaVersion:ASK2_COMPOSITION_SCHEMA,question:plan.question,currentContext:plan.currentReality.internal,currentExternalEvidence:plan.currentReality.external,runtimeResults:validated,primaryLens:plan.lensDisclosure.primary,supportingLenses:plan.lensDisclosure.supporting,whyThisLens:plan.whyThisLens,known:[],unknown:[],answer:null,nextStep:null,boundaries:freeze({boundedCompositionOnly:true,modelMayCompose:true,modelMayCalculate:false,modelMayMutateEvidence:false,modelMayCreateMedicalDiagnosis:false,modelMayCreateFinancialCalculation:false,methodVotingAllowed:false})});
}
