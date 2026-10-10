import {SMR_R2_DEDUP_RULES} from './smr-rules.js';
const list=value=>Array.isArray(value)?value:[];
const uniq=value=>[...new Set(list(value).filter(Boolean))];
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))freeze(item)}return value};
const norm=value=>String(value??'').toUpperCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const tokens=value=>new Set(norm(value).split(/\s+/).filter(Boolean));
function jaccard(a,b){const A=a instanceof Set?a:new Set(a),B=b instanceof Set?b:new Set(b);if(!A.size&&!B.size)return 1;let hit=0;for(const x of A)if(B.has(x))hit++;return hit/(A.size+B.size-hit||1)}
function hash(value){let h=2166136261;for(const ch of String(value)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(16).toUpperCase().padStart(8,'0')}
function exact(a,b){return norm(`${a.headline} ${a.structuralMeaning}`)===norm(`${b.headline} ${b.structuralMeaning}`)}
function similar(a,b){
  const evidence=jaccard(new Set(list(a.evidenceRefs)),new Set(list(b.evidenceRefs)));
  const text=jaccard(tokens(`${a.headline} ${a.structuralMeaning}`),tokens(`${b.headline} ${b.structuralMeaning}`));
  const sameDimension=a.semanticDimension===b.semanticDimension;
  return exact(a,b)||(sameDimension&&evidence>=SMR_R2_DEDUP_RULES.sameDimensionEvidenceJaccard)||(text>=SMR_R2_DEDUP_RULES.claimTokenJaccard&&evidence>=SMR_R2_DEDUP_RULES.claimEvidenceJaccard);
}
export function deduplicateClaims({claims}={}){
  const ranked=[...list(claims)].sort((a,b)=>(b.priorityScore||0)-(a.priorityScore||0)||a.claimId.localeCompare(b.claimId));
  const clusters=[];
  for(const claim of ranked){let cluster=clusters.find(c=>c.claims.some(other=>similar(claim,other)));if(!cluster){cluster={claims:[]};clusters.push(cluster)}cluster.claims.push(claim)}
  const decisions=[];const semanticClusters=clusters.map(cluster=>{
    const ordered=[...cluster.claims].sort((a,b)=>(b.priorityScore||0)-(a.priorityScore||0)||a.claimId.localeCompare(b.claimId));const primary=ordered[0];
    for(const claim of ordered){
      let decision='PRIMARY_EXPLANATION';
      if(claim!==primary){if(exact(primary,claim))decision='SUPPRESSED_DUPLICATE';else if(['TENSION','CONDITION','TRADEOFF','OPEN','TEMPORAL_ACTIVATION'].includes(claim.claimType))decision='CONTEXT_DERIVATIVE';else decision='SECONDARY_REFERENCE'}
      decisions.push(freeze({claimRef:claim.claimId,semanticClusterId:`SMR2-CLUSTER-${hash(ordered.map(c=>c.claimId).sort().join('|'))}`,decision,primaryClaimRef:primary.claimId,newInformationRequired:decision==='CONTEXT_DERIVATIVE'}));
    }
    return freeze({semanticClusterId:`SMR2-CLUSTER-${hash(ordered.map(c=>c.claimId).sort().join('|'))}`,primaryClaimRef:primary.claimId,claimRefs:ordered.map(c=>c.claimId),fullExplanationCount:1});
  });
  return freeze({schemaVersion:'PHI-OS-SMR-R2-CLAIM-DEDUP-v1.0.0',semanticClusters,decisions:decisions.sort((a,b)=>a.claimRef.localeCompare(b.claimRef)),boundary:{fullExplanationMaxPerCluster:1,tensionMayRemainDerivative:true,deterministic:true}});
}
