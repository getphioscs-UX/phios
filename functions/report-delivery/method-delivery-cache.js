import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
const inflight=new WeakMap();
const fail=code=>{throw Object.assign(new Error(code),{code,status:409});};
export async function methodCacheIdentity(seed){return sha256Stable(seed);}
export async function cachedMethodDelivery(env,{ownerAccountId,kind,key,produce,beforeClaim=async()=>{},validate=async()=>{}}){
 if(!ownerAccountId||!['SEMANTIC','PUBLICATION'].includes(kind)||!env.RUNTIME_DB?.prepare||!env.PRIVATE_REPORTS?.get||!env.PRIVATE_REPORTS?.put)fail('METHOD_CACHE_STORAGE_REQUIRED');
 // The durable claim is authoritative across isolates. This map only joins callers
 // in one isolate; authorization is performed before each caller reaches this API.
 const db=env.RUNTIME_DB;let pending=inflight.get(db);if(!pending){pending=new Map();inflight.set(db,pending);}
 const join=JSON.stringify([ownerAccountId,kind,key]);
 if(pending.has(join))return pending.get(join);
 const task=(async()=>{
  const lookup=()=>db.prepare('SELECT * FROM method_delivery_cache WHERE owner_account_id=? AND cache_kind=? AND cache_key=?').bind(ownerAccountId,kind,key).first();
  const read=async row=>{
   if(row.state!=='READY')fail(row.state==='FAILED'?'METHOD_CACHE_RECONCILIATION_REQUIRED':'METHOD_GENERATION_IN_PROGRESS');
   const object=await env.PRIVATE_REPORTS.get(row.object_key);if(!object)fail('METHOD_CACHE_MATERIAL_MISSING');
   const payload=await object.json();if(await sha256Stable(payload)!==row.payload_digest)fail('METHOD_CACHE_DIGEST_MISMATCH');
   await validate(payload);return {value:payload,cacheHit:true,key};
  };
  const existing=await lookup();if(existing)return read(existing);
  await beforeClaim();
  const claim=crypto.randomUUID(),now=new Date().toISOString();
  await db.prepare("INSERT INTO method_delivery_cache(owner_account_id,cache_kind,cache_key,claim_id,state,created_at,updated_at) VALUES(?,?,?,?,'CLAIMED',?,?) ON CONFLICT(owner_account_id,cache_kind,cache_key) DO NOTHING").bind(ownerAccountId,kind,key,claim,now,now).run();
  const row=await lookup();if(row.claim_id!==claim)return read(row);
  try{
   const value=await produce();await validate(value);
   const payloadDigest=await sha256Stable(value),objectKey='method-cache/'+await sha256Stable({ownerAccountId,kind,key})+'/'+payloadDigest+'.json';
   await env.PRIVATE_REPORTS.put(objectKey,JSON.stringify(value),{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
   await db.prepare("UPDATE method_delivery_cache SET state='READY',object_key=?,payload_digest=?,updated_at=? WHERE owner_account_id=? AND cache_kind=? AND cache_key=? AND claim_id=? AND state='CLAIMED'").bind(objectKey,payloadDigest,new Date().toISOString(),ownerAccountId,kind,key,claim).run();
   return {value,cacheHit:false,key};
  }catch(error){
   await db.prepare("UPDATE method_delivery_cache SET state='FAILED',updated_at=? WHERE owner_account_id=? AND cache_kind=? AND cache_key=? AND claim_id=? AND state='CLAIMED'").bind(new Date().toISOString(),ownerAccountId,kind,key,claim).run();throw error;
  }
 })();pending.set(join,task);
 try{return await task;}finally{pending.delete(join);}
}
