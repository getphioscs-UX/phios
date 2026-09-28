import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
export const RNT2_GOVERNANCE_VERSION='PHI-OS-RNT2-GOVERNANCE-v1.0.0';
function text(v){return String(v??'').trim();}
export async function buildReportSectionGenerationIdentity(input={}){
 const required=['methodId','sectionKey','locale','compositionVersion','promptVersion','authorityVersion','claimIrVersion','verifierVersion','evidenceDigest','schemaVersion','provider','model'];
 for(const k of required)if(!text(input[k]))throw Object.assign(new Error('RNT2_GENERATION_IDENTITY_FIELD_REQUIRED'),{field:k});
 const seed=Object.fromEntries(required.map(k=>[k,text(input[k])]));
 const digest=await sha256Stable(seed);
 return deepFreeze({schemaVersion:'PHI-OS-RNT2-GENERATION-IDENTITY-v1.0.0',...seed,generationKey:`RNT2-${digest.toUpperCase()}`});
}
export function classifyProviderFailure(error){
 const code=text(error?.code||error?.message).toUpperCase();
 if(/429|RATE/.test(code))return 'PROVIDER_RATE_LIMIT';
 if(/TIMEOUT/.test(code))return 'PROVIDER_TIMEOUT';
 if(/NETWORK|FETCH|CONNECT/.test(code))return 'PROVIDER_NETWORK';
 return 'PROVIDER_OTHER';
}
export function retryDecision({attemptCount=0,errorClass=null}={}){
 const retryable=['PROVIDER_RATE_LIMIT','PROVIDER_TIMEOUT','PROVIDER_NETWORK'].includes(errorClass);
 return deepFreeze({retryAllowed:retryable&&attemptCount<1,maxProviderRetries:1,nextAttempt:retryable&&attemptCount<1?attemptCount+1:null});
}
export function semanticRepairDecision({verification,repairCount=0}={}){
 const rejected=verification?.accepted===false;
 return deepFreeze({repairAllowed:rejected&&repairCount<1,maxRepair:1,mode:rejected&&repairCount<1?'TARGETED_SEMANTIC_REPAIR':'NO_REPAIR'});
}
export default Object.freeze({buildReportSectionGenerationIdentity,classifyProviderFailure,retryDecision,semanticRepairDecision});
