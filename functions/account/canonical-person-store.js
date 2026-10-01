import {normalizeVerifiedSymbolicAccountIdentity} from '../symbolic-method-persistence/symbolic-account-identity-v1.js';
import {validateCanonicalBirthInput} from '../method-client-delivery/canonical-birth-input-runtime.js';
import {admitPersonUse,assertNoPersistedIdentity} from './person-use-policy.js';
import {digest} from './oidc-auth.js';

const schema='CANONICAL_ACCOUNT_PERSON_V1', encoder=new TextEncoder(),decoder=new TextDecoder();
const fail=(code,status=400)=>Object.assign(new Error(code),{code,status});
const b64=bytes=>btoa(String.fromCharCode(...bytes));
const unb64=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
export function personIdentity(context){
 const identity=normalizeVerifiedSymbolicAccountIdentity(context.data?.symbolicAccountIdentity);
 if(!identity)throw fail('ACCOUNT_REQUIRED',401);
 return identity;
}
function database(env){if(!env?.RUNTIME_DB?.prepare)throw fail('PERSON_STORAGE_UNAVAILABLE',503);return env.RUNTIME_DB;}
async function key(env){
 try{
  // Dedicated binding; never borrow another product's encryption key.
  const raw=env.CANONICAL_PERSON_ENCRYPTION_KEY;
  if(typeof raw!=='string'||!/^[a-f0-9]{64}$/i.test(raw))throw 0;
  return await crypto.subtle.importKey('raw',Uint8Array.from(raw.match(/../g),x=>parseInt(x,16)),{name:'AES-GCM'},false,['encrypt','decrypt']);
 }catch{throw fail('PERSON_ENCRYPTION_CONFIGURATION_REQUIRED',503);}
}
const aad=(owner,id,version)=>encoder.encode(JSON.stringify([schema,owner,id,version]));
async function latest(env,owner,id){return database(env).prepare('SELECT * FROM account_person_versions WHERE owner_account_id=? AND person_id=? ORDER BY version DESC LIMIT 1').bind(owner,id).first();}
async function decode(env,row){
 let record,text;
 try{
  text=decoder.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(row.iv),additionalData:aad(row.owner_account_id,row.person_id,row.version)},await key(env),unb64(row.ciphertext)));
  record=JSON.parse(text);
 }catch(error){if(error.status===503)throw error;throw fail('PERSON_INTEGRITY_FAILED',409);}
 if(await digest(text)!==row.digest||record.personId!==row.person_id||record.ownerAccountId!==row.owner_account_id||record.version!==row.version||record.schemaVersion!==schema)throw fail('PERSON_INTEGRITY_FAILED',409);
 return record;
}
export async function loadCanonicalPerson(env,owner,id){
 const row=await latest(env,owner,id);if(!row)throw fail('PERSON_NOT_FOUND',404);
 return decode(env,row);
}
export async function listCanonicalPersons(context){
 const owner=personIdentity(context).userId;
 const rows=(await database(context.env).prepare('SELECT p.* FROM account_person_versions p WHERE p.owner_account_id=? AND p.version=(SELECT MAX(v.version) FROM account_person_versions v WHERE v.person_id=p.person_id) ORDER BY p.updated_at DESC LIMIT 100').bind(owner).all()).results;
 return Promise.all(rows.map(row=>decode(context.env,row)));
}
function only(value,keys){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!keys.includes(k)))throw fail('PERSON_REQUEST_INVALID');}
function consent(owner,id,purpose,version,now,expires){
 return {consentId:crypto.randomUUID(),personId:id,grantingSubjectReference:owner,purposeScope:purpose,dataScopes:purpose==='REPORT'?['personId','displayName']:['personId','displayName','birthDate','birthTime','birthPlace'],grantedAt:now,expiresAt:expires,revocationState:'ACTIVE',consentVersion:version,authorityBasis:'EXPLICIT_ACCOUNT_SELF_CONSENT'};
}
// Client declares their own birth data; server creates identity, provenance and consent IDs.
// Third-party/dependent intake remains closed until its existing authority policy is bound.
export async function saveCanonicalPerson(context,body){
 const owner=personIdentity(context).userId,env=context.env;
 only(body,['action','personId','expectedVersion','name','birth','calculationSex','consent','expiresAt']);assertNoPersistedIdentity(body);
 if(!['save','revoke'].includes(body.action)||!Number.isInteger(body.expectedVersion)||body.expectedVersion<0)throw fail('PERSON_REQUEST_INVALID');
 const old=body.personId?await loadCanonicalPerson(env,owner,body.personId):null;
 if((old?.version??0)!==body.expectedVersion)throw fail('PERSON_VERSION_CONFLICT',409);
 const now=new Date().toISOString(),id=old?.personId??crypto.randomUUID(),version=body.expectedVersion+1;
 let record;
 if(body.action==='revoke'){
  if(!old)throw fail('PERSON_NOT_FOUND',404);
  if(Object.keys(body).some(k=>!['action','personId','expectedVersion'].includes(k)))throw fail('PERSON_REQUEST_INVALID');
  record={...old,version,updatedAt:now,consentState:'REVOKED',methodConsent:{...old.methodConsent,revocationState:'REVOKED'},reportConsent:{...old.reportConsent,revocationState:'REVOKED'}};
 }else{
  if(typeof body.name!=='string'||!body.name.trim()||body.name.length>120)throw fail('PERSON_NAME_REQUIRED');
  only(body.consent,['personalMethod','report','saveBirthInput']);
  if(body.consent.personalMethod!==true||body.consent.report!==true||body.consent.saveBirthInput!==true)throw fail('PERSON_EXPLICIT_CONSENT_REQUIRED',403);
  const expires=Date.parse(body.expiresAt);if(!Number.isFinite(expires)||expires<=Date.now()||expires>Date.now()+366*86400000)throw fail('PERSON_CONSENT_EXPIRY_REQUIRED');
  only(body.birth,['birthDate','birthTime','birthPlace','timezone','timeAccuracy']);
  only(body.birth.birthPlace,['displayName','countryCode','latitude','longitude']);
  only(body.birth.timezone,['iana','utcOffsetAtBirth']);
  if(body.calculationSex!=null&&!['MALE','FEMALE'].includes(body.calculationSex))throw fail('PERSON_CALCULATION_SEX_INVALID');
  const methodConsent=consent(owner,id,'PERSONAL_METHOD',version,now,new Date(expires).toISOString()),reportConsent=consent(owner,id,'REPORT',version,now,new Date(expires).toISOString());
  const canonicalBirthInput={...body.birth,timezone:{...body.birth.timezone,source:'HUMAN_DECLARATION',confidence:'UNKNOWN'},locale:'en',consent:{recordId:methodConsent.consentId,granted:true,purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',persistence:'EXPLICIT'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
  if(!validateCanonicalBirthInput(canonicalBirthInput).valid)throw fail('PERSON_BIRTH_INPUT_INVALID');
  if(canonicalBirthInput.timezone.iana!==null){try{new Intl.DateTimeFormat('en',{timeZone:canonicalBirthInput.timezone.iana});}catch{throw fail('PERSON_TIMEZONE_INVALID');}}
  record={schemaVersion:schema,personId:id,ownerAccountId:owner,name:body.name.trim(),...body.birth,canonicalBirthInput,calculationSex:body.calculationSex??null,subjectClass:'SELF',consentState:'ACTIVE',methodConsent,reportConsent,createdAt:old?.createdAt??now,updatedAt:now,version,birthSourceRef:`CANONICAL_ACCOUNT_PERSON:${id}:v${version}`};
 }
 const text=JSON.stringify(record),iv=crypto.getRandomValues(new Uint8Array(12)),hash=await digest(text);
 const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad(owner,id,version)},await key(env),encoder.encode(text));
 const prior=old?await latest(env,owner,id):null;
 const result=await database(env).prepare('INSERT INTO account_person_versions(person_id,owner_account_id,version,ciphertext,iv,digest,prior_digest,created_at,updated_at) SELECT ?,?,?,?,?,?,?,?,? WHERE COALESCE((SELECT MAX(version) FROM account_person_versions WHERE person_id=?),0)=?').bind(id,owner,version,b64(new Uint8Array(ciphertext)),b64(iv),hash,prior?.digest??null,record.createdAt,now,id,body.expectedVersion).run();
 if(Number(result.meta?.changes??result.changes)!==1)throw fail('PERSON_VERSION_CONFLICT',409);
 return record;
}
// Shared projection uses the existing person-use-policy and no method semantics.
export async function loadCanonicalPersonSubject(env,owner,id){
 const r=await loadCanonicalPerson(env,owner,id);
 const person={personId:r.personId,accountOwnerUserId:r.ownerAccountId,displayName:r.name,subjectClass:r.subjectClass,birthDate:r.canonicalBirthInput.birthDate,birthTime:r.canonicalBirthInput.birthTime,birthPlace:r.canonicalBirthInput.birthPlace};
 admitPersonUse({userId:owner,person,consent:r.methodConsent,purpose:'PERSONAL_METHOD',requiredFields:['personId','displayName','birthDate','birthTime','birthPlace']});
 admitPersonUse({userId:owner,person,consent:r.reportConsent,purpose:'REPORT'});
 return {person,canonicalBirthInput:r.canonicalBirthInput,methodConsent:r.methodConsent,reportConsent:r.reportConsent,birthSourceRef:r.birthSourceRef,personVersion:r.version,calculationSex:r.calculationSex};
}
