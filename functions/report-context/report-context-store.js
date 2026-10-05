import {personIdentity,loadCanonicalPersonSubject} from '../account/canonical-person-store.js';
import {admitPersonUse} from '../account/person-use-policy.js';
import {requireZiweiEntitlement,ZIWEI_PRODUCT} from '../report-delivery/ziwei-production-generation-v1.js';
import {requireSameOrigin,digest} from '../account/oidc-auth.js';
import {guidedRealityQuestions,summarizeGuidedReality,methodRealityProbes} from '../current-reality/personal-current-reality-runtime.js';
import {createReportContextIntent,createReportRealityBrief,assertReportRealityBrief,fail} from './report-context-admission.js';
const enc=new TextEncoder(),dec=new TextDecoder();
const b64=b=>btoa(String.fromCharCode(...b)),unb64=b=>Uint8Array.from(atob(b),c=>c.charCodeAt(0));
const only=(body,keys)=>{if(!body||Object.keys(body).some(k=>!keys.includes(k)))fail('REPORT_CONTEXT_REQUEST_INVALID');};
async function encryptionKey(env){const raw=env.REPORT_CONTEXT_ENCRYPTION_KEY;if(typeof raw!=='string'||!/^[a-f0-9]{64}$/i.test(raw))fail('REPORT_CONTEXT_STORAGE_UNAVAILABLE',503);return crypto.subtle.importKey('raw',Uint8Array.from(raw.match(/../g),x=>parseInt(x,16)),{name:'AES-GCM'},false,['encrypt','decrypt']);}
const aad=(owner,person,id)=>enc.encode(JSON.stringify(['REPORT_CONTEXT_R1',owner,person,id]));
export async function saveContextRecord(context,kind,payload){
 const owner=personIdentity(context).userId;if(payload.ownerAccountId!==owner)fail('REALITY_BRIEF_OWNER_MISMATCH',403);
 const id=kind==='BRIEF'?payload.realityBriefId:kind==='INTENT'?payload.contextIntentId:crypto.randomUUID(),iv=crypto.getRandomValues(new Uint8Array(12)),raw=JSON.stringify(payload),key='private-report-context/'+id+'.json';
 const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(owner,payload.personId,id)},await encryptionKey(context.env),enc.encode(raw));
 await context.env.PRIVATE_REPORTS.put(key,JSON.stringify({iv:b64(iv),ciphertext:b64(new Uint8Array(ciphertext))}),{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
 await context.env.RUNTIME_DB.prepare('INSERT INTO report_context_records(record_id,owner_account_id,person_id,record_kind,object_key,payload_digest,created_at) VALUES(?,?,?,?,?,?,?)').bind(id,owner,payload.personId,kind,key,await digest(raw),new Date().toISOString()).run();return id;
}
export async function loadContextRecord(context,id,kind){
 const owner=personIdentity(context).userId,row=await context.env.RUNTIME_DB.prepare('SELECT * FROM report_context_records WHERE owner_account_id=? AND record_id=? AND record_kind=?').bind(owner,id,kind).first();if(!row)fail('REPORT_CONTEXT_UNAVAILABLE',404);
 const obj=await context.env.PRIVATE_REPORTS.get(row.object_key);if(!obj)fail('REPORT_CONTEXT_UNAVAILABLE',404);let raw;
 try{const cipher=JSON.parse(await obj.text());raw=dec.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(cipher.iv),additionalData:aad(owner,row.person_id,id)},await encryptionKey(context.env),unb64(cipher.ciphertext)));}catch(e){if(e.status===503)throw e;fail('REPORT_CONTEXT_INTEGRITY_FAILED',409);}
 const payload=JSON.parse(raw);if(await digest(raw)!==row.payload_digest||payload.ownerAccountId!==owner||payload.personId!==row.person_id)fail('REPORT_CONTEXT_INTEGRITY_FAILED',409);return payload;
}
async function access(context,personId,locale){const owner=personIdentity(context).userId;await requireZiweiEntitlement(context,locale);const record=await loadCanonicalPersonSubject(context.env,owner,personId);admitPersonUse({userId:owner,person:record.person,consent:record.reportConsent,purpose:'REPORT'});return owner;}
export async function processAccountReportContext(context,body){
 requireSameOrigin(context.request);personIdentity(context);
 if(!['local','qa','preview'].includes(context.env.PHIOS_ENVIRONMENT))fail('CONTEXTUAL_REPORT_AUTHORITY_UNAVAILABLE',403);
 if(body.action==='REPORT_CONTEXT_ELIGIBLE'){only(body,['action','locale']);await requireZiweiEntitlement(context,body.locale);return {eligible:true};}
 if(body.action==='REPORT_CONTEXT_READ'){only(body,['action','recordId']);const intent=await loadContextRecord(context,body.recordId,'INTENT');await access(context,intent.personId,intent.locale);return {intent};}
 if(body.action==='REPORT_CONTEXT_START'){
  only(body,['action','personId','locale','reportMode','primaryQuestion','requestedDomains','sourceChannel']);
  const owner=await access(context,body.personId,body.locale),intent=createReportContextIntent({...body,ownerAccountId:owner,reportProductId:ZIWEI_PRODUCT,methodId:'ZWR'});
  const recordId=await saveContextRecord(context,'INTENT',{...intent,locale:body.locale});return {recordId,questions:guidedRealityQuestions('QUICK',body.locale),probes:methodRealityProbes('ZWR',body.locale)};
 }
 if(body.action==='REPORT_CONTEXT_SUMMARIZE'){
  only(body,['action','recordId','answers','domain','sectionId','explicitOptIn','sensitiveConsent','comparisonState']);
  const intent=await loadContextRecord(context,body.recordId,'INTENT');await access(context,intent.personId,intent.locale);
  if(body.explicitOptIn!==true)fail('CONTEXTUAL_REALITY_OPT_IN_REQUIRED',403);
  const summary=summarizeGuidedReality({mode:'QUICK',answers:body.answers,locale:intent.locale});
  const recordId=await saveContextRecord(context,'SUMMARY',{ownerAccountId:intent.ownerAccountId,personId:intent.personId,intent,summary,answers:body.answers,domain:body.domain,sectionId:body.sectionId,explicitOptIn:body.explicitOptIn,sensitiveConsent:body.sensitiveConsent===true,comparisonState:body.comparisonState||'OPEN'});
  return {recordId,summary,confirmedSummary:JSON.stringify(summary.items),sensitiveExcluded:['HEALTH','TRAUMA','FINANCIAL','RELATIONSHIP_SENSITIVE'].includes(body.domain)&&body.sensitiveConsent!==true};
 }
 if(body.action==='REPORT_CONTEXT_CONFIRM'){
  only(body,['action','recordId','confirmation','confirmedSummary']);const record=await loadContextRecord(context,body.recordId,'SUMMARY');await access(context,record.personId,record.intent.locale);
  const brief=await createReportRealityBrief({...record,locale:record.intent.locale,confirmation:body.confirmation,confirmedSummary:body.confirmedSummary});
  const recordId=await saveContextRecord(context,'BRIEF',brief);return {realityBriefId:recordId,summary:brief.observations.map(o=>o.statement),source:'CUSTOMER',verifiedIndependently:false,automaticPersistence:false};
 }
 fail('REPORT_CONTEXT_ACTION_INVALID');
}
export async function consumeOwnedRealityBrief(context,id,personId,locale){
 await access(context,personId,locale);
 const owner=personIdentity(context).userId,brief=await loadContextRecord(context,id,'BRIEF');await assertReportRealityBrief(brief,{ownerAccountId:owner,personId,reportProductId:ZIWEI_PRODUCT,methodId:'ZWR'});
 try{await context.env.RUNTIME_DB.prepare('INSERT INTO report_context_uses(brief_id,owner_account_id,person_id,claimed_at) VALUES(?,?,?,?)').bind(id,owner,personId,new Date().toISOString()).run();}catch{fail('REALITY_BRIEF_NEW_CONFIRMATION_REQUIRED',409);}return brief;
}
