import assert from 'node:assert/strict';
export function assessCrossIssuerScope(b3,b2,manifest){
 const expected=['AAPL','MSFT','AMZN','NVDA','JPM'];
 assert.deepEqual(b3.records.map(r=>r.issuer),expected,'Unexpected or duplicated issuer set');
 assert.deepEqual(b2.packets.map(p=>p.issuer),expected);
 assert.equal(b3.completed.g14Candidates,0);assert.equal(b3.completed.dossierGlobalPromotions,0);assert.equal(b3.completed.runtimePositionCandidates,0);
 const candidateRows=b3.records.filter(r=>r.candidate);
 const candidates=candidateRows.map(r=>{
  assert.equal(r.scope,'SUBSYSTEM');assert.equal(r.knowledgeState,'HISTORICAL');
  const packet=b2.packets.find(p=>p.issuer===r.issuer);assert(packet);
  const dates=manifest.records.filter(s=>s.issuer===r.issuer).sort((a,b)=>a.fiscalYear-b.fiscalYear).map(s=>({fiscalYear:s.fiscalYear,periodEnd:s.periodEnd,sourceId:s.sourceId}));
  assert.deepEqual(dates.map(d=>d.fiscalYear),[2023,2024,2025]);
  const summaries={
   MSFT:{zh:'Microsoft 报告了分部组成调整，并对历史分部数据重列。证据支持这家企业的报告与管理分部组成变化，尚不证明美国经济的共同重组机制。',en:'Microsoft reports a change in segment composition and recasts prior segment information. This supports an issuer reporting/management-composition event, not a common US macro mechanism.'},
   JPM:{zh:'JPM 报告将两个原有业务分部合并。分部收入采用 managed/FTE 口径，占比不含 Corporate；不能与其他企业的净销售额合并成经济份额。',en:'JPM reports combining two former business segments. Managed/FTE segment revenue and a denominator excluding Corporate cannot be pooled with other issuers’ net sales as an economic share.'},
   NVDA:{zh:'NVIDIA 的可比报告分部收入明显向 Compute & Networking 集中。这是收入组合的历史变化，未直接确认产能、资本或国家载体迁移。',en:'NVIDIA’s comparable reportable-segment revenue shifts toward Compute & Networking. This is historical revenue-composition evidence, not direct proof of capacity, capital or national carrier migration.'}};
  assert(summaries[r.issuer],'Unexpected candidate issuer');
  return {candidateId:r.candidate.candidateId,issuer:r.issuer,types:r.candidate.types,scope:'SUBSYSTEM',
   scopeTarget:'SELECTED_ISSUER_REPORTABLE_SEGMENT_STRUCTURE',periods:dates,metric:r.metric,denominator:r.denominator,
   sourceRefs:r.sourceRefs,admissionState:'W8A_W8B_W8C_W8D_PENDING',
   directIssuerEvidence:'SOURCE_BOUNDED_HISTORICAL_CANDIDATE',crossIssuerCommonMechanism:'NOT_ESTABLISHED',
   sectorRepresentativeness:'NOT_ESTABLISHED',nationalRepresentativeness:'NOT_ESTABLISHED',
   geographicalAttribution:'ISSUER_CONSOLIDATED_BUSINESS_NOT_US_DOMESTIC_ACTIVITY',
   allowedReading:summaries[r.issuer],g14Pair:null,runtimePosition:null,
   reviewState:'SCOPE_GUARD_COMPLETE_ADMISSION_AND_SEMANTIC_REVIEW_PENDING'};
 });
 const pairs=[];
 for(let i=0;i<candidates.length;i++)for(let j=i+1;j<candidates.length;j++){
  const a=candidates[i],b=candidates[j];
  pairs.push({issuers:[a.issuer,b.issuer],sharedConclusion:'LOCAL_ISSUER_STRUCTURE_OR_REVENUE_COMPOSITION_CHANGES',
   commonMechanism:'NOT_ESTABLISHED',sameMetricAndDenominator:a.metric===b.metric&&a.denominator===b.denominator,
   synchronousPeriodEnds:JSON.stringify(a.periods.map(p=>p.periodEnd))===JSON.stringify(b.periods.map(p=>p.periodEnd)),
   pooledRevenuePermitted:false,pooledHhiPermitted:false,scopePromotionPermitted:false,
   reason:'Different segment partitions and mechanism classes; matching currency or metric labels do not establish additive economic exposure, synchronized events or a common national mechanism.'});
 }
 return {version:'1.0.0',work:'R1-W8E-P5-B4',status:'CROSS_ISSUER_SCOPE_REVIEW_COMPLETE_SUBSYSTEM_ONLY',
  cohort:{issuers:expected,selection:'FIXED_NON_PROBABILITY_WORK_ORDER_COHORT',selectionProbability:null,
   coverageDenominator:null,coverageWeight:null,economicCoverageRatio:null,
   sampleRepresentativeness:'NOT_ESTABLISHED',fiscalLabels:'FY2023–FY2025',periodsSynchronized:false,
   geography:'Issuer consolidated businesses; US domestic attribution is not extracted.',
   observationOnlyIssuers:['AAPL','AMZN'],observationOnlyMeaning:'No B3 candidate under this extraction/screen; not proof of no structural change.'},
  candidates,pairAssessments:pairs,
  boundedSynthesis:{scope:'ENUMERATED_SELECTED_ISSUER_EVIDENCE_COLLECTION',semanticPair:null,knowledgeState:'HISTORICAL',
   zh:'固定的五家公司样本中，Microsoft 与 JPM 报告了不同的分部结构调整，NVIDIA 出现了可比口径下的收入组合迁移。这些是局部、异质的历史候选证据，尚未建立共同机制、行业代表性或美国经济代表性。',
   en:'Within the fixed five-issuer cohort, Microsoft and JPM report different segment-structure changes, while NVIDIA shows comparable-basis revenue-composition movement. These are local, heterogeneous historical candidate findings; a common mechanism, sector representativeness and US economy representativeness are not established.',
   aggregateCandidateCreated:false,acceptanceByIssuerCountAllowed:false},
  guardContract:{sourceCountVotingAllowed:false,candidateRateAsPopulationEstimateAllowed:false,
   multinationalRevenueAsUsDomesticRevenueAllowed:false,commonCurrencyAsAdditivityProofAllowed:false,
   uniformFyLabelsAsSynchronizationProofAllowed:false,reclassificationAsNewRevenueAllowed:false,
   provisionalMixScreenAsG14RuleAllowed:false,sourceScopeAsNationalScopeAllowed:false,
   humanScopeAcceptanceAsSourceAdmissionAllowed:false,current2026InferenceAllowed:false},
  representativenessGaps:[
   {id:'TARGET_POPULATION',state:'UNDEFINED',needed:'Define the sector or national activity population and unit of analysis before seeking broader inference.'},
   {id:'SAMPLING_COVERAGE',state:'NOT_ESTABLISHED',needed:'Supply a documented sampling frame, exclusions and coverage denominator; large issuer selection alone is insufficient.'},
   {id:'DOMESTIC_ATTRIBUTION',state:'NOT_EXTRACTED',needed:'Separate domestic activity from issuer consolidated global activity using documented compatible evidence.'},
   {id:'COMMON_MECHANISM',state:'NOT_ESTABLISHED',needed:'Establish a supported transmission or structural linkage across issuer events, rather than count heterogeneous findings.'},
   {id:'TIME_ALIGNMENT',state:'NOT_ESTABLISHED',needed:'Align event dates and observation periods explicitly; fiscal labels do not synchronize windows.'},
   {id:'METRIC_AND_DOUBLE_COUNTING',state:'NOT_ESTABLISHED',needed:'Establish consistent metrics and handle inter-issuer flows and segment partition differences before aggregation.'},
   {id:'SOURCE_AND_CLAIM_ADMISSION',state:'PENDING',needed:'Admit bounded filing sources and factual/derived claims through W8A/W8B/W8C/W8D before semantic promotion.'}
  ],
  completed:{issuerScopeChecks:5,candidateScopeChecks:candidates.length,pairScopeChecks:pairs.length,
   boundedEvidenceCollections:1,aggregateStructuralCandidates:0,nationalRepresentativeCandidates:0,
   g14Candidates:0,dossierGlobalPromotions:0,runtimePositionCandidates:0},
  next:'Proceed with bounded primary-filing source/claim admission through W8A–W8D and then G14 grammar/domain review. Broader representativeness is separately gated; no national promotion.'};
}
