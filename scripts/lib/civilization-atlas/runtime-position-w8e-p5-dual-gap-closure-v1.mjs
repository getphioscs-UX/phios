const uniq=v=>[...new Set((v||[]).filter(Boolean))].sort();
export function deriveW8eP5({mergedHandoff,providerEvidence,officialGapEvidence}={}){
  const merged=new Map((mergedHandoff?.records||[]).map(x=>[x.claimId,x]));
  const provider=providerEvidence?.records||[];
  const official=officialGapEvidence?.records||[];
  const sloos=official.find(x=>x.claimId==='US-FED-SLOOS-APR-2026-CONSTRAINT-001');
  const sloosInRre=Boolean(sloos&&merged.has(sloos.claimId));
  const providerPressure=provider.filter(x=>x.dossierId==='DOSSIER-US'&&x.laneId==='PRESSURE_FIELD'&&['CAPITAL_FLOW','VALUATION'].some(k=>String(x.sourceId||'').includes(k)));
  const providerRefs=uniq(providerPressure.map(x=>x.claimId));
  const g2Ready=sloosInRre&&providerRefs.length>=2;
  return {
    records:[{
      candidateId:'US-W8E-P5-FINANCIAL-CREDIT-CONSTRAINT',
      semanticBasisId:'US-W8E-SEM-FINANCIAL-CONSTRAINT',
      dossierId:'DOSSIER-US',
      scope:'SUBSYSTEM',
      subsystem:'FINANCIAL_CREDIT_CONSTRAINT',
      grammarId:'G2',
      realityDomainId:'P3',
      state:g2Ready?'GRAMMAR_DOMAIN_HUMAN_REVIEW_READY':'WAITING_W8D_P2_LINEAGE',
      directMechanismObserved:g2Ready,
      officialEvidenceRefs:sloosInRre?[sloos.claimId]:[],
      providerContextEvidenceRefs:providerRefs,
      grammarBasis:g2Ready?'Federal Reserve SLOOS directly reports tighter credit standards and tighter contractual terms (risk premiums, covenants and collateral requirements), which are mechanisms that narrow feasible borrowing conditions rather than merely describing market pressure.':'Fed SLOOS evidence has not yet entered the W8D-P2 merged RRE lineage.',
      domainBasis:g2Ready?'The evidence concerns governed lending-policy changes across a quarter and, in SLOOS special questions, across the prior year; combined with regulator financial-stability context and longitudinal provider observations, this is sufficient for human review of P3 governance/adaptation at the bounded financial-credit subsystem scope.':'P3 review remains blocked until merged RRE lineage is rebuilt.',
      boundary:'Subsystem candidate only; not DOSSIER-US global semantics and not an RP candidate.',
      humanDecision:'PENDING'
    }],
    summary:{g2HumanReviewReady:g2Ready?1:0,g14HumanReviewReady:0,runtimePositionCandidates:0}
  };
}
