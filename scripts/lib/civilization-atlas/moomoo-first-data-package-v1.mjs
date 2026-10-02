const capabilityLanes=Object.freeze({
  HISTORY_KLINE:['PRESSURE_FIELD'],
  CAPITAL_FLOW:['PRESSURE_FIELD'],
  VALUATION:['PRESSURE_FIELD'],
  FINANCIAL_STATEMENTS:['INDUSTRY'],
  REVENUE_BREAKDOWN:['INDUSTRY']
});
const endpointByCapability=Object.freeze({
  HISTORY_KLINE:'https://webapi.moomoo.com/api/v1.0/quote/{symbol}/history-kline',
  CAPITAL_FLOW:'https://webapi.moomoo.com/api/v1.0/quote/{symbol}/capital-flow/history',
  VALUATION:'https://webapi.moomoo.com/api/v1.0/quote/{symbol}/valuation/detail',
  FINANCIAL_STATEMENTS:'https://webapi.moomoo.com/api/v1.0/quote/{symbol}/financials/statements',
  REVENUE_BREAKDOWN:'https://webapi.moomoo.com/api/v1.0/quote/{symbol}/financials/revenue-breakdown'
});
const uniq=v=>[...new Set(v||[])];

export function buildFirstMoomooPackage({plan,snapshots,liveState}={}){
  const snapRows=(snapshots?.records||[]).filter(x=>x.providerId==='MOOMOO_OPENAPI');
  const byCapability=new Map();
  for(const s of snapRows){if(!byCapability.has(s.capability))byCapability.set(s.capability,[]);byCapability.get(s.capability).push(s);}
  const requestFamilies=(plan?.requests||[]).map(req=>{
    const rows=byCapability.get(req.capability)||[];
    const instruments=uniq(rows.flatMap(x=>x.request?.symbols||[]));
    const executable=req.requestId==='MOOMOO-US-HISTORY-KLINE-01'||(plan?.gapClosureExecutableRequestIds||[]).includes(req.requestId);
    return {
      requestId:req.requestId,
      capability:req.capability,
      plannedInstruments:(req.instruments||[]).length,
      liveSnapshots:rows.length,
      observedInstruments:instruments.length,
      state:rows.length?(instruments.length>=(req.instruments||[]).length?'SNAPSHOTS_COMPLETE_FOR_PLAN':'PARTIAL_SNAPSHOTS'):(executable?(liveState?.networkInvoked?'LIVE_RUN_NO_SNAPSHOT':'AUTH_REQUIRED_OR_NOT_RUN'):'NOT_EXECUTABLE_YET')
    };
  });
  const hist=requestFamilies.find(x=>x.capability==='HISTORY_KLINE');
  const fullCaps=['HISTORY_KLINE','CAPITAL_FLOW','VALUATION','FINANCIAL_STATEMENTS','REVENUE_BREAKDOWN'];
  const firstLiveBackboneComplete=Boolean(hist&&hist.state==='SNAPSHOTS_COMPLETE_FOR_PLAN');
  const fullPackageComplete=fullCaps.every(cap=>requestFamilies.find(x=>x.capability===cap)?.state==='SNAPSHOTS_COMPLETE_FOR_PLAN');
  return {requestFamilies,firstLiveBackboneComplete,fullPackageComplete,snapRows};
}

export function providerSnapshotToW8aSource(snapshot){
  const lanes=capabilityLanes[snapshot.capability]||[];
  if(!lanes.length)throw new Error('MOOMOO_CAPABILITY_LANE_UNMAPPED:'+snapshot.capability);
  const symbols=uniq(snapshot.request?.symbols||[]);
  const symbolToken=symbols.join('-').replace(/[^A-Za-z0-9._-]/g,'_')||'UNKNOWN';
  const sourceId='MOOMOO-'+snapshot.capability+'-'+symbolToken+'-'+snapshot.responseDigest.slice(0,12);
  const endpoint=endpointByCapability[snapshot.capability]||'https://webapi.moomoo.com/';
  const url=endpoint.includes('{symbol}')&&symbols.length===1?endpoint.replace('{symbol}',encodeURIComponent(symbols[0])):endpoint;
  return {
    intakeId:'W8A-PROVIDER-'+sourceId,
    sourceId,
    dossierId:'DOSSIER-US',
    targetLanes:lanes,
    url,
    publisher:'Moomoo OpenAPI',
    title:'Moomoo '+snapshot.capability+' provider snapshot for '+(symbols.join(', ')||'U.S. market data'),
    publishedAt:null,
    retrievedAt:snapshot.retrievedAt,
    authorityClassHint:'MARKET_DATA_PROVIDER',
    sourceVersionOrDigest:snapshot.responseDigest,
    jurisdiction:'US',
    locale:'en-US',
    providerSnapshotId:snapshot.snapshotId,
    capability:snapshot.capability,
    recordCount:(snapshot.records||[]).length,
    notes:'Normalized provider snapshot; requires W8B bounded claim extraction and W8C FINANCIAL_MARKETS admission.',
    sourceState:'STRUCTURALLY_VALIDATED_NOT_ADMITTED',
    boundaries:{isFact:false,isClaim:false,isEvidence:false,isCurrentData:false}
  };
}

export function buildProviderClaimWorkOrders(sourceRows){
  return sourceRows.flatMap(source=>source.targetLanes.map(laneId=>({
    claimWorkOrderId:'W8B-PROVIDER-'+source.sourceId+'-'+laneId,
    sourceId:source.sourceId,
    providerSnapshotId:source.providerSnapshotId,
    dossierId:source.dossierId,
    laneId,
    capability:source.capability,
    authorityClassHint:'MARKET_DATA_PROVIDER',
    cwaDomain:'FINANCIAL_MARKETS',
    allowedLocatorTypes:['API_RESPONSE_FIELD','PROVIDER_SERIES_WINDOW'],
    state:'CLAIM_REQUIRED',
    claimCandidateIds:[]
  })));
}
