import assert from 'node:assert/strict';
import {runIChingLimitedProductionObservation as runV1} from './limited-production-observation-v1.mjs';

export async function runIChingLimitedProductionObservationV2({baseUrl,expectedSha,accessCookie,campaign,fetchImpl=fetch,observedAt=new Date().toISOString(),lineageEvidence={}}={}){
  const expected=String(expectedSha||'').trim().toLowerCase();
  assert.match(expected,/^[0-9a-f]{40}$/,'expectedSha must be a 40-character commit SHA');
  assert.equal(campaign?.schemaVersion,'PHI-OS-ICHING-LIMITED-PRODUCTION-OBSERVATION-CAMPAIGN-v2.0.0');
  assert.equal(campaign?.targetDeploymentMode,'CURRENT_EXACT_SHA_SUCCESSOR_FROM_OPERATOR_ENV');
  assert.notEqual(expected,campaign?.historicalFirstLiveAdmissionSha,'W32R1 must observe a successor SHA, not rewrite the historical first-live deployment');
  const effective=structuredClone(campaign); effective.targetDeploymentSha=expected;
  const result=await runV1({baseUrl,expectedSha:expected,accessCookie,campaign:effective,fetchImpl,observedAt});
  return Object.freeze({
    ...result,
    schemaVersion:'PHI-OS-ICHING-LIMITED-PRODUCTION-OBSERVATION-RESULTS-v2.0.0',
    work:'ICH-PROD-W32R1-SUCCESSOR-SHA-OBSERVATION-CAMPAIGN',
    campaign:'content/production/symbolic-method/observation/iching-limited-production-observation-campaign-v2.json',
    historicalFirstLiveAdmissionSha:campaign.historicalFirstLiveAdmissionSha,
    observedSuccessorDeploymentSha:expected,
    sourceLineage:Object.freeze({
      historicalAdmissionIsAncestor:lineageEvidence.historicalAdmissionIsAncestor===true,
      localHeadMatchesObservedSha:lineageEvidence.localHeadMatchesObservedSha===true,
      exactRuntimeFingerprintVerified:lineageEvidence.exactRuntimeFingerprintVerified===true,
      sharedSemanticContractVerified:lineageEvidence.sharedSemanticContractVerified===true
    })
  });
}
