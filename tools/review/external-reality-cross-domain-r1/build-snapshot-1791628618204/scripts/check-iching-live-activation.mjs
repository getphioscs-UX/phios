import assert from 'node:assert/strict';
import fs from 'node:fs';

const statusSource = fs.readFileSync('functions/api/iching-runtime-status.js', 'utf8');
for (const marker of [
  'CF_PAGES_COMMIT_SHA',
  'inspectIChingExecutionAuthority',
  'symbolicPersistenceProviderState',
  'clientMayGrantAuthority: false',
  'rawIdentityExposed: false'
]) assert.ok(statusSource.includes(marker), `I Ching live status contract missing: ${marker}`);

const base = String(process.env.PHIOS_ICHING_BASE_URL || '').trim().replace(/\/$/, '');
const expectedSha = String(process.env.PHIOS_ICHING_EXPECTED_SHA || '').trim();
if (!base) {
  console.log('✓ I Ching live activation smoke structure is ready.');
  console.log('  Set PHIOS_ICHING_BASE_URL and PHIOS_ICHING_EXPECTED_SHA after deployment for the live read-only gate.');
  process.exit(0);
}
assert.match(base, /^https:\/\//, 'PHIOS_ICHING_BASE_URL must use HTTPS');
assert.match(expectedSha, /^[0-9a-f]{40}$/i, 'PHIOS_ICHING_EXPECTED_SHA must be a 40-character commit SHA');

const statusResponse = await fetch(`${base}/api/iching-runtime-status`, { headers: { accept: 'application/json' }, redirect: 'error' });
assert.equal(statusResponse.status, 200);
assert.match(statusResponse.headers.get('content-type') || '', /application\/json/);
const payload = await statusResponse.json();
assert.equal(payload.ok, true);
assert.equal(payload.method, 'I_CHING');
assert.equal(payload.deployment.commitSha, expectedSha);
assert.equal(payload.boundaries.clientMayGrantAuthority, false);
assert.equal(payload.boundaries.rawIdentityExposed, false);
assert.equal(payload.boundaries.guestPersistenceAllowed, false);
assert.equal(payload.boundaries.browserLocalFallbackAllowed, false);

const pageResponse = await fetch(`${base}/readings/i-ching/`, { headers: { accept: 'text/html' }, redirect: 'error' });
assert.equal(pageResponse.status, 200);
const page = await pageResponse.text();
for (const marker of ['data-iching-input','data-iching-line="1"','data-iching-line="6"','does not cast for you']) {
  assert.ok(page.includes(marker), `live I Ching page missing: ${marker}`);
}
console.log(`✓ I Ching live read-only activation gate passed for ${expectedSha}.`);
console.log(`  Current activation state: ${payload.activation.state}; runAllowed=${payload.activation.runAllowed}.`);
