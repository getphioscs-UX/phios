const text=v=>String(v??'').trim();
const day=86400000;
const MAX_AGE=Object.freeze({
  CLINICAL_GUIDANCE:30,NATIONAL_GUIDANCE:30,PUBLIC_HEALTH:30,PATIENT_INFORMATION:90,
  SERVICE_INFORMATION:30,RESEARCH_INFORMATION:90,GUIDANCE:30
});
export function evaluateHealthSourceFreshness(source={}, now=Date.now()){
  const retrieved=Date.parse(source.retrievedAt||'');
  if(!Number.isFinite(retrieved)) return {fresh:false,state:'FRESHNESS_UNKNOWN',reason:'RETRIEVED_AT_REQUIRED'};
  const claimTypes=Array.isArray(source.claimTypes)?source.claimTypes:[];
  const maxAgeDays=Math.min(...claimTypes.map(x=>MAX_AGE[x]||30),30);
  const ageDays=Math.max(0,(Number(now)-retrieved)/day);
  return {fresh:ageDays<=maxAgeDays,state:ageDays<=maxAgeDays?'FRESH':'STALE',ageDays:Number(ageDays.toFixed(3)),maxAgeDays,sourceId:text(source.sourceId),freshnessIsNotClinicalValidity:true};
}
export function versionHealthSource(previous,current){
  if(!current?.sourceId||!current?.contentDigest) throw new Error('HRX_SOURCE_VERSION_REQUIRED');
  const changed=Boolean(previous&&previous.contentDigest&&previous.contentDigest!==current.contentDigest);
  return {schemaVersion:'PHI-OS-HRX-SOURCE-VERSION-v1.0.0',sourceId:current.sourceId,previousDigest:previous?.contentDigest||null,currentDigest:current.contentDigest,contentChanged:changed,etag:current.etag||null,lastModified:current.lastModified||null,retrievedAt:current.retrievedAt,governance:{contentChangeDoesNotCreateClinicalJudgment:true}};
}
