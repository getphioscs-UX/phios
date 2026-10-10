const uniq=v=>[...new Set((v||[]).filter(Boolean))].sort();
const insufficientIds=new Set([
 'US-W8E-SEM-FINANCIAL-CONSTRAINT',
 'US-W8E-SEM-MACRO-RECONFIGURATION',
 'US-W8E-SEM-SYSTEM-CONTINUITY'
]);

function evidenceById(handoff){
  return new Map((handoff?.records||[]).map(x=>[x.claimId,x]));
}
function getAddedEvidence({baseline,enriched,evidenceMap}){
  const prior=new Set(baseline?.evidenceRefs||[]);
  return (enriched?.evidenceRefs||[]).filter(id=>!prior.has(id)).map(id=>evidenceMap.get(id)).filter(Boolean);
}
function text(rows){return rows.map(x=>String(x.claimText||'')).join(' ').toLowerCase();}
function hasAny(s,terms){return terms.some(t=>s.includes(t));}

export function reassessEnrichedSemanticBasis({baselineReadouts,enrichedReadouts,enrichedHandoff,semanticBasis}={}){
  const baseMap=new Map((baselineReadouts?.records||[]).map(x=>[x.dossierId,x]));
  const enrichedMap=new Map((enrichedReadouts?.records||[]).map(x=>[x.dossierId,x]));
  const evMap=evidenceById(enrichedHandoff);
  const records=[];
  for(const basis of semanticBasis?.records||[]){
    if(basis.supportState!=='INSUFFICIENT_EVIDENCE'||!insufficientIds.has(basis.basisId))continue;
    const base=baseMap.get(basis.dossierId), enriched=enrichedMap.get(basis.dossierId);
    if(!base||!enriched){
      records.push({
        semanticBasisId:basis.basisId,
        dossierId:basis.dossierId,
        grammarId:basis.grammarId,
        realityDomainId:basis.realityDomainId,
        previousSupportState:basis.supportState,
        reassessedSupportState:'INSUFFICIENT_EVIDENCE',
        state:'ENRICHED_READOUT_REQUIRED',
        addedEvidenceRefs:[],
        evidenceDelta:0,
        promotionReason:null,
        remainingGaps:['Enriched W8D-P2 readout is not available for this dossier.'],
        humanReviewRequired:false
      });
      continue;
    }
    const added=getAddedEvidence({baseline:base,enriched,evidenceMap:evMap});
    const addedText=text(added);
    let directMechanism=false;
    let remainingGaps=[];
    if(basis.basisId==='US-W8E-SEM-FINANCIAL-CONSTRAINT'){
      directMechanism=hasAny(addedText,['financing constraint','funding constraint','credit constraint','borrowing constraint','reduced lending','tightened lending','restricted financing']);
      remainingGaps=[
        'Longitudinal market-price observations strengthen pressure context but do not show how possibilities were actually narrowed.',
        'Need capital-flow/valuation response plus regulator or primary evidence of an operative financing, leverage, funding or risk constraint mechanism.'
      ];
    }else if(basis.basisId==='US-W8E-SEM-MACRO-RECONFIGURATION'){
      directMechanism=hasAny(addedText,['sector weight changed','revenue mix changed','routing changed','carrier changed','institutional structure changed','capital reallocated from','capital shifted from']);
      remainingGaps=[
        'Longitudinal price series do not by themselves establish structural reorganization.',
        'Need before/after composition or routing evidence plus sustained capital-flow/sector/revenue migration.'
      ];
    }else{
      directMechanism=hasAny(addedText,['maintained capacity','recovered capacity','continued operation','operating capacity persisted','cash flow remained','service continuity','function persisted']);
      remainingGaps=[
        'Repeated market observations establish longitudinal observation coverage, not canonical system continuity.',
        'Need evidence that organized function/capacity persisted, recovered or adapted across time, ideally with primary/regulatory cross-check.'
      ];
    }
    const promoted=directMechanism&&added.length>=1;
    records.push({
      semanticBasisId:basis.basisId,
      dossierId:basis.dossierId,
      subsystem:basis.subsystem,
      grammarId:basis.grammarId,
      realityDomainId:basis.realityDomainId,
      previousSupportState:basis.supportState,
      reassessedSupportState:promoted?'EVIDENCE_READY':'INSUFFICIENT_EVIDENCE',
      state:promoted?'PROMOTION_CANDIDATE_HUMAN_REVIEW_REQUIRED':'EVIDENCE_ENRICHED_BUT_SEMANTIC_THRESHOLD_NOT_MET',
      baselineReadoutReference:base.readoutReference,
      enrichedReadoutReference:enriched.readoutReference,
      baselineEvidenceCount:base.evidenceCount,
      enrichedEvidenceCount:enriched.evidenceCount,
      addedEvidenceRefs:uniq(added.map(x=>x.claimId)),
      addedAuthorityClasses:uniq(added.map(x=>x.authorityClass)),
      addedLanes:uniq(added.map(x=>x.laneId)),
      evidenceDelta:added.length,
      directMechanismObserved:directMechanism,
      promotionReason:promoted?'New admitted evidence directly expresses the previously missing semantic mechanism.':null,
      remainingGaps:promoted?[]:remainingGaps,
      humanReviewRequired:promoted,
      boundaries:{evidenceCountVotingUsed:false,providerPresenceUsedAsPromotion:false,runtimePositionCandidateCreated:false}
    });
  }
  return records;
}
