import {newRealityCandidateStore,saveSelectedReality,reviewRealityRecord,resolveAskRealityContext} from './pc-r1-reality-successor.js';
const copy=x=>structuredClone(x),allowed=['DECLARED','OBSERVED','MEASURED','DOCUMENTED','METHOD_DERIVED','CURRENT_DATA_CONTEXT','PROFESSIONALLY_REVIEWED','UNKNOWN'];
export function newReviewSession({accountId,entityId,kind='PERSON',participantIds=[]}){
 const entities=[...participantIds.map(id=>({id,kind:'PERSON',accountId})),{id:entityId,kind,accountId,...(participantIds.length?{participantIds}:{})}];
 return newRealityCandidateStore({accountId,entities});
}
export function prepareReviewQuestion({accountId,entityId,question,selectedIds=[],evidence=[],allowEmptyContext=false}){
 if(!accountId||!entityId||typeof question!=='string'||!question.trim()||question.length>2000)throw Error('QUESTION_REQUIRED');
 if((!selectedIds.length&&!allowEmptyContext)||new Set(selectedIds).size!==selectedIds.length)throw Error('EXPLICIT_CONTEXT_SELECTION_REQUIRED');
 const selected=selectedIds.map(id=>{const row=evidence.find(x=>x.id===id);if(!row||row.entityId!==entityId||row.accountId!==accountId||!allowed.includes(row.authority)||!row.sourceRef)throw Error('CONTEXT_SOURCE_OR_SUBJECT_INVALID');return copy(row);});
 const base=newReviewSession({accountId,entityId});
 const context=resolveAskRealityContext({surface:'MY_REALITY',entityId,store:{...base,records:selected.map(x=>({...x,active:true}))},actorAccountId:accountId,selectedRecordIds:selectedIds});
 return {question:question.trim(),selectedContext:context.selectedContext,answer:null,providerCalls:0,automaticallyPersisted:false,role:'LOCAL_QUESTION_CONTEXT_ONLY'};
}
export function saveReviewSelection(store,{entityId,selectedIds,evidence,consent,sourceConsent,participantConsent,at}){
 const items=selectedIds.map(id=>{const item=evidence.find(x=>x.id===id);if(!item)throw Error('SELECTION_NOT_FOUND');return item;});
 if(!items.length)throw Error('SELECTION_REQUIRED');
 let next=store;
 for(const item of items){const sourceKind=({METHOD_DERIVED:'METHOD_GENERATED',CURRENT_DATA_CONTEXT:'EXTERNAL_PROVIDER',PROFESSIONALLY_REVIEWED:'PROFESSIONAL',DOCUMENTED:'UPLOADED_DOCUMENT',MEASURED:'UPLOADED_DOCUMENT',OBSERVED:'CUSTOMER_ENTERED',UNKNOWN:'CUSTOMER_ENTERED',DECLARED:'CUSTOMER_ENTERED'})[item.authority];
  const entity=store.entities.find(x=>x.id===entityId);
  next=saveSelectedReality(next,{actorAccountId:store.accountId,entityId,sourceProduct:entity.kind==='RELATIONSHIP'?'RELATIONSHIP':'PERSONAL',sourceKind,action:'SAVE_SELECTED',consent,sourceConsent:{[sourceKind]:sourceConsent===true},at,selectedItems:[{...copy(item),...(entity.kind==='RELATIONSHIP'?{permissions:participantConsent}:{})}]});
 }
 return next;
}
export function correctReviewSelection(store,{entityId,recordId,action,statement,consent,reason,at}){
 return reviewRealityRecord(store,{actorAccountId:store.accountId,entityId,recordId,action,statement,consent,reason,at});
}
