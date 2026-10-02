const PRECEDENCE=Object.freeze({OFFICIAL_PRIMARY:100,REGULATOR:95,PUBLIC_HEALTH:95,GOVERNMENT:90,OFFICIAL_COMPANY:85,ACADEMIC:80,MARKET_DATA_PROVIDER:78,REPUTABLE_NEWS:70,SECONDARY_REFERENCE:55,COMMUNITY:25});
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const semantic=record=>JSON.stringify(stable(record));
const uniq=v=>[...new Set((v||[]).filter(Boolean))].sort();

function assertEligible(row,label){
  if(row?.rreEligibility!=='RRE_ELIGIBLE')throw new Error('W8D_P2_NON_ELIGIBLE_'+label);
  if(row?.supportLevel!=='DIRECT')throw new Error('W8D_P2_NON_DIRECT_'+label);
  if(row?.evidenceState!=='CWA_ADMITTED')throw new Error('W8D_P2_NOT_CWA_ADMITTED_'+label);
  if(!row?.claimId||!row?.sourceId||!row?.dossierId||!row?.laneId)throw new Error('W8D_P2_LINEAGE_REQUIRED_'+label);
}

export function mergeMultiAuthorityEvidence({officialHandoff,providerHandoff}={}){
  const official=officialHandoff?.records||[];
  const provider=providerHandoff?.records||[];
  const byId=new Map();
  const originById=new Map();
  for(const [origin,rows] of [['OFFICIAL_REGULATOR_BATCH',official],['MARKET_DATA_PROVIDER_BATCH',provider]]){
    for(const row of rows){
      assertEligible(row,origin);
      if(origin==='MARKET_DATA_PROVIDER_BATCH'&&row.authorityClass!=='MARKET_DATA_PROVIDER')throw new Error('W8D_P2_PROVIDER_AUTHORITY_MISMATCH');
      if(origin==='OFFICIAL_REGULATOR_BATCH'&&row.authorityClass==='MARKET_DATA_PROVIDER')throw new Error('W8D_P2_OFFICIAL_BATCH_CONTAINS_PROVIDER');
      const prior=byId.get(row.claimId);
      if(prior&&semantic(prior)!==semantic(row))throw new Error('W8D_P2_CONFLICTING_DUPLICATE_CLAIM_ID:'+row.claimId);
      if(!prior){byId.set(row.claimId,row);originById.set(row.claimId,origin);}
    }
  }
  const records=[...byId.values()].map(row=>({
    ...row,
    mergeLineage:{
      originBatch:originById.get(row.claimId),
      originalAuthorityClass:row.authorityClass,
      authorityPrecedence:PRECEDENCE[row.authorityClass]??null,
      sourceVotingUsed:false,
      authorityPromoted:false
    }
  })).sort((a,b)=>a.claimId.localeCompare(b.claimId));
  const authorityClasses=uniq(records.map(x=>x.authorityClass));
  const lanes=uniq(records.map(x=>x.laneId));
  const byLane=Object.fromEntries(lanes.map(lane=>{
    const rows=records.filter(x=>x.laneId===lane);
    return [lane,{evidenceCount:rows.length,authorityClasses:uniq(rows.map(x=>x.authorityClass)),claimIds:uniq(rows.map(x=>x.claimId))}];
  }));
  return {
    records,
    summary:{
      officialOrRegulatorEvidence:records.filter(x=>x.mergeLineage.originBatch==='OFFICIAL_REGULATOR_BATCH').length,
      marketDataProviderEvidence:records.filter(x=>x.mergeLineage.originBatch==='MARKET_DATA_PROVIDER_BATCH').length,
      totalEvidence:records.length,
      distinctLanes:lanes.length,
      authorityClasses,
      laneComposition:byLane,
      sourceVotingUsed:false,
      authorityPromotionUsed:false
    }
  };
}
