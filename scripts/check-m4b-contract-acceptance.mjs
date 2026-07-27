import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const json = async file => JSON.parse(await read(file));
const load = file => import(`${pathToFileURL(path.join(root, file)).href}?accept=${Date.now()}`);
const schemaRoot = 'knowledge/external-readers/schemas';

const [
  readerSchema, entrySchema, birthSchema, chartSchema, normalizedSchema,
  interpretationSchema, correspondenceSchema, reportContract,
  registry, categories, readers, consent, interpretation, correspondence,
  workspacePage, workspaceController, reportPage, reportController, en, zh, acceptance
] = await Promise.all([
  json(`${schemaRoot}/reader-registry.schema.json`),
  json(`${schemaRoot}/registry-entry.schema.json`),
  json(`${schemaRoot}/birth-data.schema.json`),
  json(`${schemaRoot}/chart-upload.schema.json`),
  json(`${schemaRoot}/normalized-chart.schema.json`),
  json(`${schemaRoot}/interpretation.schema.json`),
  json(`${schemaRoot}/correspondence.schema.json`),
  read('functions/professional/reports/professional-report-contract.js'),
  json('knowledge/external-readers/human-design/registry/entries.json'),
  json('knowledge/external-readers/registry/categories.json'),
  json('knowledge/external-readers/registry/readers.json'),
  load('functions/professional/consent/external-reader-consent-contract.js'),
  read('functions/professional/external-readers/external-reader-interpretation-contract.js'),
  read('functions/professional/external-readers/external-reader-correspondence-contract.js'),
  read('professional-workspace.html'), read('assets/js/pages/professional-workspace.js'),
  read('professional-reports.html'), read('assets/js/pages/professional-reports.js'),
  read('assets/js/locales/en/professional.js'), read('assets/js/locales/zh-Hans/professional.js'),
  json('content/registry/m4b-contract-acceptance.json')
]);

// T01 Schema acceptance
for (const schema of [readerSchema, entrySchema, birthSchema, chartSchema, normalizedSchema, interpretationSchema, correspondenceSchema]) {
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.ok(schema.$id.startsWith('https://getphios.com/schemas/external-readers/'));
  assert.ok(Array.isArray(schema.required) && schema.required.length > 0);
}
for (const field of ['source_type','source_reference','registry_version','professional_id','confidence','correspondence_status']) {
  assert.ok(reportContract.includes(field), `Report contract missing ${field}`);
}

// T02 Boundary acceptance
for (const marker of [
  'interpretation_only: true', 'runtime_reading_generated: false',
  'runtime_evidence_written: false', 'runtime_memory_written: false'
]) assert.ok(interpretation.includes(marker));
for (const marker of [
  'reader_became_reality_fact: false', 'runtime_evidence_written: false',
  'runtime_reading_modified: false'
]) assert.ok(correspondence.includes(marker));
assert.ok(correspondence.includes('requires explicit confirmation'));
const deterministicTerms = /\b(guarantees?|you will|will always|must act|is your destiny|required action)\b/i;
for (const entry of registry.entries) {
  assert.equal(deterministicTerms.test(`${entry.runtime_language.en} ${entry.professional_notes.en}`), false);
  assert.ok(entry.boundary.en);
}

// T03 Source and lineage acceptance
for (const entry of registry.entries) {
  for (const field of ['registry_id','reader_type','version','english_source','chinese_source','boundary','professional_notes']) {
    assert.ok(entry[field], `${entry.registry_id} missing ${field}`);
  }
}
for (const field of ['reader_type','source_reference','professional_id','created_at','updated_at','status']) {
  assert.ok(interpretation.includes(field), `Interpretation lineage missing ${field}`);
}

// T04 Consent acceptance
const acknowledgements = Object.fromEntries([
  'birth_data_voluntarily_submitted','birth_time_accuracy_affects_result','interpretive_not_diagnostic',
  'reader_does_not_prove_causation','professional_access_is_service_bound','future_access_revocable',
  'policy_retention_understood','report_does_not_prove_cause','correspondence_requires_runtime_evidence',
  'not_licensed_professional_advice','not_deterministic_prediction','client_retains_final_decision'
].map(key => [key, true]));
const grant = consent.createExternalReaderConsent({
  consent_id: 'consent_acceptance', client_id: 'client_1', professional_id: 'professional_1',
  service_id: 'service_1', reader_type: 'human_design', purpose: 'Acceptance',
  resource_scopes: ['reading','birth_information'], duration: 'seven_days',
  acknowledgements, explicit_action: true
}, { now: '2026-07-01T00:00:00.000Z' });
assert.throws(() => consent.authorizeExternalReaderAccess(undefined, {
  resource_scope: 'reading', professional_id: 'professional_1'
}, { now: '2026-07-01T01:00:00.000Z' }), /not active/);
assert.throws(() => consent.authorizeExternalReaderAccess(grant, {
  resource_scope: 'reading', professional_id: 'professional_1'
}, { now: '2026-07-09T00:00:00.000Z' }), /expired/);
assert.throws(() => consent.authorizeExternalReaderAccess(grant, {
  resource_scope: 'external_reader_chart', professional_id: 'professional_1'
}, { now: '2026-07-02T00:00:00.000Z' }), /outside consent scope/);
const revoked = consent.revokeExternalReaderConsent(grant, {
  explicit_action: true, revocation_scopes: ['birth_data_access'], revoked_by: 'client_1'
}, { now: '2026-07-02T00:00:00.000Z' });
assert.throws(() => consent.authorizeExternalReaderAccess(revoked, {
  resource_scope: 'birth_information', professional_id: 'professional_1'
}, { now: '2026-07-03T00:00:00.000Z' }), /revoked/);
assert.equal(revoked.revocation.audit_record_retained, true);

// T05 Registry acceptance
assert.equal(registry.entries.length, 14);
assert.equal(new Set(registry.entries.map(entry => entry.registry_id)).size, registry.entries.length);
const requiredCategories = new Set(categories.readers.find(item => item.reader_type === 'human_design').categories);
for (const entry of registry.entries) {
  assert.ok(requiredCategories.has(entry.category));
  for (const field of ['localized_names','runtime_language','professional_notes','boundary']) {
    assert.ok(entry[field].en); assert.ok(entry[field].zh_Hans);
  }
  assert.ok(entry.version); assert.ok(entry.english_source); assert.ok(entry.chinese_source);
}
for (const reader of readers.readers.filter(item => item.reader_id !== 'human_design')) {
  assert.equal(reader.registry_status, 'scaffold'); assert.equal(reader.active, false);
  assert.equal(reader.interpretation_status, 'infrastructure_only');
  const directory = reader.reader_id === 'gene_keys' ? 'gene-keys' : reader.reader_id;
  const entries = await json(`knowledge/external-readers/${directory}/registry/entries.json`);
  assert.deepEqual(entries.entries, []);
}

// T06–T08 Workspace, reports and i18n acceptance
for (const token of [
  'professionalClientList','professionalRuntimeView','professionalExternalReaders','professionalNotes',
  'professionalReviewQueue','professionalReadingRevisions','professionalNavigationConsiderations','professionalFollowUpTimeline'
]) assert.ok(workspacePage.includes(token));
for (const forbidden of ['fetch(', 'localStorage', 'sessionStorage']) assert.equal(workspaceController.includes(forbidden), false);
for (const token of ['reportContent','reportSources','registryVersion','correspondence','reportBoundary']) {
  assert.ok(`${reportPage}${reportController}`.includes(token));
}
assert.ok(reportController.includes('section.client_visible !== false'));
assert.equal(acceptance.languages.en, true); assert.equal(acceptance.languages.zh_Hans, true);
assert.ok(en.includes('professionalWorkspace')); assert.ok(zh.includes('professionalWorkspace'));
assert.deepEqual(acceptance.acceptance, {
  schema: 'passed', boundary: 'passed', lineage: 'passed', consent: 'passed',
  registry: 'passed', workspace: 'passed', reports: 'passed', i18n: 'passed'
});
console.log('✓ M4B-W9 Contract Acceptance passed: schemas, boundaries, lineage, consent, Registries, Workspace, reports and bilingual parity are closed.');
