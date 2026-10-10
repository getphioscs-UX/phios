/**
 * TPA-K current Tarot public-execution authority.
 * Human acceptance and source-browser acceptance are source-governed gates.
 * Client input can never grant execution. Production still requires a trusted
 * persistence identity/provider, live deployed SHA alignment and explicit
 * LIMITED_PRODUCTION authority from server-side context.
 */
export const TAROT_SOURCE_HUMAN_ACCEPTANCE=true;
export const TAROT_SOURCE_BROWSER_ACCEPTANCE=true;

export function inspectTarotExecutionAuthority(context={}){
  const authority=context?.data?.symbolicExecutionAuthority?.TAROT;
  const liveSha=String(context?.env?.CF_PAGES_COMMIT_SHA||'').trim();
  const authorized=Boolean(
    authority&&authority.methodCode==='TAROT'&&authority.state==='LIMITED_PRODUCTION'&&
    authority.runAllowed===true&&authority.humanAcceptance===true&&
    authority.verifiedPersistenceIdentity===true&&authority.liveBrowserAcceptance===true&&
    authority.liveProductionShaVerified===true&&liveSha&&authority.liveProductionSha===liveSha
  );
  return Object.freeze({
    authorized,
    state:authorized?'LIMITED_PRODUCTION':'HUMAN_AND_SOURCE_BROWSER_ACCEPTED_LIVE_PERSISTENCE_SHA_PROMOTION_PENDING',
    runAllowed:authorized,
    limitedProduction:authorized,
    humanAcceptance:TAROT_SOURCE_HUMAN_ACCEPTANCE,
    sourceBrowserAcceptance:TAROT_SOURCE_BROWSER_ACCEPTANCE,
    liveProductionShaVerified:authorized,
    clientMayGrantAuthority:false
  });
}
