import {buildBook6DossierRreProjection} from './book6-rre-adapter-v1.mjs';

const uniq=values=>[...new Set((values||[]).filter(Boolean))].sort();
const day=value=>String(value||'').slice(0,10);
const maxDate=rows=>{
  const values=(rows||[]).map(x=>x.retrievedAt||x.publishedAt).filter(Boolean).map(x=>new Date(x)).filter(x=>!Number.isNaN(x.valueOf()));
  return values.length?new Date(Math.max(...values)).toISOString():null;
};

export function consumeW8dRreEvidence({handoff,dossiers,cases=[],readiness,registries}={}){
  if(!registries)throw new Error('W8D_RRE_REGISTRIES_REQUIRED');
  const dossierMap=new Map((dossiers?.dossiers||[]).map(row=>[row.id,row]));
  const readinessMap=new Map((readiness?.dossiers||[]).map(row=>[row.dossierId,row]));
  const grouped=new Map();
  for(const evidence of handoff?.records||[]){
    if(evidence.rreEligibility!=='RRE_ELIGIBLE')throw new Error('W8D_NON_ELIGIBLE_EVIDENCE');
    if(evidence.supportLevel!=='DIRECT')throw new Error('W8D_NON_DIRECT_EVIDENCE');
    if(!evidence.dossierId||!dossierMap.has(evidence.dossierId))throw new Error('W8D_DOSSIER_UNKNOWN');
    if(!evidence.claimId||!evidence.laneId)throw new Error('W8D_EVIDENCE_LINEAGE_REQUIRED');
    if(!grouped.has(evidence.dossierId))grouped.set(evidence.dossierId,[]);
    grouped.get(evidence.dossierId).push(evidence);
  }

  const records=[],derivationReadiness=[];
  for(const [dossierId,evidenceRows] of grouped){
    const dossier=dossierMap.get(dossierId);
    const ready=readinessMap.get(dossierId);
    if(!ready)throw new Error('W8D_READINESS_UNKNOWN');
    const requiredLaneIds=(ready.sourceLaneRequirements||[]).filter(x=>x.requiredForPositionCandidate).map(x=>x.laneId);
    const admittedLaneIds=uniq(evidenceRows.map(x=>x.laneId));
    const missingRequiredLanes=requiredLaneIds.filter(id=>!admittedLaneIds.includes(id));
    const retrievedAt=maxDate(evidenceRows);
    const runtimeDossier={
      ...dossier,
      dataClass:'CURRENT_DATA',
      asOfDate:day(retrievedAt),
      sourceDate:day(retrievedAt),
      sourceFreshness:'W8C_RRE_ELIGIBLE_CURRENT_EVIDENCE',
      lastReviewedAt:day(retrievedAt)
    };
    const currentEvidenceRecord={
      dossierId,
      currentEvidence:{
        admissionState:'CURRENT_EVIDENCE_ADMITTED',
        admittedClaims:evidenceRows,
        conflictState:'NO_CONFLICT'
      },
      transitionSignals:{observed:[]},
      observationThreshold:{state:'NOT_EVALUATED'},
      reachablePositions:{positions:[]}
    };
    const projection=buildBook6DossierRreProjection({
      dossier:runtimeDossier,
      cases,
      registries,
      currentEvidenceRecord
    });
    const state=missingRequiredLanes.length?'RRE_PARTIAL_EVIDENCE_CONSUMED':'RRE_REQUIRED_LANES_CONSUMED';
    records.push({
      dossierId,
      entity:dossier.entity,
      state,
      dataClass:'DERIVED_RUNTIME_READOUT',
      evidenceRefs:uniq(evidenceRows.map(x=>x.claimId)),
      sourceIds:uniq(evidenceRows.map(x=>x.sourceId)),
      admittedLaneIds,
      requiredLaneIds,
      missingRequiredLanes,
      evidenceCount:evidenceRows.length,
      latestEvidenceAt:retrievedAt,
      readoutReference:projection.readoutReference,
      confidenceClass:projection.confidenceClass,
      missingLineageDimensions:projection.missingLineageDimensions,
      resolutionLimitKinds:projection.resolutionLimitKinds,
      historicalKnowledgeReferences:projection.historicalKnowledgeReferences,
      meaningReferences:projection.meaningReferences,
      boundaries:{
        currentFactsInvented:false,
        missingEvidenceFilledByInference:false,
        canonicalDossierMutated:false,
        grammarDerived:false,
        realityDomainDerived:false,
        runtimePositionCandidateCreated:false,
        runtimePositionAdmitted:false
      }
    });
    derivationReadiness.push({
      dossierId,
      state:missingRequiredLanes.length?'REQUIRED_LANES_INCOMPLETE':'REQUIRED_LANES_COMPLETE',
      readoutReference:projection.readoutReference,
      admittedLaneIds,
      requiredLaneIds,
      missingRequiredLanes,
      evidenceRefs:uniq(evidenceRows.map(x=>x.claimId)),
      positionCandidateCount:0,
      humanDecision:'NOT_APPLICABLE',
      boundary:'This is readiness for the next derivation stage, not a runtime-position candidate.'
    });
  }
  return {records,derivationReadiness};
}
