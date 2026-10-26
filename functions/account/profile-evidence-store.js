import {prepareLocalPrivatePdf,deliverLocalPrivatePdf,LOCAL_PDF_TYPE} from './local-private-pdf-artifact.js';
const localPdfPreparations=new WeakSet();
import {renderDossierR12,DOSSIER_R12} from '../profile/personal-evidence-dossier-r12.js';
import {dossierEligibility} from '../profile/personal-evidence-membership.js';
import {onRequestPost as produceProfile} from '../api/profile-progressive.js';
import {normalizeVerifiedSymbolicAccountIdentity} from '../symbolic-method-persistence/symbolic-account-identity-v1.js';
import {requireSameOrigin} from './oidc-auth.js';
import {encryptSensitive,decryptSensitive,sha256Hex} from '../commerce/commerce-crypto.js';
import {normalizeExperience,describeExperience,compareExperiences,projectExperienceHandoff,evidenceError} from '../profile/personal-evidence-records.js';
import {assembleExperienceDossier} from '../profile/personal-evidence-report-adapter.js';
import {receiveSelectedPersonalEvidence,receiverConsentOwner,personalEvidenceReceiverChoices} from '../profile/personal-evidence-receivers.js';
import {compareAssessmentVersions} from '../profile/personal-evidence-records.js';
const TYPE='PROFILE_PERSONAL_EVIDENCE_OBJECT',SCHEMA='PHIOS-ACCOUNT-PROFILE-EVIDENCE-v1';
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
const fail=(code,status=400)=>Object.assign(new Error(code),{code,status});
export async function profileEvidenceApi(context){
 try{
  const identity=normalizeVerifiedSymbolicAccountIdentity(context.data?.symbolicAccountIdentity);if(!identity)throw fail('ACCOUNT_REQUIRED',401);
  const db=context.env?.RUNTIME_DB,key=context.env?.PROFILE_EVIDENCE_ENCRYPTION_KEY;
  if(!db?.prepare||typeof key!=='string'||key.length<32)throw fail('PROFILE_ACCOUNT_STORAGE_NOT_CONFIGURED',503);
  const userId=identity.userId,url=new URL(context.request.url);
  // Compatible local candidate in this canonical account owner. No production activation.
  if(url.searchParams.get('lane')==='experiences')return await experienceLane(context,{db,key,userId,url,readAssessment:read});
  async function read(id){
   const row=await db.prepare('SELECT a.payload FROM runtime_artifacts a JOIN runtimes r ON r.runtime_id=a.runtime_id WHERE a.artifact_id=? AND a.artifact_type=? AND r.user_id=? AND r.status=?').bind(id,TYPE,userId,'active').first();
   if(!row)throw fail('PROFILE_OBJECT_NOT_FOUND',404);
   const envelope=JSON.parse(row.payload),saved=JSON.parse(await decryptSensitive(envelope.ciphertext,key));
   if(saved.customerId!==userId||saved.objectId!==id||saved.schemaVersion!==SCHEMA||await sha256Hex(JSON.stringify(saved))!==envelope.digest)throw fail('PROFILE_OBJECT_INTEGRITY_FAILED',409);
   if(Date.parse(saved.expiresAt)<=Date.now())throw fail('PROFILE_OBJECT_EXPIRED',410);return saved;
  }
  if(context.request.method==='GET'){
   const id=url.searchParams.get('id');if(id){const saved=await read(id);return reply({...saved.result,accountObject:{objectId:id,version:1,expiresAt:saved.expiresAt,reportState:'APPROVED_UNRELEASED',paidEntitlementGranted:false}});}
   const rows=await db.prepare('SELECT a.artifact_id FROM runtime_artifacts a JOIN runtimes r ON r.runtime_id=a.runtime_id WHERE a.artifact_type=? AND r.user_id=? AND r.status=? ORDER BY a.created_at DESC LIMIT 50').bind(TYPE,userId,'active').all();
   const objects=[];for(const row of rows.results||[]){try{const s=await read(row.artifact_id);objects.push({objectId:s.objectId,createdAt:s.createdAt,expiresAt:s.expiresAt,mode:s.result.mode,profileViewId:s.result.view.profileViewId,reportState:'APPROVED_UNRELEASED'});}catch(e){if(e.code!=='PROFILE_OBJECT_EXPIRED')throw e;}}return reply({ok:true,objects});
  }
  if(context.request.method!=='POST')return reply({ok:false,code:'METHOD_NOT_ALLOWED'},405);
  requireSameOrigin(context.request);const raw=await context.request.text();if(new TextEncoder().encode(raw).length>200000)throw fail('PROFILE_INPUT_TOO_LARGE',413);
  const body=JSON.parse(raw);if(body.saveConsent!==true||body.retentionConsent!==true||body.consent!==true)throw fail('PROFILE_ACCOUNT_EXPLICIT_CONSENT_REQUIRED',403);
  // The existing external O*NET workflow remains separate; saving must not start it again.
  const mode=String(body.mode||'').toUpperCase();
  if(!['QUICK_PROFILE','FULL_SELF_ASSESSMENT','REASONING_TASKS','IMPORT_EXTERNAL_RESULT','BIG_FIVE','FINANCIAL_CAPABILITY'].includes(mode))throw fail('PROFILE_EXTERNAL_SAVE_NOT_ADMITTED',409);
  const expiresAt=new Date(body.expiresAt);if(!Number.isFinite(+expiresAt)||+expiresAt<=Date.now()||+expiresAt>Date.now()+366*86400000)throw fail('PROFILE_RETENTION_INVALID');
  if(!/^[0-9a-f-]{36}$/i.test(body.requestToken||''))throw fail('PROFILE_REQUEST_TOKEN_REQUIRED');
  const id='PRF-'+await sha256Hex(JSON.stringify([SCHEMA,userId,body.requestToken]));
  const native={...body,mode,participantRef:userId};delete native.saveConsent;delete native.retentionConsent;delete native.expiresAt;delete native.requestToken;
  const inputDigest=await sha256Hex(JSON.stringify(native));
  try{const prior=await read(id);if(prior.inputDigest!==inputDigest)throw fail('PROFILE_IDEMPOTENCY_CONFLICT',409);return reply({...prior.result,accountObject:{objectId:id,version:1,expiresAt:prior.expiresAt,reportState:'APPROVED_UNRELEASED',paidEntitlementGranted:false,reused:true}});}catch(e){if(e.code!=='PROFILE_OBJECT_NOT_FOUND')throw e;}
  const resultResponse=await produceProfile({...context,request:new Request(context.request.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(native)})});if(!resultResponse.ok)return resultResponse;
  const result=await resultResponse.json();if(result.view?.participantRef!==userId||result.dossierReport?.canonicalState!=='APPROVED_UNRELEASED')throw fail('PROFILE_ACCEPTED_PRODUCER_LINEAGE_REQUIRED',409);
  const now=new Date().toISOString(),runtimeId=crypto.randomUUID(),saved={schemaVersion:SCHEMA,objectId:id,customerId:userId,createdAt:now,expiresAt:expiresAt.toISOString(),inputDigest,consent:{save:true,retention:true,recordedAt:now},result};
  const payload=JSON.stringify({ciphertext:await encryptSensitive(JSON.stringify(saved),key),digest:await sha256Hex(JSON.stringify(saved))});
  await db.batch([
   db.prepare("INSERT INTO runtime_users(user_id,status,created_at,updated_at) VALUES(?,'active',?,?) ON CONFLICT(user_id) DO NOTHING").bind(userId,now,now),
   db.prepare("INSERT INTO runtimes(runtime_id,user_id,status,current_stage,schema_version,state,created_at,updated_at) VALUES(?,?,'active','profile_evidence',?,'{}',?,?)").bind(runtimeId,userId,SCHEMA,now,now),
   db.prepare('INSERT INTO runtime_artifacts(artifact_id,runtime_id,artifact_type,stage,payload,schema_version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,runtimeId,TYPE,'APPROVED_UNRELEASED',payload,SCHEMA,now,now)
  ]);
  return reply({...result,accountObject:{objectId:id,version:1,expiresAt:saved.expiresAt,reportState:'APPROVED_UNRELEASED',paidEntitlementGranted:false,reused:false}},201);
 }catch(e){return reply({ok:false,code:e.code||'PROFILE_ACCOUNT_REQUEST_INVALID'},e.status||400);}
}

const EXPERIENCE_TYPE='PROFILE_EXPERIENCE_REVISION_V1';
async function purgeExpiredProfileEvidence({db,key,userId,now}){
 const rows=(await db.prepare('SELECT r.runtime_id,a.artifact_type,a.payload FROM runtimes r JOIN runtime_artifacts a ON a.runtime_id=r.runtime_id WHERE r.user_id=? AND r.current_stage=?').bind(userId,'profile_evidence').all()).results||[];
 const groups=new Map();for(const row of rows){if(!groups.has(row.runtime_id))groups.set(row.runtime_id,[]);groups.get(row.runtime_id).push(row);}
 let removedRuntimes=0,removedArtifacts=0,quarantined=0;
 for(const [id,items]of groups){
  if(items.some(x=>![TYPE,EXPERIENCE_TYPE,'PROFILE_EXPERIENCE_DOSSIER_V1','PROFILE_RECEIVER_CONSENT_V1',LOCAL_PDF_TYPE].includes(x.artifact_type))){quarantined++;continue;}
  for(const row of items.filter(x=>x.artifact_type==='PROFILE_RECEIVER_CONSENT_V1')){try{const e=JSON.parse(row.payload),v=JSON.parse(await decryptSensitive(e.ciphertext,key));if(v.ownerId!==userId||await sha256Hex(JSON.stringify(v))!==e.digest||!Number.isFinite(Date.parse(v.expiresAt)))throw Error('INVALID');if(Date.parse(v.expiresAt)<=Date.parse(now)){const result=await db.prepare('DELETE FROM runtime_artifacts WHERE runtime_id=? AND artifact_id=? AND artifact_type=? AND payload=? AND EXISTS(SELECT 1 FROM runtimes WHERE runtime_id=? AND user_id=? AND current_stage=?)').bind(id,v.consent.consentRecordId,'PROFILE_RECEIVER_CONSENT_V1',row.payload,id,userId,'profile_evidence').run();removedArtifacts+=Number(result.meta?.changes||0);}}catch{quarantined++;}}
  const sources=items.filter(x=>[TYPE,EXPERIENCE_TYPE].includes(x.artifact_type));if(!sources.length)continue;
  let eligible=true;for(const source of sources){try{const e=JSON.parse(source.payload),v=JSON.parse(await decryptSensitive(e.ciphertext,key));if(await sha256Hex(JSON.stringify(v))!==e.digest||(v.customerId||v.ownerId)!==userId||!Number.isFinite(Date.parse(v.expiresAt)))throw Error('INVALID');if(Date.parse(v.expiresAt)>Date.parse(now))eligible=false;}catch{eligible=false;quarantined++;}}
  if(!eligible)continue;
  // Same canonical tables, owner and stage checked in the transaction. No other product runtimes.
  const out=await db.batch([
   db.prepare('DELETE FROM runtime_artifacts WHERE runtime_id=? AND EXISTS(SELECT 1 FROM runtimes WHERE runtime_id=? AND user_id=? AND current_stage=?) AND NOT EXISTS(SELECT 1 FROM runtime_artifacts x WHERE x.runtime_id=? AND x.artifact_type NOT IN (?,?,?,?,?))').bind(id,id,userId,'profile_evidence',id,TYPE,EXPERIENCE_TYPE,'PROFILE_EXPERIENCE_DOSSIER_V1','PROFILE_RECEIVER_CONSENT_V1',LOCAL_PDF_TYPE),
   db.prepare('DELETE FROM runtimes WHERE runtime_id=? AND user_id=? AND current_stage=? AND NOT EXISTS(SELECT 1 FROM runtime_artifacts WHERE runtime_id=?)').bind(id,userId,'profile_evidence',id)
  ]);removedArtifacts+=Number(out[0].meta?.changes||0);removedRuntimes+=Number(out[1].meta?.changes||0);
 }
 return {ok:true,removedRuntimes,removedArtifacts,quarantined,privateTextRetainedInReceipt:false,scope:'EXPIRED_OWN_PROFILE_ONLY',productionCleanupActivated:false};
}
async function experienceLane(context,{db,key,userId,url,readAssessment}){
 const host=url.hostname;
 if(context.env?.PHIOS_PERSONAL_EVIDENCE_LOCAL!=='true'||!['127.0.0.1','localhost','[::1]'].includes(host))throw evidenceError('EVIDENCE_LOCAL_CANDIDATE_ONLY',403);
 const now=new Date().toISOString();
 const validId=id=>typeof id==='string'&&/^PEX-[a-f0-9]{64}$/.test(id);
 async function revisions(id){
  if(!validId(id))throw evidenceError('EVIDENCE_NOT_FOUND',404);
  const rows=await db.prepare('SELECT a.payload FROM runtime_artifacts a JOIN runtimes r ON r.runtime_id=a.runtime_id WHERE a.runtime_id=? AND a.artifact_type=? AND r.user_id=? AND r.status=? ORDER BY a.created_at,a.artifact_id').bind(id,EXPERIENCE_TYPE,userId,'active').all();
  if(!rows.results?.length)throw evidenceError('EVIDENCE_NOT_FOUND',404);
  const values=[];
  for(const row of rows.results){const e=JSON.parse(row.payload),v=JSON.parse(await decryptSensitive(e.ciphertext,key));if(v.ownerId!==userId||v.record.recordId!==id||await sha256Hex(JSON.stringify(v))!==e.digest)throw evidenceError('EVIDENCE_INTEGRITY_FAILED',409);if(Date.parse(v.expiresAt)<=Date.parse(now))throw evidenceError('EVIDENCE_EXPIRED',410);values.push(v);}
  return values.sort((a,b)=>a.record.version-b.record.version);
 }
 const latest=async id=>(await revisions(id)).at(-1);
 if(context.request.method==='GET'){
  if(url.searchParams.get('catalog')==='receivers')return reply({ok:true,cards:personalEvidenceReceiverChoices(url.searchParams.get('locale')==='zh-Hans'?'zh-Hans':'en')});
  const reportId=url.searchParams.get('report');
  if(reportId){
   if(!/^PED-[a-f0-9-]{36}$/.test(reportId))throw evidenceError('EVIDENCE_REPORT_NOT_FOUND',404);
   const row=await db.prepare('SELECT a.payload FROM runtime_artifacts a JOIN runtimes r ON r.runtime_id=a.runtime_id WHERE a.artifact_id=? AND a.artifact_type=? AND r.user_id=? AND r.status=?').bind(reportId,'PROFILE_EXPERIENCE_DOSSIER_V1',userId,'active').first();
   if(!row)throw evidenceError('EVIDENCE_REPORT_NOT_FOUND',404);
   const e=JSON.parse(row.payload),saved=JSON.parse(await decryptSensitive(e.ciphertext,key));
   if(saved.ownerId!==userId||saved.reportId!==reportId||await sha256Hex(JSON.stringify(saved))!==e.digest)throw evidenceError('EVIDENCE_REPORT_INTEGRITY_FAILED',409);
   if(saved.r12)await dossierEligibility(context.env,userId);
   let historical=false;const openedVersions=new Map();for(const ref of saved.refs){const current=await latest(ref.id);openedVersions.set(ref.id,current.record.version);if(current.record.version!==ref.version)historical=true;}
   if(saved.r12){for(const a of saved.assessments||[])await readAssessment(a.objectId);}
   const rendered=saved.r12?renderDossierR12({...saved.r12,visualArchitecture:url.searchParams.get('visualArchitecture')||saved.r12.visualArchitecture,records:saved.records,assessments:saved.assessments||[],reportId:saved.reportId,language:url.searchParams.get('language')||saved.r12.language}):null;
   const baseHtml=rendered?.html||saved.html;
   const html=historical?baseHtml.replace('<main>','<main><p role="status">历史版本：来源已有修正。 / Historical version: source has since been corrected.</p>'):baseHtml;
   if(url.searchParams.get('format')==='pdf'){
    if(!saved.r12)throw evidenceError('DOSSIER_LEGACY_PDF_PRINT_ONLY',409);
    const checkSource=async()=>{await dossierEligibility(context.env,userId);for(const ref of saved.refs){if((await latest(ref.id)).record.version!==openedVersions.get(ref.id))throw evidenceError('EVIDENCE_SOURCE_CHANGED_DURING_EXPORT',409);}for(const a of saved.assessments||[])await readAssessment(a.objectId);};
    const binding={ownerId:userId,runtimeId:saved.parentRuntimeId||saved.refs[0]?.id,documentId:reportId,language:rendered.language,sourceSnapshotVersion:saved.r12.sourceSnapshotVersion,checkSource};
    if(localPdfPreparations.has(context))return reply(await prepareLocalPrivatePdf(context,{...binding,html}));
    return deliverLocalPrivatePdf(context,binding);
   }
   return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'",'Content-Disposition':`${url.searchParams.get('download')==='1'?'attachment':'inline'}; filename="Personal-Evidence-Dossier.html"`,'X-PHIOS-Report-State':historical?'SUPERSEDED':'LOCAL_CANDIDATE'}});
  }
  const id=url.searchParams.get('id');
  if(id){const history=await revisions(id),current=history.at(-1);return reply({ok:true,record:current.record,narrative:describeExperience(current.record),history:history.map(x=>({version:x.record.version,recordedAt:x.record.recordedAt,observationPeriod:x.record.observationPeriod,supersedes:x.record.supersedes})),expiresAt:current.expiresAt});}
  const rows=await db.prepare('SELECT DISTINCT r.runtime_id FROM runtimes r JOIN runtime_artifacts a ON r.runtime_id=a.runtime_id WHERE r.user_id=? AND r.status=? AND a.artifact_type=?').bind(userId,'active',EXPERIENCE_TYPE).all();
  const records=[];for(const r of rows.results||[]){try{records.push((await latest(r.runtime_id)).record);}catch(e){if(e.code!=='EVIDENCE_EXPIRED')throw e;}}
  const reportRows=await db.prepare('SELECT a.artifact_id,a.created_at FROM runtime_artifacts a JOIN runtimes r ON r.runtime_id=a.runtime_id WHERE a.artifact_type=? AND r.user_id=? AND r.status=? ORDER BY a.created_at DESC').bind('PROFILE_EXPERIENCE_DOSSIER_V1',userId,'active').all();
  return reply({ok:true,records,reports:reportRows.results||[],historyState:records.length?'RECORDED_EVENTS_ONLY':'NO_VERIFIED_HISTORY'});
 }
 if(context.request.method!=='POST')return reply({ok:false,code:'METHOD_NOT_ALLOWED'},405);
 requireSameOrigin(context.request);
 if(!context.request.headers.get('content-type')?.startsWith('application/json'))throw evidenceError('EVIDENCE_JSON_REQUIRED',415);
 const raw=await context.request.text();if(new TextEncoder().encode(raw).length>30000)throw evidenceError('EVIDENCE_INPUT_TOO_LARGE',413);
 let body;try{body=JSON.parse(raw);}catch{throw evidenceError('EVIDENCE_INVALID_JSON',400);}
 if(!body||typeof body!=='object'||Array.isArray(body))throw evidenceError('EVIDENCE_OBJECT_REQUIRED',400);
 const allowed=['action','record','id','baseVersion','requestToken','consent','retentionConsent','expiresAt','selected','target','purpose','purposeCode','locale','worldQuery','savedDraftRef','financialConsent','reflection','configurationConsent','contextComparable','consentRef','language','customerName','sections','assessmentIds','visualArchitecture'];
 if(Object.keys(body).some(k=>!allowed.includes(k)))throw evidenceError('EVIDENCE_UNKNOWN_FIELD');
 if(body.consent!==true)throw evidenceError('EVIDENCE_CONSENT_REQUIRED',403);
 if(body.action==='prepare-pdf'){
  if(Object.keys(body).some(k=>!['action','id','language','consent'].includes(k))||!/^PED-[a-f0-9-]{36}$/.test(body.id||''))throw evidenceError('DOSSIER_PDF_REFERENCE_REQUIRED');
  const nextUrl=new URL(url);nextUrl.searchParams.set('report',body.id);nextUrl.searchParams.set('language',body.language);nextUrl.searchParams.set('format','pdf');const next={...context,request:new Request(nextUrl)};localPdfPreparations.add(next);return experienceLane(next,{db,key,userId,url:nextUrl,readAssessment});
 }
 if(body.action==='cleanup')return reply(await purgeExpiredProfileEvidence({db,key,userId,now}));
 if(['receive','withdraw-receiver'].includes(body.action)){
  if(Object.keys(body).some(k=>!['action','consentRef','consent'].includes(k))||!/^PRC-[a-f0-9-]{36}$/.test(body.consentRef||''))throw evidenceError('RECEIVER_REFERENCE_ONLY_REQUIRED',403);
  async function open(){const row=await db.prepare('SELECT a.payload FROM runtime_artifacts a JOIN runtimes r ON a.runtime_id=r.runtime_id WHERE a.artifact_id=? AND a.artifact_type=? AND r.user_id=? AND r.status=?').bind(body.consentRef,'PROFILE_RECEIVER_CONSENT_V1',userId,'active').first();if(!row)throw evidenceError('RECEIVER_CONSENT_UNAVAILABLE',403);const e=JSON.parse(row.payload),v=JSON.parse(await decryptSensitive(e.ciphertext,key));if(v.ownerId!==userId||await sha256Hex(JSON.stringify(v))!==e.digest||v.consent.consentRecordId!==body.consentRef)throw evidenceError('RECEIVER_CONSENT_UNAVAILABLE',403);return {v,row};}
  const {v,row}=await open();
  if(body.action==='withdraw-receiver'){const consent=receiverConsentOwner.createRecord({...v.consent,consentValid:false,withdrawal:{supported:true,status:'WITHDRAWN',withdrawnAt:now}}),next={...v,consent};const payload=JSON.stringify({ciphertext:await encryptSensitive(JSON.stringify(next),key),digest:await sha256Hex(JSON.stringify(next))});await db.prepare('UPDATE runtime_artifacts SET payload=?,updated_at=? WHERE artifact_id=? AND payload=?').bind(payload,now,body.consentRef,row.payload).run();return reply({ok:true,withdrawn:true});}
  const assertActive=v=>{if(v.consent.consentValid!==true||v.consent.withdrawal.status!=='AVAILABLE'||Date.parse(v.expiresAt)<=Date.now())throw evidenceError('RECEIVER_CONSENT_INACTIVE',403);};assertActive(v);
  const records=[];for(const ref of v.input.selected){const current=await latest(ref.id);if(current.record.version!==ref.version)throw evidenceError('EVIDENCE_SOURCE_VERSION_CHANGED',409);records.push(current.record);}
  const result=await receiveSelectedPersonalEvidence(context,records,v.input,{ownerId:userId,now:new Date().toISOString()});assertActive((await open()).v);
  for(const ref of v.input.selected)if((await latest(ref.id)).record.version!==ref.version)throw evidenceError('EVIDENCE_SOURCE_VERSION_CHANGED',409);
  return reply({ok:true,result});
 }
 if(body.action==='assessment-compare'){
  if(!Array.isArray(body.selected)||body.selected.length!==2||body.selected[0]===body.selected[1]||body.selected.some(x=>typeof x!=='string'))throw evidenceError('ASSESSMENT_TWO_OBJECTS_REQUIRED');
  const values=await Promise.all(body.selected.map(readAssessment));
  const descriptor=s=>{const result=s.result,cards=result.view.signalCards,provenance=cards.flatMap(c=>c.provenance||[]);return {objectId:s.objectId,mode:result.mode,instrumentId:result.profileSummary?.instrumentId||result.financialSummary?.instrumentId||provenance.find(p=>p.instrumentCode)?.instrumentCode||null,instrumentVersion:result.profileSummary?.instrumentVersion||result.financialSummary?.instrumentVersion||provenance.find(p=>p.instrumentVersion)?.instrumentVersion||null,context:body.contextComparable===true?'USER_CONFIRMED_COMPARABLE_CONTEXT':null,assessmentDate:cards[0]?.assessmentDate||null,coverage:cards.map(c=>[c.domainId,c.facetId]),signals:cards.map(c=>({domainId:c.domainId,facetId:c.facetId,value:c.value,sourceClass:c.sourceClass}))};};
  const [a,b]=values.map(descriptor),sameCoverage=JSON.stringify(a.coverage)===JSON.stringify(b.coverage)&&a.mode===b.mode;
  const comparison=compareAssessmentVersions(a,b);if(!sameCoverage){comparison.state='NOT_COMPARABLE';comparison.reason='COVERAGE_OR_MODE_DIFFERS';}else if(!a.context||!b.context){comparison.state='NOT_COMPARABLE';comparison.reason='CONTEXT_NOT_CONFIRMED';}
  return reply({ok:true,comparison:{...comparison,contextConfirmedByCustomer:body.contextComparable===true,growthProven:false},versions:[a,b]});
 }
 if(body.action==='revoke'){
  await latest(body.id);
  await db.prepare('UPDATE runtimes SET status=?,updated_at=? WHERE runtime_id=? AND user_id=? AND status=?').bind('revoked',now,body.id,userId,'active').run();
  return reply({ok:true,revoked:true,newReadsDenied:true,physicalDeletion:false,downloadedCopiesRetractable:false});
 }
 if(['compare','handoff','report','grant-receiver'].includes(body.action)){
  const assessmentOnly=body.action==='report'&&body.language!==undefined&&Array.isArray(body.assessmentIds)&&body.assessmentIds.length>0;
  if(!Array.isArray(body.selected)||(!body.selected.length&&!assessmentOnly)||body.selected.length>10||new Set(body.selected.map(x=>x.id)).size!==body.selected.length)throw evidenceError('EVIDENCE_SELECTION_REQUIRED');
  const records=[];for(const ref of body.selected){const current=await latest(ref.id);if(current.record.version!==ref.version)throw evidenceError('EVIDENCE_SOURCE_VERSION_CHANGED',409);records.push(current.record);}
  if(body.action==='grant-receiver'){
   if(Object.keys(body).some(k=>!['action','selected','target','purpose','purposeCode','consent','expiresAt','locale','worldQuery','savedDraftRef','financialConsent','reflection','configurationConsent'].includes(k)))throw evidenceError('RECEIVER_SCOPE_FIELDS_ONLY');
   projectExperienceHandoff(records,body,{ownerId:userId,now});
   const consentRef='PRC-'+crypto.randomUUID(),consent=receiverConsentOwner.createRecord({consentRecordId:consentRef,subjectReference:userId,methodCode:'PROFILE',purposeCode:body.purposeCode,consentClass:'EXPLICIT_CONSENT',retentionClass:'SESSION_END',visibilityScope:'SUBJECT_ONLY',grantedAt:now,expiresAt:body.expiresAt,consentValid:true,withdrawal:{supported:true,status:'AVAILABLE',withdrawnAt:null}});
   const input=structuredClone(body);delete input.action;const saved={ownerId:userId,consent,input,expiresAt:body.expiresAt},payload=JSON.stringify({ciphertext:await encryptSensitive(JSON.stringify(saved),key),digest:await sha256Hex(JSON.stringify(saved))});
   await db.prepare('INSERT INTO runtime_artifacts(artifact_id,runtime_id,artifact_type,stage,payload,schema_version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').bind(consentRef,records[0].recordId,'PROFILE_RECEIVER_CONSENT_V1','LOCAL_CANDIDATE',payload,'MPA-CONSENT-v1',now,now).run();
   return reply({ok:true,consentRef,expiresAt:body.expiresAt,referenceIsBearerToken:false},201);
  }
  if(body.action==='report'){
   if(body.retentionConsent!==true)throw evidenceError('EVIDENCE_RETENTION_CONSENT_REQUIRED',403);
   const reportId='PED-'+crypto.randomUUID();let assessments=[],eligibility;
   if(body.language!==undefined){
    eligibility=await dossierEligibility(context.env,userId);
    const ids=body.assessmentIds||[];if(!Array.isArray(ids)||ids.length>10||new Set(ids).size!==ids.length||ids.some(id=>typeof id!=='string'))throw evidenceError('DOSSIER_ASSESSMENT_SELECTION_INVALID');
    assessments=await Promise.all(ids.map(readAssessment));
   }
   const report=assembleExperienceDossier({records,ownerId:userId,reportId,now,assessments});
   let parentRuntimeId=records[0]?.recordId;
   if(!parentRuntimeId){const parent=await db.prepare('SELECT r.runtime_id FROM runtime_artifacts a JOIN runtimes r ON r.runtime_id=a.runtime_id WHERE a.artifact_id=? AND a.artifact_type=? AND r.user_id=? AND r.status=?').bind(assessments[0].objectId,TYPE,userId,'active').first();if(!parent)throw evidenceError('PROFILE_OBJECT_NOT_FOUND',404);parentRuntimeId=parent.runtime_id;}
   if(body.language!==undefined){
    const ids=body.assessmentIds||[];
    if(typeof(body.customerName||'')!=='string'||(body.customerName||'').length>160)throw evidenceError('DOSSIER_CUSTOMER_NAME_INVALID');
    const sourceSnapshotVersion=await sha256Hex(JSON.stringify({refs:report.refs,assessmentIds:ids}));
    const r12={language:body.language,now,sourceSnapshotVersion,customerName:body.customerName||'',sections:body.sections||null,...(body.visualArchitecture?{visualArchitecture:body.visualArchitecture}:{})};
    const rendering=renderDossierR12({...r12,records,assessments,reportId});
    Object.assign(report,{canonical:assembleExperienceDossier({records,ownerId:userId,reportId,now,assessments}).canonical,...rendering,r12,records:structuredClone(records),assessments,eligibility,sourceSnapshotVersion,renderingArtifactId:reportId+'-'+rendering.language,schemaVersion:DOSSIER_R12});
   }
   const saved={ownerId:userId,reportId,parentRuntimeId,...report},payload=JSON.stringify({ciphertext:await encryptSensitive(JSON.stringify(saved),key),digest:await sha256Hex(JSON.stringify(saved))});
   await db.prepare('INSERT INTO runtime_artifacts(artifact_id,runtime_id,artifact_type,stage,payload,schema_version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').bind(reportId,parentRuntimeId,'PROFILE_EXPERIENCE_DOSSIER_V1','LOCAL_CANDIDATE',payload,'PHIOS-PROFILE-EXPERIENCE-v1',now,now).run();
   return reply({ok:true,reportId,refs:report.refs,canonicalState:report.canonical.canonicalState,downloadFormat:report.r12?'AUTHENTICATED_PDF_AND_HTML':'HTML_PRINT_TO_PDF',language:report.language||'bilingual',sourceSnapshotVersion:report.sourceSnapshotVersion||null,renderingArtifactId:report.renderingArtifactId||null,artworkState:report.artworkState||null},201);
  }
  return reply(body.action==='compare'?{ok:true,comparison:records.length===2?compareExperiences(...records):{state:'INSUFFICIENT_DATA'}}:{ok:true,package:projectExperienceHandoff(records,body,{ownerId:userId,now})});
 }
 if(body.action!=='save')throw evidenceError('EVIDENCE_ACTION_INVALID');
 if(body.retentionConsent!==true)throw evidenceError('EVIDENCE_RETENTION_CONSENT_REQUIRED',403);
 if(!/^[a-f0-9-]{36}$/i.test(body.requestToken||''))throw evidenceError('EVIDENCE_REQUEST_TOKEN_REQUIRED');
 let previous=null,recordId,version=1,expiresAt;
 if(body.id){previous=await latest(body.id);if(body.baseVersion!==previous.record.version)throw evidenceError('EVIDENCE_SOURCE_VERSION_CHANGED',409);recordId=body.id;version=previous.record.version+1;expiresAt=previous.expiresAt;}
 else{recordId='PEX-'+await sha256Hex(JSON.stringify([userId,body.requestToken]));expiresAt=body.expiresAt;if(!Number.isFinite(Date.parse(expiresAt))||Date.parse(expiresAt)<=Date.parse(now)||Date.parse(expiresAt)>Date.parse(now)+366*86400000)throw evidenceError('EVIDENCE_RETENTION_INVALID');}
 const record=normalizeExperience(body.record,{ownerId:userId,recordId,version,now,previous:previous?.record});
 const inputDigest=await sha256Hex(JSON.stringify(body.record));
 if(!body.id){try{const prior=await latest(recordId);if(prior.inputDigest!==inputDigest)throw evidenceError('EVIDENCE_IDEMPOTENCY_CONFLICT',409);return reply({ok:true,record:prior.record,reused:true});}catch(e){if(e.code!=='EVIDENCE_NOT_FOUND')throw e;}}
 const saved={ownerId:userId,record,expiresAt,inputDigest},payload=JSON.stringify({ciphertext:await encryptSensitive(JSON.stringify(saved),key),digest:await sha256Hex(JSON.stringify(saved))});
 const statements=[];
 if(!previous){statements.push(db.prepare("INSERT INTO runtime_users(user_id,status,created_at,updated_at) VALUES(?,'active',?,?) ON CONFLICT(user_id) DO NOTHING").bind(userId,now,now));statements.push(db.prepare("INSERT INTO runtimes(runtime_id,user_id,status,current_stage,schema_version,state,created_at,updated_at) VALUES(?,?,'active','profile_evidence',?,'{}',?,?)").bind(recordId,userId,'PHIOS-PROFILE-EXPERIENCE-v1',now,now));}
 statements.push(db.prepare('INSERT INTO runtime_artifacts(artifact_id,runtime_id,artifact_type,stage,payload,schema_version,created_at,updated_at) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM runtimes WHERE runtime_id=? AND user_id=? AND status=?)').bind(recordId+'-v'+version,recordId,EXPERIENCE_TYPE,'LOCAL_CANDIDATE',payload,'PHIOS-PROFILE-EXPERIENCE-v1',now,now,recordId,userId,'active'));
 try{const result=await db.batch(statements);if(result.at(-1)?.meta?.changes!==1)throw evidenceError('EVIDENCE_WRITE_CONFLICT',409);}catch(e){if(e.code==='EVIDENCE_WRITE_CONFLICT')throw e;throw evidenceError('EVIDENCE_WRITE_CONFLICT',409);}
 return reply({ok:true,record,narrative:describeExperience(record),expiresAt},201);
}
