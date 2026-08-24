import assert from 'node:assert/strict';
const base = String(process.env.PHIOS_ASK2_BASE_URL || '').replace(/\/$/, '');
const expectedSha = String(process.env.PHIOS_EXPECTED_SHA || '').trim();
if (!base.startsWith('https://')) throw new Error('PHIOS_ASK2_BASE_URL_HTTPS_REQUIRED');
if (!expectedSha) throw new Error('PHIOS_EXPECTED_SHA_REQUIRED');


const statusResponse = await fetch(`${base}/api/ask2-runtime-status`, { headers: { accept: 'application/json' } });
const runtimeStatus = await statusResponse.json().catch(() => null);
assert.equal(statusResponse.ok, true, 'ASK2_STATUS_ENDPOINT_FAILED');
assert.equal(statusResponse.headers.get('cache-control')?.includes('no-store'), true, 'ASK2_STATUS_NO_STORE_REQUIRED');
assert.equal(runtimeStatus?.deployedSha, expectedSha, 'ASK2_DEPLOYED_SHA_MISMATCH');

async function post(q) {
  const response = await fetch(`${base}/api/ask-phios-orchestrated`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ q, locale: 'zh-Hans' })
  });
  const payload = await response.json().catch(() => null);
  assert.equal(response.headers.get('cache-control')?.includes('no-store'), true, 'ASK2_LIVE_NO_STORE_REQUIRED');
  assert.equal(response.ok, true, `ASK2_LIVE_HTTP_${response.status}`);
  assert.equal(payload?.ok, true, 'ASK2_LIVE_PAYLOAD_NOT_OK');
  return payload;
}

const lens = await post('今年事业环境如何？');
assert.equal(lens.mode, 'ASK2');
assert.equal(Boolean(lens.ask2?.plan?.lensDisclosure), true);
assert.equal(lens.ask2?.plan?.boundaries?.modelCalculationAllowed, false);
assert.notEqual(lens.cka?.w5w17?.answerState, 'ANSWERED', 'ASK2_MUST_NOT_FAKE_RUNTIME_RESULT_WITHOUT_INPUT');

const health = await post('为什么我的手会起红疹');
assert.equal(health.mode, 'HEALTH', 'ASK2_HEALTH_RED_RASH_ROUTE_REGRESSION');
assert.equal(health.ask2?.health?.governance?.diagnosisAllowed, false);

const evergreen = await post('什么是 Reality Drift？');
assert.ok(evergreen.cka, 'ASK2_EVERGREEN_CKA_COMPATIBILITY_REQUIRED');

console.log(`✓ ASK2 live browser/API acceptance passed for ${base}.`);
console.log(`✓ Deployed SHA matched expected successor SHA: ${expectedSha}.`);
