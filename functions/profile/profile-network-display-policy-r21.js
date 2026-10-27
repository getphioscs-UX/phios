// Local candidate only. No client flag can activate the production reader.
export const PROFILE_NETWORK_DISPLAY='PROFILE_NETWORK_DISPLAY';
export function requireLocalNetworkDisplay(context){
 if(context.env?.PHIOS_PROFILE_NETWORK_LOCAL!=='true'||!['localhost','127.0.0.1'].includes(new URL(context.request.url).hostname))throw Object.assign(Error('PROFILE_NETWORK_PRODUCTION_BLOCKED'),{code:'PROFILE_NETWORK_PRODUCTION_BLOCKED',status:403});
}
export function displayBinding({domain,edgeIds}){
 if(!['FINANCIAL','ESTATE'].includes(domain)||!Array.isArray(edgeIds)||!edgeIds.length||edgeIds.length>100||Array.from(edgeIds).some(x=>typeof x!=='string'||!x||x.length>200)||new Set(edgeIds).size!==edgeIds.length)throw Object.assign(Error('PROFILE_DISPLAY_SELECTION_REQUIRED'),{status:422});
 return JSON.stringify({version:'PROFILE_DISPLAY_R2.1',domain,edgeIds:[...edgeIds].sort()});
}
