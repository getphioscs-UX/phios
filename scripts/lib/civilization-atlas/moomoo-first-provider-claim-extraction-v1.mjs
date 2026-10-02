const byPath=(records,path)=>records.filter(x=>x.fieldPath===path);
const iso=v=>{const d=new Date(v);return v&&!Number.isNaN(d.valueOf())?d.toISOString():null;};
const fmt=v=>typeof v==='number'?String(v):String(v??'');

export function deriveHistoryKlineClaim({snapshot,source}={}){
  if(snapshot?.capability!=='HISTORY_KLINE')return null;
  const closes=byPath(snapshot.records||[],'data.kline_list[].close')
    .filter(x=>iso(x.timestamp)!=null)
    .sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));
  if(!closes.length)throw new Error('MOOMOO_PROVIDER_CLAIM_NO_CLOSE_SERIES:'+snapshot.snapshotId);
  const first=closes[0],last=closes[closes.length-1];
  const instrument=String(first.instrument||source?.title||'').trim();
  const start=iso(first.timestamp),end=iso(last.timestamp);
  const locatorValue=instrument+' close observations '+start.slice(0,10)+'..'+end.slice(0,10)+'; snapshot='+snapshot.snapshotId+'; digest='+snapshot.responseDigest;
  return {
    claimCandidateId:'MOOMOO-HISTORY-'+instrument.replace(/[^A-Za-z0-9]+/g,'-')+'-'+snapshot.responseDigest.slice(0,12),
    sourceId:source.sourceId,
    providerSnapshotId:snapshot.snapshotId,
    dossierId:source.dossierId,
    laneId:'PRESSURE_FIELD',
    claimType:'GENERAL_CURRENT_FACT',
    claimText:'Moomoo OpenAPI HISTORY_KLINE for '+instrument+' contains '+closes.length+' close observations spanning '+start.slice(0,10)+' to '+end.slice(0,10)+', with first observed close '+fmt(first.value)+' and last observed close '+fmt(last.value)+'.',
    sourceLocator:{type:'PROVIDER_SERIES_WINDOW',value:locatorValue},
    supportLevel:'DIRECT',
    supportNote:'Descriptive provider-series claim only. No trend, causality, pressure, constraint, reconfiguration, persistence or continuity interpretation is asserted.',
    observedAt:end,
    conflictGroup:null,
    jurisdiction:'US'
  };
}

export function buildFirstProviderClaims({snapshots,sources}={}){
  const sourceBySnapshot=new Map((sources?.records||[]).map(x=>[x.providerSnapshotId,x]));
  const claims=[],skipped=[];
  for(const snapshot of snapshots?.records||[]){
    if(snapshot.providerId!=='MOOMOO_OPENAPI')continue;
    const source=sourceBySnapshot.get(snapshot.snapshotId);
    if(!source){skipped.push({snapshotId:snapshot.snapshotId,reason:'W8A_PROVIDER_SOURCE_HANDOFF_MISSING'});continue;}
    if(snapshot.capability!=='HISTORY_KLINE'){skipped.push({snapshotId:snapshot.snapshotId,reason:'CAPABILITY_NOT_YET_SUPPORTED'});continue;}
    claims.push(deriveHistoryKlineClaim({snapshot,source}));
  }
  return {claims,skipped};
}
