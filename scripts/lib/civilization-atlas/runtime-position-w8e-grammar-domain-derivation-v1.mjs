const uniq=values=>[...new Set((values||[]).filter(Boolean))].sort();
const refEqual=(a,b)=>a?.code===b?.code&&a?.version===b?.version&&a?.digest===b?.digest;

export function buildW8eWorkOrders({readouts,readiness}={}){
  const readoutMap=new Map((readouts?.records||[]).map(x=>[x.dossierId,x]));
  const rows=[];
  for(const ready of readiness?.records||[]){
    if(ready.state!=='REQUIRED_LANES_COMPLETE')continue;
    const readout=readoutMap.get(ready.dossierId);
    if(!readout?.readoutReference)continue;
    rows.push({
      workOrderId:'W8E-'+ready.dossierId,
      dossierId:ready.dossierId,
      state:'DERIVATION_EVIDENCE_REQUIRED',
      readoutReference:readout.readoutReference,
      evidenceRefs:uniq(readout.evidenceRefs||ready.evidenceRefs||[]),
      admittedLaneIds:uniq(readout.admittedLaneIds||ready.admittedLaneIds||[]),
      requiredLaneIds:uniq(readout.requiredLaneIds||ready.requiredLaneIds||[]),
      missingRequiredLanes:uniq(readout.missingRequiredLanes||ready.missingRequiredLanes||[]),
      historicalPositionReferencesExcluded:true,
      candidateIds:[]
    });
  }
  return rows;
}

export function validateW8eDerivation({intake,readouts,readiness,grammarCanon,domainCriteria,positions}={}){
  const readoutMap=new Map((readouts?.records||[]).map(x=>[x.dossierId,x]));
  const readyMap=new Map((readiness?.records||[]).map(x=>[x.dossierId,x]));
  const grammarMap=new Map((grammarCanon?.grammars||[]).map(x=>[x.grammarId,x]));
  const domainMap=new Map((domainCriteria?.domains||[]).map(x=>[x.domainId,x]));
  const positionPairs=new Set((positions?.positions||[]).map(x=>x.grammarId+'::'+x.realityDomainId));
  const seen=new Set(),records=[],rejected=[];
  for(const raw of intake?.records||[]){
    const reasons=[];
    if(!raw?.derivationId||seen.has(raw.derivationId))reasons.push(!raw?.derivationId?'DERIVATION_ID_REQUIRED':'DERIVATION_ID_DUPLICATE');
    if(raw?.derivationId)seen.add(raw.derivationId);
    if(!['DOSSIER','SUBSYSTEM'].includes(raw?.scope))reasons.push('SCOPE_INVALID');
    const readout=readoutMap.get(raw?.dossierId), ready=readyMap.get(raw?.dossierId);
    if(!readout||!ready||ready.state!=='REQUIRED_LANES_COMPLETE')reasons.push('W8D_REQUIRED_LANES_COMPLETE_REQUIRED');
    if(readout&&!refEqual(raw?.readoutReference,readout.readoutReference))reasons.push('READOUT_REFERENCE_MISMATCH');
    const grammar=grammarMap.get(raw?.grammarId); if(!grammar)reasons.push('GRAMMAR_ID_INVALID');
    const domain=domainMap.get(raw?.realityDomainId); if(!domain)reasons.push('DOMAIN_ID_INVALID');
    if(raw?.grammarId&&raw?.realityDomainId&&!positionPairs.has(raw.grammarId+'::'+raw.realityDomainId))reasons.push('GRAMMAR_DOMAIN_PAIR_NOT_CANONICAL');
    const refs=uniq(raw?.evidenceRefs||[]);
    const allowed=new Set(readout?.evidenceRefs||[]);
    if(!refs.length)reasons.push('EVIDENCE_REFS_REQUIRED');
    if(refs.some(ref=>!allowed.has(ref)))reasons.push('EVIDENCE_REF_OUTSIDE_W8D_LINEAGE');
    if(!String(raw?.grammarBasis||'').trim())reasons.push('GRAMMAR_BASIS_REQUIRED');
    if(!String(raw?.domainBasis||'').trim())reasons.push('DOMAIN_BASIS_REQUIRED');
    if(!['EVIDENCE_READY','INSUFFICIENT_EVIDENCE','CONFLICTED'].includes(raw?.supportState))reasons.push('SUPPORT_STATE_INVALID');
    if(raw?.supportState==='EVIDENCE_READY'&&refs.length<1)reasons.push('EVIDENCE_READY_WITHOUT_SUPPORT');
    if(reasons.length){rejected.push({derivationId:raw?.derivationId||null,dossierId:raw?.dossierId||null,reasons});continue;}
    records.push({
      derivationId:raw.derivationId,
      dossierId:raw.dossierId,
      scope:raw.scope,
      subsystem:raw.scope==='SUBSYSTEM'?String(raw.subsystem||'').trim()||null:null,
      grammarId:raw.grammarId,
      grammarKey:grammar.conceptId,
      grammarDefinition:grammar.definition,
      realityDomainId:raw.realityDomainId,
      domainEvidenceTest:domain.evidenceTest,
      evidenceRefs:refs,
      readoutReference:readout.readoutReference,
      grammarBasis:String(raw.grammarBasis).trim(),
      domainBasis:String(raw.domainBasis).trim(),
      supportState:raw.supportState,
      unknowns:raw.unknowns||[],
      candidateState:raw.supportState==='EVIDENCE_READY'?'GRAMMAR_DOMAIN_HUMAN_REVIEW_READY':raw.supportState,
      humanDecision:'PENDING',
      boundaries:{positionIdCreated:false,phaseAssigned:false,historicalPositionUsed:false,currentnessUsedAsDomainShortcut:false}
    });
  }
  return {records,rejected};
}
