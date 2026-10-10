import {onRequestPost as produceProfile} from '../api/profile-progressive.js';
import {normalizeVerifiedSymbolicAccountIdentity} from '../symbolic-method-persistence/symbolic-account-identity-v1.js';
import {requireSameOrigin} from './oidc-auth.js';
import {encryptSensitive,decryptSensitive,sha256Hex} from '../commerce/commerce-crypto.js';
const TYPE='PROFILE_PERSONAL_EVIDENCE_OBJECT',SCHEMA='PHIOS-ACCOUNT-PROFILE-EVIDENCE-v1';
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
const fail=(code,status=400)=>Object.assign(new Error(code),{code,status});
export async function profileEvidenceApi(context){
 try{
  const identity=normalizeVerifiedSymbolicAccountIdentity(context.data?.symbolicAccountIdentity);if(!identity)throw fail('ACCOUNT_REQUIRED',401);
  const db=context.env?.RUNTIME_DB,key=context.env?.PROFILE_EVIDENCE_ENCRYPTION_KEY;
  if(!db?.prepare||typeof key!=='string'||key.length<32)throw fail('PROFILE_ACCOUNT_STORAGE_NOT_CONFIGURED',503);
  const userId=identity.userId,url=new URL(context.request.url);
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
