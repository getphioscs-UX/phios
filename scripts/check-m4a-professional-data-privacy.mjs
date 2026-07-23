import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  HIGHLY_RESTRICTED_IDENTIFIER_FIELDS,
  HUMAN_DESIGN_DATA_FIELDS,
  PROFESSIONAL_DATA_DOMAINS,
  RESTRICTED_FINANCIAL_DATA_FIELDS,
  classifyProfessionalData
} from '../functions/professional/privacy/professional-data-classification.js';
import {
  FINANCIAL_EVIDENCE_SOURCE_TYPES,
  FINANCIAL_MEMORY_SUMMARY_FIELDS,
  assertProfessionalRuntimeMemoryBoundary,
  buildConfirmedFinancialMemorySummary,
  minimizeFinancialRecord,
  minimizeHumanDesignServiceRecord
} from '../functions/professional/privacy/professional-data-minimization.js';
import {
  PROFESSIONAL_RETENTION_MODES,
  PROFESSIONAL_RETENTION_RECORD_CLASSES,
  buildProfessionalRetentionSchedule,
  createLegalRetentionException,
  createProfessionalRetentionDecision,
  handleProfessionalConsentWithdrawal
} from '../functions/professional/privacy/professional-retention-contract.js';
import {
  PROFESSIONAL_FILE_MAXIMUM_BYTES,
  PROFESSIONAL_FILE_TYPES,
  PROFESSIONAL_SIGNED_ACCESS_MAXIMUM_SECONDS,
  createProfessionalFileSecurityRecord,
  createTemporaryFileAccessGrant
} from '../functions/professional/privacy/professional-file-security-contract.js';
import {
  PROFESSIONAL_DATA_RIGHTS_ACTIONS,
  PROFESSIONAL_NOTE_TYPES,
  PROFESSIONAL_REPORT_STATUSES,
  createProfessionalDataRightsRequest,
  createProfessionalNoteRecord,
  createReportGovernanceRecord
} from '../functions/professional/privacy/professional-records-rights-contract.js';

const root = process.cwd();
const now = '2026-07-23T12:00:00.000Z';

function normalizeText(source) {
  return source
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n');
}

async function read(relativePath) {
  return normalizeText(
    await fs.readFile(path.join(root, relativePath), 'utf8')
  );
}

async function readJson(relativePath) {
  return JSON.parse(await read(relativePath));
}

async function exists(relativePath) {
  try {
    await fs.access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function sha256(relativePath) {
  return crypto
    .createHash('sha256')
    .update(await read(relativePath), 'utf8')
    .digest('hex');
}

const requiredFiles = [
  'content/registry/professional-data-governance.json',
  'content/registry/m4a-w7-professional-data-privacy.json',
  'functions/professional/privacy/professional-data-classification.js',
  'functions/professional/privacy/professional-data-minimization.js',
  'functions/professional/privacy/professional-retention-contract.js',
  'functions/professional/privacy/professional-file-security-contract.js',
  'functions/professional/privacy/professional-records-rights-contract.js',
  'tests/fixtures/m4a-w7-data-governance-scenarios.json',
  'docs/professional/M4A-W7-PROFESSIONAL-DATA-PRIVACY.md',
  'docs/professional/M4A-W7-INSTALL.md'
];
for (const file of requiredFiles) {
  assert.equal(await exists(file), true, `Missing M4A-W7 deliverable: ${file}`);
}

const registry = await readJson(
  'content/registry/professional-data-governance.json'
);
const milestone = await readJson(
  'content/registry/m4a-w7-professional-data-privacy.json'
);
const fixtures = await readJson(
  'tests/fixtures/m4a-w7-data-governance-scenarios.json'
);
const registryIndex = await readJson('content/registry/index.json');
const fixture = id => fixtures.scenarios.find(item => item.id === id);

assert.equal(
  fixtures.schemaVersion,
  'phi-os.m4a-w7-data-governance-scenarios.v1'
);
assert.equal(fixtures.syntheticOnly, true);
assert.equal(fixtures.scenarios.length, 9);
for (const id of [
  'financial-minimization',
  'confirmed-memory-summary',
  'human-design-service-record',
  'annual-retention',
  'secure-financial-file',
  'separated-professional-note',
  'report-governance',
  'data-rights-export',
  'legal-retention-exception'
]) {
  assert.ok(fixture(id), `Missing M4A-W7 fixture: ${id}`);
}

assert.deepEqual(
  registry.humanDesignGovernance.fields,
  [...HUMAN_DESIGN_DATA_FIELDS]
);
assert.deepEqual(
  registry.financialGovernance.restrictedData,
  [...RESTRICTED_FINANCIAL_DATA_FIELDS]
);
assert.deepEqual(
  registry.financialGovernance.highlyRestrictedIdentifiers,
  [...HIGHLY_RESTRICTED_IDENTIFIER_FIELDS]
);
assert.deepEqual(
  registry.financialGovernance.confirmedSummaryFields,
  [...FINANCIAL_MEMORY_SUMMARY_FIELDS]
);
assert.deepEqual(
  registry.professionalNotesGovernance.noteTypes,
  [...PROFESSIONAL_NOTE_TYPES]
);
assert.deepEqual(
  registry.reportGovernance.statuses,
  [...PROFESSIONAL_REPORT_STATUSES]
);
assert.deepEqual(
  registry.fileGovernance.allowedExtensions,
  Object.keys(PROFESSIONAL_FILE_TYPES)
);
assert.equal(
  registry.fileGovernance.maximumBytesPerFile,
  PROFESSIONAL_FILE_MAXIMUM_BYTES
);
assert.equal(
  registry.fileGovernance.signedAccessMaximumSeconds,
  PROFESSIONAL_SIGNED_ACCESS_MAXIMUM_SECONDS
);
assert.equal(registry.principles.privateByDefault, true);
assert.equal(registry.principles.sourceDocumentsInRuntimeMemory, false);
assert.equal(registry.principles.indefiniteRetentionAllowed, false);
assert.equal(
  registry.retentionGovernance.accountingRecord
    .clientSourceDocumentsIncludedByDefault,
  false
);
assert.equal(
  registry.professionalNotesGovernance.regulatedAdviceEnabled,
  false
);
for (const value of Object.values(registry.implementationBoundary)) {
  assert.equal(value, false);
}

assert.deepEqual(
  [...PROFESSIONAL_DATA_DOMAINS],
  [
    'general',
    'human_design',
    'financial',
    'professional_notes',
    'report',
    'file',
    'audit'
  ]
);
const financialClassification = classifyProfessionalData({
  domain: 'financial',
  field: 'bank_balance'
});
assert.equal(
  financialClassification.classification,
  'professional_restricted'
);
assert.equal(financialClassification.runtime_classification, 'sensitive');
assert.equal(financialClassification.public, false);
assert.equal(
  financialClassification.runtime_memory_eligible_by_default,
  false
);
const identifierClassification = classifyProfessionalData({
  domain: 'financial',
  field: 'bank_account_number'
});
assert.equal(
  identifierClassification.classification,
  'professional_highly_restricted'
);
assert.equal(
  classifyProfessionalData({
    domain: 'professional_notes',
    field: 'financial_fact_note'
  }).classification,
  'professional_record'
);
assert.equal(
  classifyProfessionalData({
    domain: 'audit',
    field: 'download_event'
  }).classification,
  'professional_audit'
);
assert.throws(
  () => classifyProfessionalData({ domain: 'public', field: 'income' }),
  /supported Professional data domain/
);

assert.deepEqual(
  registry.financialGovernance.defaultStoredFields,
  [
    'masked_account_number',
    'masked_policy_number',
    'general_property_location',
    'required_financial_value',
    'evidence_date',
    'ownership'
  ]
);
assert.deepEqual(
  [...FINANCIAL_EVIDENCE_SOURCE_TYPES],
  [
    'user_entered',
    'document_extracted',
    'professional_entered',
    'calculated',
    'estimated',
    'projected',
    'unverified'
  ]
);
const minimized = minimizeFinancialRecord(
  fixture('financial-minimization').input
);
assert.equal(minimized.masked_account_number, '****5678');
assert.equal(minimized.masked_policy_number, '****2468');
assert.equal(minimized.general_property_location, 'Test District');
assert.equal(minimized.required_financial_value, 5000);
assert.equal(minimized.raw_source_document_stored, false);
assert.equal(minimized.exact_address_stored, false);
assert.equal(minimized.full_account_number_stored, false);
assert.equal(Object.hasOwn(minimized, 'account_number'), false);
assert.equal(Object.hasOwn(minimized, 'policy_number'), false);
assert.equal(Object.hasOwn(minimized, 'exact_address'), false);
assert.equal(Object.hasOwn(minimized, 'raw_document_text'), false);

const summary = buildConfirmedFinancialMemorySummary(
  fixture('confirmed-memory-summary').input
);
assert.equal(summary.client_confirmed, true);
assert.equal(summary.runtime_memory_eligible, true);
assert.equal(summary.source_documents_embedded, false);
assert.equal(summary.precise_identifiers_embedded, false);
assert.equal(summary.precise_account_balances_embedded, false);
assert.equal(
  assertProfessionalRuntimeMemoryBoundary(summary.summary),
  true
);
assert.throws(
  () => buildConfirmedFinancialMemorySummary({
    ...fixture('confirmed-memory-summary').input,
    client_confirmed: false
  }),
  /explicit client confirmation/
);
assert.throws(
  () => assertProfessionalRuntimeMemoryBoundary({
    account_number: 'synthetic-reference'
  }),
  /prohibited Professional data/
);

const humanDesign = minimizeHumanDesignServiceRecord(
  fixture('human-design-service-record').input
);
assert.equal(humanDesign.runtime_memory_eligible, false);
assert.equal(humanDesign.raw_chart_content_embedded, false);
assert.equal(humanDesign.future_session_retention_authorised, false);
assert.equal(humanDesign.selected_fields.includes('birth_time'), true);
assert.throws(
  () => minimizeHumanDesignServiceRecord({
    ...fixture('human-design-service-record').input,
    selected_fields: ['deterministic_outcome']
  }),
  /unsupported field/
);

assert.equal(
  PROFESSIONAL_RETENTION_MODES.includes('scheduled_annual_reviews'),
  true
);
assert.equal(
  PROFESSIONAL_RETENTION_RECORD_CLASSES.includes('source_document'),
  true
);
const retention = createProfessionalRetentionDecision(
  fixture('annual-retention').input,
  { now }
);
assert.equal(retention.indefinite_retention, false);
assert.equal(retention.source_documents_in_runtime_memory, false);
assert.equal(
  retention.retention_authorised_separately_from_access,
  true
);
const schedule = buildProfessionalRetentionSchedule(retention, {
  service_completed_at: '2026-08-01T00:00:00.000Z',
  report_delivered_at: '2026-07-31T00:00:00.000Z'
});
assert.equal(
  schedule.source_document_delete_at,
  '2026-08-30T00:00:00.000Z'
);
assert.equal(
  schedule.professional_working_file_delete_at,
  '2026-10-30T00:00:00.000Z'
);
assert.equal(
  schedule.accounting_record_retention
    .client_source_documents_included_by_default,
  false
);
assert.equal(schedule.automatic_deletion_executed, false);
assert.throws(
  () => createProfessionalRetentionDecision({
    ...fixture('annual-retention').input,
    explicit_action: false
  }, { now }),
  /explicit client action/
);
assert.throws(
  () => createProfessionalRetentionDecision({
    ...fixture('annual-retention').input,
    retention_expires_at: '2028-07-23T12:00:00.000Z'
  }, { now }),
  /fresh consent/
);

const legalException = createLegalRetentionException(
  fixture('legal-retention-exception').input,
  { now }
);
assert.equal(legalException.indefinite, false);
assert.equal(legalException.client_source_documents_included, false);
assert.deepEqual(
  legalException.record_classes,
  ['phi_os_accounting_record']
);
assert.throws(
  () => createLegalRetentionException({
    ...fixture('legal-retention-exception').input,
    expires_at: ''
  }, { now }),
  /must be a date/
);
const withdrawal = handleProfessionalConsentWithdrawal({
  explicit_action: true,
  consent_id: 'consent_test_1',
  data_subject_id: 'subject_test_1',
  withdrawn_at: '2026-07-24T00:00:00.000Z'
});
assert.equal(withdrawal.new_access_stopped, true);
assert.equal(withdrawal.new_processing_stopped, true);
assert.equal(withdrawal.deletion_review_required, true);
assert.equal(withdrawal.deletion_claimed_complete, false);

const fileRecord = createProfessionalFileSecurityRecord(
  fixture('secure-financial-file').input,
  { now }
);
assert.equal(fileRecord.access_ready, true);
assert.equal(fileRecord.public_url, false);
assert.equal(fileRecord.original_filename_retained, false);
assert.equal(fileRecord.raw_content_in_audit_log, false);
assert.equal(fileRecord.storage_implementation_enabled, false);
assert.equal(Object.hasOwn(fileRecord, 'original_filename'), false);
assert.throws(
  () => createProfessionalFileSecurityRecord({
    ...fixture('secure-financial-file').input,
    upload_channel: 'ordinary_email'
  }, { now }),
  /cannot use ordinary email/
);
assert.throws(
  () => createProfessionalFileSecurityRecord({
    ...fixture('secure-financial-file').input,
    mime_type: 'image/png'
  }, { now }),
  /does not match extension/
);
const accessGrant = createTemporaryFileAccessGrant({
  access_grant_id: 'file_access_test_1',
  file_security_record: fileRecord,
  professional_id: 'professional_test_1',
  action: 'view',
  explicit_action: true,
  consent_access_allowed: true,
  ttl_seconds: 900,
  audit_event_id: 'audit_test_1'
}, { now });
assert.equal(accessGrant.public_url, false);
assert.equal(accessGrant.signed_url_issued, false);
assert.equal(accessGrant.access_service_enabled, false);
assert.equal(
  accessGrant.expires_at,
  '2026-07-23T12:15:00.000Z'
);
assert.throws(
  () => createTemporaryFileAccessGrant({
    access_grant_id: 'file_access_test_2',
    file_security_record: fileRecord,
    professional_id: 'professional_test_1',
    action: 'download',
    explicit_action: true,
    consent_access_allowed: true,
    ttl_seconds: 901,
    audit_event_id: 'audit_test_2'
  }, { now }),
  /exceeds maximum TTL/
);

const note = createProfessionalNoteRecord(
  fixture('separated-professional-note').input,
  { now }
);
assert.equal(note.content_class, 'client_provided_fact');
assert.equal(note.mixed_content_classes, false);
assert.equal(note.raw_source_document_embedded, false);
assert.equal(note.regulated_advice_authorised, false);
assert.throws(
  () => createProfessionalNoteRecord({
    ...fixture('separated-professional-note').input,
    content_classes: [
      'client_provided_fact',
      'professional_assessment'
    ]
  }, { now }),
  /exactly one/
);
assert.throws(
  () => createProfessionalNoteRecord({
    ...fixture('separated-professional-note').input,
    note_type: 'regulated_advice_note',
    content_class: 'regulated_advice'
  }, { now }),
  /not enabled/
);
const report = createReportGovernanceRecord(
  fixture('report-governance').input,
  { now }
);
assert.equal(report.public, false);
assert.equal(report.report_content_embedded, false);
assert.equal(report.source_document_content_embedded, false);
assert.equal(report.regulated_advice_authorised, false);
assert.throws(
  () => createReportGovernanceRecord({
    ...fixture('report-governance').input,
    report_content: 'must not be embedded'
  }, { now }),
  /cannot embed/
);

assert.equal(
  PROFESSIONAL_DATA_RIGHTS_ACTIONS.includes('export_financial_data'),
  true
);
const rightsRequest = createProfessionalDataRightsRequest(
  fixture('data-rights-export').input,
  { now }
);
assert.equal(rightsRequest.secure_delivery_required, true);
assert.equal(rightsRequest.ordinary_email_delivery_allowed, false);
assert.equal(rightsRequest.action_executed, false);
assert.equal(rightsRequest.export_worker_enabled, false);
assert.throws(
  () => createProfessionalDataRightsRequest({
    ...fixture('data-rights-export').input,
    explicit_action: false
  }, { now }),
  /explicit action/
);

assert.equal(
  milestone.status,
  'professional-data-privacy-contract-closed-next-infrastructure'
);
assert.equal(
  milestone.baseline.commit,
  'de8f804ce426194a7d4c9b83096887770584b841'
);
assert.equal(
  milestone.nextWorkPackage,
  'M4A-W8 Financial Professional Infrastructure'
);
assert.equal(
  milestone.legalPolicyBoundary.productionLegalReviewCompleted,
  false
);
assert.equal(
  milestone.legalPolicyBoundary
    .clientSourceDocumentsAutomaticallyAccountingRecords,
  false
);
for (const value of Object.values(milestone.completion)) {
  assert.equal(value, true);
}
for (const value of Object.values(milestone.implementationBoundary)) {
  assert.equal(value, false);
}
for (const value of Object.values(milestone.guardrails)) {
  assert.equal(value, false);
}
for (const [file, expectedHash] of Object.entries(
  milestone.frozenArtifacts
)) {
  assert.equal(
    await sha256(file),
    expectedHash,
    `Frozen pre-W7 artifact changed: ${file}`
  );
}
const migrations = (await fs.readdir(path.join(root, 'db/migrations')))
  .filter(filename => filename.endsWith('.sql'))
  .sort();
assert.deepEqual(migrations, milestone.migrationInventory);

assert.equal(
  registryIndex.registries.professional_data_governance,
  './professional-data-governance.json'
);
assert.equal(
  registryIndex.registries.m4a_w7_professional_data_privacy,
  './m4a-w7-professional-data-privacy.json'
);

const m4aW3 = await readJson(
  'content/registry/m4a-w3-consent-sharing.json'
);
assert.equal(
  m4aW3.nextWorkPackage,
  'M4A-W7 Professional Data and Privacy'
);
const m2Privacy = await readJson(
  'content/registry/runtime-security-privacy.json'
);
assert.equal(m2Privacy.default_classification, 'private');
assert.equal(
  m2Privacy.logging.full_sensitive_text_allowed,
  false
);
assert.equal(
  m2Privacy.professional_boundary.automatic_account_access,
  false
);

const authoredText = (
  await Promise.all(requiredFiles.map(file => read(file)))
).join('\n');
assert.doesNotMatch(
  authoredText,
  /\b\d{6}-?\d{2}-?\d{4}\b/,
  'M4A-W7 must not contain an identity number'
);
assert.doesNotMatch(
  authoredText,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  'M4A-W7 must not contain a client email address'
);
assert.doesNotMatch(
  authoredText,
  /\b\d{10,16}\b/,
  'M4A-W7 must not contain a full account, policy or phone number'
);
assert.doesNotMatch(
  authoredText,
  /https?:\/\/(?!www\.pdp\.gov\.my|www\.hasil\.gov\.my)/,
  'M4A-W7 must not contain a public client file URL'
);

const packageJson = await readJson('package.json');
assert.equal(
  packageJson.scripts['check:m4a-professional-data-privacy'],
  'node scripts/check-m4a-professional-data-privacy.mjs'
);
assert.equal(
  packageJson.scripts.check.includes(
    'node scripts/check-m4a-professional-data-privacy.mjs'
  ),
  true
);

console.log(
  '✓ M4A-W7 Professional Data and Privacy passed: Human Design, Financial, Notes, Reports, Files, retention and data rights are governance-closed.'
);
console.log(
  '  Source documents remain outside Runtime Memory; public URLs, ordinary-email sensitive intake, indefinite retention and unverified deletion claims remain prohibited.'
);
console.log(
  '  Next required gate: M4A-W8 Financial Professional Infrastructure before M4A-W2 Workspace.'
);
