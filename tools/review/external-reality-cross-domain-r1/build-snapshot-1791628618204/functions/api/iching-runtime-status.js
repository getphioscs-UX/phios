import { inspectIChingExecutionAuthority } from '../iching-product-runtime/iching-execution-authority-v1.js';
import { symbolicPersistenceProviderState } from '../symbolic-method-persistence/symbolic-account-identity-v1.js';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff'
};

export async function onRequestGet(context) {
  const authority = context?.data?.symbolicExecutionAuthority?.I_CHING || {};
  const execution = inspectIChingExecutionAuthority(context);
  const persistence = symbolicPersistenceProviderState(context);
  const commitSha = String(context?.env?.CF_PAGES_COMMIT_SHA || '').trim() || null;
  const gates = Object.freeze({
    humanAcceptance: authority.humanAcceptance === true,
    verifiedPersistenceIdentity: authority.verifiedPersistenceIdentity === true && persistence.verifiedIdentityBound,
    persistenceProvider: persistence.providerReady,
    liveBrowserAcceptance: authority.liveBrowserAcceptance === true,
    liveProductionSha: authority.liveProductionShaVerified === true && Boolean(commitSha) && authority.liveProductionSha === commitSha
  });
  const fullyActivated = execution.authorized && Object.values(gates).every(Boolean);
  return new Response(JSON.stringify({
    ok: true,
    method: 'I_CHING',
    deployment: { commitSha },
    activation: {
      state: fullyActivated ? 'LIMITED_PRODUCTION' : 'ACTIVATION_EVIDENCE_PENDING',
      fullyActivated,
      runAllowed: fullyActivated,
      gates,
      identityProviderId: persistence.identityProviderId
    },
    boundaries: {
      clientMayGrantAuthority: false,
      rawIdentityExposed: false,
      guestPersistenceAllowed: false,
      browserLocalFallbackAllowed: false
    }
  }), { status: 200, headers });
}

export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: false, error: { code: 'METHOD_NOT_ALLOWED' } }), { status: 405, headers });
}
