import {normalizeVerifiedSymbolicAccountIdentity} from '../symbolic-method-persistence/symbolic-account-identity-v1.js';
import {onRequest as reports} from '../api/account-reports.js';
import {onRequest as methodReports} from '../api/account-method-reports.js';
import {onRequestGet as readings} from '../api/symbolic-method-readings.js';
import {onRequest as financialDrafts} from '../api/account-financial-will-drafts.js';
import {onRequestGet as questions} from '../api/account-report-questions.js';
const readers={reports,methodReports,readings,financialDrafts};
const list=v=>Array.isArray(v)?v:[];
function requestContext(context,path){return {...context,request:new Request(new URL(path,context.request.url),{method:'GET',headers:context.request.headers})};}
async function lane(context,name,reader){
 try{
  const response=await reader(requestContext(context,`/api/my-reality-source?limit=20`)),payload=await response.json();
  if(!response.ok||payload.ok!==true)return {state:response.status===403?'CONSENT_OR_ADMISSION_REQUIRED':'SOURCE_UNAVAILABLE',items:[],code:payload.code||payload.error?.code||null};
  const items=list(payload[name==='readings'?'records':name==='financialDrafts'?'drafts':'reports']).slice(0,20);
  return {state:items.length?'AVAILABLE':'EMPTY',items};
 }catch{return {state:'SOURCE_UNAVAILABLE',items:[]};}
}
// Reuse each source's owner, consent, retention and integrity admission. This
// projection does not save, reconstruct or invent any prior customer history.
export async function collectMyRealitySavedSources(context,{sourceReaders=readers,questionReader=questions}={}){
 const identity=normalizeVerifiedSymbolicAccountIdentity(context.data?.symbolicAccountIdentity);
 if(!identity)return {state:'ACCOUNT_REQUIRED',lanes:{},reports:[],history:[]};
 if(context.env?.PHIOS_MY_REALITY_SAVED_QA_ENABLED!=='true'||!['local','qa','preview'].includes(context.env?.PHIOS_ENVIRONMENT))return {state:'NOT_ADMITTED',lanes:{},reports:[],history:[]};
 const entries=await Promise.all(Object.entries(sourceReaders).map(async([name,reader])=>[name,await lane(context,name,reader)]));
 const lanes=Object.fromEntries(entries),reportItems=[],history=[];
 const event=(id,label,date,sourceClass,version,state,extra={})=>{if(!id||!date)return;history.push({id,label,occurredAt:date,sourceClass,sourceVersion:version??null,state,retained:true,...extra});};
 for(const r of lanes.reports?.items||[]){const label=r.acceptanceFixture?'QA synthetic report':'Released report',sourceClass=r.acceptanceFixture?'SYNTHETIC_QA_REPORT':'PROFESSIONAL_RELEASED_REPORT';reportItems.push({id:r.reportId,title:label,state:r.releaseStatus,sourceClass,sourceVersion:r.reportVersion,href:'/account-my-reality.html#reports'});event(r.reportId,label,r.releasedAt,sourceClass,r.reportVersion,r.releaseStatus);}
 for(const r of lanes.methodReports?.items||[]){
  reportItems.push({id:r.reportId,title:`${r.method} · ${r.subjectName||'Report'}`,state:r.status,sourceClass:'PURCHASED_METHOD_REPORT',sourceVersion:r.version,href:`/api/account-method-reports?reportId=${encodeURIComponent(r.reportId)}`});
  event(r.reportId,`${r.method} report`,r.releasedAt,'PURCHASED_METHOD_REPORT',r.version,r.status);
  const q=await lane(context,'questions',async()=>{
   const response=await questionReader(requestContext(context,`/api/account-report-questions?reportId=${encodeURIComponent(r.reportId)}`));
   const body=await response.json();return Response.json({...body,reports:body.items},{status:response.status});
  });
  lanes[`questions:${r.reportId}`]=q;
  for(const x of q.items)event(x.requestId,x.question,x.createdAt,x.sourceClass,x.sourceVersion,x.historyState,{reportId:r.reportId,question:x.question,answer:x.answer,completedAt:x.completedAt});
 }
 for(const r of lanes.readings?.items||[])event(r.readingId,`${r.methodCode}: ${r.question}`,r.createdAt,'ACCOUNT_EXPLICIT_SAVED_READING',r.schemaVersion||null,r.reviewState,{drawEvidenceRef:r.drawEvidenceId||null,href:`/api/symbolic-method-readings?readingId=${encodeURIComponent(r.readingId)}`});
 for(const r of lanes.financialDrafts?.items||[])event(r.draftId,`${r.draftType} draft`,r.createdAt,'CUSTOMER_CONSENTED_INTAKE_DRAFT',r.version,'SAVED_CURRENT_VERSION',{expiresAt:r.expiresAt,priorDigest:r.priorDigest||null});
 history.sort((a,b)=>String(b.occurredAt).localeCompare(String(a.occurredAt))||String(a.id).localeCompare(String(b.id)));
 return {state:'OWNER_SCOPED_SOURCE_PROJECTION',lanes:Object.fromEntries(Object.entries(lanes).map(([name,v])=>[name,{state:v.state,count:v.items.length}])),reports:reportItems,history,governance:{writesPerformed:false,providerCalls:0,membershipRequiredForHistory:false,missingHistoryReconstructed:false,currentRealityPersistence:'EXISTING_BRIEF_OWNER_INTEGRATION_PENDING'}};
}
