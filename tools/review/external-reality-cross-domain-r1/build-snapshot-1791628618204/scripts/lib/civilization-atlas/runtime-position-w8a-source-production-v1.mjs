const AUTHORITY_CLASSES=new Set(['OFFICIAL_PRIMARY','REGULATOR','PUBLIC_HEALTH','GOVERNMENT','OFFICIAL_COMPANY','ACADEMIC','MARKET_DATA_PROVIDER','REPUTABLE_NEWS','SECONDARY_REFERENCE','COMMUNITY']);
const iso=value=>{const d=new Date(value);return value&&!Number.isNaN(d.valueOf())?d.toISOString():null;};
const https=value=>{try{const u=new URL(value);return u.protocol==='https:'?u.toString():null;}catch{return null;}};

export function buildW8aSourceWorkOrders({readiness,queryByLane={}}={}){
  const rows=[];
  for(const dossier of readiness?.dossiers||[]){
    for(const lane of dossier.sourceLaneRequirements||[]){
      const required=Boolean(lane.requiredForPositionCandidate);
      const entity=dossier.entity?.en||dossier.dossierId;
      rows.push({
        workOrderId:'W8A-'+String(dossier.dossierId).replace(/^DOSSIER-/,'')+'-'+lane.laneId,
        dossierId:dossier.dossierId,
        entity:dossier.entity,
        entityType:dossier.entityType,
        laneId:lane.laneId,
        priority:required?'REQUIRED_FOR_POSITION_CANDIDATE':'OPTIONAL_DEPTH',
        requiredForPositionCandidate:required,
        preferredAuthorityClasses:lane.preferredAuthorityClasses||[],
        queryHints:(queryByLane[lane.laneId]||['current official data']).map(q=>entity+' '+q),
        state:'SOURCE_REQUIRED',
        candidateIntakeIds:[]
      });
    }
  }
  return rows;
}

export function validateW8aSourceIntake({intake,readiness,contract}={}){
  const producedAt=iso(intake?.producedAt);
  if(!producedAt)throw new Error('W8A_INTAKE_PRODUCED_AT_REQUIRED');
  const dossierMap=new Map((readiness?.dossiers||[]).map(d=>[d.dossierId,d]));
  const seen=new Set(),records=[],rejected=[];
  for(const raw of intake?.sources||[]){
    const reasons=[];
    if(!raw?.intakeId)reasons.push('INTAKE_ID_REQUIRED');
    if(!raw?.sourceId)reasons.push('SOURCE_ID_REQUIRED');
    if(raw?.sourceId&&seen.has(raw.sourceId))reasons.push('SOURCE_ID_DUPLICATE');
    if(raw?.sourceId)seen.add(raw.sourceId);
    const dossier=dossierMap.get(raw?.dossierId);
    if(!dossier)reasons.push('DOSSIER_UNKNOWN');
    const laneIds=new Set((dossier?.sourceLaneRequirements||[]).map(x=>x.laneId));
    if(!Array.isArray(raw?.targetLanes)||raw.targetLanes.length===0)reasons.push('TARGET_LANES_REQUIRED');
    else if(raw.targetLanes.some(id=>!laneIds.has(id)))reasons.push('TARGET_LANE_UNKNOWN');
    const url=https(raw?.url);if(!url)reasons.push('HTTPS_URL_REQUIRED');
    if(!String(raw?.publisher||'').trim())reasons.push('PUBLISHER_REQUIRED');
    if(!String(raw?.title||'').trim())reasons.push('TITLE_REQUIRED');
    if(!String(raw?.sourceVersionOrDigest||'').trim())reasons.push('SOURCE_VERSION_OR_DIGEST_REQUIRED');
    const retrievedAt=iso(raw?.retrievedAt);if(!retrievedAt)reasons.push('RETRIEVED_AT_INVALID');
    else if(new Date(retrievedAt)>new Date(producedAt))reasons.push('RETRIEVED_AFTER_PRODUCED_AT');
    if(raw?.publishedAt&&!iso(raw.publishedAt))reasons.push('PUBLISHED_AT_INVALID');
    if(!AUTHORITY_CLASSES.has(raw?.authorityClassHint))reasons.push('AUTHORITY_CLASS_HINT_UNKNOWN');
    if(reasons.length){rejected.push({intakeId:raw?.intakeId||null,sourceId:raw?.sourceId||null,dossierId:raw?.dossierId||null,reasons});continue;}
    const lanePrefs=new Map((dossier.sourceLaneRequirements||[]).map(x=>[x.laneId,x.preferredAuthorityClasses||[]]));
    records.push({
      intakeId:raw.intakeId,
      sourceId:raw.sourceId,
      dossierId:raw.dossierId,
      targetLanes:[...new Set(raw.targetLanes)],
      url,
      publisher:String(raw.publisher).trim(),
      title:String(raw.title).trim(),
      publishedAt:raw.publishedAt?iso(raw.publishedAt):null,
      retrievedAt,
      authorityClassHint:raw.authorityClassHint,
      sourceVersionOrDigest:String(raw.sourceVersionOrDigest).trim(),
      jurisdiction:raw.jurisdiction||null,
      locale:raw.locale||null,
      notes:raw.notes||null,
      preferredForEveryTargetLane:[...new Set(raw.targetLanes)].every(id=>(lanePrefs.get(id)||[]).includes(raw.authorityClassHint)),
      sourceState:'STRUCTURALLY_VALIDATED_NOT_ADMITTED',
      boundaries:{isFact:false,isClaim:false,isEvidence:false,isCurrentData:false}
    });
  }
  return {records,rejected,knownAuthorityClasses:[...(contract?.knownAuthorityClasses||AUTHORITY_CLASSES)]};
}

