import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const base = String(process.env.PHIOS_HEALTH_BASE_URL || '').replace(/\/$/, '');
const lineageBaselineSha = '13364abcedc47d935829dbc4dec1a8da4a3adee9';
const expectedSha = String(process.env.PHIOS_EXPECTED_SHA || '');
const authorityUrl = String(process.env.PHIOS_HRX_AUTHORITY_TEST_URL || 'https://www.who.int/health-topics');
const out = process.env.PHIOS_HRX_EVIDENCE_OUT || 'dist/hrx-live-evidence/hrx-w33-live-evidence.json';
assert.ok(base, 'PHIOS_HEALTH_BASE_URL is required');
assert.match(base, /^https:\/\//, 'PHIOS_HEALTH_BASE_URL must use HTTPS');
assert.match(expectedSha, /^[a-f0-9]{40}$/i, 'PHIOS_EXPECTED_SHA is required and must be the full successor commit SHA actually deployed');

const evidence = {
  schemaVersion: 'PHI-OS-HRX-W33-LIVE-EVIDENCE-v1.0.0',
  capturedAt: new Date().toISOString(),
  baseUrl: base,
  lineageBaselineSha,
  expectedSha,
  machine: {},
  humanAttestations: {
    mobileBrowserRender: String(process.env.PHIOS_HRX_MOBILE_BROWSER_ACCEPTED || '') === '1',
    enAndZhHans: String(process.env.PHIOS_HRX_EN_ZH_ACCEPTED || '') === '1'
  }
};

const noStore = response => /no-store/i.test(response.headers.get('cache-control') || '');

const statusResponse = await fetch(`${base}/api/health-runtime-status`, { redirect: 'manual', cache: 'no-store' });
assert.equal(statusResponse.status, 200, 'health runtime status endpoint must return 200');
assert.equal(noStore(statusResponse), true, 'health runtime status must be no-store');
const status = await statusResponse.json();
assert.equal(status?.sourceBaselineSha, lineageBaselineSha, 'live Health candidate lineage does not match 13364ab baseline');
const deployedSha = status?.deployment?.pagesCommitSha;
assert.ok(deployedSha, 'live deployment did not expose CF_PAGES_COMMIT_SHA/PHIOS_DEPLOYED_SHA');
assert.equal(deployedSha, expectedSha, 'deployed SHA does not match expected SHA');
evidence.machine.deployedShaMatch = true;
evidence.machine.deployedSha = deployedSha;
evidence.machine.runtimeCandidateId = status.candidateId;
evidence.machine.liveAuthorityEnabled = status?.activation?.liveAuthorityEnabled === true;
assert.equal(evidence.machine.liveAuthorityEnabled, true, 'PHIOS_HEALTH_AUTHORITY_ENABLED is not active in production');

const page = await fetch(`${base}/health-reality.html`, { redirect: 'manual', cache: 'no-store' });
assert.equal(page.status, 200, 'Health Reality page must return 200');
const html = await page.text();
assert.match(html, /Health Reality/);
assert.match(html, /does not diagnose/i);
evidence.machine.healthPageRender = true;

const ask = await fetch(`${base}/api/ask-phios-health`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ question: 'I have had fatigue for several months', caseRef: 'HRX-W33-LIVE' })
});
assert.ok([200, 400].includes(ask.status), 'Ask Health route returned an unexpected status');
assert.equal(noStore(ask), true, 'Ask Health route must be no-store');
const askPayload = await ask.json();
assert.equal(askPayload?.governance?.diagnosis ?? askPayload?.plan?.governance?.diagnosisAllowed ?? false, false);
assert.equal(askPayload?.governance?.treatmentPrescription ?? askPayload?.plan?.governance?.treatmentPrescriptionAllowed ?? false, false);
evidence.machine.postApiHealthRoute = true;
evidence.machine.noDiagnosisTreatmentRegression = true;

const authority = await fetch(`${base}/api/health-authority-retrieve`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    sourceId: 'WHO-W33-LIVE-SMOKE',
    authorityId: 'WHO',
    url: authorityUrl,
    title: 'WHO Health Topics',
    locale: 'en',
    claimTypes: ['PUBLIC_HEALTH']
  })
});
assert.equal(authority.status, 200, 'approved authority live fetch must return 200');
assert.equal(noStore(authority), true, 'authority retrieval must be no-store');
const authorityPayload = await authority.json();
assert.equal(authorityPayload?.ok, true, 'approved authority source was not admitted');
assert.match(authorityPayload?.source?.contentDigest || '', /^sha256:[a-f0-9]{64}$/);
evidence.machine.approvedAuthorityFetch = true;
evidence.machine.authorityDigest = authorityPayload.source.contentDigest;
evidence.machine.noStoreHeaders = true;

assert.equal(evidence.humanAttestations.mobileBrowserRender, true, 'Set PHIOS_HRX_MOBILE_BROWSER_ACCEPTED=1 only after real mobile browser acceptance');
assert.equal(evidence.humanAttestations.enAndZhHans, true, 'Set PHIOS_HRX_EN_ZH_ACCEPTED=1 only after EN and zh-Hans acceptance');

evidence.passed = Object.values(evidence.machine).every(v => v !== false && v !== null) && Object.values(evidence.humanAttestations).every(Boolean);
assert.equal(evidence.passed, true, 'W33 evidence is incomplete');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(evidence, null, 2) + '\n');
console.log('✓ HRX-W33 live evidence captured:', out);
console.log('  deployed SHA:', deployedSha);
