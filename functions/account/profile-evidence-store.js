import {onRequestPost as produceProfile} from '../api/profile-progressive.js';
import {normalizeVerifiedSymbolicAccountIdentity} from '../symbolic-method-persistence/symbolic-account-identity-v1.js';
import {requireSameOrigin} from './oidc-auth.js';
import {encryptSensitive,decryptSensitive,sha256Hex} from '../commerce/commerce-crypto.js';
import {normalizeExperience,describeExperience,compareExperiences,projectExperienceHandoff,evidenceError} from '../profile/personal-evidence-records.js';
import {assembleExperienceDossier} from '../profile/personal-evidence-report-adapter.js';
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
  if(url.searchParams.get('lane')==='experiences')return await experienceLane(context,{db,key,userId,url});
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
async function experienceLane(context,{db,key,userId,url}){
 const host=url.hostname;
 if(context.env?.PHIOS_PERSONAL_EVIDENCE_LOCAL!=='true'||!['127.0.0.1','localhost','[::1]'].includes(host))throw evidenceError('EVIDENCE_LOCAL_CANDIDATE_ONLY',403);
 const now=new Date().toISOString();
 const validId=id=>typeof id==='string'&&/^PEX-[a-f0-9]{64}$/.test(id);
 async function revisions(id){
  if(!validId(id))throw evidenceError('EVIDENCE_NOT_FOUND',404);
  const rows=await db.prepare('SELECT a.payload FROM runtime_artifacts a JOIN runtimes r ON r.runtime_id=a.runtime_id WHERE a.runtime_id=? AND a.artifact_type=? AND r.user_id=? AND r.status=? ORDER BY a.created_at,a.artifact_id').bind(id,EXPERIENCE_TYPE,userId,'active').all();
  if(!rows.results?.length)throw evidenceError('EVIDENCE_NOT_FOUND',404);
  const values=[];
  for(const row of rows.results){const e=JSON.parse(row.payload),v=JSON.parse(await decryptSensitive(e.ciphertext,key));if(v.ownerId!==userId||v.record.recordId!==id||await sha256Hex(JSON.stringify(v))!==e.digest)throw evidenceError('EVIDENCE_INTEGRITY_FAILED',409);if(v.expiresAt<=now)throw evidenceError('EVIDENCE_EXPIRED',410);values.push(v);}
  return values.sort((a,b)=>a.record.version-b.record.version);
 }
 const latest=async id=>(await revisions(id)).at(-1);
 if(context.request.method==='GET'){
  const reportId=url.searchParams.get('report');
  if(reportId){
   if(!/^PED-[a-f0-9-]{36}$/.test(reportId))throw evidenceError('EVIDENCE_REPORT_NOT_FOUND',404);
   const row=await db.prepare('SELECT a.payload FROM runtime_artifacts a JOIN runtimes r ON r.runtime_id=a.runtime_id WHERE a.artifact_id=? AND a.artifact_type=? AND r.user_id=? AND r.status=?').bind(reportId,'PROFILE_EXPERIENCE_DOSSIER_V1',userId,'active').first();
   if(!row)throw evidenceError('EVIDENCE_REPORT_NOT_FOUND',404);
   const e=JSON.parse(row.payload),saved=JSON.parse(await decryptSensitive(e.ciphertext,key));
   if(saved.ownerId!==userId||saved.reportId!==reportId||await sha256Hex(JSON.stringify(saved))!==e.digest)throw evidenceError('EVIDENCE_REPORT_INTEGRITY_FAILED',409);
   let historical=false;for(const ref of saved.refs){const current=await latest(ref.id);if(current.record.version!==ref.version)historical=true;}
   const html=historical?saved.html.replace('<main>','<main><p role="status">历史版本：来源已有修正。 / Historical version: source has since been corrected.</p>'):saved.html;
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
 const allowed=['action','record','id','baseVersion','requestToken','consent','retentionConsent','expiresAt','selected','target','purpose','purposeCode'];
 if(Object.keys(body).some(k=>!allowed.includes(k)))throw evidenceError('EVIDENCE_UNKNOWN_FIELD');
 if(body.consent!==true)throw evidenceError('EVIDENCE_CONSENT_REQUIRED',403);
 if(body.action==='revoke'){
  await latest(body.id);
  await db.prepare('UPDATE runtimes SET status=?,updated_at=? WHERE runtime_id=? AND user_id=? AND status=?').bind('revoked',now,body.id,userId,'active').run();
  return reply({ok:true,revoked:true,newReadsDenied:true,physicalDeletion:false,downloadedCopiesRetractable:false});
 }
 if(['compare','handoff','report'].includes(body.action)){
  if(!Array.isArray(body.selected)||!body.selected.length||body.selected.length>10||new Set(body.selected.map(x=>x.id)).size!==body.selected.length)throw evidenceError('EVIDENCE_SELECTION_REQUIRED');
  const records=[];for(const ref of body.selected){const current=await latest(ref.id);if(current.record.version!==ref.version)throw evidenceError('EVIDENCE_SOURCE_VERSION_CHANGED',409);records.push(current.record);}
  if(body.action==='report'){
   if(body.retentionConsent!==true)throw evidenceError('EVIDENCE_RETENTION_CONSENT_REQUIRED',403);
   const reportId='PED-'+crypto.randomUUID(),report=assembleExperienceDossier({records,ownerId:userId,reportId,now});
   const saved={ownerId:userId,reportId,...report},payload=JSON.stringify({ciphertext:await encryptSensitive(JSON.stringify(saved),key),digest:await sha256Hex(JSON.stringify(saved))});
   await db.prepare('INSERT INTO runtime_artifacts(artifact_id,runtime_id,artifact_type,stage,payload,schema_version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').bind(reportId,records[0].recordId,'PROFILE_EXPERIENCE_DOSSIER_V1','LOCAL_CANDIDATE',payload,'PHIOS-PROFILE-EXPERIENCE-v1',now,now).run();
   return reply({ok:true,reportId,refs:report.refs,canonicalState:report.canonical.canonicalState,downloadFormat:'HTML_PRINT_TO_PDF'},201);
  }
  return reply(body.action==='compare'?{ok:true,comparison:records.length===2?compareExperiences(...records):{state:'INSUFFICIENT_DATA'}}:{ok:true,package:projectExperienceHandoff(records,body,{ownerId:userId,now})});
 }
 if(body.action!=='save')throw evidenceError('EVIDENCE_ACTION_INVALID');
 if(body.retentionConsent!==true)throw evidenceError('EVIDENCE_RETENTION_CONSENT_REQUIRED',403);
 if(!/^[a-f0-9-]{36}$/i.test(body.requestToken||''))throw evidenceError('EVIDENCE_REQUEST_TOKEN_REQUIRED');
 let previous=null,recordId,version=1,expiresAt;
 if(body.id){previous=await latest(body.id);if(body.baseVersion!==previous.record.version)throw evidenceError('EVIDENCE_SOURCE_VERSION_CHANGED',409);recordId=body.id;version=previous.record.version+1;expiresAt=previous.expiresAt;}
 else{recordId='PEX-'+await sha256Hex(JSON.stringify([userId,body.requestToken]));expiresAt=body.expiresAt;if(!Number.isFinite(Date.parse(expiresAt))||expiresAt<=now||Date.parse(expiresAt)>Date.parse(now)+366*86400000)throw evidenceError('EVIDENCE_RETENTION_INVALID');}
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
