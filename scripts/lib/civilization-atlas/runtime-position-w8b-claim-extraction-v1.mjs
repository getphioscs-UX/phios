const LOCATOR_TYPES=new Set(['PAGE','SECTION','TABLE','PARAGRAPH','ANCHOR','DATASET_FIELD','URL_FRAGMENT','FIGURE','APPENDIX']);
const SUPPORT_LEVELS=new Set(['DIRECT','PARTIAL']);
const CLAIM_TYPES=new Set(['GENERAL_CURRENT_FACT','BREAKING_NEWS','NEWS_DEVELOPMENT','POLICY_OR_REGULATION','COMPANY_PRODUCT_SPEC']);
const iso=value=>{const d=new Date(value);return value&&!Number.isNaN(d.valueOf())?d.toISOString():null;};

export function buildW8bClaimWorkOrders({validatedSources}={}){
  const out=[];
  for(const source of validatedSources?.records||[]){
    for(const laneId of source.targetLanes||[]){
      out.push({
        claimWorkOrderId:'W8B-'+source.intakeId+'-'+laneId,
        sourceId:source.sourceId,
        intakeId:source.intakeId,
        dossierId:source.dossierId,
        laneId,
        publisher:source.publisher,
        title:source.title,
        url:source.url,
        authorityClassHint:source.authorityClassHint,
        sourceVersionOrDigest:source.sourceVersionOrDigest,
        state:'CLAIM_REQUIRED',
        claimCandidateIds:[]
      });
    }
  }
  return out;
}

export function validateW8bClaimIntake({intake,validatedSources,contract}={}){
  const producedAt=iso(intake?.producedAt);
  if(!producedAt)throw new Error('W8B_INTAKE_PRODUCED_AT_REQUIRED');
  const sourceMap=new Map((validatedSources?.records||[]).map(row=>[row.sourceId,row]));
  const seen=new Set(),records=[],rejected=[];
  for(const raw of intake?.claims||[]){
    const reasons=[];
    if(!String(raw?.claimCandidateId||'').trim())reasons.push('CLAIM_CANDIDATE_ID_REQUIRED');
    if(raw?.claimCandidateId&&seen.has(raw.claimCandidateId))reasons.push('CLAIM_CANDIDATE_ID_DUPLICATE');
    if(raw?.claimCandidateId)seen.add(raw.claimCandidateId);
    const source=sourceMap.get(raw?.sourceId);
    if(!source)reasons.push('SOURCE_NOT_VALIDATED');
    if(source&&raw?.dossierId!==source.dossierId)reasons.push('DOSSIER_SOURCE_MISMATCH');
    if(source&&!source.targetLanes?.includes(raw?.laneId))reasons.push('LANE_SOURCE_MISMATCH');
    if(!CLAIM_TYPES.has(raw?.claimType))reasons.push('CLAIM_TYPE_INVALID');
    const claimText=String(raw?.claimText||'').trim();
    if(!claimText)reasons.push('CLAIM_TEXT_REQUIRED');
    if(claimText.length>1200)reasons.push('CLAIM_TEXT_TOO_LONG');
    if(!SUPPORT_LEVELS.has(raw?.supportLevel))reasons.push('SUPPORT_LEVEL_INVALID');
    if(!raw?.sourceLocator||!LOCATOR_TYPES.has(raw.sourceLocator.type)||!String(raw.sourceLocator.value||'').trim())reasons.push('SOURCE_LOCATOR_REQUIRED');
    if(raw?.sourceLocator?.value&&String(raw.sourceLocator.value).length>500)reasons.push('SOURCE_LOCATOR_TOO_LONG');
    if(raw?.supportNote&&String(raw.supportNote).length>1000)reasons.push('SUPPORT_NOTE_TOO_LONG');
    if(raw?.observedAt&&!iso(raw.observedAt))reasons.push('OBSERVED_AT_INVALID');
    if(raw?.observedAt&&new Date(iso(raw.observedAt))>new Date(producedAt))reasons.push('OBSERVED_AFTER_PRODUCED_AT');
    if(reasons.length){
      rejected.push({claimCandidateId:raw?.claimCandidateId||null,sourceId:raw?.sourceId||null,dossierId:raw?.dossierId||null,laneId:raw?.laneId||null,reasons});
      continue;
    }
    records.push({
      claimCandidateId:String(raw.claimCandidateId).trim(),
      sourceId:raw.sourceId,
      dossierId:raw.dossierId,
      laneId:raw.laneId,
      claimType:raw.claimType,
      claimText,
      sourceLocator:{type:raw.sourceLocator.type,value:String(raw.sourceLocator.value).trim()},
      supportLevel:raw.supportLevel,
      supportNote:raw.supportNote?String(raw.supportNote).trim():null,
      observedAt:raw.observedAt?iso(raw.observedAt):null,
      conflictGroup:raw.conflictGroup||null,
      jurisdiction:raw.jurisdiction||source?.jurisdiction||null,
      sourceLineage:{
        intakeId:source.intakeId,
        url:source.url,
        publisher:source.publisher,
        title:source.title,
        publishedAt:source.publishedAt,
        retrievedAt:source.retrievedAt,
        authorityClassHint:source.authorityClassHint,
        sourceVersionOrDigest:source.sourceVersionOrDigest
      },
      claimState:'SOURCE_BOUNDED_CLAIM_CANDIDATE_NOT_ADMITTED',
      boundaries:{isAdmittedEvidence:false,isCurrentData:false,sourceVotingUsed:false,derivedReadingCreated:false,runtimePositionCreated:false}
    });
  }
  return {records,rejected,allowedClaimTypes:[...(contract?.allowedClaimTypes||CLAIM_TYPES)]};
}

export function toW8bCwaReadyClaim(row){
  return {
    claimCandidateId:row.claimCandidateId,
    sourceId:row.sourceId,
    dossierId:row.dossierId,
    laneId:row.laneId,
    claimType:row.claimType,
    claimText:row.claimText,
    supportLevel:row.supportLevel,
    jurisdiction:row.jurisdiction,
    conflictGroup:row.conflictGroup,
    sourceLocator:row.sourceLocator,
    candidate:{
      url:row.sourceLineage.url,
      publisher:row.sourceLineage.publisher,
      title:row.sourceLineage.title,
      publishedAt:row.sourceLineage.publishedAt,
      retrievedAt:row.sourceLineage.retrievedAt
    },
    authorityClassHint:row.sourceLineage.authorityClassHint,
    sourceVersionOrDigest:row.sourceLineage.sourceVersionOrDigest,
    admissionState:'NOT_EVALUATED_BY_CWA'
  };
}
