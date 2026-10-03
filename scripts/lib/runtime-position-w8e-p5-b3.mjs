import assert from 'node:assert/strict';
const round=n=>Math.round(n*1e6)/1e6;
export function deriveStructuralChange(packet,{mixScreenPp=10,officialEvent=null}={}){
 assert(mixScreenPp>0&&Number.isFinite(mixScreenPp),'Invalid screen threshold');
 assert(['COMPARABLE_ON_ISSUER_RECAST_BASIS_ONLY','REVENUE_COMPARABLE_WITH_MATCHING_OVERLAPS'].includes(packet.comparability.state),'Comparable basis required');
 assert.equal(packet.comparability.selectedBasisSourceId,packet.filings.at(-1).sourceId);
 const periods=packet.selectedComparablePeriods;assert.deepEqual(periods.map(p=>p.fiscalYear),[2023,2024,2025]);
 const names=periods[0].segments.map(s=>s.name);
 for(const p of periods){
  assert.deepEqual(p.segments.map(s=>s.name),names,'Segment basis mismatch');
  assert.equal(p.denominator,periods[0].denominator,'Denominator mismatch');
  assert.equal(p.metric,periods[0].metric,'Metric mismatch');
  assert.equal(p.denominatorValue,p.segments.reduce((n,s)=>n+s.revenue,0));
  assert(p.segments.every(s=>s.revenue>0));
 }
 const shares=periods.map(p=>p.segments.map(s=>s.revenue/p.denominatorValue*100));
 const changes=names.map((name,i)=>({name,firstRevenue:periods[0].segments[i].revenue,lastRevenue:periods[2].segments[i].revenue,
  revenueGrowthPercent:round((periods[2].segments[i].revenue/periods[0].segments[i].revenue-1)*100),
  sharesPercent:shares.map(s=>round(s[i])),netShareChangePp:round(shares[2][i]-shares[0][i]),
  adjacentShareChangesPp:[round(shares[1][i]-shares[0][i]),round(shares[2][i]-shares[1][i])]}));
 const maxAbsShareChangePp=Math.max(...changes.map(c=>Math.abs(c.netShareChangePp)));
 const hhi=shares.map(s=>round(s.reduce((sum,p)=>sum+(p/100)**2,0)));
 const top=shares.map((s,j)=>{const i=s.indexOf(Math.max(...s));return {year:periods[j].fiscalYear,name:names[i],sharePercent:round(s[i])};});
 const types=[];const reasoning=[];
 if(officialEvent){
  assert(officialEvent.sourceId&&officialEvent.sourceSha256&&officialEvent.verified,'Verified original-file event evidence required');
  assert(['SEGMENT_RECLASSIFICATION','ISSUER_STRUCTURE_SHIFT'].includes(officialEvent.type),'Unknown official event type');
  assert(packet.filings.some(f=>f.sourceId===officialEvent.sourceId&&f.sha256===officialEvent.sourceSha256),'Official event outside packet lineage');
  types.push(officialEvent.type);reasoning.push(officialEvent.summary);
 }
 if(maxAbsShareChangePp>=mixScreenPp){types.push('BUSINESS_MIX_MIGRATION');reasoning.push('Comparable-basis segment revenue share crosses the provisional analytical screen. Differential revenue growth can cause this movement; capacity or causal carrier migration is not established.');
  if(hhi[2]>hhi[0]&&top[2].sharePercent>top[0].sharePercent){types.push('CARRIER_CONCENTRATION_SHIFT');reasoning.push('Revenue concentration increases within the disclosed reportable-segment partition. This is a revenue proxy only, not a claim about capacity or national carrier structure.');}
 }
 return {issuer:packet.issuer,scope:'SUBSYSTEM',knowledgeState:'HISTORICAL',observationWindow:'FY2023–FY2025',
  selectedBasisSourceId:packet.comparability.selectedBasisSourceId,metric:periods[0].metric,denominator:periods[0].denominator,
  sourceRefs:packet.filings.map(f=>({sourceId:f.sourceId,sha256:f.sha256,url:f.url})),officialEvent,
  asFiledComparabilityBreaks:packet.comparability.asFiledBreaks,
  reportingBasisBridge:packet.comparability.comparisons.map(c=>({fiscalYear:c.fiscalYear,state:c.state,
   originalRevenueTotal:c.originalSegments.reduce((n,s)=>n+s.revenue,0),revisedRevenueTotal:c.revisedSegments.reduce((n,s)=>n+s.revenue,0),
   aggregateRevenueDifference:c.revisedSegments.reduce((n,s)=>n+s.revenue,0)-c.originalSegments.reduce((n,s)=>n+s.revenue,0),
   interpretation:'A reclassification difference is not economic revenue growth.'})),
  metrics:{segmentChanges:changes,maxAbsShareChangePp:round(maxAbsShareChangePp),hhiFractionScale:hhi,hhiChange:round(hhi[2]-hhi[0]),topSegmentByYear:top,
   mixScreenPp,screenAuthority:'PROVISIONAL_ANALYTICAL_SCREEN_NOT_CANONICAL_G14',thresholdSensitivity:[5,10,15].map(threshold=>({thresholdPp:threshold,screenCrossed:maxAbsShareChangePp>=threshold}))},
  candidate:types.length?{candidateId:'US-W8E-P5-B3-'+packet.issuer+'-STRUCTURAL-CHANGE',types,state:'STRUCTURAL_CHANGE_CANDIDATE_REQUIRES_ADMISSION_AND_REVIEW',reasoning}:null,
  disposition:types.length?'STRUCTURAL_CHANGE_CANDIDATE':'REVENUE_MOVEMENT_OBSERVATION_ONLY',
  limitations:['Raw primary-file acquisition and B2 extraction are not CWA/RRE admission.','No G14/P2 assignment.','No dossier-global representativeness.','No runtime position.','No inference of present 2026 conditions from this historical cohort.','Non-screened movement does not establish absence of structural change.']};
}
