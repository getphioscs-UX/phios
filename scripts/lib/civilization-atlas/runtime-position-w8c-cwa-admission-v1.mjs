import {
  normalizeCurrentSourceCandidate,
  admitCurrentSource,
  createCurrentEvidence,
  resolveCurrentEvidenceConflict
} from '../../../functions/current-web-authority/current-web-authority-runtime.js';

const DOMAIN_SET=new Set(['HEALTH','FINANCIAL_MARKETS','COMPANY_PRODUCT','NEWS_CURRENT_EVENTS','WEATHER','GENERAL_CURRENT']);
const AUTHORITY_SET=new Set(['OFFICIAL_PRIMARY','REGULATOR','PUBLIC_HEALTH','GOVERNMENT','OFFICIAL_COMPANY','ACADEMIC','MARKET_DATA_PROVIDER','REPUTABLE_NEWS','SECONDARY_REFERENCE','COMMUNITY']);
const iso=value=>{const d=new Date(value);return value&&!Number.isNaN(d.valueOf())?d.toISOString():null;};

export function buildW8cAdmissionWorkOrders({cwaReadyClaims}={}){
  return (cwaReadyClaims?.records||[]).map(row=>({
    admissionWorkOrderId:'W8C-'+row.claimCandidateId,
    claimCandidateId:row.claimCandidateId,
    dossierId:row.dossierId,
    laneId:row.laneId,
    sourceId:row.sourceId,
    claimType:row.claimType,
    authorityClassHint:row.authorityClassHint,
    sourceUrl:row.candidate?.url||null,
    publisher:row.candidate?.publisher||null,
    state:'AUTHORITY_DECISION_REQUIRED'
  }));
}

export function validateW8cAuthorityDecisions({decisionIntake,cwaReadyClaims}={}){
  const producedAt=iso(decisionIntake?.producedAt);
  if(!producedAt)throw new Error('W8C_DECISION_PRODUCED_AT_REQUIRED');
  const claimMap=new Map((cwaReadyClaims?.records||[]).map(row=>[row.claimCandidateId,row]));
  const seen=new Set(),records=[],rejected=[];
  for(const raw of decisionIntake?.decisions||[]){
    const reasons=[];
    if(!raw?.claimCandidateId||!claimMap.has(raw.claimCandidateId))reasons.push('CLAIM_CANDIDATE_UNKNOWN');
    if(raw?.claimCandidateId&&seen.has(raw.claimCandidateId))reasons.push('CLAIM_DECISION_DUPLICATE');
    if(raw?.claimCandidateId)seen.add(raw.claimCandidateId);
    if(!AUTHORITY_SET.has(raw?.authorityClass))reasons.push('AUTHORITY_CLASS_INVALID');
    if(!DOMAIN_SET.has(raw?.domain))reasons.push('DOMAIN_INVALID');
    const reviewedAt=iso(raw?.reviewedAt);
    if(!reviewedAt)reasons.push('REVIEWED_AT_INVALID');
    else if(new Date(reviewedAt)>new Date(producedAt))reasons.push('REVIEWED_AFTER_PRODUCED_AT');
    if(!String(raw?.reviewerRole||'').trim())reasons.push('REVIEWER_ROLE_REQUIRED');
    if(!String(raw?.decisionBasis||'').trim())reasons.push('DECISION_BASIS_REQUIRED');
    if(reasons.length){rejected.push({claimCandidateId:raw?.claimCandidateId||null,reasons});continue;}
    records.push({
      claimCandidateId:raw.claimCandidateId,
      authorityClass:raw.authorityClass,
      domain:raw.domain,
      reviewedAt,
      reviewerRole:String(raw.reviewerRole).trim(),
      decisionBasis:String(raw.decisionBasis).trim(),
      sourceVersionCurrent:raw.sourceVersionCurrent===true?true:(raw.sourceVersionCurrent===false?false:null),
      superseded:raw.superseded===true,
      notes:raw.notes||null
    });
  }
  return {records,rejected,producedAt};
}

export function runW8cAdmission({cwaReadyClaims,decisionIntake}={}){
  const validation=validateW8cAuthorityDecisions({decisionIntake,cwaReadyClaims});
  const decisionMap=new Map(validation.records.map(row=>[row.claimCandidateId,row]));
  const resultRows=[],evidenceRows=[];
  for(const claim of cwaReadyClaims?.records||[]){
    const decision=decisionMap.get(claim.claimCandidateId);
    if(!decision){
      resultRows.push({claimCandidateId:claim.claimCandidateId,dossierId:claim.dossierId,laneId:claim.laneId,sourceId:claim.sourceId,admissionState:'PENDING_AUTHORITY_DECISION',reason:null});
      continue;
    }
    try{
      const candidate=normalizeCurrentSourceCandidate({
        ...(claim.candidate||{}),
        authorityClassHint:claim.authorityClassHint||null,
        sourceVersionHint:claim.sourceVersionOrDigest||null
      });
      const admission=admitCurrentSource({
        candidate,
        domain:decision.domain,
        authorityClass:decision.authorityClass,
        claimType:claim.claimType,
        now:validation.producedAt,
        sourceVersionCurrent:decision.sourceVersionCurrent,
        superseded:decision.superseded,
        sourceId:claim.sourceId,
        sourceVersionOrDigest:claim.sourceVersionOrDigest
      });
      if(admission.admissionState!=='ADMITTED'){
        resultRows.push({claimCandidateId:claim.claimCandidateId,dossierId:claim.dossierId,laneId:claim.laneId,sourceId:claim.sourceId,admissionState:admission.admissionState,reason:admission.reason||null,freshness:admission.freshness||null,decision});
        continue;
      }
      const currentEvidence=createCurrentEvidence({
        claimId:claim.claimCandidateId,
        claimText:claim.claimText,
        claimType:claim.claimType,
        admission,
        publishedAt:claim.candidate?.publishedAt||null,
        supportLevel:claim.supportLevel,
        jurisdiction:claim.jurisdiction||null,
        conflicts:claim.conflictGroup?[claim.conflictGroup]:[]
      });
      const evidence={
        ...currentEvidence,
        claimCandidateId:claim.claimCandidateId,
        dossierId:claim.dossierId,
        laneId:claim.laneId,
        sourceLocator:claim.sourceLocator,
        conflictGroup:claim.conflictGroup||null,
        authorityDecision:{authorityClass:decision.authorityClass,domain:decision.domain,reviewedAt:decision.reviewedAt,reviewerRole:decision.reviewerRole,decisionBasis:decision.decisionBasis},
        evidenceState:'CWA_ADMITTED_PENDING_CONFLICT_RESOLUTION',
        rreEligibility:'PENDING_CONFLICT_RESOLUTION'
      };
      evidenceRows.push(evidence);
      resultRows.push({claimCandidateId:claim.claimCandidateId,dossierId:claim.dossierId,laneId:claim.laneId,sourceId:claim.sourceId,admissionState:'ADMITTED',reason:null,freshness:admission.freshness,authorityClass:decision.authorityClass,domain:decision.domain});
    }catch(error){
      resultRows.push({claimCandidateId:claim.claimCandidateId,dossierId:claim.dossierId,laneId:claim.laneId,sourceId:claim.sourceId,admissionState:'REJECTED',reason:String(error?.code||error?.message||'CWA_ADMISSION_FAILED'),decision});
    }
  }

  const groups=new Map();
  for(const row of evidenceRows){
    if(!row.conflictGroup)continue;
    if(!groups.has(row.conflictGroup))groups.set(row.conflictGroup,[]);
    groups.get(row.conflictGroup).push(row);
  }
  const conflictRecords=[];
  const disposition=new Map();
  for(const [conflictGroup,rows] of groups){
    const resolution=resolveCurrentEvidenceConflict(rows);
    const selectedClaimId=resolution.selected?.claimId||null;
    conflictRecords.push({
      conflictGroup,
      state:resolution.state,
      selectedClaimId,
      alternativeClaimIds:(resolution.alternatives||[]).map(x=>x.claimId),
      method:resolution.method||null
    });
    if(resolution.state==='UNKNOWN_CONFLICTED'){
      for(const row of rows)disposition.set(row.claimId,{conflictState:'UNKNOWN_CONFLICTED',selected:false});
    }else if(selectedClaimId){
      for(const row of rows)disposition.set(row.claimId,{conflictState:resolution.state,selected:row.claimId===selectedClaimId});
    }
  }
  const finalizedEvidence=evidenceRows.map(row=>{
    const d=disposition.get(row.claimId)||{conflictState:'NO_CONFLICT',selected:true};
    const eligible=row.supportLevel==='DIRECT'&&d.conflictState!=='UNKNOWN_CONFLICTED'&&d.selected===true;
    return {...row,evidenceState:d.conflictState==='UNKNOWN_CONFLICTED'?'CWA_ADMITTED_CONFLICTED':'CWA_ADMITTED',conflictDisposition:d,rreEligibility:eligible?'RRE_ELIGIBLE':'NOT_RRE_ELIGIBLE'};
  });
  const rreEligible=finalizedEvidence.filter(row=>row.rreEligibility==='RRE_ELIGIBLE');
  return {
    decisionValidation:validation,
    admissionResults:resultRows,
    currentEvidence:finalizedEvidence,
    conflictRecords,
    rreEligible
  };
}
