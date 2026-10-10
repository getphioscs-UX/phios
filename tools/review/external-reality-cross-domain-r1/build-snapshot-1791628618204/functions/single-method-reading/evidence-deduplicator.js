const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};
function fail(code){throw Object.assign(new Error(code),{code})}
export function deduplicateEvidence({claims}={}){
  const items=list(claims);if(!items.length)fail('SMR_R2_EVIDENCE_DEDUP_CLAIMS_REQUIRED');
  const owners=new Map();
  for(const claim of items){for(const ref of uniq(claim.evidenceRefs)){if(!owners.has(ref))owners.set(ref,[]);owners.get(ref).push(claim)}}
  const evidence=[...owners.entries()].map(([evidenceRef,claimsForRef])=>{
    const ranked=[...claimsForRef].sort((a,b)=>(b.priorityScore||0)-(a.priorityScore||0)||a.claimId.localeCompare(b.claimId));
    return freeze({evidenceRef,primaryClaimRef:ranked[0].claimId,secondaryClaimRefs:ranked.slice(1).map(c=>c.claimId),decision:ranked.length>1?'PRIMARY_WITH_SECONDARY_REFERENCES':'PRIMARY_ONLY',lineagePreserved:true});
  }).sort((a,b)=>a.evidenceRef.localeCompare(b.evidenceRef));
  return freeze({schemaVersion:'PHI-OS-SMR-R2-EVIDENCE-DEDUP-v1.0.0',evidence,boundary:{evidenceDeleted:false,lineagePreserved:true,deterministic:true}});
}
