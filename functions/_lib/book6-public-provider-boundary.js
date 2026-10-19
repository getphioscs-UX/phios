// Historical CWA/RRE admission does not grant public market-data redistribution.
export function publicBook6ProviderBoundary(projection){
  if(!projection)return projection;
  const evidence=projection.externalEvidence||[];
  const withheld=evidence.filter(e=>String(e.sourceId||'').startsWith('MOOMOO-')||/^https:\/\/webapi\.moomoo\.com\//i.test(e.sourceUrl||''));
  return {...projection,externalEvidence:evidence.filter(e=>!withheld.includes(e)),externalProviderDisplay:{state:withheld.length?'RIGHTS_UNVERIFIED_WITHHELD':'NO_UNVERIFIED_PROVIDER_FIELDS',withheldRecords:withheld.length,acceptedPositionsUnchanged:true}};
}
