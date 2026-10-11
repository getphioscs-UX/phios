import {personIdentity} from '../account/canonical-person-store.js';
import {openOwnedMethodReport} from '../account/method-report-delivery.js';
import {onRequestGet as symbolicReadingApi} from '../api/symbolic-method-readings.js';
import {draftApi} from '../account/financial-will-draft-store.js';
import {appointmentRequestApi} from '../professional/appointments/appointment-request-store.js';
import {navigationPublicCatalog} from '../academy/navigation-public-catalog.js';
import {resolveSelectedArticle} from '../contextual-ask/contextual-ask-runtime.js';
import {acceptedNavigationForCustomer} from './accepted-navigation-customer.js';
import {projectRealityForCustomer} from './reality-customer-projection.js';
import {saveContextRecord,loadContextRecord} from '../report-context/report-context-store.js';
import {digest,requireSameOrigin} from '../account/oidc-auth.js';

export const CANONICAL_CUSTOMER_NAVIGATION_HANDOFF_V1='CANONICAL_CUSTOMER_NAVIGATION_HANDOFF_V1';
const fail=(code,status=422)=>{throw Object.assign(Error(code),{code,status});};
const list=v=>Array.isArray(v)?v:[];
const text=(v,max=1200)=>typeof v==='string'?v.trim().slice(0,max):'';
const publicFamilies=new Set(['BOOKS','ACADEMY']);
const types={BAZI:'REPORT',TAROT:'READING',ACADEMY:'LESSON',FINANCIAL:'FINANCIAL_DRAFT',APPOINTMENT:'APPOINTMENT_REQUEST',BOOKS:'ARTICLE'};
const only=(value,keys)=>{if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!keys.includes(k)))fail('NAVIGATION_INPUT_INVALID',400);};
const safeHref=v=>typeof v==='string'&&v.startsWith('/')&&!v.startsWith('//')&&!/[<>"\s]/.test(v)?v:null;
function identity(context){try{return personIdentity(context);}catch{return null;}}
function enabled(context){if(context.env?.PHIOS_CANONICAL_NAVIGATION_HANDOFF_ENABLED!=='true')fail('NAVIGATION_HANDOFF_NOT_ADMITTED',503);}
async function readApi(api,context,path){const response=await api({...context,request:new Request(new URL(path,context.request.url),{headers:context.request.headers})});const body=await response.json();if(!response.ok||!body.ok)fail(body.code||body.error?.code||'NAVIGATION_SOURCE_UNAVAILABLE',response.status);return body;}
export const navigationSourceOwners={
 BOOKS:async(c,b)=>{const a=await resolveSelectedArticle(c.env,b.objectId,b.locale);if(!a)fail('NAVIGATION_SOURCE_UNAVAILABLE',404);return {objectType:'ARTICLE',sourceVersion:a.sourceVersion,sourceClass:'PUBLIC_KNOWLEDGE',sourceRef:'ARTICLE:'+a.slug,title:a.title,href:a.href,interpretiveRefs:a.sources.map(s=>s.sourceId),related:list(a.atlasLinks).map(r=>({href:r.href,label:r.label})),public:true};},
 ACADEMY:async(c,b)=>{const catalog=navigationPublicCatalog(JSON.parse(c.env.PHIOS_NAVIGATION_PUBLIC_VIDEO_MANIFEST||'{}'));const lesson=catalog.items.find(r=>r.videoId===b.objectId||r.moduleId===b.objectId);if(!lesson)fail('NAVIGATION_SOURCE_UNAVAILABLE',404);return {objectType:'LESSON',sourceVersion:lesson.teachingProjectionVersion,sourceClass:'PUBLIC_TEACHING_PROJECTION',sourceRef:lesson.videoId,title:lesson.title[b.locale==='zh-Hans'?'zh':'en'],href:'/academy/#navigation',public:true,videoState:lesson.status,interpretiveRefs:lesson.doctrineSources.map(r=>r.moduleId),related:lesson.bookFoundationRefs.map(href=>({href,label:'Canonical foundation'}))};},
 BAZI:async(c,b)=>{const {artifact}=await openOwnedMethodReport(c,b.objectId);if(!artifact||artifact.methodCode!=='BZR')fail('NAVIGATION_SOURCE_UNAVAILABLE',404);return {objectType:'REPORT',sourceVersion:artifact.artifactDigest,sourceClass:'REPORT_INTERPRETATION',sourceRef:artifact.reportArtifactId,ownerId:artifact.customerId,personId:artifact.personId,title:'BaZi · '+artifact.reportContentVersion,href:'/api/account-method-reports?reportId='+encodeURIComponent(b.objectId),interpretiveRefs:artifact.generatedSections.map(s=>artifact.reportArtifactId+'#'+s.sectionId),public:false};},
 TAROT:async(c,b)=>{const {record:r}=await readApi(symbolicReadingApi,c,'/api/symbolic-method-readings?readingId='+encodeURIComponent(b.objectId));if(!r||r.methodCode!=='TAROT')fail('NAVIGATION_SOURCE_UNAVAILABLE',404);const reading=r.reading;if(!reading?.drawEvidence)fail('NAVIGATION_FIXED_DRAW_REQUIRED');return {objectType:'READING',sourceVersion:await digest(JSON.stringify(reading)),sourceClass:'SYMBOLIC_READING',sourceRef:r.readingId,ownerId:personIdentity(c).userId,title:r.question,question:r.question,href:'/api/symbolic-method-readings?readingId='+encodeURIComponent(r.readingId),fixedDraw:reading.drawEvidence,interpretiveRefs:[reading.drawEvidence.drawEvidenceId].filter(Boolean),public:false};},
 FINANCIAL:async(c,b)=>{const r=await readApi(draftApi,c,'/api/account-financial-will-drafts?id='+encodeURIComponent(b.objectId));if(r.draftType!=='FINANCIAL')fail('NAVIGATION_SOURCE_UNAVAILABLE',404);return {objectType:'FINANCIAL_DRAFT',sourceVersion:r.digest,sourceClass:'CUSTOMER_CONSENTED_INTAKE_DRAFT',sourceRef:r.draftId,ownerId:personIdentity(c).userId,title:'Financial · '+r.version,href:'/professional/financial/',financialObject:{draftId:r.draftId,version:r.version},public:false};},
 APPOINTMENT:async(c,b)=>{const {request:r}=await readApi(appointmentRequestApi,c,'/api/account-appointment-requests?id='+encodeURIComponent(b.objectId));return {objectType:'APPOINTMENT_REQUEST',sourceVersion:r.inputDigest,sourceClass:'CUSTOMER_SERVICE_REQUEST',sourceRef:r.appointmentRequestId,ownerId:r.customerId,title:r.serviceType,href:'/professional/appointments/',appointmentState:r.status,serviceIntent:r.serviceType,public:false};}
};
export async function produceCustomerNavigationSnapshot(context,input,{sourceReaders=navigationSourceOwners}={}){
 enabled(context);only(input,['productFamily','objectType','objectId','sourceVersion','locale','currentRealityConsent','currentReality','action','recordId','retentionDays']);
 const family=input.productFamily;if(!types[family]||typeof input.objectId!=='string'||!input.objectId||input.objectId.length>150||input.objectType&&input.objectType!==types[family])fail('NAVIGATION_SOURCE_SELECTION_INVALID',400);
 const who=identity(context);if(!publicFamilies.has(family)&&!who)fail('ACCOUNT_REQUIRED',401);
 const consent=input.currentRealityConsent||{};only(consent,['processing','persistence','retention']);
 if((!publicFamilies.has(family)||input.currentReality)&&consent.processing!==true)fail('NAVIGATION_PROCESSING_CONSENT_REQUIRED',403);
 const locale=input.locale==='zh-Hans'?'zh-Hans':'en',source=await sourceReaders[family](context,{...input,locale});
 if(!source?.sourceVersion||!source?.sourceRef||source.objectType!==types[family])fail('NAVIGATION_SOURCE_UNAVAILABLE',404);
 if(!source.public&&source.ownerId!==who?.userId)fail('NAVIGATION_SOURCE_UNAVAILABLE',404);
 if(input.sourceVersion&&input.sourceVersion!==source.sourceVersion)fail('NAVIGATION_SOURCE_VERSION_CHANGED',409);
 if(input.currentReality)only(input.currentReality,['observation','question']);
 return {schemaVersion:'CANONICAL_CUSTOMER_CURRENT_SNAPSHOT_V1',ownerAccountId:who?.userId||null,personId:source.personId||null,sourceIdentity:source.sourceRef,sourceVersion:source.sourceVersion,objectScope:{objectType:types[family],objectId:input.objectId,productFamily:family},locale,consent:{processing:consent.processing===true,persistence:consent.persistence===true,retention:consent.retention===true},source,reportedContext:consent.processing===true&&input.currentReality?{sourceClass:'USER_REPORTED',objectiveFact:false,observation:text(input.currentReality.observation),question:text(input.currentReality.question)}:null,historyState:'NOT_SUPPLIED',history:[]};
}
export function projectCanonicalNavigationHandoff(context,snapshot){
 const {source}=snapshot,existing=acceptedNavigationForCustomer(context,{reality:projectRealityForCustomer(context.data?.cxRealitySources||{}),locale:snapshot.locale});
 // Reuse the accepted evaluator; neither a saved source nor interpretation
 // creates a decision, direction, position, relationship or history edge.
 const handoffTargets=[{kind:'SOURCE',href:safeHref(source.href),label:source.title},{kind:'MY_REALITY',href:'/reality/',label:'My Reality'},...list(source.related).map(r=>({kind:'RELATED_ACCEPTED_MAPPING',href:safeHref(r.href),label:text(r.label,160)}))].filter(r=>r.href);
 if(source.public&&snapshot.objectScope.productFamily==='BOOKS')handoffTargets.push({kind:'ASK',href:'/knowledge/ask/?contextType=KNOWLEDGE&contextRef='+encodeURIComponent(source.sourceRef),label:'Ask with this source'});
 return {schemaVersion:CANONICAL_CUSTOMER_NAVIGATION_HANDOFF_V1,navigationState:existing.acceptedEvaluation.applicable?'PARTIAL':'NOT_ESTABLISHED',sourceIdentity:snapshot.sourceIdentity,sourceVersion:snapshot.sourceVersion,customerScope:snapshot.ownerAccountId?'SAME_ACCOUNT':'PUBLIC_ANONYMOUS',objectScope:snapshot.objectScope,locale:snapshot.locale,evidenceState:snapshot.reportedContext?'PARTIAL':'UNKNOWN',directionState:'NOT_ESTABLISHED',direction:null,positionState:'NOT_ESTABLISHED',position:null,relationsState:'NOT_ESTABLISHED',relations:[],historyState:'NOT_SUPPLIED',history:[],persistenceState:'NOT_ESTABLISHED',snapshot,acceptedNavigation:{applicable:existing.acceptedEvaluation.applicable,acceptedThrough:'NAV-30',modules:existing.acceptedEvaluation.modules.map(r=>({moduleId:r.moduleId,state:r.state}))},handoffTargets,limitations:['SOURCE_CONTEXT_IS_NOT_A_PERSONAL_OR_EXTERNAL_FACT','NO_DIRECTION_POSITION_OR_CAUSAL_EDGES_INFERRED','NO_HISTORY_BACKFILL','NO_PAID_EXECUTION_AUTHORIZATION',...(source.videoState&&source.videoState!=='AVAILABLE'?['VIDEO_ASSET_NOT_AVAILABLE']:[])],providerCalls:0};
}
export async function createCanonicalNavigationHandoff(context,input,options){return projectCanonicalNavigationHandoff(context,await produceCustomerNavigationSnapshot(context,input,options));}
export async function saveCanonicalNavigationHandoff(context,input,options){
 requireSameOrigin(context.request);const who=personIdentity(context),handoff=await createCanonicalNavigationHandoff(context,input,options);
 if(!handoff.snapshot.consent.processing||!handoff.snapshot.consent.persistence||!handoff.snapshot.consent.retention||![7,30,90,365].includes(input.retentionDays))fail('NAVIGATION_SAVE_CONSENT_RETENTION_REQUIRED',403);
 const savedAt=new Date().toISOString(),expiresAt=new Date(Date.now()+input.retentionDays*86400000).toISOString();
 const payload={schemaVersion:CANONICAL_CUSTOMER_NAVIGATION_HANDOFF_V1,ownerAccountId:who.userId,personId:handoff.snapshot.personId,selection:{productFamily:input.productFamily,objectId:input.objectId,sourceVersion:handoff.sourceVersion,locale:handoff.locale},handoff,savedAt,expiresAt};
 const recordId=await saveContextRecord(context,'NAVIGATION',payload);return savedProjection(handoff,recordId,savedAt,expiresAt);
}
export async function reopenCanonicalNavigationHandoff(context,recordId,options){
 enabled(context);const record=await loadContextRecord(context,recordId,'NAVIGATION');if(record.schemaVersion!==CANONICAL_CUSTOMER_NAVIGATION_HANDOFF_V1||Date.parse(record.expiresAt)<=Date.now())fail('NAVIGATION_RECORD_EXPIRED',410);
 const handoff=await createCanonicalNavigationHandoff(context,{...record.selection,currentRealityConsent:record.handoff.snapshot.consent,currentReality:record.handoff.snapshot.reportedContext?{observation:record.handoff.snapshot.reportedContext.observation,question:record.handoff.snapshot.reportedContext.question}:undefined},options);
 return savedProjection(handoff,recordId,record.savedAt,record.expiresAt);
}
function savedProjection(handoff,recordId,savedAt,expiresAt){return {...handoff,recordId,persistenceState:'ESTABLISHED',savedAt,expiresAt,historyState:'NOT_SUPPLIED',handoffTargets:[...handoff.handoffTargets.filter(t=>t.kind!=='ASK'),{kind:'ASK',href:'/knowledge/ask/?navigationRecordId='+encodeURIComponent(recordId),label:'Ask with this saved context'}]};}
export async function listCanonicalNavigationHandoffs(context){
 enabled(context);const who=personIdentity(context),rows=(await context.env.RUNTIME_DB.prepare("SELECT record_id,created_at FROM report_context_records WHERE owner_account_id=? AND record_kind='NAVIGATION' ORDER BY created_at DESC LIMIT 20").bind(who.userId).all()).results||[];
 const items=[],unavailable=[];for(const row of rows){try{items.push(await reopenCanonicalNavigationHandoff(context,row.record_id));}catch(error){unavailable.push({recordId:row.record_id,state:error.status===409?'BLOCKED_SOURCE':'BLOCKED_AUTH'});}}return {items,unavailable,providerCalls:0};
}
