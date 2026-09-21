import {normalizeVerifiedSymbolicAccountIdentity} from '../symbolic-method-persistence/symbolic-account-identity-v1.js';
import {requireSameOrigin,digest} from './oidc-auth.js';
import {validateFinancialWillDraft} from './financial-will-draft-schema.js';
const encoder=new TextEncoder(),decoder=new TextDecoder();
const b64=bytes=>{let text='';for(let i=0;i<bytes.length;i+=32768)text+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(text);};
const unb64=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
const fail=(code,status=400)=>Object.assign(new Error(code),{code,status});
const schema='FW_CUSTOMER_INTAKE_DRAFT_v1';
async function encryptionKey(env){
 const secret=env.FINANCIAL_WILL_DRAFT_ENCRYPTION_KEY;
 try{let bytes;if(typeof secret!=='string')throw 0;if(/^[0-9a-f]{64}$/i.test(secret))bytes=Uint8Array.from(secret.match(/../g),s=>parseInt(s,16));else{try{bytes=unb64(secret.replace(/-/g,'+').replace(/_/g,'/'));}catch{}if(bytes?.length!==32&&encoder.encode(secret).length===32)bytes=encoder.encode(secret);}if(bytes?.length!==32)throw 0;return await crypto.subtle.importKey('raw',bytes,{name:'AES-GCM'},false,['encrypt','decrypt']);}catch{throw fail('DRAFT_ENCRYPTION_CONFIGURATION_REQUIRED',503);}
}
function aad(userId,type,id,version,expires){return encoder.encode(JSON.stringify([schema,userId,type,id,version,expires]));}
const headers={'Content-Type':'application/json','Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow, noarchive','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
function metadata(row){return {draftId:row.draft_id,draftType:row.draft_type,schemaVersion:row.schema_version,version:row.object_version,digest:row.digest,priorDigest:row.prior_digest,expiresAt:new Date(row.expires_at).toISOString(),createdAt:new Date(row.created_at).toISOString()};}
export async function draftApi(context){
 try{
  const identity=normalizeVerifiedSymbolicAccountIdentity(context.data?.symbolicAccountIdentity);if(!identity)throw fail('ACCOUNT_REQUIRED',401);
  const db=context.env?.RUNTIME_DB;if(!db?.prepare)throw fail('DRAFT_STORAGE_UNAVAILABLE',503);
  const userId=identity.userId,now=Date.now(),url=new URL(context.request.url),type=url.searchParams.get('type');
  if(type&&!['FINANCIAL','WILL'].includes(type))throw fail('DRAFT_TYPE_INVALID');
  if(context.request.method==='GET'){
   const id=url.searchParams.get('id');
   if(!id){const records=await db.prepare('SELECT d.* FROM account_financial_will_drafts d WHERE d.user_id=? AND (? IS NULL OR d.draft_type=?) AND d.expires_at>? AND d.object_version=(SELECT MAX(x.object_version) FROM account_financial_will_drafts x WHERE x.user_id=d.user_id AND x.draft_id=d.draft_id) ORDER BY d.created_at DESC LIMIT 100').bind(userId,type,type,now).all();return reply({ok:true,drafts:records.results.map(metadata)});}
   const row=await db.prepare('SELECT * FROM account_financial_will_drafts WHERE user_id=? AND draft_id=? ORDER BY object_version DESC LIMIT 1').bind(userId,id).first();
   if(!row||row.expires_at<=now||row.schema_version!==schema)throw fail('DRAFT_NOT_FOUND',404);
   if(row.key_version!=='v1')throw fail('DRAFT_KEY_VERSION_UNAVAILABLE',503);
   const data=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(row.iv),additionalData:aad(userId,row.draft_type,id,row.object_version,row.expires_at)},await encryptionKey(context.env),unb64(row.ciphertext));
   const text=decoder.decode(data);if(await digest(text)!==row.digest)throw fail('DRAFT_INTEGRITY_FAILED',409);
   const payload=validateFinancialWillDraft(row.draft_type,JSON.parse(text));return reply({ok:true,...metadata(row),payload});
  }
  if(context.request.method!=='POST')return reply({ok:false,code:'METHOD_NOT_ALLOWED'},405);
  requireSameOrigin(context.request);
  const raw=await context.request.text();if(encoder.encode(raw).length>200000)throw fail('DRAFT_TOO_LARGE',413);
  const body=JSON.parse(raw);
  if(body.action==='delete'||body.action==='withdraw'){
   if(body.confirmed!==true||typeof body.draftId!=='string')throw fail('DRAFT_CONFIRMATION_REQUIRED',403);
   const rows=await db.prepare('SELECT draft_id,legal_hold_reference FROM account_financial_will_drafts WHERE user_id=? AND draft_id=?').bind(userId,body.draftId).all();
   if(!rows.results.length)throw fail('DRAFT_NOT_FOUND',404);
   if(rows.results.some(r=>r.legal_hold_reference))throw fail('DRAFT_RIGHTS_REVIEW_REQUIRED',409);
   const removed=await db.batch([
    db.prepare('INSERT INTO account_fw_rights_audit(request_id,user_id,draft_id,right_code,state,decision_reason,created_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM account_financial_will_drafts WHERE user_id=? AND draft_id=?) AND NOT EXISTS(SELECT 1 FROM account_financial_will_drafts WHERE user_id=? AND draft_id=? AND legal_hold_reference IS NOT NULL)').bind(crypto.randomUUID(),userId,body.draftId,body.action==='withdraw'?'WITHDRAW_CONSENT':'DELETE','FULFILLED','VERIFIED_OWNER_EXPLICIT_CONFIRMATION_NO_HOLD',now,userId,body.draftId,userId,body.draftId),
    db.prepare('DELETE FROM account_financial_will_drafts WHERE user_id=? AND draft_id=? AND NOT EXISTS(SELECT 1 FROM account_financial_will_drafts h WHERE h.user_id=? AND h.draft_id=? AND h.legal_hold_reference IS NOT NULL)').bind(userId,body.draftId,userId,body.draftId)
   ]);
   if(!(removed[1].meta?.changes??removed[1].changes))throw fail('DRAFT_RIGHTS_REVIEW_REQUIRED',409);
   return reply({ok:true,deleted:true});
  }
  if(body.action!=='save'||body.saveConsent!==true||body.retentionConsent!==true)throw fail('DRAFT_EXPLICIT_SAVE_REQUIRED',403);
  const kind=body.draftType,payload=validateFinancialWillDraft(kind,body.payload),expires=Date.parse(body.expiresAt);
  if(!Number.isFinite(expires)||expires<=now||expires>now+366*86400000)throw fail('DRAFT_RETENTION_DATE_REQUIRED');
  if(body.purpose!==(kind==='WILL'?'WILL_ASSEMBLY':'FINANCIAL_PLANNING'))throw fail('DRAFT_PURPOSE_REQUIRED',403);
  const expected=body.expectedVersion??0;if(!Number.isInteger(expected)||expected<0)throw fail('DRAFT_VERSION_INVALID');
  let prior=null,id=body.draftId;
  if(id){prior=await db.prepare('SELECT * FROM account_financial_will_drafts WHERE user_id=? AND draft_id=? ORDER BY object_version DESC LIMIT 1').bind(userId,id).first();if(!prior||prior.expires_at<=now)throw fail('DRAFT_NOT_FOUND',404);if(prior.draft_type!==kind||prior.object_version!==expected)throw fail('DRAFT_VERSION_CONFLICT',409);if(prior.legal_hold_reference)throw fail('DRAFT_RIGHTS_REVIEW_REQUIRED',409);}else{if(expected!==0)throw fail('DRAFT_VERSION_CONFLICT',409);id=crypto.randomUUID();}
  const version=expected+1,text=JSON.stringify(payload),iv=crypto.getRandomValues(new Uint8Array(12)),key=await encryptionKey(context.env),hash=await digest(text);
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(userId,kind,id,version,expires)},key,encoder.encode(text));
  const result=await db.prepare('INSERT INTO account_financial_will_drafts(draft_id,user_id,draft_type,schema_version,object_version,ciphertext,iv,key_version,digest,prior_digest,retention_id,consent_id,expires_at,created_at) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE COALESCE((SELECT MAX(object_version) FROM account_financial_will_drafts WHERE user_id=? AND draft_id=?),0)=? AND NOT EXISTS(SELECT 1 FROM account_financial_will_drafts WHERE user_id=? AND draft_id=? AND legal_hold_reference IS NOT NULL)').bind(id,userId,kind,schema,version,b64(new Uint8Array(ciphertext)),b64(iv),'v1',hash,prior?.digest||null,crypto.randomUUID(),crypto.randomUUID(),expires,now,userId,id,expected,userId,id).run();
  if((result.meta?.changes??result.changes)!==1)throw fail('DRAFT_VERSION_CONFLICT',409);
  return reply({ok:true,draftId:id,draftType:kind,version,digest:hash,expiresAt:new Date(expires).toISOString(),saved:true});
 }catch(error){return reply({ok:false,code:error.code||'DRAFT_REQUEST_INVALID'},error.status||400);}
}
