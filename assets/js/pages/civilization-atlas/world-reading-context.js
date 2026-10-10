import {buildAtlasAskContext} from './atlas-ask-context.js';
import {atlasUrlFromState,reconfigurationAtlasUrlFromState} from './atlas-url-state.js';
export const local=(v,locale)=>v?.[locale]||v?.en||'';
export const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function activeWorldObject(index,book,state){
 const keys=book==='BOOK-5'?{timeline:state.timeWindowId,cases:state.primaryCaseId,world:state.snapshotId,comparison:state.comparisonFamilyId,trajectories:state.trajectoryIds?.[0],transitions:state.transitionWindowId,loss:state.lossTypeId||state.lossFamilyId}:{cases:state.primaryCaseId,windows:state.windowId,snapshots:state.snapshotId,dossiers:state.dossierId,lived:state.livedRealityDimensionId,positions:state.positionId};
 const id=book==='BOOK-6'&&state.sectionId?state.sectionId:keys[state.activeLayer];return id?index?.rows.find(r=>r.book===book&&r.id===id&&r.type!=='visual')||null:null;
}
export function worldObjectRelations(index,object){return object?(index.relations||[]).filter(r=>r.from===object.id||r.to===object.id):[];}
export function worldAskContext(book,state,data,locale,currentUrl){
 if(book==='BOOK-5')return buildAtlasAskContext(state,data,locale,currentUrl);
 const scope={schemaVersion:'PHI-OS-ATLAS-RETRIEVAL-SCOPE-v2.0.0',scopeType:'CIVILIZATION_RECONFIGURATION_ATLAS',bookCode:book,partCode:'PART-13',activeLayer:state.activeLayer};
 for(const key of ['windowId','snapshotId','dossierId','livedRealityDimensionId','positionId','sectionId'])if(state[key])scope[key]=state[key];
 if(state.primaryCaseId){scope.entityId=state.primaryCaseId;scope.caseIds=[state.primaryCaseId];}
 if(state.compareCaseIds?.length)scope.comparisonIds=state.compareCaseIds;
 const url=reconfigurationAtlasUrlFromState(currentUrl,state);url.searchParams.set('view','reconfiguration');
 return {contextType:'KNOWLEDGE',contextRef:'BOOK:BOOK-6',contextLabel:locale==='zh-Hans'?'世界重组资料':'World reconfiguration sources',contextRoute:url.pathname+url.search+url.hash,readingPath:'BOOK-6 > PART-13 > '+state.activeLayer,relatedKnowledgeRef:'BOOK:BOOK-6',retrievalScope:scope};
}
export function askURL(context){const p=new URLSearchParams();for(const[k,v]of Object.entries(context))if(v)p.set(k,k==='retrievalScope'?JSON.stringify(v):v);return '/knowledge/ask/?'+p;}
export function sameObjectDirection(index,object,layer){
 if(!object)return {state:'BROWSE',candidates:[]};
 const candidates=worldObjectRelations(index,object).map(r=>index.rows.find(x=>x.id===(r.from===object.id?r.to:r.from)&&x.book===object.book&&x.layer===layer&&x.type!=='visual')).filter(Boolean);
 const unique=[...new Map(candidates.map(x=>[x.id,x])).values()];return {state:unique.length===1?'ONE_MAPPING':unique.length?'CHOOSE_MAPPING':'NO_MAPPING',candidates:unique};
}
export function currentProjectionState(value){
 if(!value)return 'NOT_REQUESTED';if(value.currentLoadState==='SERVICE_ERROR')return 'SERVICE_ERROR';if(value.currentLoadState==='NOT_ACTIVATED')return 'NOT_ACTIVATED';
 const p=value.acceptedCurrent;if(!p)return 'NO_EVIDENCE';if(p.externalEvidence?.some(x=>x.currentFreshness==='STALE'))return 'PARTIAL_WITH_DATED_EXTERNAL_EVIDENCE';
 return p.sourceTimestamp?'ACCEPTED_SCOPE_FRESHNESS_UNVERIFIED':'ACCEPTED_SCOPE_DATE_MISSING';
}
export function stableWorldURL(book,state,currentUrl){const u=(book==='BOOK-5'?atlasUrlFromState:reconfigurationAtlasUrlFromState)(currentUrl,state);if(book==='BOOK-6')u.searchParams.set('view','reconfiguration');return u.pathname+u.search+u.hash;}
