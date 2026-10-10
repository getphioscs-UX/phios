import crypto from 'node:crypto';
const SECRET_KEYS=/authorization|access[_-]?token|refresh[_-]?token|api[_-]?key|secret|password/i;
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])):value;
export const digest=value=>crypto.createHash('sha256').update(JSON.stringify(stable(value)),'utf8').digest('hex');
function scanSecrets(value,path='$',hits=[]){
  if(!value||typeof value!=='object')return hits;
  for(const [k,v] of Object.entries(value)){
    if(SECRET_KEYS.test(k)&&v!=null&&String(v).trim())hits.push(path+'.'+k);
    if(v&&typeof v==='object')scanSecrets(v,path+'.'+k,hits);
  }
  return hits;
}
export function validateMarketProviderPayload({payload,registry}={}){
  const reasons=[];
  const provider=(registry?.providers||[]).find(x=>x.providerId===payload?.providerId);
  if(!provider)reasons.push('PROVIDER_NOT_REGISTERED');
  if(!provider?.capabilities?.includes(payload?.capability))reasons.push('CAPABILITY_NOT_REGISTERED');
  if(!payload?.retrievedAt||Number.isNaN(Date.parse(payload.retrievedAt)))reasons.push('RETRIEVED_AT_INVALID');
  if(!payload?.request||typeof payload.request!=='object')reasons.push('REQUEST_REQUIRED');
  if(!payload?.rawResponse||typeof payload.rawResponse!=='object')reasons.push('RAW_RESPONSE_REQUIRED');
  const secrets=scanSecrets(payload);
  if(secrets.length)reasons.push('SECRET_MATERIAL_PRESENT:'+secrets.join(','));
  return {ok:reasons.length===0,reasons,provider};
}
export function normalizeMarketProviderPayload({payload,registry}={}){
  const check=validateMarketProviderPayload({payload,registry});
  if(!check.ok)return {record:null,rejected:{payloadId:payload?.payloadId||null,reasons:check.reasons}};
  const raw=payload.rawResponse;
  const records=Array.isArray(payload.normalizedRecords)?payload.normalizedRecords.map(row=>({
    fieldPath:String(row.fieldPath||'').trim(),
    instrument:String(row.instrument||'').trim(),
    timestamp:row.timestamp||null,
    value:row.value,
    unit:row.unit||null,
    meta:row.meta&&typeof row.meta==='object'?stable(row.meta):null
  })):[];
  if(records.some(x=>!x.fieldPath||!x.instrument))return {record:null,rejected:{payloadId:payload?.payloadId||null,reasons:['NORMALIZED_LINEAGE_REQUIRED']}};
  return {record:{
    snapshotId:String(payload.payloadId||'').trim(),
    providerId:payload.providerId,
    authorityClass:check.provider.authorityClass,
    cwaDomain:check.provider.cwaDomain,
    capability:payload.capability,
    request:payload.request,
    retrievedAt:new Date(payload.retrievedAt).toISOString(),
    responseDigest:digest(raw),
    records,
    sourceState:'PROVIDER_SNAPSHOT_NOT_CWA_ADMITTED',
    boundaries:{isFact:false,isEvidence:false,isCurrentData:false,financialRecommendationCreated:false,tradingActionCreated:false,credentialsPersisted:false}
  },rejected:null};
}
