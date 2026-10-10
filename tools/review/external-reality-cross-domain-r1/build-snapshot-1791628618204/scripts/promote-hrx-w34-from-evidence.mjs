import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const evidencePath = process.env.PHIOS_HRX_EVIDENCE || 'dist/hrx-live-evidence/hrx-w33-live-evidence.json';
const outputPath = process.env.PHIOS_HRX_PROMOTION_OUT || 'content/health/health-reality-runtime/acceptance/hrx-w34-limited-production-promotion-successor-v2.json';
const freezePath = process.env.PHIOS_HRX_FREEZE_OUT || 'content/health/health-reality-runtime/freeze/hrx-w35-health-runtime-freeze-successor-v3.json';
const lineageBaselineSha = '13364abcedc47d935829dbc4dec1a8da4a3adee9';
assert.ok(fs.existsSync(evidencePath), `W33 evidence file missing: ${evidencePath}`);
const evidenceBytes = fs.readFileSync(evidencePath);
const evidence = JSON.parse(evidenceBytes.toString('utf8'));
assert.equal(evidence.passed, true, 'W33 evidence is not fully accepted');
assert.equal(evidence.lineageBaselineSha, lineageBaselineSha, 'W33 lineage baseline mismatch');
assert.match(evidence.expectedSha || '', /^[a-f0-9]{40}$/i, 'W33 expected successor SHA missing');
assert.equal(evidence.machine?.deployedSha, evidence.expectedSha, 'deployed SHA mismatch');
for (const key of ['deployedShaMatch','healthPageRender','postApiHealthRoute','approvedAuthorityFetch','noDiagnosisTreatmentRegression','noStoreHeaders']) assert.equal(evidence.machine?.[key], true, `missing machine evidence: ${key}`);
assert.equal(evidence.humanAttestations?.mobileBrowserRender, true, 'mobile browser acceptance missing');
assert.equal(evidence.humanAttestations?.enAndZhHans, true, 'EN/zh-Hans acceptance missing');
const ageMs = Date.now() - Date.parse(evidence.capturedAt);
assert.ok(ageMs >= 0 && ageMs <= 24 * 60 * 60 * 1000, 'W33 evidence is older than 24 hours');
const evidenceDigest = `sha256:${crypto.createHash('sha256').update(evidenceBytes).digest('hex')}`;
const promotedAt = new Date().toISOString();
const successor = {
  schemaVersion: 'PHI-OS-HRX-W34-LIMITED-PRODUCTION-PROMOTION-SUCCESSOR-v2.0.0',
  work: 'HRX-W34',
  successorOf: 'hrx-w34-limited-production-promotion-v1.json',
  lineageBaselineSha,
  promotedAt,
  evidence: { file: evidencePath, digest: evidenceDigest, capturedAt: evidence.capturedAt },
  deployedSha: evidence.machine.deployedSha,
  promotionState: 'LIMITED_PRODUCTION_PROMOTED',
  current: {
    sourceAccepted: true,
    liveBrowserAccepted: true,
    approvedAuthorityFetchProven: true,
    publicHealthExecutionAllowed: true,
    healthPersistenceAllowed: false
  },
  scope: {
    allowed: ['GROUNDED_HEALTH_INFORMATION','GUIDED_HEALTH_REALITY','DOCUMENT_UNDERSTANDING','SAFETY_ROUTING'],
    forbidden: ['DIAGNOSIS','TREATMENT_PRESCRIPTION','PROFESSIONAL_JUDGMENT','SYMBOLIC_HEALTH_DIAGNOSIS','AUTOMATIC_HEALTH_PERSISTENCE']
  },
  noFakePromotion: true
};
const freeze = {
  schemaVersion: 'PHI-OS-HRX-W35-LIMITED-PRODUCTION-FREEZE-SUCCESSOR-v3.0.0',
  work: 'HRX-W35',
  successorOf: 'hrx-w35-health-runtime-freeze-successor-v2.json',
  lineageBaselineSha,
  frozenAt: promotedAt,
  deployedSha: evidence.machine.deployedSha,
  evidenceDigest,
  status: 'HRX_LIMITED_PRODUCTION_FROZEN',
  freeze: {
    liveBrowserVerified: true,
    approvedAuthorityFetchVerified: true,
    limitedProductionPromoted: true,
    publicHealthExecutionAllowed: true,
    healthPersistencePromoted: false,
    diagnosisAllowed: false,
    treatmentPrescriptionAllowed: false,
    professionalJudgmentAllowed: false,
    symbolicHealthDiagnosisAllowed: false
  },
  nextGate: 'REAL_USER_HEALTH_PILOT_BEFORE_ANY_SCOPE_EXPANSION_OR_PERSISTENCE_PROMOTION'
};
for (const [target, value] of [[outputPath, successor], [freezePath, freeze]]) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(value, null, 2) + '\n');
}
console.log('✓ HRX-W34 limited-production promotion successor generated:', outputPath);
console.log('✓ HRX-W35 limited-production freeze successor generated:', freezePath);
console.log('  evidence digest:', evidenceDigest);
