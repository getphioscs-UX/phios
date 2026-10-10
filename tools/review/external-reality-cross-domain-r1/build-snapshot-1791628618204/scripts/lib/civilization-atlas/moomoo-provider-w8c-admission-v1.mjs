const exactHost='webapi.moomoo.com';
export function buildMoomooProviderAuthorityDecisions({claims,providerRegistry,sourceHandoff,producedAt=new Date().toISOString()}={}){
  const provider=(providerRegistry?.providers||[]).find(x=>x.providerId==='MOOMOO_OPENAPI');
  if(!provider)throw new Error('MOOMOO_PROVIDER_REGISTRY_MISSING');
  if(provider.authorityClass!=='MARKET_DATA_PROVIDER')throw new Error('MOOMOO_PROVIDER_AUTHORITY_CLASS_MISMATCH');
  if(provider.cwaDomain!=='FINANCIAL_MARKETS')throw new Error('MOOMOO_PROVIDER_DOMAIN_MISMATCH');
  const sourceMap=new Map((sourceHandoff?.records||[]).map(x=>[x.sourceId,x]));
  const decisions=[],rejected=[];
  for(const claim of claims?.records||[]){
    const reasons=[];
    const source=sourceMap.get(claim.sourceId);
    if(!source)reasons.push('PROVIDER_SOURCE_HANDOFF_MISSING');
    if(source&&source.publisher!=='Moomoo OpenAPI')reasons.push('PROVIDER_PUBLISHER_MISMATCH');
    if(source&&source.authorityClassHint!=='MARKET_DATA_PROVIDER')reasons.push('PROVIDER_AUTHORITY_HINT_MISMATCH');
    if(source&&source.dossierId!==claim.dossierId)reasons.push('DOSSIER_SOURCE_MISMATCH');
    if(source&&!source.targetLanes?.includes(claim.laneId))reasons.push('LANE_SOURCE_MISMATCH');
    try{
      const u=new URL(claim.candidate?.url||source?.url||'');
      if(u.hostname!==exactHost)reasons.push('PROVIDER_HOST_MISMATCH');
    }catch{reasons.push('PROVIDER_URL_INVALID');}
    if(claim.authorityClassHint!=='MARKET_DATA_PROVIDER')reasons.push('CLAIM_AUTHORITY_HINT_MISMATCH');
    if(claim.admissionState!=='NOT_EVALUATED_BY_CWA')reasons.push('CLAIM_NOT_CWA_PENDING');
    if(reasons.length){rejected.push({claimCandidateId:claim.claimCandidateId,reasons});continue;}
    decisions.push({
      claimCandidateId:claim.claimCandidateId,
      authorityClass:'MARKET_DATA_PROVIDER',
      domain:'FINANCIAL_MARKETS',
      reviewedAt:producedAt,
      reviewerRole:'PHI_OS_REGISTERED_PROVIDER_AUTHORITY_POLICY',
      decisionBasis:'Claim source resolves to the governed MOOMOO_OPENAPI provider source handoff; Moomoo OpenAPI is registered as MARKET_DATA_PROVIDER for FINANCIAL_MARKETS. This decision admits provider authority class/domain only and does not interpret market direction or runtime position.',
      sourceVersionCurrent:true,
      superseded:false,
      notes:'R1-W8C-P2 first MARKET_DATA_PROVIDER admission batch.'
    });
  }
  return {producedAt,decisions,rejected};
}
