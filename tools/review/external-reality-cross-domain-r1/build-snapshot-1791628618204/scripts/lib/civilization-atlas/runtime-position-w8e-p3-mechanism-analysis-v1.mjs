const uniq=v=>[...new Set((v||[]).filter(Boolean))].sort();
const median=a=>{const x=[...a].filter(Number.isFinite).sort((p,q)=>p-q);if(!x.length)return null;const m=Math.floor(x.length/2);return x.length%2?x[m]:(x[m-1]+x[m])/2;};
const pct=(part,total)=>total?part/total:null;
const iso=v=>{const d=new Date(v);return v&&!Number.isNaN(d.valueOf())?d.toISOString():null;};

function admittedSnapshotIds(providerEvidence){
  const ids=new Set();
  for(const e of providerEvidence?.records||[]){
    const v=String(e.sourceLocator?.value||'');
    const m=v.match(/snapshot=([^;]+)/);
    if(m)ids.add(m[1]);
  }
  return ids;
}
function allowedSnapshots(snapshots,providerEvidence){
  const allowed=admittedSnapshotIds(providerEvidence);
  return (snapshots?.records||[]).filter(x=>x.providerId==='MOOMOO_OPENAPI'&&allowed.has(x.snapshotId));
}
function byCap(rows,cap){return rows.filter(x=>x.capability===cap);}
function instruments(rows){return uniq(rows.flatMap(x=>(x.request?.symbols||[])));}

function capitalFlowContext(rows){
  const perInstrument=[];
  for(const instrument of instruments(rows)){
    const vals=rows.filter(s=>(s.request?.symbols||[]).includes(instrument)).flatMap(s=>(s.records||[]).filter(r=>r.fieldPath==='data.flow_list[].in_flow'&&Number.isFinite(Number(r.value))).map(r=>Number(r.value)));
    if(!vals.length)continue;
    perInstrument.push({instrument,observations:vals.length,positive:vals.filter(x=>x>0).length,negative:vals.filter(x=>x<0).length,zero:vals.filter(x=>x===0).length,medianInFlow:median(vals),positiveShare:pct(vals.filter(x=>x>0).length,vals.length)});
  }
  return perInstrument;
}
function valuationContext(rows){
  const perInstrument=[];
  for(const instrument of instruments(rows)){
    const ir=rows.filter(s=>(s.request?.symbols||[]).includes(instrument));
    const types={};
    for(const s of ir){
      const type=s.request?.valuationType||'UNKNOWN';
      const current=(s.records||[]).find(r=>r.fieldPath==='data.trend.current_value');
      const avg=(s.records||[]).find(r=>r.fieldPath==='data.trend.average_value');
      const percentile=(s.records||[]).find(r=>r.fieldPath==='data.trend.valuation_percentile');
      types[type]={current:current?.value??null,average:avg?.value??null,percentile:percentile?.value??null,historicalCount:(s.records||[]).filter(r=>r.fieldPath==='data.trend.historical_items[].value').length};
    }
    perInstrument.push({instrument,types});
  }
  return perInstrument;
}
function financialContinuity(rows){
  const issuerMap=new Map();
  for(const s of rows){
    const issuer=(s.request?.symbols||[])[0]; if(!issuer)continue;
    if(!issuerMap.has(issuer))issuerMap.set(issuer,{issuer,periods:new Set(),statementTypes:new Set(),observations:0,snapshotIds:[]});
    const o=issuerMap.get(issuer);o.snapshotIds.push(s.snapshotId);
    for(const r of s.records||[]){
      if(r.meta?.periodText)o.periods.add(r.meta.periodText);
      if(r.meta?.statementType!=null)o.statementTypes.add(String(r.meta.statementType));
      o.observations++;
    }
  }
  return [...issuerMap.values()].map(x=>({issuer:x.issuer,reportingPeriods:x.periods.size,statementTypes:x.statementTypes.size,observations:x.observations,snapshotIds:uniq(x.snapshotIds)}));
}
function revenueStructure(rows){
  const issuerMap=new Map();
  for(const s of rows){
    const issuer=(s.request?.symbols||[])[0];if(!issuer)continue;
    if(!issuerMap.has(issuer))issuerMap.set(issuer,{issuer,periods:new Set(),items:new Set(),dimensions:new Set(),snapshotIds:[]});
    const o=issuerMap.get(issuer);o.snapshotIds.push(s.snapshotId);
    for(const r of s.records||[]){
      if(r.meta?.period)o.periods.add(r.meta.period);
      if(r.meta?.itemName)o.items.add(r.meta.itemName);
      if(r.meta?.breakdownType!=null)o.dimensions.add(String(r.meta.breakdownType));
    }
  }
  return [...issuerMap.values()].map(x=>({issuer:x.issuer,comparablePeriods:x.periods.size,items:x.items.size,dimensions:x.dimensions.size,snapshotIds:uniq(x.snapshotIds)}));
}
function officialConstraintMechanism(official){
  const terms=['tightened lending','reduced lending','restricted financing','financing constraint','credit constraint','funding constraint','borrowing constraint'];
  const matches=(official?.records||[]).filter(x=>terms.some(t=>String(x.claimText||'').toLowerCase().includes(t)));
  return {observed:matches.length>0,evidenceRefs:matches.map(x=>x.claimId)};
}

export function buildMechanismAnalysis({snapshots,providerEvidence,officialEvidence,thresholds}={}){
  const rows=allowedSnapshots(snapshots,providerEvidence);
  const cf=capitalFlowContext(byCap(rows,'CAPITAL_FLOW'));
  const val=valuationContext(byCap(rows,'VALUATION'));
  const fin=financialContinuity(byCap(rows,'FINANCIAL_STATEMENTS'));
  const rev=revenueStructure(byCap(rows,'REVENUE_BREAKDOWN'));
  const officialConstraint=officialConstraintMechanism(officialEvidence);

  const continuityQualified=fin.filter(x=>x.reportingPeriods>=thresholds.issuerContinuityMinimumReportingPeriods&&x.statementTypes>=thresholds.issuerContinuityMinimumStatementTypes);
  const continuityCandidate=continuityQualified.length>=thresholds.issuerContinuityMinimumIssuers;
  const reconfigComparable=rev.filter(x=>x.comparablePeriods>=thresholds.reconfigurationMinimumComparablePeriods);

  const records=[
    {
      semanticBasisId:'US-W8E-SEM-FINANCIAL-CONSTRAINT',targetPair:'G2+P3',
      state:officialConstraint.observed?'MECHANISM_CROSSCHECK_AVAILABLE':'PROVIDER_PRESSURE_CONTEXT_ONLY',
      providerContext:{capitalFlow:cf,valuation:val},
      officialMechanismEvidenceRefs:officialConstraint.evidenceRefs,
      directMechanismObserved:officialConstraint.observed,
      humanReviewReady:officialConstraint.observed,
      explanation:officialConstraint.observed?'Official/regulatory evidence explicitly expresses an operative constraint mechanism and provider series add market context.':'Capital-flow and valuation observations provide pressure context, but no admitted official/regulatory claim yet states that feasible financing/borrowing behavior was constrained.'
    },
    {
      semanticBasisId:'US-W8E-SEM-MACRO-RECONFIGURATION',targetPair:'G14+P2',
      state:reconfigComparable.length?'SUBSYSTEM_COMPOSITION_COMPARISON_AVAILABLE':'SINGLE_PERIOD_OR_NONCOMPARABLE_STRUCTURE',
      providerContext:{capitalFlow:cf,revenueStructure:rev},
      comparableIssuerCount:reconfigComparable.length,
      directMechanismObserved:false,
      humanReviewReady:false,
      explanation:reconfigComparable.length?'Some issuer revenue breakdowns have multiple comparable periods, but issuer-level composition changes still require explicit before/after relation derivation and primary cross-check before macro reconfiguration can be considered.':'Revenue breakdown evidence does not yet provide two comparable reporting periods per issuer; therefore structural reconfiguration cannot be derived.'
    },
    {
      semanticBasisId:'US-W8E-SEM-SYSTEM-CONTINUITY',targetPair:'G16+P3',
      state:continuityCandidate?'SUBSYSTEM_CONTINUITY_HUMAN_REVIEW_READY':'SUBSYSTEM_CONTINUITY_THRESHOLD_NOT_MET',
      providerContext:{issuerFinancialContinuity:fin},
      qualifiedIssuerCount:continuityQualified.length,
      qualifiedIssuers:continuityQualified.map(x=>x.issuer),
      directMechanismObserved:false,
      humanReviewReady:continuityCandidate,
      explanation:continuityCandidate?'Multiple selected issuers have multi-period, multi-statement reporting continuity. This supports a subsystem-level continuity candidate only; it does not establish DOSSIER-US system continuity.':'Insufficient selected issuers meet the multi-period, multi-statement continuity guard.'
    }
  ];

  const subsystemCandidates=[];
  if(continuityCandidate)subsystemCandidates.push({
    candidateId:'US-W8E-P3-SELECTED-ISSUER-CONTINUITY',
    dossierId:'DOSSIER-US',
    scope:'SUBSYSTEM',
    subsystem:'SELECTED_ISSUER_OPERATING_CONTINUITY',
    grammarId:'G16',
    realityDomainId:'P3',
    state:'HUMAN_REVIEW_READY',
    evidenceClass:'DERIVED_FROM_CWA_ADMITTED_PROVIDER_SNAPSHOTS',
    qualifiedIssuers:continuityQualified.map(x=>x.issuer),
    snapshotRefs:uniq(continuityQualified.flatMap(x=>x.snapshotIds)),
    boundary:'Selected issuer continuity candidate only. It cannot be generalized to national system continuity or an RP position without separate evidence and human review.'
  });
  return {records,subsystemCandidates,admittedProviderSnapshotCount:rows.length};
}
