import {projectMyRealityWorkspace} from './my-reality-workspace-projection.js';
import {createMyRealityProjection} from '../account/my-reality-account-projection.js';
import {createCurrentEvidence} from '../current-web-authority/current-evidence-ir.js';

// Candidate adapter only. Existing authenticated endpoints and storage remain their owners.
export const WORLD_DOMAINS=Object.freeze(['DEMOGRAPHY','ECONOMY','FINANCIAL_MARKETS','INDUSTRY','TECHNOLOGY','INFRASTRUCTURE','ENERGY','POLICY','INSTITUTIONS','SOCIAL','ENVIRONMENT','EXTERNAL_DEPENDENCY','LABOUR','HOUSING']);
export const REALITY_DOMAINS=Object.freeze(['ME','RELATIONSHIPS','FINANCIAL','CURRENT_REALITY','WORLD_CONTEXT','QUESTIONS','OBSERVATIONS','NAVIGATION','REPORTS','HISTORY']);
export const SOURCE_KINDS=Object.freeze(['CUSTOMER_ENTERED','UPLOADED_DOCUMENT','EXTERNAL_PROVIDER','MARKET_PROVIDER','PROFESSIONAL','METHOD_GENERATED']);
const SOURCE_AUTHORITIES={CUSTOMER_ENTERED:['DECLARED','OBSERVED','UNKNOWN'],UPLOADED_DOCUMENT:['DOCUMENTED','MEASURED','UNKNOWN'],EXTERNAL_PROVIDER:['DOCUMENTED','CURRENT_DATA_CONTEXT','UNKNOWN'],MARKET_PROVIDER:['CURRENT_DATA_CONTEXT','UNKNOWN'],PROFESSIONAL:['PROFESSIONALLY_REVIEWED','UNKNOWN'],METHOD_GENERATED:['METHOD_DERIVED','UNKNOWN']};
const copy=x=>structuredClone(x);
const requireValue=(value,error)=>{if(!value)throw new Error(error);};
const stamp=x=>{requireValue(typeof x==='string'&&Number.isFinite(Date.parse(x)),'TIMESTAMP_REQUIRED');return x;};
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};

export function createWorldEvidenceGateway({knowledge=[],evidence=[],currentEvidence=[]}={}){
  const claims=currentEvidence.map(row=>{
    requireValue(row?.schemaVersion==='PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0','CURRENT_EVIDENCE_IR_REQUIRED');
    requireValue(row.sourceId&&row.sourceVersion&&row.sourceUrl&&row.retrievedAt,'CURRENT_PROVENANCE_REQUIRED');
    requireValue(row.freshnessState,'CURRENT_FRESHNESS_REQUIRED');
    return copy(row);
  });
  return freeze({schemaVersion:'PC-R1-WORLD-GATEWAY-v1',layers:{knowledge:copy(knowledge),evidence:copy(evidence),currentEvidence:claims},consumers:['BOOK_VI','PERSONAL','RELATIONSHIP','FINANCIAL','ASK','MY_REALITY'],ingestionOwner:'CURRENT_WEB_AUTHORITY',createAdmittedEvidence:createCurrentEvidence,knowledgeIsLiveReality:false,networkCalls:0});
}

export function contextualWorldRelevance({claim,domain,product,context={},explicitSelection=false}={}){
  requireValue(WORLD_DOMAINS.includes(domain),'WORLD_DOMAIN_UNKNOWN');
  requireValue(['PERSONAL','RELATIONSHIP','FINANCIAL'].includes(product),'PRODUCT_UNKNOWN');
  requireValue(claim?.schemaVersion==='PHI-OS-CURRENT-EVIDENCE-IR-v1.0.0','CURRENT_EVIDENCE_IR_REQUIRED');
  const selected=explicitSelection===true&&context.confirmed===true;
  const shared=product!=='RELATIONSHIP'||context.sharedReality===true;
  const matching=Array.isArray(context.domains)&&context.domains.includes(domain);
  const state=!selected||!shared?'OPEN':!matching?'NOT_CURRENTLY_RELEVANT':context.observationRefs?.length?'RELEVANT':'POSSIBLY_RELEVANT';
  return freeze({state,product,domain,claimId:claim.claimId,sourceId:claim.sourceId,contextRefs:copy(context.observationRefs||[]),contextualRelevanceOnly:true,personalFindingCreated:false,relationshipFindingCreated:false,investmentAdviceCreated:false,sharedContextRequired:product==='RELATIONSHIP'});
}

export function newRealityCandidateStore({accountId,entities=[]}={}){
  requireValue(accountId,'ACCOUNT_REQUIRED');
  const allowed=['PERSON','RELATIONSHIP','HOUSEHOLD','FINANCIAL_REALITY','REALITY_CASE','REPORT'];
  const ids=new Set();
  for(const entity of entities){requireValue(entity.accountId===accountId,'CROSS_ACCOUNT_ENTITY');requireValue(allowed.includes(entity.kind)&&entity.id&&!ids.has(entity.id),'CANONICAL_ENTITY_INVALID');ids.add(entity.id);}
  for(const entity of entities)for(const ref of entity.participantIds||[])requireValue(ids.has(ref)&&entities.some(x=>x.id===ref&&x.kind==='PERSON'),'PARTICIPANT_NOT_BOUND');
  return freeze({schemaVersion:'PC-R1-REALITY-CANDIDATE-STORE-v1',accountId,entities:copy(entities),records:[],events:[],productionPersistence:false});
}

export function saveSelectedReality(store,{actorAccountId,entityId,sourceProduct,sourceKind,selectedItems=[],action,consent,sourceConsent,at}={}){
  requireValue(actorAccountId===store.accountId,'ACCOUNT_ACCESS_DENIED');
  requireValue(store.entities.some(x=>x.id===entityId),'ENTITY_NOT_BOUND');
  requireValue(['PERSONAL','RELATIONSHIP','FINANCIAL','ASK'].includes(sourceProduct),'SOURCE_PRODUCT_INVALID');
  requireValue(SOURCE_KINDS.includes(sourceKind),'SOURCE_KIND_INVALID');
  requireValue(action==='SAVE_SELECTED'&&consent===true&&sourceConsent?.[sourceKind]===true&&selectedItems.length>0,'EXPLICIT_SELECTION_AND_CONSENT_REQUIRED');
  stamp(at);
  const next=copy(store);
  for(const item of selectedItems){
    requireValue(item.id&&item.statement&&item.authority&&item.sourceRef,'ITEM_PROVENANCE_REQUIRED');
    requireValue(SOURCE_AUTHORITIES[sourceKind].includes(item.authority),'SOURCE_AUTHORITY_PROMOTION_DENIED');
    requireValue(!next.records.some(x=>x.id===item.id),'RECORD_ALREADY_EXISTS');
    if(sourceProduct==='RELATIONSHIP')requireValue(item.permissions?.personA===true&&item.permissions?.personB===true&&item.permissions?.shared===true,'SEPARATE_PARTICIPANT_CONSENT_REQUIRED');
    if(item.jointFinancial===true)requireValue(item.confirmedByA===true,'DECLARING_PARTICIPANT_REQUIRED');
    const record={...copy(item),entityId,sourceProduct,sourceKind,active:true,revision:1,createdAt:at,confirmationState:item.jointFinancial===true&&item.confirmedByB!==true?'DECLARED_BY_A_NOT_CONFIRMED_BY_B':'SOURCE_NATIVE'};
    next.records.push(record);
    const eventType=item.eventType||(sourceProduct==='ASK'?'NEW_OBSERVATION':'FACT_REVISION');
    requireValue(['FACT_REVISION','NEW_OBSERVATION','MARKET_UPDATE','NEW_REPORT','PROFESSIONAL_AMENDMENT','CUSTOMER_CORRECTION'].includes(eventType),'EVENT_TYPE_INVALID');
    next.events.push({eventId:`event-${next.events.length+1}`,recordId:item.id,type:eventType,at,source:item.sourceRef,previousState:null,newState:copy(record),reason:'Explicitly selected and consented by owner'});
  }
  return freeze(next);
}

export function reviewRealityRecord(store,{actorAccountId,recordId,action,statement,reason,at,consent}={}){
  requireValue(actorAccountId===store.accountId,'ACCOUNT_ACCESS_DENIED');
  requireValue(consent===true,'REVIEW_CONSENT_REQUIRED');
  requireValue(['CONFIRM','CORRECT','MARK_OUTDATED','REMOVE_ACTIVE','SUPERSEDE'].includes(action),'REVIEW_ACTION_INVALID');
  requireValue(reason,'REVIEW_REASON_REQUIRED');stamp(at);
  const index=store.records.findIndex(x=>x.id===recordId);requireValue(index>=0,'RECORD_NOT_FOUND');
  if(['CORRECT','SUPERSEDE'].includes(action))requireValue(statement,'REPLACEMENT_REQUIRED');
  const next=copy(store),previous=copy(next.records[index]);
  const revised={...previous,revision:previous.revision+1,reviewedAt:at,reviewAction:action};
  if(statement)revised.statement=statement;
  if(['MARK_OUTDATED','REMOVE_ACTIVE','SUPERSEDE'].includes(action))revised.active=false;
  next.records[index]=revised;
  if(action==='SUPERSEDE')next.records.push({...previous,id:`${recordId}-revision-${revised.revision}`,statement,revision:1,createdAt:at,supersedes:recordId,active:true});
  next.events.push({eventId:`event-${next.events.length+1}`,recordId,type:action==='CORRECT'?'CUSTOMER_CORRECTION':'FACT_REVISION',at,source:previous.sourceRef,previousState:previous,newState:copy(revised),reason});
  return freeze(next);
}

export function projectCanonicalReality(store,{actorAccountId,locale='en',reportedContext=[],worldContext=[],questions=[]}={}){
  requireValue(actorAccountId===store.accountId,'ACCOUNT_ACCESS_DENIED');
  const active=store.records.filter(x=>x.active);
  const reports=active.filter(x=>x.sourceProduct==='REPORT'||x.reportLineage);
  const existing=projectMyRealityWorkspace({locale,reality:{state:active.length?'READY':'EMPTY',currentReality:{reportedContext,importantFacts:active.filter(x=>['DECLARED','DOCUMENTED','MEASURED'].includes(x.authority)),externalEvidence:worldContext,unknown:active.filter(x=>x.authority==='UNKNOWN'),openQuestions:questions}},reports,continuity:{history:store.events}});
  return freeze({schemaVersion:'PC-R1-MY-REALITY-CANDIDATE-v2',title:{en:'Your Reality',zh:'你的现实'},domains:REALITY_DOMAINS,existingWorkspace:existing,accountProjection:createMyRealityProjection({reports}),entities:copy(store.entities),today:active,previous:store.events.map(x=>x.previousState).filter(Boolean),whatChanged:copy(store.events),whatRemainsOpen:questions,whatToObserve:active.filter(x=>x.authority==='UNKNOWN'),worldContext,productionRouteActivated:false,productionPersistence:false});
}

export function resolveAskRealityContext({surface,entityId,store,actorAccountId,selectedRecordIds=[],sources={}}={}){
  requireValue(['PERSONAL','RELATIONSHIP','FINANCIAL','WORLD','MY_REALITY'].includes(surface),'ASK_SURFACE_INVALID');
  requireValue(actorAccountId===store.accountId,'ACCOUNT_ACCESS_DENIED');
  if(entityId)requireValue(store.entities.some(x=>x.id===entityId),'ENTITY_NOT_BOUND');
  const records=store.records.filter(x=>x.active&&selectedRecordIds.includes(x.id)&&(!entityId||x.entityId===entityId));
  const publicKinds=['PUBLISHED_KNOWLEDGE','CURRENT_EVIDENCE','MARKET_EVIDENCE'];
  const stack=['YOUR_DATA','YOUR_OBSERVATIONS','METHOD_PERSPECTIVE','PUBLISHED_KNOWLEDGE','CURRENT_EVIDENCE','MARKET_EVIDENCE','PROFESSIONAL_CONTRIBUTION'].map(kind=>({kind,items:copy((sources[kind]||[]).filter(row=>publicKinds.includes(kind)&&row.public===true&&row.sourceRef||row.accountId===store.accountId&&row.entityId===entityId&&row.consent===true))}));
  return freeze({surface,entityId:entityId||null,selectedContext:copy(records),evidenceStack:stack,contextIsAnswer:false,answer:null,automaticallyPersisted:false,providerCalls:0});
}

export function keepAskObservation({answer,selectedText,selectionConfirmed=false,consent=false,id,sourceRef}={}){
  requireValue(selectionConfirmed===true&&consent===true&&selectedText&&typeof answer==='string'&&answer.includes(selectedText),'KEEP_SELECTION_AND_CONSENT_REQUIRED');
  return freeze({id,statement:selectedText,sourceRef,authority:'DECLARED',role:'OBSERVATION_CANDIDATE',origin:'USER_SELECTED_ASK_TEXT',persisted:false,requiresSaveAction:true,answerIsEstablishedFact:false});
}

export function reportLineage({subject,participants=[],dataSnapshot,marketSnapshot=null,methodVersions=[],knowledgeVersion=null,currentEvidenceVersion=null,generatedAt,reviewedAt=null,releasedAt=null}={}){
  requireValue(subject&&dataSnapshot,'REPORT_SUBJECT_AND_SNAPSHOT_REQUIRED');stamp(generatedAt);if(reviewedAt)stamp(reviewedAt);if(releasedAt)stamp(releasedAt);
  return freeze({subject,participants:copy(participants),dataSnapshot:copy(dataSnapshot),marketSnapshot:copy(marketSnapshot),methodVersions:copy(methodVersions),knowledgeVersion,currentEvidenceVersion,generatedAt,reviewedAt,releasedAt,role:'VERSIONED_SNAPSHOT',livingReality:false});
}

export function currentDataDisclosure(row){requireValue(row?.retrievedAt&&row.sourceId&&row.freshnessState,'CURRENT_DISCLOSURE_REQUIRED');return freeze({asOf:row.publishedAt||null,retrievedAt:row.retrievedAt,provider:row.publisher||row.sourceId,freshness:row.freshnessState,limitations:copy(row.limitations||['Contextual evidence; applicability requires explicit contextual review.']),sourceVersion:row.sourceVersion});}
