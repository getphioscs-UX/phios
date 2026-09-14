import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  createTestamentaryIntake, serialiseTestamentaryDraft, resumeTestamentaryDraft,
  applyTestamentaryCorrection, approveTestamentarySnapshot,
  PTRC_TESTAMENTARY_SECTIONS
} from '../functions/professional/financial/testamentary-intake-v1.js';
import {
  deriveTestamentaryCalculations, buildTestamentaryDraftReport,
  renderTestamentaryReportHtml, createTestamentaryPdfProjection,
  PTRC_TESTAMENTARY_REPORT_DISCLAIMER
} from '../functions/professional/financial/testamentary-report-v1.js';
import {
  PTRC_TESTAMENTARY_SECURITY_POLICY, assertTestamentaryPermission,
  createTestamentaryExportGrant, inspectTestamentaryExportGrant,
  redactTestamentaryExport, createTestamentaryDeletionReceipt
} from '../functions/professional/financial/testamentary-security-v1.js';

const json = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const policy = json('content/production-truth/financial/ptrc-w9-testamentary-policy-v1.json');
const intakeSchema = json('content/production-truth/financial/contracts/ptrc-w9-testamentary-intake-v1.schema.json');
const reportSchema = json('content/production-truth/financial/contracts/ptrc-w9-testamentary-report-v1.schema.json');
const completeFixture = json('test/fixtures/testamentary/complete-fixture.json');
const partialFixture = json('test/fixtures/testamentary/partial-fixture.json');
const NOW = '2026-09-14T04:45:00.000Z';
const RETENTION = '2027-09-14T00:00:00.000Z';

assert.equal(policy.status, 'ACTIVE_REVIEWABLE_DRAFT_ONLY');
assert.deepEqual(policy.requiredSections, PTRC_TESTAMENTARY_SECTIONS);
assert.deepEqual(policy.dataLayers, ['rawUserInput','normalizedFacts','derivedCalculations','warnings','generatedNarrative']);
assert.equal(intakeSchema.$id, 'PHI-OS-PTRC-W9-TESTAMENTARY-INTAKE-v1.0.0');
assert.equal(reportSchema.$id, 'PHI-OS-PTRC-W9-TESTAMENTARY-REPORT-v1.0.0');
for (const value of Object.values(policy.boundaries)) assert.equal(value, false);

// Complete intake: raw input, normalized facts, calculations, warnings and narrative remain separate.
const complete = createTestamentaryIntake(completeFixture, { now: NOW });
assert.equal(complete.rawUserInput.caseId, completeFixture.caseId);
assert.notEqual(complete.rawUserInput, complete.normalizedFacts);
assert.equal(complete.derivedCalculations, null);
assert.equal(complete.generatedNarrative, null);
assert.equal(complete.modelGeneratedFacts, false);
assert.equal(complete.warnings.gaps.length, 0);
assert.equal(complete.warnings.conflicts.length, 0);

// Save/resume and correction are deterministic and versioned.
const saved = serialiseTestamentaryDraft(complete);
const resumed = resumeTestamentaryDraft(saved, { now: NOW });
assert.deepEqual(resumed.normalizedFacts, complete.normalizedFacts);
assert.equal(resumed.dataVersion, 1);
const corrected = applyTestamentaryCorrection(complete, {
  sectionId: 'funeral_wishes',
  items: [{ preference: 'Updated preference for professional review' }],
  sourceReferences: ['client-confirmation:funeral:v2'],
  reason: 'Client corrected preference.'
}, { now: '2026-09-14T05:00:00.000Z' });
assert.equal(corrected.dataVersion, 2);
assert.equal(corrected.previousDataVersion, 1);
assert.equal(complete.normalizedFacts.sections.funeral_wishes.items[0].preference, 'family to decide after professional review');

const completeSnapshot = await approveTestamentarySnapshot(complete, {
  reviewConsentReference: 'CONSENT-001', approvedByRole: 'CLIENT', retentionUntil: RETENTION
}, { now: NOW });
const correctedSnapshot = await approveTestamentarySnapshot(corrected, {
  reviewConsentReference: 'CONSENT-001', approvedByRole: 'CLIENT', retentionUntil: RETENTION
}, { now: '2026-09-14T05:01:00.000Z' });
assert.notEqual(completeSnapshot.snapshotFingerprint, correctedSnapshot.snapshotFingerprint);
assert.equal(completeSnapshot.fingerprintAlgorithm, 'SHA-256');
assert.equal(completeSnapshot.immutableApprovedSnapshot, true);

// W8 estate runtime is the only numeric authority used here.
const calc = deriveTestamentaryCalculations(completeSnapshot);
assert.equal(calc.status, 'CALCULATED');
assert.equal(calc.calculatorId, 'ESTATE_SUMMARY');
assert.equal(calc.reconciledWithPtrcW8, true);
assert.equal(calc.values.grossEstate, 580000);
assert.equal(calc.values.totalLiabilities, 180000);
assert.equal(calc.values.netEstateBeforeTaxFeesAndDistribution, 400000);
assert.equal(calc.values.distributionCalculated, false);
assert.equal(calc.modelGeneratedNumericInputs, false);

const report = buildTestamentaryDraftReport(completeSnapshot);
assert.equal(report.rawUserInput.caseId, completeFixture.caseId);
assert.equal(report.normalizedFacts.sections.assets.items.length, 2);
assert.equal(report.derivedCalculations.values.netEstateBeforeTaxFeesAndDistribution, 400000);
assert.equal(report.warnings.gaps.length, 0);
assert.equal(report.generatedNarrative.length, report.outline.length);
assert.equal(report.outline.length, 12);
assert.equal(report.fieldsInvented, false);
assert.equal(report.professionalReviewRequired, true);
assert.equal(report.executedInstrument, false);
assert.equal(report.automaticExecution, false);
assert.equal(report.legalValidityDetermined, false);
assert.match(PTRC_TESTAMENTARY_REPORT_DISCLAIMER, /not an executed will/i);
for (const section of report.outline) assert.ok(section.provenance.length || section.sectionId === 'gaps_and_conflicts');

// Partial fixture produces explicit gaps and conflicts instead of invented content.
const partial = createTestamentaryIntake(partialFixture, { now: NOW });
assert.ok(partial.warnings.gaps.length >= 8);
assert.equal(partial.warnings.conflicts.length, 1);
const partialSnapshot = await approveTestamentarySnapshot(partial, {
  reviewConsentReference: 'CONSENT-002', approvedByRole: 'CLIENT', retentionUntil: RETENTION
}, { now: NOW });
const partialReport = buildTestamentaryDraftReport(partialSnapshot);
assert.ok(partialReport.warnings.gaps.some(item => item.sectionId === 'executors'));
assert.ok(partialReport.warnings.conflicts.some(item => item.sectionId === 'guardians'));
assert.match(partialReport.outline.find(item => item.sectionId === 'gaps_and_conflicts').narrative, /gap\(s\).*conflict\(s\)/i);

// HTML and PDF projection are tied to the approved snapshot and visually reviewable.
const html = renderTestamentaryReportHtml(report);
assert.match(html, /@page\{size:A4;margin:14mm\}/);
assert.match(html, /DRAFT — PROFESSIONAL REVIEW REQUIRED/);
assert.match(html, new RegExp(completeSnapshot.snapshotId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
const pdf = createTestamentaryPdfProjection(report);
assert.equal(pdf.snapshotFingerprint, completeSnapshot.snapshotFingerprint);
assert.equal(pdf.page.size, 'A4');
assert.equal(pdf.visualQa.required, true);
assert.equal(pdf.visualQa.status, 'READY_FOR_VISUAL_QA');
assert.ok(pdf.visualQa.checks.includes('DISCLAIMER_VISIBLE'));
assert.equal(pdf.executedInstrument, false);
assert.equal(pdf.rawDocumentsEmbedded, false);
assert.equal('rawUserInput' in pdf.exportPayload, false);

// Least privilege, expiring export grants, redaction and deletion controls.
assert.equal(PTRC_TESTAMENTARY_SECURITY_POLICY.encryptionAtRestRequired, true);
assert.equal(PTRC_TESTAMENTARY_SECURITY_POLICY.leastPrivilegeRequired, true);
assert.equal(assertTestamentaryPermission('PROFESSIONAL', 'REVIEW'), true);
assert.throws(() => assertTestamentaryPermission('AUDITOR', 'EDIT'), /ACCESS_DENIED/);
const grant = createTestamentaryExportGrant({ caseId: complete.caseId, snapshotId: completeSnapshot.snapshotId, actorRole: 'CLIENT', now: NOW, ttlMinutes: 15 });
assert.equal(inspectTestamentaryExportGrant(grant, '2026-09-14T04:55:00.000Z').status, 'ACTIVE');
assert.equal(inspectTestamentaryExportGrant(grant, '2026-09-14T05:01:00.000Z').status, 'EXPIRED');
assert.throws(() => createTestamentaryExportGrant({ caseId: complete.caseId, snapshotId: completeSnapshot.snapshotId, actorRole: 'CLIENT', now: NOW, ttlMinutes: 61 }), /TTL_INVALID/);
const redacted = redactTestamentaryExport({ caseId:'x', rawUserInput:{a:1}, document_storage_key:'secret-location', safe:'visible' });
assert.equal(redacted.safe, 'visible'); assert.equal('rawUserInput' in redacted, false); assert.equal('document_storage_key' in redacted, false);
const deletion = createTestamentaryDeletionReceipt({ caseId: complete.caseId, snapshotId: completeSnapshot.snapshotId, actorRole:'CLIENT', now:NOW });
assert.equal(deletion.payload, null); assert.equal(deletion.recoverableFromApplicationState, false); assert.equal(deletion.auditEvent.sensitivePayloadIncluded, false);

// Restricted exact identifiers are rejected; no silent storage or prose invention.
const bad = structuredClone(completeFixture);
bad.sections.identity.items[0].identity_number = 'SHOULD-NOT-BE-STORED';
assert.throws(() => createTestamentaryIntake(bad, { now: NOW }), /RESTRICTED_IDENTIFIER/);
await assert.rejects(() => approveTestamentarySnapshot(complete, {
  reviewConsentReference:'CONSENT-001', approvedByRole:'CLIENT', retentionUntil:'2026-09-14T04:44:59.000Z'
}, { now: NOW }), /RETENTION_MUST_BE_FUTURE/);

console.log('✓ PTRC-W9 Will intake and automatic report assembly passed.');
console.log('  Versioned jurisdiction-aware 15-section intake, explicit unknowns, save/resume/correction, immutable approved snapshots and provenance passed.');
console.log('  Deterministic outline → HTML/PDF projection passed; complete and partial fixtures preserve gaps/conflicts and never create an executed legal instrument.');
console.log('  W8 ESTATE_SUMMARY reconciliation, least privilege, encryption/retention policy, audit-safe deletion, redaction and expiring download controls passed.');
