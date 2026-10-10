const EXECUTION_PURPOSES = new Set(['SERVICE_DELIVERY','PROFESSIONAL_SERVICE']);
function t(v){return typeof v==='string'&&v.trim()?v.trim():null;}
function iso(v,label){ if(v===null||v===undefined) return null; const d=new Date(v); if(Number.isNaN(d.valueOf())) throw new TypeError(`${label} must be ISO date-time.`); return d.toISOString(); }
export function createConsentDataPurposeRuntime({purposeCodes=[],consentClasses=[],retentionClasses=[],visibilityScopes=[]}={}){
  const P=new Set(purposeCodes), C=new Set(consentClasses), R=new Set(retentionClasses), V=new Set(visibilityScopes);
  if(!P.size||!C.size||!R.size||!V.size) throw new TypeError('RDG registries are required.');
  function createRecord(input={}){
    for(const [value,set,label] of [[input.purposeCode,P,'purposeCode'],[input.consentClass,C,'consentClass'],[input.retentionClass,R,'retentionClass'],[input.visibilityScope,V,'visibilityScope']]) if(!set.has(value)) throw new TypeError(`${label} is not governed by RDG.`);
    const professionalAccess=input.professionalAccess===true; const professionalReference=t(input.professionalReference);
    if(professionalAccess && (input.consentClass!=='PROFESSIONAL_SHARING_CONSENT'||input.visibilityScope!=='ASSIGNED_PROFESSIONAL'||!professionalReference)) throw new Error('PROFESSIONAL_SHARING_CONSENT_REQUIRED');
    const withdrawal=input.withdrawal||{}; if(withdrawal.supported!==true||!['AVAILABLE','WITHDRAWN'].includes(withdrawal.status)) throw new TypeError('withdrawal state is invalid.');
    const withdrawnAt=iso(withdrawal.withdrawnAt,'withdrawnAt'); if(withdrawal.status==='WITHDRAWN'&&!withdrawnAt) throw new TypeError('withdrawnAt is required after withdrawal.'); if(withdrawal.status==='AVAILABLE'&&withdrawnAt) throw new TypeError('withdrawnAt must be null while withdrawal is available.');
    const consentValid=input.consentValid===true && withdrawal.status==='AVAILABLE';
    return Object.freeze({schemaVersion:'PHI-OS-MPA-CONSENT-DATA-PURPOSE-RECORD-v1.0.0',consentRecordId:t(input.consentRecordId)||(()=>{throw new TypeError('consentRecordId is required.');})(),subjectReference:t(input.subjectReference)||(()=>{throw new TypeError('subjectReference is required.');})(),methodCode:t(input.methodCode)||(()=>{throw new TypeError('methodCode is required.');})(),purposeCode:input.purposeCode,consentClass:input.consentClass,retentionClass:input.retentionClass,visibilityScope:input.visibilityScope,professionalAccess,professionalReference:professionalAccess?professionalReference:null,grantedAt:iso(input.grantedAt,'grantedAt')||(()=>{throw new TypeError('grantedAt is required.');})(),expiresAt:iso(input.expiresAt,'expiresAt'),consentValid,withdrawal:Object.freeze({supported:true,status:withdrawal.status,withdrawnAt})});
  }
  function assertExecutionPermission({canonicalInput,consentRecord,now=new Date().toISOString()}={}){
    if(!canonicalInput||!consentRecord) throw new Error('MPA_CONSENT_INVALID');
    if(canonicalInput.consentRecordId!==consentRecord.consentRecordId||canonicalInput.subjectReference!==consentRecord.subjectReference||canonicalInput.methodCode!==consentRecord.methodCode) throw new Error('MPA_CONSENT_INVALID');
    if(canonicalInput.purposeCode!==consentRecord.purposeCode||!EXECUTION_PURPOSES.has(consentRecord.purposeCode)||!P.has(consentRecord.purposeCode)) throw new Error('MPA_PURPOSE_INVALID');
    if(consentRecord.consentValid!==true||consentRecord.withdrawal?.status!=='AVAILABLE') throw new Error('MPA_CONSENT_INVALID');
    if(consentRecord.expiresAt && Date.parse(consentRecord.expiresAt)<=Date.parse(now)) throw new Error('MPA_CONSENT_INVALID');
    return true;
  }
  return Object.freeze({createRecord,assertExecutionPermission});
}
export default Object.freeze({createConsentDataPurposeRuntime});
