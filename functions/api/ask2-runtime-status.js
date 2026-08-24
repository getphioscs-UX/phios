const headers = Object.freeze({'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});
const json = body => new Response(JSON.stringify(body), { status: 200, headers });
export async function onRequestGet(context) {
  const env = context.env || {};
  return json({
    ok: true,
    schemaVersion: 'PHI-OS-ASK2-RUNTIME-STATUS-v1.0.0',
    sourceBaselineSha: 'cb396cc5b8ab75679e278e47a2a78cb7489f3b70',
    deployedSha: env.CF_PAGES_COMMIT_SHA || env.PHIOS_DEPLOYED_SHA || null,
    environment: env.CF_PAGES_BRANCH ? 'CLOUDFLARE_PAGES' : 'UNKNOWN',
    publicEndpoint: '/api/ask-phios-orchestrated',
    containsPrivateUserData: false,
    modelCalculationAllowed: false,
    rawWebResultAllowed: false
  });
}
