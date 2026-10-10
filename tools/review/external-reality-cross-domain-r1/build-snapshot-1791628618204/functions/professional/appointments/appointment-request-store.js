import {APPOINTMENT_SERVICE_TYPES} from './professional-appointment-constants.js';
import {normalizeVerifiedSymbolicAccountIdentity} from '../../symbolic-method-persistence/symbolic-account-identity-v1.js';
import {requireSameOrigin} from '../../account/oidc-auth.js';
import {encryptSensitive,decryptSensitive,sha256Hex} from '../../commerce/commerce-crypto.js';

// An unscheduled request belongs to the existing Professional appointment owner.
// Existing scheduled appointments and Commerce fulfillments are not fabricated.
const TYPE='PROFESSIONAL_APPOINTMENT_REQUEST', SCHEMA='PHIOS-APPOINTMENT-REQUEST-v1';
const fail=(code,status=400)=>Object.assign(new Error(code),{code,status});
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
const text=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';
export async function appointmentRequestApi(context){
  try {
    const identity=normalizeVerifiedSymbolicAccountIdentity(context.data?.symbolicAccountIdentity);
    if(!identity)throw fail('ACCOUNT_REQUIRED',401);
    const db=context.env?.RUNTIME_DB,secret=context.env?.APPOINTMENT_REQUEST_ENCRYPTION_KEY;
    if(!db?.prepare||typeof secret!=='string'||secret.length<32)throw fail('APPOINTMENT_REQUEST_STORAGE_NOT_CONFIGURED',503);
    const userId=identity.userId,url=new URL(context.request.url);
    async function read(id){
      const row=await db.prepare('SELECT a.payload FROM runtime_artifacts a JOIN runtimes r ON r.runtime_id=a.runtime_id WHERE a.artifact_id=? AND a.artifact_type=? AND r.user_id=? AND r.status=?').bind(id,TYPE,userId,'active').first();
      if(!row)throw fail('APPOINTMENT_REQUEST_NOT_FOUND',404);
      const envelope=JSON.parse(row.payload);
      const value=JSON.parse(await decryptSensitive(envelope.ciphertext,secret));
      if(value.customerId!==userId||value.appointmentRequestId!==id||value.schemaVersion!==SCHEMA||await sha256Hex(JSON.stringify(value))!==envelope.digest)throw fail('APPOINTMENT_REQUEST_INTEGRITY_FAILED',409);
      if(Date.parse(value.expiresAt)<=Date.now())throw fail('APPOINTMENT_REQUEST_EXPIRED',410);
      return value;
    }
    if(context.request.method==='GET'){
      const id=url.searchParams.get('id');
      if(id)return reply({ok:true,request:await read(id)});
      const rows=await db.prepare('SELECT a.artifact_id FROM runtime_artifacts a JOIN runtimes r ON r.runtime_id=a.runtime_id WHERE a.artifact_type=? AND r.user_id=? AND r.status=? ORDER BY a.created_at DESC LIMIT 50').bind(TYPE,userId,'active').all();
      const requests=[];for(const row of rows.results||[]){try{requests.push(await read(row.artifact_id));}catch(error){if(error.code!=='APPOINTMENT_REQUEST_EXPIRED')throw error;}}
      return reply({ok:true,requests,serviceTypes:APPOINTMENT_SERVICE_TYPES});
    }
    if(context.request.method!=='POST')return reply({ok:false,code:'METHOD_NOT_ALLOWED'},405);
    requireSameOrigin(context.request);
    const raw=await context.request.text();if(new TextEncoder().encode(raw).length>12000)throw fail('REQUEST_TOO_LARGE',413);
    const body=JSON.parse(raw);
    if(body.consent!==true||body.retentionConsent!==true)throw fail('APPOINTMENT_EXPLICIT_CONSENT_REQUIRED',403);
    if(!APPOINTMENT_SERVICE_TYPES.includes(body.serviceType))throw fail('APPOINTMENT_SERVICE_INVALID');
    const question=text(body.question,2000),timezone=text(body.timezone,80),preferences=text(body.preferences,500);
    if(!question||!timezone||!['ONLINE','IN_PERSON','NO_PREFERENCE'].includes(body.modality))throw fail('APPOINTMENT_INPUT_REQUIRED');
    try{new Intl.DateTimeFormat('en',{timeZone:timezone});}catch{throw fail('APPOINTMENT_TIMEZONE_INVALID');}
    if(!/^[0-9a-f-]{36}$/i.test(body.requestToken||''))throw fail('APPOINTMENT_REQUEST_TOKEN_REQUIRED');
    const expiresAt=new Date(body.expiresAt);if(!Number.isFinite(+expiresAt)||+expiresAt<=Date.now()||+expiresAt>Date.now()+90*86400000)throw fail('APPOINTMENT_RETENTION_INVALID');
    const id='APR-'+await sha256Hex(JSON.stringify([SCHEMA,userId,body.requestToken]));
    const inputDigest=await sha256Hex(JSON.stringify([body.serviceType,question,timezone,preferences,body.modality,expiresAt.toISOString()]));
    try{const prior=await read(id);if(prior.inputDigest!==inputDigest)throw fail('APPOINTMENT_IDEMPOTENCY_CONFLICT',409);return reply({ok:true,request:prior,reused:true});}catch(error){if(error.code!=='APPOINTMENT_REQUEST_NOT_FOUND')throw error;}
    const now=new Date().toISOString(),runtimeId=crypto.randomUUID();
    const value={schemaVersion:SCHEMA,appointmentRequestId:id,customerId:userId,version:1,status:'REQUESTED',serviceType:body.serviceType,question,timezone,preferences,modality:body.modality,createdAt:now,expiresAt:expiresAt.toISOString(),inputDigest,consent:{processing:true,retention:true,recordedAt:now},scheduledStart:null,professionalId:null,paymentRecordId:null,confirmed:false};
    const payload=JSON.stringify({ciphertext:await encryptSensitive(JSON.stringify(value),secret),digest:await sha256Hex(JSON.stringify(value))});
    try{
      await db.batch([
        db.prepare("INSERT INTO runtime_users(user_id,status,created_at,updated_at) VALUES(?,'active',?,?) ON CONFLICT(user_id) DO NOTHING").bind(userId,now,now),
        db.prepare("INSERT INTO runtimes(runtime_id,user_id,status,current_stage,schema_version,state,created_at,updated_at) VALUES(?,?,'active','appointment_request',?,'{}',?,?)").bind(runtimeId,userId,SCHEMA,now,now),
        db.prepare('INSERT INTO runtime_artifacts(artifact_id,runtime_id,artifact_type,stage,payload,schema_version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,runtimeId,TYPE,'REQUESTED',payload,SCHEMA,now,now)
      ]);
    }catch(error){const prior=await read(id);if(prior.inputDigest!==inputDigest)throw fail('APPOINTMENT_IDEMPOTENCY_CONFLICT',409);return reply({ok:true,request:prior,reused:true});}
    return reply({ok:true,request:value,reused:false},201);
  }catch(error){return reply({ok:false,code:error.code||'APPOINTMENT_REQUEST_INVALID'},error.status||400);}
}
