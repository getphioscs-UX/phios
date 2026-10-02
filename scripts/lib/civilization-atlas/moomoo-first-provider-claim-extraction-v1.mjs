const byPath=(records,path)=>records.filter(x=>x.fieldPath===path);
const iso=v=>{const d=new Date(v);return v&&!Number.isNaN(d.valueOf())?d.toISOString():null;};
const fmt=v=>typeof v==='number'?String(v):String(v??'');
const uniq=v=>[...new Set((v||[]).filter(Boolean))];

function baseClaim({snapshot,source,laneId,slug,claimText,locatorValue,observedAt,supportNote}){
  return {
    claimCandidateId:'MOOMOO-'+slug+'-'+snapshot.responseDigest.slice(0,12),
    sourceId:source.sourceId,
    providerSnapshotId:snapshot.snapshotId,
    dossierId:source.dossierId,
    laneId,
    claimType:'GENERAL_CURRENT_FACT',
    claimText,
    sourceLocator:{type:'PROVIDER_SERIES_WINDOW',value:locatorValue},
    supportLevel:'DIRECT',
    supportNote,
    observedAt,
    conflictGroup:null,
    jurisdiction:'US'
  };
}

export function deriveHistoryKlineClaim({snapshot,source}={}){
  if(snapshot?.capability!=='HISTORY_KLINE')return null;
  const closes=byPath(snapshot.records||[],'data.kline_list[].close').filter(x=>iso(x.timestamp)!=null).sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));
  if(!closes.length)throw new Error('MOOMOO_PROVIDER_CLAIM_NO_CLOSE_SERIES:'+snapshot.snapshotId);
  const first=closes[0],last=closes[closes.length-1],instrument=String(first.instrument||'').trim(),start=iso(first.timestamp),end=iso(last.timestamp);
  return baseClaim({snapshot,source,laneId:'PRESSURE_FIELD',slug:'HISTORY-'+instrument.replace(/[^A-Za-z0-9]+/g,'-'),claimText:'Moomoo OpenAPI HISTORY_KLINE for '+instrument+' contains '+closes.length+' close observations spanning '+start.slice(0,10)+' to '+end.slice(0,10)+', with first observed close '+fmt(first.value)+' and last observed close '+fmt(last.value)+'.',locatorValue:instrument+' close observations '+start.slice(0,10)+'..'+end.slice(0,10)+'; snapshot='+snapshot.snapshotId+'; digest='+snapshot.responseDigest,observedAt:end,supportNote:'Descriptive provider-series claim only. No trend, causality, pressure, constraint, reconfiguration, persistence or continuity interpretation is asserted.'});
}

export function deriveCapitalFlowClaim({snapshot,source}={}){
  if(snapshot?.capability!=='CAPITAL_FLOW')return null;
  const rows=byPath(snapshot.records||[],'data.flow_list[].in_flow').filter(x=>iso(x.timestamp)!=null).sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));
  if(!rows.length)throw new Error('MOOMOO_PROVIDER_CLAIM_NO_CAPITAL_FLOW_SERIES:'+snapshot.snapshotId);
  const first=rows[0],last=rows[rows.length-1],instrument=String(first.instrument||'').trim(),start=iso(first.timestamp),end=iso(last.timestamp);
  return baseClaim({snapshot,source,laneId:'PRESSURE_FIELD',slug:'CAPITAL-FLOW-'+instrument.replace(/[^A-Za-z0-9]+/g,'-'),claimText:'Moomoo OpenAPI CAPITAL_FLOW for '+instrument+' contains '+rows.length+' net-flow observations spanning '+start.slice(0,10)+' to '+end.slice(0,10)+', with first observed in_flow '+fmt(first.value)+' and last observed in_flow '+fmt(last.value)+'.',locatorValue:instrument+' in_flow '+start.slice(0,10)+'..'+end.slice(0,10)+'; snapshot='+snapshot.snapshotId+'; digest='+snapshot.responseDigest,observedAt:end,supportNote:'Descriptive capital-flow series claim only. No direction, persistence, causal pressure or allocation interpretation is asserted.'});
}

export function deriveValuationClaim({snapshot,source}={}){
  if(snapshot?.capability!=='VALUATION')return null;
  const rec=snapshot.records||[];
  const current=rec.find(x=>x.fieldPath==='data.trend.current_value');
  const average=rec.find(x=>x.fieldPath==='data.trend.average_value');
  const percentile=rec.find(x=>x.fieldPath==='data.trend.valuation_percentile');
  const historical=rec.filter(x=>x.fieldPath==='data.trend.historical_items[].value');
  if(!current&&!average&&!percentile&&!historical.length)throw new Error('MOOMOO_PROVIDER_CLAIM_NO_VALUATION_DATA:'+snapshot.snapshotId);
  const instrument=String(current?.instrument||average?.instrument||percentile?.instrument||historical[0]?.instrument||'').trim();
  const valuationType=String(current?.meta?.valuationType||average?.meta?.valuationType||snapshot.request?.valuationType||'UNKNOWN');
  const timestamps=[current,average,percentile,...historical].map(x=>iso(x?.timestamp)).filter(Boolean).sort();
  const end=timestamps.at(-1)||snapshot.retrievedAt;
  const parts=[];
  if(current)parts.push('current value '+fmt(current.value));
  if(average)parts.push('interval average '+fmt(average.value));
  if(percentile)parts.push('historical percentile '+fmt(percentile.value));
  parts.push('historical observations '+historical.length);
  return baseClaim({snapshot,source,laneId:'PRESSURE_FIELD',slug:'VALUATION-'+instrument.replace(/[^A-Za-z0-9]+/g,'-')+'-'+valuationType,claimText:'Moomoo OpenAPI VALUATION '+valuationType+' for '+instrument+' reports '+parts.join(', ')+'.',locatorValue:instrument+' valuation '+valuationType+'; snapshot='+snapshot.snapshotId+'; digest='+snapshot.responseDigest,observedAt:iso(end),supportNote:'Descriptive valuation claim only. No overvaluation, undervaluation, pressure or constraint conclusion is asserted.'});
}

export function deriveFinancialStatementClaim({snapshot,source}={}){
  if(snapshot?.capability!=='FINANCIAL_STATEMENTS')return null;
  const rec=snapshot.records||[];
  if(!rec.length)throw new Error('MOOMOO_PROVIDER_CLAIM_NO_FINANCIAL_DATA:'+snapshot.snapshotId);
  const instrument=String(rec[0]?.instrument||'').trim();
  const periods=uniq(rec.map(x=>x.meta?.periodText));
  const fields=uniq(rec.map(x=>x.meta?.displayName));
  const stamps=rec.map(x=>iso(x.timestamp)).filter(Boolean).sort();
  const end=stamps.at(-1)||snapshot.retrievedAt;
  const statementType=String(rec[0]?.meta?.statementType||snapshot.request?.statementType||'UNKNOWN');
  const sortedPeriods=[...periods].sort();
  const firstPeriod=sortedPeriods[0]||'UNKNOWN';
  const lastPeriod=sortedPeriods.at(-1)||'UNKNOWN';
  return baseClaim({snapshot,source,laneId:'INDUSTRY',slug:'FINANCIALS-'+instrument.replace(/[^A-Za-z0-9]+/g,'-')+'-S'+statementType,claimText:'Moomoo OpenAPI FINANCIAL_STATEMENTS for '+instrument+' statement type '+statementType+' contains '+periods.length+' reporting periods and '+fields.length+' distinct reported fields across '+rec.length+' normalized field observations.',locatorValue:instrument+' financial statements S'+statementType+'; periodCount='+periods.length+'; firstPeriod='+firstPeriod+'; lastPeriod='+lastPeriod+'; snapshot='+snapshot.snapshotId+'; digest='+snapshot.responseDigest,observedAt:iso(end),supportNote:'Descriptive issuer financial-series claim only. No growth, deterioration, continuity or reconfiguration conclusion is asserted.'});
}

export function deriveRevenueBreakdownClaim({snapshot,source}={}){
  if(snapshot?.capability!=='REVENUE_BREAKDOWN')return null;
  const rec=snapshot.records||[];
  if(!rec.length)throw new Error('MOOMOO_PROVIDER_CLAIM_NO_REVENUE_BREAKDOWN:'+snapshot.snapshotId);
  const instrument=String(rec[0]?.instrument||'').trim();
  const periods=uniq(rec.map(x=>x.meta?.period));
  const dimensions=uniq(rec.map(x=>x.meta?.breakdownType));
  const items=uniq(rec.map(x=>x.meta?.itemName));
  const stamps=rec.map(x=>iso(x.timestamp)).filter(Boolean).sort();
  const end=stamps.at(-1)||snapshot.retrievedAt;
  return baseClaim({snapshot,source,laneId:'INDUSTRY',slug:'REVENUE-BREAKDOWN-'+instrument.replace(/[^A-Za-z0-9]+/g,'-'),claimText:'Moomoo OpenAPI REVENUE_BREAKDOWN for '+instrument+' contains '+items.length+' distinct breakdown items across '+dimensions.length+' breakdown dimensions for reporting period(s) '+periods.join(', ')+'.',locatorValue:instrument+' revenue breakdown; periods='+periods.join('|')+'; snapshot='+snapshot.snapshotId+'; digest='+snapshot.responseDigest,observedAt:iso(end),supportNote:'Descriptive issuer revenue-composition claim only. No structural change, reconfiguration or continuity conclusion is asserted.'});
}

export function buildFirstProviderClaims({snapshots,sources}={}){
  const sourceBySnapshot=new Map((sources?.records||[]).map(x=>[x.providerSnapshotId,x]));
  const claims=[],skipped=[];
  const derivation={HISTORY_KLINE:deriveHistoryKlineClaim,CAPITAL_FLOW:deriveCapitalFlowClaim,VALUATION:deriveValuationClaim,FINANCIAL_STATEMENTS:deriveFinancialStatementClaim,REVENUE_BREAKDOWN:deriveRevenueBreakdownClaim};
  for(const snapshot of snapshots?.records||[]){
    if(snapshot.providerId!=='MOOMOO_OPENAPI')continue;
    const source=sourceBySnapshot.get(snapshot.snapshotId);
    if(!source){skipped.push({snapshotId:snapshot.snapshotId,reason:'W8A_PROVIDER_SOURCE_HANDOFF_MISSING'});continue;}
    const fn=derivation[snapshot.capability];
    if(!fn){skipped.push({snapshotId:snapshot.snapshotId,reason:'CAPABILITY_NOT_YET_SUPPORTED'});continue;}
    try{claims.push(fn({snapshot,source}));}catch(e){skipped.push({snapshotId:snapshot.snapshotId,reason:String(e.message)});}
  }
  return {claims,skipped};
}
