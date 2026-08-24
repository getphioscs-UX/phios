import identity from '../../content/health/health-reality-runtime/deployment/hrx-w33-deployment-identity-v1.json';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'referrer-policy': 'no-referrer'
};

export async function onRequestGet(context) {
  const env = context.env || {};
  const pagesCommitSha = String(env.CF_PAGES_COMMIT_SHA || env.PHIOS_DEPLOYED_SHA || '').trim() || null;
  const pagesUrl = String(env.CF_PAGES_URL || '').trim() || null;
  const pagesBranch = String(env.CF_PAGES_BRANCH || '').trim() || null;
  return new Response(JSON.stringify({
    ok: true,
    runtime: identity.runtime,
    candidateId: identity.candidateId,
    sourceBaselineSha: identity.sourceBaselineSha,
    deployment: {
      pagesCommitSha,
      pagesUrl,
      pagesBranch,
      shaMatch: pagesCommitSha ? pagesCommitSha === identity.sourceBaselineSha : null
    },
    activation: {
      liveAuthorityEnabled: env.PHIOS_HEALTH_AUTHORITY_ENABLED === '1',
      persistenceConfigured: Boolean(env.HEALTH_DB && env.PHIOS_HEALTH_DATA_SECRET),
      persistencePromoted: false
    },
    governance: {
      containsHealthData: false,
      diagnosisAllowed: false,
      treatmentPrescriptionAllowed: false,
      cacheable: false
    }
  }), { status: 200, headers });
}

export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: false, error: { code: 'HRX_STATUS_GET_ONLY' } }), { status: 405, headers });
}
