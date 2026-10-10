import { evaluateHealthDataGovernance } from './health-sensitive-data-governance.js';
const enc=new TextEncoder(); const b64=b=>{let s='';for(const x of b)s+=String.fromCharCode(x);return btoa(s).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'')};
async function key(secret){const d=await crypto.subtle.digest('SHA-256',enc.encode(`phi-os:health-data:v1:${secret}`));return crypto.subtle.importKey('raw',d,{name:'AES-GCM'},false,['encrypt']);}
async function encrypt(value,secret){if(!secret)throw new Error('HRX_HEALTH_DATA_SECRET_REQUIRED');const iv=crypto.getRandomValues(new Uint8Array(12));const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(secret),enc.encode(JSON.stringify(value)));return `v1.${b64(iv)}.${b64(new Uint8Array(ct))}`;}
export async function persistHealthReality({db,secret,accountRef,reality,consentState,purpose='USER_REQUESTED_CONTINUITY'}={}){
  const g=evaluateHealthDataGovernance({dataClasses:['SYMPTOM','LAB_RESULT','MEDICATION'],consentState,purpose});
  if(!g.persistAllowed)throw new Error('HRX_HEALTH_PERSISTENCE_CONSENT_REQUIRED'); if(!db?.prepare)throw new Error('HRX_HEALTH_DB_BINDING_REQUIRED'); if(!accountRef||!reality?.caseRef)throw new Error('HRX_HEALTH_PERSISTENCE_ID_REQUIRED');
  const payload=await encrypt(reality,secret); const now=new Date().toISOString();
  await db.prepare('INSERT INTO health_reality_records (case_ref, account_ref, encrypted_payload, created_at, updated_at) VALUES (?1,?2,?3,?4,?4) ON CONFLICT(case_ref) DO UPDATE SET encrypted_payload=excluded.encrypted_payload, updated_at=excluded.updated_at').bind(reality.caseRef,accountRef,payload,now).run();
  return {persisted:true,caseRef:reality.caseRef,encrypted:true,governance:g};
}
