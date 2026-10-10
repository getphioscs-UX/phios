import {
  normalizeCurrentSourceCandidate,
  admitCurrentSource,
  createCurrentEvidence,
  resolveCurrentEvidenceConflict
} from '../../../functions/current-web-authority/current-web-authority-runtime.js';
import {buildBook6DossierRreProjection} from './book6-rre-adapter-v1.mjs';

const ALLOWED_ROLES=new Set(['PRIMARY_CANDIDATE','SECONDARY_CANDIDATE','SUBSYSTEM_CANDIDATE']);
const uniq=values=>[...new Set((values||[]).filter(Boolean))];
const fail=code=>{const error=new Error(code);error.code=code;throw error;};
const day=value=>String(value||'').slice(0,10);

function processClaim(row,batch){
  const base={claimId:row?.claimId||null,laneId:row?.laneId||null};
  try{
    const candidate=normalizeCurrentSourceCandidate({
      ...(row.candidate||{}),
      retrievedAt:row?.candidate?.retrievedAt||batch.runAt
    });
    const admission=admitCurrentSource({
      candidate,
      domain:row.domain||batch.domain||'GENERAL_CURRENT',
      authorityClass:row.authorityClass,
      claimType:row.claimType||batch.claimType||'GENERAL_CURRENT_FACT',
      now:batch.runAt,
      sourceVersionCurrent:row.sourceVersionCurrent??true,
      superseded:row.superseded===true,
      sourceId:row.sourceId,
      sourceVersionOrDigest:row.sourceVersionOrDigest
    });
    if(admission.admissionState!=='ADMITTED')return {...base,state:admission.admissionState,reason:admission.reason||null,admission};
    const ev=createCurrentEvidence({
      claimId:row.claimId,
      claimText:row.claimText,
      claimType:row.claimType||batch.claimType||'GENERAL_CURRENT_FACT',
      admission,
      publishedAt:row.publishedAt||row?.candidate?.publishedAt||null,
      supportLevel:row.supportLevel||'DIRECT',
      jurisdiction:row.jurisdiction||null,
      conflicts:row.conflicts||[]
    });
    return {...base,state:'ADMITTED',conflictGroup:row.conflictGroup||null,evidence:{...ev,laneId:row.laneId}};
  }catch(error){
    return {...base,state:'REJECTED',reason:String(error?.code||error?.message||'CWA_ADMISSION_FAILED')};
  }
}

export function processRuntimePositionW8Batch({batch,dossier,cases=[],readiness,positions=[],registries,mode='PRODUCTION'}={}){
  if(!batch?.batchId||!batch?.dossierId||!batch?.runAt)fail('W8_BATCH_ID_DOSSIER_RUN_AT_REQUIRED');
  if(mode==='PRODUCTION'&&batch.fixtureOnly===true)fail('W8_FIXTURE_NOT_ALLOWED_IN_PRODUCTION');
  if(!dossier?.id||dossier.id!==batch.dossierId)fail('W8_DOSSIER_MISMATCH');
  if(!registries)fail('W8_RRE_REGISTRIES_REQUIRED');
  const readinessRow=(readiness?.dossiers||[]).find(row=>row.dossierId===batch.dossierId);
  if(!readinessRow)fail('W8_READINESS_DOSSIER_REQUIRED');

  const claimResults=(batch.claims||[]).map(row=>processClaim(row,batch));
  const admitted=claimResults.filter(row=>row.state==='ADMITTED'&&row.evidence);
  const evidenceById=new Map(admitted.map(row=>[row.evidence.claimId,row.evidence]));
  const conflictGroups=new Map();
  for(const row of admitted){
    if(!row.conflictGroup)continue;
    if(!conflictGroups.has(row.conflictGroup))conflictGroups.set(row.conflictGroup,[]);
    conflictGroups.get(row.conflictGroup).push(row.evidence);
  }
  const conflictResults=[...conflictGroups.entries()].map(([groupId,items])=>({groupId,...resolveCurrentEvidenceConflict(items)}));
  const unresolvedConflictGroups=conflictResults.filter(row=>row.state==='UNKNOWN_CONFLICTED').map(row=>row.groupId);

  const requiredLaneIds=(readinessRow.sourceLaneRequirements||[]).filter(row=>row.requiredForPositionCandidate).map(row=>row.laneId);
  const admittedLaneIds=uniq(admitted.map(row=>row.laneId));
  const missingRequiredLanes=requiredLaneIds.filter(id=>!admittedLaneIds.includes(id));
  const currentEvidenceRecord={
    dossierId:dossier.id,
    currentEvidence:{
      admissionState:admitted.length?'CURRENT_EVIDENCE_ADMITTED':'NO_ADMITTED_CURRENT_EVIDENCE',
      admittedClaims:admitted.map(row=>row.evidence),
      conflictState:unresolvedConflictGroups.length?'CONFLICTED':(conflictResults.some(row=>row.state==='RESOLVED_BY_AUTHORITY')?'RESOLVED_BY_AUTHORITY':'NO_CONFLICT')
    },
    transitionSignals:{observed:[]},
    observationThreshold:{state:'NOT_EVALUATED'},
    reachablePositions:{positions:[]}
  };

  let rreProjection=null;
  if(admitted.length){
    const runtimeDossier={...dossier,dataClass:'CURRENT_DATA',asOfDate:day(batch.runAt),sourceDate:day(batch.runAt),sourceFreshness:'CWA_ADMITTED_BATCH',lastReviewedAt:day(batch.runAt)};
    rreProjection=buildBook6DossierRreProjection({dossier:runtimeDossier,cases,registries,currentEvidenceRecord});
  }

  const candidateGateOpen=Boolean(admitted.length&&missingRequiredLanes.length===0&&unresolvedConflictGroups.length===0&&rreProjection?.readoutReference?.code);
  const outCandidates=[];
  const rejectedPositionProposals=[];
  for(const proposal of batch.positionProposals||[]){
    const reasons=[];
    if(!candidateGateOpen)reasons.push('CANDIDATE_GATE_CLOSED');
    if(!ALLOWED_ROLES.has(proposal.candidateRole))reasons.push('CANDIDATE_ROLE_INVALID');
    const evidenceRefs=uniq(proposal.evidenceRefs||[]);
    if(!evidenceRefs.length||evidenceRefs.some(ref=>!evidenceById.has(ref)))reasons.push('PROPOSAL_EVIDENCE_NOT_ADMITTED');
    const position=positions.find(row=>row.grammarId===proposal.grammarId&&row.realityDomainId===proposal.realityDomainId);
    if(!position)reasons.push('CANONICAL_GRAMMAR_DOMAIN_POSITION_NOT_FOUND');
    if(!String(proposal.grammarRationale||'').trim())reasons.push('GRAMMAR_RATIONALE_REQUIRED');
    if(!String(proposal.domainRationale||'').trim())reasons.push('DOMAIN_RATIONALE_REQUIRED');
    if(reasons.length){rejectedPositionProposals.push({proposalId:proposal.proposalId||null,reasons});continue;}
    outCandidates.push({
      dossierId:dossier.id,batchId:batch.batchId,candidateId:'W8-'+batch.batchId+'-'+proposal.proposalId,proposalId:proposal.proposalId,
      scope:proposal.scope,candidatePositionId:position.id,candidateRole:proposal.candidateRole,evidenceRefs,rreReadoutRef:rreProjection.readoutReference,
      grammarId:proposal.grammarId,realityDomainId:proposal.realityDomainId,grammarRationale:proposal.grammarRationale,domainRationale:proposal.domainRationale,
      supportState:'HUMAN_REVIEW_READY',conflicts:[],unknowns:proposal.unknowns||[],humanDecision:'PENDING',dataClass:'DERIVED_RUNTIME_READOUT',
      boundaries:{currentPositionAdmitted:false,sourceWindowDateUsedAsPosition:false,autoPopulationUsed:false}
    });
  }
  const state=!admitted.length?'NO_ADMITTED_EVIDENCE':!rreProjection?'CURRENT_EVIDENCE_ADMITTED':missingRequiredLanes.length||unresolvedConflictGroups.length?'RRE_READY_REQUIRED_LANES_INCOMPLETE':outCandidates.length?'POSITION_HUMAN_REVIEW':'RRE_READY_NO_POSITION_PROPOSAL';
  return {schemaVersion:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8-BATCH-RESULT-v1.0.0',batchId:batch.batchId,dossierId:dossier.id,state,runAt:batch.runAt,claimResults,admittedEvidence:admitted.map(row=>row.evidence),conflictResults,requiredLaneIds,admittedLaneIds,missingRequiredLanes,currentEvidenceRecord,rreProjection,candidateGateOpen,candidates:outCandidates,rejectedPositionProposals,boundaries:{canonicalDossierMutated:false,missingSourcesInferred:false,positionAutoAdmitted:false,dossierAutoPopulated:false}};
}
