import {normalizePersonalCurrentRealityInput,canonicalizeCurrentRealityObservations} from '../current-reality/personal-current-reality-runtime.js';
import {routePersonalRealityProducts} from './product-router.js';

export const PERSON_EVIDENCE_CLASSES=Object.freeze(['DECLARED','OBSERVED','MEASURED','DOCUMENTED','METHOD_DERIVED','CURRENT_DATA_CONTEXT','PROFESSIONALLY_REVIEWED','UNKNOWN']);
export const PERSON_LANES=Object.freeze(['stableStructure','variablePatterns','currentConditions','decisionContexts','environmentContexts','lifeStage','relationships','financialLinks','observations','perspectives','evidence','unknowns','openQuestions','revisions']);
export const PERSONAL_SECTIONS=Object.freeze([
 ['overview','Overview','概览'],['stableStructure','Structure','结构'],['variablePatterns','Patterns','模式'],['currentConditions','Current Context','当前处境'],['relationships','Relationships','关系'],['financialLinks','Financial Context','财务处境'],['perspectives','Perspectives','视角'],['evidence','Evidence','证据'],['openQuestions','Open Questions','开放问题'],['ask','Ask PHI','询问 PHI']
]);
const copy=x=>structuredClone(x),arr=x=>Array.isArray(x)?x:[],fail=m=>{throw Error(m);};
function evidence(item,personId){
 if(!item.id||!PERSON_EVIDENCE_CLASSES.includes(item.evidenceClass)||!item.sourceRef)fail('PERSON_EVIDENCE_LINEAGE_REQUIRED');
 if(item.personId&&item.personId!==personId)fail('PERSON_EVIDENCE_SUBJECT_MISMATCH');
 if(item.evidenceClass==='METHOD_DERIVED'&&(!item.methodId||!item.claimId))fail('METHOD_CLAIM_LINEAGE_REQUIRED');
 if(item.evidenceClass==='CURRENT_DATA_CONTEXT'&&!item.asOf)fail('CURRENT_CONTEXT_TIMESTAMP_REQUIRED');
 if(item.evidenceClass==='PROFESSIONALLY_REVIEWED'&&(!item.reviewId||!item.reviewerId))fail('PROFESSIONAL_REVIEW_LINEAGE_REQUIRED');
 return {...copy(item),personId,authority:item.evidenceClass,objectiveFact:false};
}
export function createCanonicalPersonReality({accountId,personId,identity={},evidence:items=[],...lanes}={}){
 if(!accountId||!personId)fail('ACCOUNT_PERSON_BINDING_REQUIRED');
 const records=arr(items).map(x=>evidence(x,personId)),ids=new Set(records.map(x=>x.id));
 if(ids.size!==records.length)fail('DUPLICATE_PERSON_EVIDENCE');
 const result={schemaVersion:'PC-R1-CANONICAL-PERSON-v1',accountId,personId,identity:copy(identity),evidence:records};
 for(const lane of PERSON_LANES.filter(x=>x!=='evidence'))result[lane]=arr(lanes[lane]).map(x=>{
  if(typeof x!=='object'||x===null)fail('PERSON_LANE_RECORD_REQUIRED');
  for(const ref of arr(x.evidenceRefs))if(!ids.has(ref))fail('PERSON_EVIDENCE_REFERENCE_UNKNOWN');
  return copy(x);
 });
 result.boundaries={profileAssessmentOptional:true,methodNamesAreTopLevelTabs:false,unknownRemainsUnknown:true,persisted:false,productionActivated:false};
 return result;
}
export function composePersonStructure(person,{comparisons=[]}={}){
 const records=new Map(person.evidence.map(x=>[x.id,x]));
 return ['stableStructure','variablePatterns','decisionContexts','environmentContexts','currentConditions','openQuestions'].map(lane=>({lane,items:person[lane].map(item=>{
  const refs=arr(item.evidenceRefs),sources=refs.map(x=>records.get(x)).filter(Boolean);
  const admitted=arr(comparisons).filter(c=>c.subjectId===person.personId&&c.topicId===item.id&&c.sourceRef&&arr(c.evidenceRefs).length&&c.evidenceRefs.every(r=>records.has(r)));
  const support=admitted.some(x=>x.state==='REALITY_SUPPORTED'),contrast=admitted.some(x=>x.state==='REALITY_CONTRASTED');
  const divergence=admitted.some(x=>x.state==='PERSPECTIVE_DIVERGENCE')||(support&&contrast);
  const explicitConvergence=admitted.some(x=>x.state==='MULTI_PERSPECTIVE_CONVERGENCE');
  const state=divergence?'PERSPECTIVE_DIVERGENCE':contrast?'REALITY_CONTRASTED':support?'REALITY_SUPPORTED':explicitConvergence?'MULTI_PERSPECTIVE_CONVERGENCE':sources.length===1?'SINGLE_SOURCE':'OPEN';
  return {...item,state,sources,comparisons:admitted,majorityVotePerformed:false,personalFactCreated:false};
 })}));
}
const domainMap={CURRENT_STATE:'currentConditions',LOAD:'currentConditions',DRIFT:'variablePatterns',DECISION:'decisionContexts',EXECUTION:'currentConditions',RELATIONSHIP:'relationships',ENVIRONMENT:'environmentContexts',RESOURCES:'financialLinks',RECOVERY:'currentConditions',OPEN_LOOPS:'openQuestions',HEALTH:'currentConditions',FINANCIAL:'financialLinks',RELATIONSHIP_SENSITIVE:'relationships',BODY_CARRIER:'currentConditions',INPUT_SENSITIVITY:'currentConditions'};
export function consumePersonalCurrentReality(person,{input,contextTags={}}={}){
 const normalized=normalizePersonalCurrentRealityInput(input||{}),ir=canonicalizeCurrentRealityObservations(normalized),next=copy(person);
 for(const observation of ir.observations){
  const id='current:'+observation.observationId,tag=contextTags[observation.observationId]||null;
  if(tag==='health'&&!normalized.sensitiveConsent)fail('HEALTH_CONTEXT_EXPLICIT_CONSENT_REQUIRED');
  const lane=tag==='life-stage'?'lifeStage':domainMap[observation.domain];
  const record=evidence({id,evidenceClass:'DECLARED',sourceRef:'CURRENT_REALITY_RUNTIME:'+observation.observationId,statement:observation.statement,domain:observation.domain,contextTag:tag,sensitive:observation.sensitive},person.personId);
  if(next.evidence.some(x=>x.id===id))fail('CURRENT_OBSERVATION_ALREADY_CONSUMED');
  next.evidence.push(record);next.observations.push({...observation,evidenceRefs:[id]});
  next[lane].push({id,statement:observation.statement,contextTag:tag,evidenceRefs:[id]});
 }
 return next;
}
export function consumePersonalMethodProducts(person,args){
 const route=routePersonalRealityProducts(args),next=copy(person);
 next.perspectives.push(...route.products.map((product,index)=>({id:'method-product:'+index,methodId:product.methodId||route.methodId||route.methodIds?.[index],sourceRef:'PPR_CURRENT_SHARED_RUNTIME',product:copy(product),evidenceClass:'METHOD_DERIVED',objectiveFact:false})));
 return {person:next,route};
}
export function projectPersonCustomerSurface(person,options={}){
 const composed=composePersonStructure(person,options),byLane=new Map(composed.map(x=>[x.lane,x.items]));
 return {title:{en:'You now',zh:'现在的你'},sections:PERSONAL_SECTIONS.map(([id,en,zh])=>({id,title:{en,zh},items:id==='overview'?[{id:'identity',statement:person.identity.displayName||null}]:id==='ask'?[{context:{accountId:person.accountId,personId:person.personId},answer:null,persisted:false}]:byLane.get(id)||person[id]||[],empty:(byLane.get(id)||person[id]||[]).length===0})),unknowns:person.unknowns,boundaries:person.boundaries};
}
