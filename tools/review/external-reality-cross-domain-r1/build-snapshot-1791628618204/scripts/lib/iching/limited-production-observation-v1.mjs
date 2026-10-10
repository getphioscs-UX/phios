import assert from 'node:assert/strict';
const readJson=async response=>{const text=await response.text();try{return JSON.parse(text);}catch{return {raw:text};}};
const clone=value=>structuredClone(value);
const summarizeExecution=(item,body)=>({
  caseId:item.caseId,
  passed:true,
  locale:body.depthSupplement?.locale||null,
  primaryHexagramId:body.readingIr?.structuralProjection?.primary?.hexagramId||null,
  relatingHexagramId:body.readingIr?.structuralProjection?.relating?.hexagramId||null,
  changingLines:clone(body.readingIr?.structuralProjection?.changingLines||[]),
  sensitiveDomains:clone(body.readingIr?.sensitiveDomainBoundary?.domains||[]),
  runtimeVersion:body.runtimeVersion,
  depthStatus:body.depthSupplement?.status,
  productionState:body.production?.state,
  runAllowed:body.production?.runAllowed===true,
  humanApprovedDepthOnly:body.execution?.humanApprovedDepthOnly===true,
  candidateFallbackUsed:body.execution?.candidateFallbackUsed===true,
  runtimeModelDepthGenerationUsed:body.execution?.runtimeModelDepthGenerationUsed===true,
  userDecisionAuthority:body.readingIr?.agency?.decisionAuthority||null,
  readingMayPredict:body.readingIr?.authority?.readingMayPredict,
  readingMayDiagnose:body.readingIr?.authority?.readingMayDiagnose,
  readingMayInferThirdPartyHiddenState:body.readingIr?.authority?.readingMayInferThirdPartyHiddenState,
  readingMayCreateProfessionalDirective:body.readingIr?.authority?.readingMayCreateProfessionalDirective
});
export async function runIChingLimitedProductionObservation({baseUrl,expectedSha,accessCookie,campaign,fetchImpl=fetch,observedAt=new Date().toISOString()}={}){
  const base=String(baseUrl||'').trim().replace(/\/$/,'');
  const expected=String(expectedSha||'').trim().toLowerCase();
  assert.match(base,/^https:\/\//,'baseUrl must use HTTPS');
  assert.match(expected,/^[0-9a-f]{40}$/,'expectedSha must be a 40-character commit SHA');
  assert.ok(accessCookie,'Access cookie is required');
  assert.equal(campaign.targetDeploymentSha,expected,'W32 must observe the exact campaign deployment SHA');
  const start=await fetchImpl(`${base}${campaign.sessionEndpoint}`,{method:'POST',headers:{accept:'application/json',cookie:`CF_Authorization=${accessCookie}`},redirect:'manual'});
  const startBody=await readJson(start);assert.equal(start.status,200,`W32 session failed: HTTP ${start.status} ${JSON.stringify(startBody)}`);
  assert.equal(startBody.ok,true);assert.equal(startBody.deploymentSha,expected);assert.equal(startBody.d1?.writeReadVerified,true);assert.equal(startBody.boundaries?.fullProduction,false);assert.equal(startBody.boundaries?.retentionConsentGranted,false);assert.equal(startBody.successor?.sessionEndpointVersion,'2.0.0');
  const beta=(start.headers.get('set-cookie')||'').split(';')[0];assert.match(beta,/^__Host-PHIOS_ICHING_BETA=/);
  const get=async path=>{const r=await fetchImpl(`${base}${path}`,{headers:{accept:'application/json',cookie:beta},redirect:'manual'});return [r,await readJson(r)];};
  const [status,statusBody]=await get('/api/iching-runtime-status');assert.equal(status.status,200,JSON.stringify(statusBody));assert.equal(statusBody.deployment?.commitSha,expected);assert.equal(statusBody.activation?.state,'LIMITED_PRODUCTION');assert.equal(statusBody.activation?.runAllowed,true);assert.equal(statusBody.boundaries?.guestPersistenceAllowed,false);assert.equal(statusBody.boundaries?.browserLocalFallbackAllowed,false);
  const [context,contextBody]=await get('/api/symbolic-method-context?method=I_CHING');assert.equal(context.status,200,JSON.stringify(contextBody));assert.equal(contextBody.production?.state,'LIMITED_PRODUCTION');assert.equal(contextBody.production?.runAllowed,true);assert.equal(contextBody.account?.retentionPolicyAccepted,false);assert.equal(contextBody.account?.saveContractAvailable,false);assert.equal(contextBody.account?.saveBlocker,'RETENTION_POLICY_REQUIRED');assert.equal(contextBody.guest?.localBrowserReadingHistory,false);
  const execute=async item=>{const payload={method:'I_CHING',question:item.question,inputMode:'MANUAL_LINES',lines:item.lines,sessionId:`${item.caseId.toLowerCase()}-live`,timestamp:campaign.fixedInputTimestamp,projectionVersion:'1.0.0',locale:item.locale};const r=await fetchImpl(`${base}${campaign.executionEndpoint}`,{method:'POST',headers:{accept:'application/json','content-type':'application/json',cookie:beta},body:JSON.stringify(payload),redirect:'manual'});const body=await readJson(r);assert.equal(r.status,200,`${item.caseId}: ${JSON.stringify(body)}`);assert.equal(body.ok,true,item.caseId);assert.equal(body.runtimeVersion,'2.0.0',item.caseId);assert.equal(body.depthSupplement?.status,'AVAILABLE',item.caseId);assert.equal(body.depthSupplement?.locale,item.locale,item.caseId);assert.equal(body.production?.state,'LIMITED_PRODUCTION',item.caseId);assert.equal(body.production?.runAllowed,true,item.caseId);assert.equal(body.production?.limitedProductionActivated,true,item.caseId);assert.equal(body.execution?.humanApprovedDepthOnly,true,item.caseId);assert.equal(body.execution?.candidateFallbackUsed,false,item.caseId);assert.equal(body.execution?.runtimeModelDepthGenerationUsed,false,item.caseId);assert.equal(body.readingIr?.agency?.decisionAuthority,'USER',item.caseId);assert.equal(body.readingIr?.authority?.readingMayPredict,false,item.caseId);assert.equal(body.readingIr?.authority?.readingMayDiagnose,false,item.caseId);assert.equal(body.readingIr?.authority?.readingMayInferThirdPartyHiddenState,false,item.caseId);assert.equal(body.readingIr?.authority?.readingMayCreateProfessionalDirective,false,item.caseId);assert.equal((body.readingIr?.structuralProjection?.changingLines||[]).length,item.expectedChangingLines,item.caseId);if(item.sensitiveDomain)assert.ok((body.readingIr?.sensitiveDomainBoundary?.domains||[]).includes(item.sensitiveDomain),`${item.caseId}: missing ${item.sensitiveDomain}`);return {body,summary:summarizeExecution(item,body)};};
  const observations=[];let replayDeterministic=false;
  for(const item of campaign.executionCases){const first=await execute(item);observations.push(first.summary);if(item.replay===true){const second=await execute(item);assert.deepEqual(second.body.readingIr,first.body.readingIr,`${item.caseId}: reading replay drift`);assert.deepEqual(second.body.depthSupplement,first.body.depthSupplement,`${item.caseId}: depth replay drift`);replayDeterministic=true;}}
  const guest=await fetchImpl(`${base}${campaign.executionEndpoint}`,{method:'POST',headers:{accept:'application/json','content-type':'application/json'},body:JSON.stringify({method:'I_CHING'}),redirect:'manual'});const guestBody=await readJson(guest);assert.equal(guest.status,423,JSON.stringify(guestBody));assert.equal(guestBody.production?.runAllowed,false);
  const save=await fetchImpl(`${base}/api/symbolic-method-save`,{method:'POST',headers:{accept:'application/json','content-type':'application/json',cookie:beta},body:'{}',redirect:'manual'});const saveBody=await readJson(save);assert.equal(save.status,403,JSON.stringify(saveBody));assert.equal(saveBody.error?.code,'RETENTION_POLICY_REQUIRED');
  const sensitivePassed=observations.filter(x=>x.sensitiveDomains.length>0).length;
  assert.equal(observations.length,campaign.acceptanceCriteria.executionCasesRequired);assert.equal(sensitivePassed,campaign.acceptanceCriteria.sensitiveDomainsFailClosed);assert.equal(replayDeterministic,true);
  return {
    schemaVersion:'PHI-OS-ICHING-LIMITED-PRODUCTION-OBSERVATION-RESULTS-v1.0.0',
    work:'ICH-PROD-W32-LIMITED-PRODUCTION-OBSERVATION-CAMPAIGN',
    campaign:'content/production/symbolic-method/observation/iching-limited-production-observation-campaign-v1.json',
    status:'LIVE_OBSERVATION_ACCEPTED',
    deploymentSha:expected,
    observedAt,
    summary:{controlGatesPassed:6,executionCasesPassed:observations.length,sensitiveDomainCasesPassed:sensitivePassed,replayDeterministic,bilingualLocales:['en','zh-Hans'],runtimeVersion:'2.0.0',humanApprovedDepthCoverage:'448/448'},
    controlGates:{accessSessionCreated:true,productionD1WriteReadCleanup:true,limitedRuntimeStatus:true,currentContextLimitedAuthority:true,guestExecutionBlocked423:true,retentionSaveBlocked403:true},
    observations,
    boundaries:{authorityState:'LIMITED_PRODUCTION',fullProduction:false,globalPublicExecutionClaimed:false,retentionConsentGranted:false,guestRunAllowed:false,userDecisionAuthorityPreserved:true},
    privacy:{rawAccessCookieStored:false,betaSessionCookieStored:false,rawAccountIdentityStored:false,sessionSecretStored:false}
  };
}
