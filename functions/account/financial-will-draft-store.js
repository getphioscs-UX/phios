import {normalizeVerifiedSymbolicAccountIdentity} from '../symbolic-method-persistence/symbolic-account-identity-v1.js';
import {requireSameOrigin,digest} from './oidc-auth.js';
import {validateDraftVersion,FW_V1,FW_V2} from './financial-will-draft-v2.js';
import {requireFinancialGrant} from '../professional/consent/financial-purpose-grants.js';
const encoder=new TextEncoder(),decoder=new TextDecoder();
const b64=bytes=>{let text='';for(let i=0;i<bytes.length;i+=32768)text+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(text);};
const unb64=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
const fail=(code,status=400)=>Object.assign(new Error(code),{code,status});
const schema=FW_V2;
async function encryptionKey(env){
 const secret=env.FINANCIAL_WILL_DRAFT_ENCRYPTION_KEY;
 try{let bytes;if(typeof secret!=='string')throw 0;if(/^[0-9a-f]{64}$/i.test(secret))bytes=Uint8Array.from(secret.match(/../g),s=>parseInt(s,16));else{try{bytes=unb64(secret.replace(/-/g,'+').replace(/_/g,'/'));}catch{}if(bytes?.length!==32&&encoder.encode(secret).length===32)bytes=encoder.encode(secret);}if(bytes?.length!==32)throw 0;return await crypto.subtle.importKey('raw',bytes,{name:'AES-GCM'},false,['encrypt','decrypt']);}catch{throw fail('DRAFT_ENCRYPTION_CONFIGURATION_REQUIRED',503);}
}
function aad(userId,type,id,version,expires,schemaVersion=schema){return encoder.encode(JSON.stringify([schemaVersion,userId,type,id,version,expires]));}
const headers={'Content-Type':'application/json','Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow, noarchive','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
function metadata(row){return {draftId:row.draft_id,draftType:row.draft_type,schemaVersion:row.schema_version,version:row.object_version,digest:row.digest,priorDigest:row.prior_digest,expiresAt:new Date(row.expires_at).toISOString(),createdAt:new Date(row.created_at).toISOString()};}
export function savedDraftRef(row){return Object.freeze({sourceKind:'SAVED_INTAKE',draftId:row.draft_id,kind:row.draft_type,version:row.object_version,schemaVersion:row.schema_version,contentDigest:row.digest,ownerRef:row.user_id,subjectRef:row.user_id,savedAt:new Date(row.created_at).toISOString(),sourceRef:`ACCOUNT_DRAFT:${row.draft_id}:${row.object_version}`});}
export async function loadOwnedDraft(context,{draftId,version,expectedRef,kind}={}){
 const identity=normalizeVerifiedSymbolicAccountIdentity(context.data?.symbolicAccountIdentity);if(!identity)throw fail('ACCOUNT_REQUIRED',401);
 const db=context.env?.RUNTIME_DB;if(!db?.prepare)throw fail('DRAFT_STORAGE_UNAVAILABLE',503);
 if(typeof draftId!=='string'||!draftId||draftId.length>128)throw fail('DRAFT_ID_INVALID');
 if(version!==undefined&&(!Number.isInteger(version)||version<1))throw fail('DRAFT_VERSION_INVALID');
 const row=await (version===undefined?db.prepare('SELECT * FROM account_financial_will_drafts WHERE user_id=? AND draft_id=? ORDER BY object_version DESC LIMIT 1').bind(identity.userId,draftId):db.prepare('SELECT * FROM account_financial_will_drafts WHERE user_id=? AND draft_id=? AND object_version=?').bind(identity.userId,draftId,version)).first();
 // An absent foreign-owned draft is indistinguishable from an absent local draft.
 if(!row)throw fail('DRAFT_NOT_FOUND',404);
 if(row.expires_at<=Date.now())throw fail('DRAFT_EXPIRED',410);
 if(![FW_V1,FW_V2].includes(row.schema_version))throw fail('DRAFT_SCHEMA_UNSUPPORTED',422);
 if(kind&&row.draft_type!==kind)throw fail('DRAFT_TYPE_MISMATCH',422);
 if(row.key_version!=='v1')throw fail('DRAFT_KEY_VERSION_UNAVAILABLE',503);
 const ref=savedDraftRef(row);
 if(expectedRef&&Object.keys(ref).some(k=>expectedRef[k]!==ref[k]))throw fail('DRAFT_REFERENCE_MISMATCH',409);
 const key=await encryptionKey(context.env);let data;
 try{data=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(row.iv),additionalData:aad(identity.userId,row.draft_type,draftId,row.object_version,row.expires_at,row.schema_version)},key,unb64(row.ciphertext));}catch{throw fail('DRAFT_DECRYPTION_FAILED',422);}
 const text=decoder.decode(data);if(await digest(text)!==row.digest)throw fail('DRAFT_INTEGRITY_FAILED',409);
 let payload;try{payload=validateDraftVersion(row.draft_type,JSON.parse(text),row.schema_version);}catch(e){throw fail(e.code||'DRAFT_STRUCTURE_INVALID',422);}
 return {ok:true,...metadata(row),savedDraftRef:ref,payload};
}
export async function draftApi(context){
 try{
  const identity=normalizeVerifiedSymbolicAccountIdentity(context.data?.symbolicAccountIdentity);if(!identity)throw fail('ACCOUNT_REQUIRED',401);
  const db=context.env?.RUNTIME_DB;if(!db?.prepare)throw fail('DRAFT_STORAGE_UNAVAILABLE',503);
  const userId=identity.userId,now=Date.now(),url=new URL(context.request.url),type=url.searchParams.get('type');
  if(type&&!['FINANCIAL','WILL'].includes(type))throw fail('DRAFT_TYPE_INVALID');
  if(context.request.method==='GET'){
   const id=url.searchParams.get('id');
   if(!id){const records=await db.prepare('SELECT d.* FROM account_financial_will_drafts d WHERE d.user_id=? AND (? IS NULL OR d.draft_type=?) AND d.expires_at>? AND d.object_version=(SELECT MAX(x.object_version) FROM account_financial_will_drafts x WHERE x.user_id=d.user_id AND x.draft_id=d.draft_id) ORDER BY d.created_at DESC LIMIT 100').bind(userId,type,type,now).all();return reply({ok:true,accountOwnerRef:userId,drafts:records.results.map(metadata)});}
   const rawVersion=url.searchParams.get('version');return reply(await loadOwnedDraft(context,{draftId:id,...(rawVersion!==null?{version:Number(rawVersion)}:{})}));
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
  const kind=body.draftType,payload=validateDraftVersion(kind,body.payload,schema),expires=Date.parse(body.expiresAt);
  if(!Number.isFinite(expires)||expires<=now||expires>now+366*86400000)throw fail('DRAFT_RETENTION_DATE_REQUIRED');
  if(body.purpose!==(kind==='WILL'?'WILL_ASSEMBLY':'FINANCIAL_PLANNING'))throw fail('DRAFT_PURPOSE_REQUIRED',403);
  let grant=null,financialSourceRef=null;
  const expected=body.expectedVersion??0;if(!Number.isInteger(expected)||expected<0)throw fail('DRAFT_VERSION_INVALID');
  let prior=null,id=body.draftId;
  if(id){prior=await db.prepare('SELECT * FROM account_financial_will_drafts WHERE user_id=? AND draft_id=? ORDER BY object_version DESC LIMIT 1').bind(userId,id).first();if(!prior||prior.expires_at<=now)throw fail('DRAFT_NOT_FOUND',404);if(prior.draft_type!==kind||prior.object_version!==expected)throw fail('DRAFT_VERSION_CONFLICT',409);if(prior.legal_hold_reference)throw fail('DRAFT_RIGHTS_REVIEW_REQUIRED',409);}else{if(expected!==0)throw fail('DRAFT_VERSION_CONFLICT',409);id=kind==='WILL'&&context.data?.financialPurposeGrant?.newWillDraftId||crypto.randomUUID();}
  if(kind==='WILL'){
   const old=prior?await loadOwnedDraft(context,{draftId:id,version:prior.object_version}):null;
   if(JSON.stringify(old?.payload.financialSource)!==JSON.stringify(payload.financialSource)){
    const witness=context.data?.financialPurposeGrant,s=payload.financialSource;
    if(!s||witness?.grantId!==s.grantId||witness?.sourceRef!==s.savedDraftRef.sourceRef||witness?.sourceDigest!==s.savedDraftRef.contentDigest||witness?.mappingDigest!==s.mappingDigest)throw fail('WILL_IMPORT_SERVER_PROPOSAL_REQUIRED',403);
   }
    const s=payload.financialSource,witness=context.data?.financialPurposeGrant;
    if(s){
     if(!s.scopes.length||s.scopes.some(x=>!['assets','liabilities','guarantees'].includes(x))||new Set(s.scopes).size!==s.scopes.length)throw fail('WILL_IMPORT_SCOPE_INVALID',422);
     const freshImport=witness?.grantId===s.grantId&&witness?.mappingDigest===s.mappingDigest&&witness?.sourceRef===s.savedDraftRef.sourceRef&&witness?.sourceDigest===s.savedDraftRef.contentDigest;
     if(freshImport){const source=await loadOwnedDraft(context,{draftId:s.savedDraftRef.draftId,version:s.savedDraftRef.version,expectedRef:s.savedDraftRef,kind:'FINANCIAL'});financialSourceRef=source.savedDraftRef;grant=await requireFinancialGrant(context,{grantId:s.grantId,source:source.savedDraftRef,purpose:'WILL_ASSEMBLY',scopes:s.scopes});}
     else for(const section of s.scopes)if(JSON.stringify(old?.payload.sections?.[section])!==JSON.stringify(payload.sections?.[section]))throw fail('WILL_IMPORTED_FACT_UPDATE_REQUIRES_PROPOSAL',403);
     // Existing imported bytes are historical Will material. Revocation closes
     // new source reads/imports, but does not silently erase them or freeze wishes.
    }
  }
  const version=expected+1,text=JSON.stringify(payload),iv=crypto.getRandomValues(new Uint8Array(12)),key=await encryptionKey(context.env),hash=await digest(text);
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(userId,kind,id,version,expires)},key,encoder.encode(text));
  const grantClause=grant?' AND EXISTS(SELECT 1 FROM financial_purpose_grants WHERE grant_id=? AND owner_id=? AND purpose=? AND source_ref=? AND source_digest=? AND revoked_at IS NULL AND expires_at>?) AND EXISTS(SELECT 1 FROM account_financial_will_drafts WHERE draft_id=? AND user_id=? AND object_version=? AND digest=? AND schema_version=? AND expires_at>?)':'';
  const args=[id,userId,kind,schema,version,b64(new Uint8Array(ciphertext)),b64(iv),'v1',hash,prior?.digest||null,crypto.randomUUID(),crypto.randomUUID(),expires,now,userId,id,expected,userId,id];
  if(grant)args.push(grant.grant_id,userId,'WILL_ASSEMBLY',grant.source_ref,grant.source_digest,Date.now(),financialSourceRef.draftId,userId,financialSourceRef.version,financialSourceRef.contentDigest,financialSourceRef.schemaVersion,Date.now());
  const result=await db.prepare('INSERT INTO account_financial_will_drafts(draft_id,user_id,draft_type,schema_version,object_version,ciphertext,iv,key_version,digest,prior_digest,retention_id,consent_id,expires_at,created_at) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE COALESCE((SELECT MAX(object_version) FROM account_financial_will_drafts WHERE user_id=? AND draft_id=?),0)=? AND NOT EXISTS(SELECT 1 FROM account_financial_will_drafts WHERE user_id=? AND draft_id=? AND legal_hold_reference IS NOT NULL)'+grantClause).bind(...args).run();
  if((result.meta?.changes??result.changes)!==1)throw fail('DRAFT_VERSION_CONFLICT',409);
  const row={draft_id:id,draft_type:kind,user_id:userId,object_version:version,schema_version:schema,digest:hash,prior_digest:prior?.digest||null,expires_at:expires,created_at:now};
  return reply({ok:true,...metadata(row),savedDraftRef:savedDraftRef(row),saved:true});
 }catch(error){return reply({ok:false,code:error.code||'DRAFT_REQUEST_INVALID'},error.status||400);}
}
