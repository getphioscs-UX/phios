/** Fail-closed I Ching public execution authority. Client input can never satisfy this gate. */
export function inspectIChingExecutionAuthority(context={}){
  const authority=context?.data?.symbolicExecutionAuthority?.I_CHING;
  const liveSha=String(context?.env?.CF_PAGES_COMMIT_SHA||'').trim();
  const authorized=Boolean(
    authority&&authority.methodCode==='I_CHING'&&authority.state==='LIMITED_PRODUCTION'&&
    authority.runAllowed===true&&authority.humanAcceptance===true&&
    authority.verifiedPersistenceIdentity===true&&authority.liveBrowserAcceptance===true&&
    authority.liveProductionShaVerified===true&&liveSha&&authority.liveProductionSha===liveSha
  );
  return Object.freeze({
    authorized,
    state:authorized?'LIMITED_PRODUCTION':'PRODUCT_RUNTIME_SOURCE_READY_ACTIVATION_EVIDENCE_PENDING',
    runAllowed:authorized,
    limitedProduction:authorized,
    clientMayGrantAuthority:false
  });
}
