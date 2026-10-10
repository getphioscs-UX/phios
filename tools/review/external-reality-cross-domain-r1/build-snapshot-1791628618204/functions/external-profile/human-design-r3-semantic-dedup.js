import crypto from 'node:crypto';
import {HD_R3_PRECEDENCE} from './human-design-r3-composition-runtime.js';

export const HD_R3_DEDUP_VERSION='PHI-OS-HD-PRO-R3-W13-SEMANTIC-DEDUP-v1.0.0';
export const HD_R3_DEDUP_PRECEDENCE=Object.freeze([
  Object.freeze({precedenceClass:'CHART_LEVEL_COMPOSITION',rank:HD_R3_PRECEDENCE.CHART_LEVEL_COMPOSITION}),
  Object.freeze({precedenceClass:'AUTHORITY_COMPOSITION',rank:HD_R3_PRECEDENCE.AUTHORITY_COMPOSITION}),
  Object.freeze({precedenceClass:'PROFILE_COMPOSITION',rank:HD_R3_PRECEDENCE.PROFILE_COMPOSITION}),
  Object.freeze({precedenceClass:'CHANNEL_COMPOSITION',rank:HD_R3_PRECEDENCE.CHANNEL_COMPOSITION}),
  Object.freeze({precedenceClass:'DEFINITION_COMPOSITION',rank:HD_R3_PRECEDENCE.DEFINITION_COMPOSITION}),
  Object.freeze({precedenceClass:'CENTER_MEANING',rank:HD_R3_PRECEDENCE.CENTER_MEANING}),
  Object.freeze({precedenceClass:'GATE_DETAIL',rank:HD_R3_PRECEDENCE.GATE_DETAIL}),
  Object.freeze({precedenceClass:'ADVANCED_VARIABLE_MODIFIER',rank:HD_R3_PRECEDENCE.ADVANCED_VARIABLE_MODIFIER})
]);

const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])):value;
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex').slice(0,24);
const uniq=arr=>[...new Set((arr||[]).filter(Boolean))];
const sortedUniq=arr=>uniq(arr).sort();
const overlap=(a,b)=>{const bs=new Set(b||[]);return (a||[]).some(x=>bs.has(x));};
const exactSet=(a,b)=>JSON.stringify(sortedUniq(a))===JSON.stringify(sortedUniq(b));

function inferredRank(claim){
  if(Number.isFinite(claim?.precedenceRank)) return claim.precedenceRank;
  const cls=claim?.precedenceClass;
  if(cls && Number.isFinite(HD_R3_PRECEDENCE[cls])) return HD_R3_PRECEDENCE[cls];
  const owner=String(claim?.semanticOwnerId||'').toLowerCase();
  if(owner.includes('.authority')) return HD_R3_PRECEDENCE.AUTHORITY_COMPOSITION;
  if(owner.includes('.profile')) return HD_R3_PRECEDENCE.PROFILE_COMPOSITION;
  if(owner.includes('.channel')) return HD_R3_PRECEDENCE.CHANNEL_COMPOSITION;
  if(owner.includes('.definition')) return HD_R3_PRECEDENCE.DEFINITION_COMPOSITION;
  if(owner.includes('.center')) return HD_R3_PRECEDENCE.CENTER_MEANING;
  if(owner.includes('.gate')) return HD_R3_PRECEDENCE.GATE_DETAIL;
  if(owner.includes('.advanced')) return HD_R3_PRECEDENCE.ADVANCED_VARIABLE_MODIFIER;
  return 0;
}

function inferredClass(claim){
  if(claim?.precedenceClass) return claim.precedenceClass;
  const rank=inferredRank(claim);
  return HD_R3_DEDUP_PRECEDENCE.find(x=>x.rank===rank)?.precedenceClass||'UNMAPPED_SUPPORTING_DETAIL';
}

function duplicateReason(a,b){
  const ca=a.semanticClusterId, cb=b.semanticClusterId;
  if(ca&&cb&&ca===cb) return 'SAME_SEMANTIC_CLUSTER';
  const ra=a.realityImplicationKey, rb=b.realityImplicationKey;
  if(ra&&rb&&ra===rb) return 'SAME_REALITY_IMPLICATION';
  if((a.sourceRefs?.length||0)>0 && (b.sourceRefs?.length||0)>0 && exactSet(a.sourceRefs,b.sourceRefs)) return 'SAME_EVIDENCE_SET';
  if((a.sourceRefs?.length||0)>0 && (b.sourceRefs?.length||0)>0 && overlap(a.sourceRefs,b.sourceRefs) && ra&&rb&&ra===rb) return 'OVERLAPPING_EVIDENCE_AND_REALITY';
  return null;
}

function compareClaims(a,b){
  const rankDiff=inferredRank(b)-inferredRank(a);
  if(rankDiff) return rankDiff;
  const compDiff=Number(Boolean(b.compositionSupported))-Number(Boolean(a.compositionSupported));
  if(compDiff) return compDiff;
  const sourceDiff=(b.sourceRefs?.length||0)-(a.sourceRefs?.length||0);
  if(sourceDiff) return sourceDiff;
  const subjectDiff=(b.subjectRefs?.length||0)-(a.subjectRefs?.length||0);
  if(subjectDiff) return subjectDiff;
  return String(a.claimId||'').localeCompare(String(b.claimId||''));
}

export function deduplicateHumanDesignR3Claims(inputClaims=[]){
  const claims=(inputClaims||[]).filter(Boolean).map(c=>({...c}));
  const parent=claims.map((_,i)=>i);
  const find=i=>parent[i]===i?i:(parent[i]=find(parent[i]));
  const union=(i,j)=>{const a=find(i),b=find(j);if(a!==b) parent[Math.max(a,b)]=Math.min(a,b);};
  const reasons=new Map();
  for(let i=0;i<claims.length;i++){
    for(let j=i+1;j<claims.length;j++){
      const reason=duplicateReason(claims[i],claims[j]);
      if(reason){union(i,j);reasons.set(`${i}:${j}`,reason);}
    }
  }
  const groups=new Map();
  for(let i=0;i<claims.length;i++){
    const root=find(i);
    if(!groups.has(root)) groups.set(root,[]);
    groups.get(root).push(i);
  }

  const clusters=[];
  const primaryClaims=[];
  const supportingClaims=[];
  for(const indexes of [...groups.values()].sort((a,b)=>Math.min(...a)-Math.min(...b))){
    const members=indexes.map(i=>claims[i]).sort(compareClaims);
    const primary={...members[0]};
    const supports=members.slice(1).map(s=>({
      claimId:s.claimId,
      precedenceClass:inferredClass(s),
      precedenceRank:inferredRank(s),
      compositionRuleId:s.compositionRuleId||null,
      semanticOwnerId:s.semanticOwnerId||null,
      subjectRefs:sortedUniq(s.subjectRefs),
      sourceRefs:sortedUniq(s.sourceRefs),
      semanticClusterId:s.semanticClusterId||null,
      realityImplicationKey:s.realityImplicationKey||null,
      role:'SUPPORTING_EVIDENCE'
    }));
    const allSources=sortedUniq(members.flatMap(x=>x.sourceRefs||[]));
    const allSubjects=sortedUniq(members.flatMap(x=>x.subjectRefs||[]));
    const clusterId=primary.semanticClusterId||primary.realityImplicationKey||`DEDUP-${digest(members.map(x=>x.claimId))}`;
    primary.precedenceClass=inferredClass(primary);
    primary.precedenceRank=inferredRank(primary);
    primary.dedupRole='PRIMARY_EXPLANATION';
    primary.supportingEvidence=Object.freeze(supports);
    primary.evidenceRefs=Object.freeze(allSources);
    primary.clusterSubjectRefs=Object.freeze(allSubjects);
    primaryClaims.push(Object.freeze(primary));
    for(const s of supports) supportingClaims.push(Object.freeze(s));
    const reasonSet=new Set();
    for(let x=0;x<indexes.length;x++) for(let y=x+1;y<indexes.length;y++){
      const i=Math.min(indexes[x],indexes[y]),j=Math.max(indexes[x],indexes[y]);
      const reason=reasons.get(`${i}:${j}`); if(reason) reasonSet.add(reason);
    }
    clusters.push(Object.freeze({
      clusterId,
      primaryClaimId:primary.claimId,
      primaryPrecedenceClass:primary.precedenceClass,
      primaryPrecedenceRank:primary.precedenceRank,
      memberClaimIds:Object.freeze(members.map(x=>x.claimId)),
      supportingClaimIds:Object.freeze(supports.map(x=>x.claimId)),
      duplicateReasons:Object.freeze([...reasonSet].sort()),
      evidenceRefs:Object.freeze(allSources),
      subjectRefs:Object.freeze(allSubjects)
    }));
  }
  const result={
    schemaVersion:HD_R3_DEDUP_VERSION,
    precedence:HD_R3_DEDUP_PRECEDENCE,
    inputClaimCount:claims.length,
    primaryClaimCount:primaryClaims.length,
    supportingClaimCount:supportingClaims.length,
    primaryClaims:Object.freeze(primaryClaims),
    supportingClaims:Object.freeze(supportingClaims),
    clusters:Object.freeze(clusters),
    boundaries:Object.freeze({
      onePrimaryExplanationPerDedupCluster:true,
      supportingEvidenceRetained:true,
      sourceEvidenceDeleted:false,
      advancedVariableMayOverrideCore:false,
      authorityCompositionMayBeSuppressedByLowerPrecedence:false,
      r3CustomerPublishable:false
    })
  };
  return Object.freeze({...result,dedupDigest:digest(result)});
}
