import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const read = relative => fs.readFile(path.join(root, relative), 'utf8');
const json = async relative => JSON.parse(await read(relative));
const load = relative => import(
  `${pathToFileURL(path.join(root, relative)).href}?external=${Date.now()}`
);

const frameworkRoot = 'knowledge/external-readers';
const readerIds = [
  'human_design',
  'bazi',
  'ziwei',
  'gene_keys',
  'astrology'
];
const directoryNames = [
  'registry',
  'schemas',
  'translations',
  'runtime-language',
  'boundaries'
];
const bilingualFields = [
  'localized_names',
  'source_concept',
  'runtime_language',
  'professional_notes',
  'boundary'
];
const runtimeDomains = new Set([
  'carrier',
  'decision',
  'environment',
  'relationship',
  'experience',
  'expression',
  'action',
  'time',
  'resources',
  'constraints',
  'signatures',
  'navigation'
]);

const [
  page,
  controller,
  css,
  enLocale,
  zhLocale,
  registrySchema,
  readerSchema,
  sourceSchema,
  birthSchema,
  chartSchema,
  normalizedSchema,
  interpretationSchema,
  correspondenceSchema,
  adapterSchema,
  versionSchema,
  readerRegistry,
  categories,
  adapters,
  versions,
  sourceLabels,
  humanRegistry,
  humanMetadata,
  localizationReport,
  missingReport,
  duplicateReport,
  milestone,
  workspaceModule,
  consentModule,
  registryModule,
  sourceModule,
  birthModule,
  chartModule,
  normalizedModule,
  interpretationModule,
  correspondenceModule,
  adapterModule,
  versionModule,
  projectionModule
] = await Promise.all([
  read('professional-workspace.html'),
  read('assets/js/pages/professional-workspace.js'),
  read('assets/css/professional-workspace.css'),
  read('assets/js/locales/en/professional.js'),
  read('assets/js/locales/zh-Hans/professional.js'),
  json(`${frameworkRoot}/schemas/registry-entry.schema.json`),
  json(`${frameworkRoot}/schemas/reader-registry.schema.json`),
  json(`${frameworkRoot}/schemas/source-label.schema.json`),
  json(`${frameworkRoot}/schemas/birth-data.schema.json`),
  json(`${frameworkRoot}/schemas/chart-upload.schema.json`),
  json(`${frameworkRoot}/schemas/normalized-chart.schema.json`),
  json(`${frameworkRoot}/schemas/interpretation.schema.json`),
  json(`${frameworkRoot}/schemas/correspondence.schema.json`),
  json(`${frameworkRoot}/schemas/reader-adapter.schema.json`),
  json(`${frameworkRoot}/schemas/registry-version.schema.json`),
  json(`${frameworkRoot}/registry/readers.json`),
  json(`${frameworkRoot}/registry/categories.json`),
  json(`${frameworkRoot}/registry/adapters.json`),
  json(`${frameworkRoot}/registry/versions.json`),
  json(`${frameworkRoot}/registry/source-labels.json`),
  json(`${frameworkRoot}/human-design/registry/entries.json`),
  json(`${frameworkRoot}/human-design/metadata.json`),
  json(`${frameworkRoot}/human-design/validation/localization-validation-report.json`),
  json(`${frameworkRoot}/human-design/validation/missing-translation-report.json`),
  json(`${frameworkRoot}/human-design/validation/duplicated-concept-report.json`),
  json('content/registry/m4b-external-reader-framework.json'),
  load('functions/professional/workspace/professional-workspace-contract.js'),
  load('functions/professional/consent/professional-consent-contract.js'),
  load('functions/professional/external-readers/external-reader-registry-contract.js'),
  load('functions/professional/external-readers/external-reader-source-contract.js'),
  load('functions/professional/external-readers/shared-birth-data-contract.js'),
  load('functions/professional/external-readers/chart-upload-contract.js'),
  load('functions/professional/external-readers/normalized-chart-contract.js'),
  load('functions/professional/external-readers/external-reader-interpretation-contract.js'),
  load('functions/professional/external-readers/external-reader-correspondence-contract.js'),
  load('functions/professional/external-readers/reader-adapter-contract.js'),
  load('functions/professional/external-readers/external-reader-registry-version-contract.js'),
  load('functions/professional/external-readers/external-reader-workspace-projection.js')
]);

for (const schema of [
  registrySchema,
  readerSchema,
  sourceSchema,
  birthSchema,
  chartSchema,
  normalizedSchema,
  interpretationSchema,
  correspondenceSchema,
  adapterSchema,
  versionSchema
]) {
  assert.equal(
    schema.$schema,
    'https://json-schema.org/draft/2020-12/schema'
  );
  assert.ok(schema.$id.startsWith(
    'https://getphios.com/schemas/external-readers/'
  ));
}
for (const field of [
  'registry_id',
  'reader_type',
  'category',
  'element_key',
  'canonical_name',
  'localized_names',
  'english_source',
  'chinese_source',
  'source_concept',
  'runtime_language',
  'professional_notes',
  'boundary',
  'runtime_domains',
  'version'
]) {
  assert.ok(
    registrySchema.required.includes(field),
    `Bilingual Registry Schema missing ${field}`
  );
}
assert.equal(
  registrySchema.$defs.localizedText.additionalProperties.type,
  'string'
);

assert.deepEqual(
  readerRegistry.readers.map(reader => reader.reader_id),
  readerIds
);
assert.equal(new Set(readerIds).size, readerRegistry.readers.length);
assert.equal(
  readerRegistry.readers.find(reader =>
    reader.reader_id === 'human_design'
  ).registry_status,
  'active'
);
for (const reader of readerRegistry.readers.slice(1)) {
  assert.equal(reader.registry_status, 'scaffold');
  assert.equal(reader.interpretation_status, 'infrastructure_only');
  assert.equal(reader.active, false);
}
assert.deepEqual(
  categories.readers.map(reader => reader.reader_type),
  readerIds
);
assert.deepEqual(
  adapters.adapters.map(adapter => adapter.reader_type),
  readerIds
);
assert.deepEqual(
  versions.versions.map(version => version.reader_type),
  readerIds
);
for (const adapter of adapters.adapters) {
  assert.equal(adapter.automatic_calculation, false);
  assert.equal(adapter.automatic_rendering, false);
}

for (const readerId of readerIds) {
  const directory = readerId === 'gene_keys' ? 'gene-keys' : (
    readerId === 'human_design' ? 'human-design' : readerId
  );
  const readerRoot = path.join(root, frameworkRoot, directory);
  const stat = await fs.stat(path.join(readerRoot, 'metadata.json'));
  assert.equal(stat.isFile(), true);
  for (const directoryName of directoryNames) {
    const folder = await fs.stat(path.join(readerRoot, directoryName));
    assert.equal(
      folder.isDirectory(),
      true,
      `${readerId} missing ${directoryName}`
    );
  }
  const entries = await json(
    `${frameworkRoot}/${directory}/registry/entries.json`
  );
  assert.equal(
    entries.schema_version,
    'phi-os.external-reader-bilingual-registry.v1'
  );
  assert.equal(entries.reader_type, readerId);
  if (readerId !== 'human_design') {
    assert.deepEqual(entries.entries, []);
  }
}

assert.equal(humanRegistry.entries.length, 14);
assert.equal(humanMetadata.entry_count, 14);
assert.deepEqual(humanMetadata.supported_locales, ['en', 'zh_Hans']);
assert.equal(
  humanMetadata.localization_model,
  'independent_concept_alignment'
);
assert.equal(humanMetadata.single_language_authority, false);
assert.equal(
  humanMetadata.source_workbooks.en,
  'Human Design Summary(3).xlsx'
);
assert.equal(
  humanMetadata.source_workbooks.zh_Hans,
  '人类图总结(2).xlsx'
);
const registryIds = new Set();
const elementKeys = new Set();
for (const entry of humanRegistry.entries) {
  assert.equal(entry.reader_type, 'human_design');
  assert.equal(registryIds.has(entry.registry_id), false);
  assert.equal(elementKeys.has(entry.element_key), false);
  registryIds.add(entry.registry_id);
  elementKeys.add(entry.element_key);
  assert.equal(
    categories.readers[0].categories.includes(entry.category),
    true,
    `Unknown Human Design category: ${entry.category}`
  );
  assert.equal(
    entry.english_source.workbook,
    'Human Design Summary(3).xlsx'
  );
  assert.equal(
    entry.chinese_source.workbook,
    '人类图总结(2).xlsx'
  );
  for (const field of bilingualFields) {
    assert.ok(entry[field]?.en?.trim(), `${entry.registry_id} missing en ${field}`);
    assert.ok(
      entry[field]?.zh_Hans?.trim(),
      `${entry.registry_id} missing zh_Hans ${field}`
    );
    assert.ok(
      entry[field].en.length < 500 &&
      entry[field].zh_Hans.length < 500,
      `${entry.registry_id} copied a long source paragraph`
    );
  }
  assert.ok(entry.runtime_domains.every(domain =>
    runtimeDomains.has(domain)
  ));
}
assert.equal(registryIds.size, humanRegistry.entries.length);
assert.equal(elementKeys.size, humanRegistry.entries.length);

assert.equal(localizationReport.entry_count, humanRegistry.entries.length);
assert.equal(localizationReport.result, 'passed');
assert.equal(missingReport.missing_count, 0);
assert.deepEqual(missingReport.missing_entries, []);
assert.equal(duplicateReport.duplicate_count, 0);
assert.deepEqual(duplicateReport.registry_id_duplicates, []);
assert.deepEqual(duplicateReport.element_key_duplicates, []);

const requiredSourceLabels = [
  'user_provided',
  'uploaded_external_chart',
  'manually_entered_chart_data',
  'phi_os_generated',
  'third_party_api',
  'registry_source',
  'rule_inference',
  'ai_assisted_draft',
  'professional_interpretation',
  'client_confirmed_correspondence',
  'professionally_supported_correspondence',
  'unverified_correspondence'
];
const labelIds = sourceLabels.labels.map(label => label.id);
for (const label of requiredSourceLabels) {
  assert.ok(labelIds.includes(label), `Source Label missing ${label}`);
}
assert.equal(sourceLabels.boundaries.runtime_evidence_label, false);

const waiting = workspaceModule.createProfessionalWorkspace({
  workspace_id: 'workspace_external',
  client_id: 'client_external',
  professional_id: 'professional_external',
  service_id: 'human_design_runtime_interpretation',
  current_runtime_id: 'runtime_external'
});
const consent = consentModule.createProfessionalConsent({
  consent_id: 'consent_external',
  client_id: waiting.client_id,
  professional_id: waiting.professional_id,
  service_id: waiting.service_id,
  purpose: 'External Reader professional interpretation',
  consent_version: '1.0.0',
  duration: 'thirty_days',
  explicit_action: true,
  runtime_ids: [waiting.current_runtime_id],
  resource_scopes: ['reading', 'navigation', 'uploaded_files', 'birth_information'],
  human_design_scopes: [],
  acknowledgements: {
    scope_selected: true,
    data_accuracy: true,
    future_access_revocable: true,
    birth_data_voluntarily_submitted: true,
    birth_time_accuracy_affects_result: true,
    interpretive_not_diagnostic: true,
    future_access_revocation_understood: true
  }
}, {
  now: '2026-07-27T00:00:00.000Z'
});
const workspace = workspaceModule.activateProfessionalWorkspace(
  waiting,
  consent,
  { now: '2026-07-28T00:00:00.000Z' }
);
const registry = registryModule.createExternalReaderRegistry(
  readerRegistry
);
assert.equal(registry.readers.length, 5);
assert.equal(registry.runtime_reading_authority, false);
assert.equal(registry.runtime_evidence_authority, false);
assert.equal(registry.runtime_memory_write_allowed, false);

const source = sourceModule.createExternalReaderSourceLabel({
  source_label: 'uploaded_external_chart',
  source_reference_id: 'chart_upload_external',
  source_version: '1.0.0',
  created_by: workspace.client_id,
  created_at: '2026-07-28T01:00:00.000Z',
  display_label: {
    en: 'Uploaded External Chart',
    'zh-Hans': '已上传外部图表'
  }
});
assert.equal(source.runtime_evidence_label, false);
assert.equal(source.source_display_required, true);

const birthData = birthModule.createSharedBirthData({
  birth_data_id: 'birth_external',
  client_id: workspace.client_id,
  birth_date: '2000-01-01',
  birth_time: '12:30',
  birth_place: 'Kuala Lumpur',
  birth_timezone: 'Asia/Kuala_Lumpur',
  latitude: 3.139,
  longitude: 101.6869,
  daylight_saving_status: 'not_observed',
  birth_time_accuracy: 'documented',
  source,
  client_confirmed: true,
  calculation_settings: {
    calendar_system: 'gregorian',
    timezone_method: 'iana',
    solar_time_method: null,
    school_or_lineage: null,
    calculation_method: 'source_chart'
  }
}, {
  now: '2026-07-28T01:00:00.000Z'
});
assert.equal(birthData.duplicated_per_reader, false);
assert.equal(birthData.runtime_memory_written, false);

const chart = chartModule.createExternalReaderChartUpload({
  chart_upload_id: 'chart_upload_external',
  chart_id: 'chart_external',
  client_id: workspace.client_id,
  reader_type: 'human_design',
  file_type: 'pdf',
  file_reference: 'secure-file-reference',
  file_name: 'chart.pdf',
  mime_type: 'application/pdf',
  file_size: 1024,
  source_platform: 'client_upload',
  calculation_settings_known: false,
  professional_verified: false,
  uploaded_by: workspace.client_id,
  retention_policy: 'service_scope',
  access_status: 'consent_gated'
}, {
  now: '2026-07-28T01:00:00.000Z'
});
assert.equal(chart.automatic_calculation_used, false);
assert.equal(chart.automatic_rendering_used, false);
assert.equal(chart.automatic_report_generated, false);

const normalized = normalizedModule.createNormalizedExternalChart({
  chart_id: chart.chart_id,
  reader_type: chart.reader_type,
  reader_version: '1.0.0',
  input_summary: 'Manually verified uploaded chart container.',
  chart_data: { type: 'generator' },
  derived_fields: {},
  warnings: [],
  uncertainties: ['Calculation settings are unknown.'],
  source,
  verification_status: 'professional_review'
}, {
  now: '2026-07-28T02:00:00.000Z'
});
assert.equal(normalized.runtime_evidence_written, false);
assert.equal(normalized.runtime_reading_generated, false);

const interpretation =
  interpretationModule.createExternalReaderInterpretation(
    workspace,
    {
      interpretation_id: 'interpretation_external',
      reader_type: 'human_design',
      chart_id: normalized.chart_id,
      chart_element: 'authority',
      source_reference: source,
      interpretation: 'A possible decision-timing observation.',
      runtime_domain: 'decision',
      confidence: 'moderate',
      limitations: ['Interpretation only.'],
      client_visible: true,
      status: 'professional_review',
      created_at: '2026-07-28T03:00:00.000Z'
    }
  );
assert.equal(interpretation.interpretation_only, true);
assert.equal(interpretation.runtime_reading_generated, false);
assert.equal(interpretation.runtime_evidence_written, false);
assert.equal(interpretation.runtime_memory_written, false);

const correspondence =
  correspondenceModule.createExternalReaderCorrespondence(
    workspace,
    {
      correspondence_id: 'correspondence_external',
      reader_type: 'human_design',
      interpretation_id: interpretation.interpretation_id,
      runtime_evidence_id: 'evidence_external',
      runtime_evidence_references: ['evidence_external'],
      status: 'professionally_supported',
      summary: 'A limited correspondence supported by one Runtime record.',
      supporting_evidence: ['evidence_external'],
      conflicting_evidence: [],
      limitations: ['Does not establish causation.'],
      client_confirmed: false,
      professional_confirmation: true,
      created_at: '2026-07-28T04:00:00.000Z'
    }
  );
assert.equal(correspondence.reader_became_reality_fact, false);
assert.equal(correspondence.runtime_evidence_written, false);
assert.equal(correspondence.runtime_reading_modified, false);
assert.throws(
  () => correspondenceModule.createExternalReaderCorrespondence(
    workspace,
    {
      correspondence_id: 'unsupported',
      reader_type: 'human_design',
      interpretation_id: interpretation.interpretation_id,
      runtime_evidence_references: [],
      status: 'professionally_supported',
      summary: 'Unsupported.'
    }
  ),
  /requires Runtime Evidence/
);

for (const adapterInput of adapters.adapters) {
  const adapter = adapterModule.createExternalReaderAdapter(adapterInput);
  assert.equal(adapter.automatic_calculation, false);
  assert.equal(adapter.automatic_rendering, false);
  assert.equal(adapter.runtime_evidence_written, false);
}
const version = versionModule.createExternalReaderRegistryVersion({
  reader_type: 'human_design',
  registry_version: '1.0.0',
  registry_schema_version: '1.0.0',
  content_version: '1.0.0',
  effective_from: '2026-07-27T00:00:00.000Z',
  effective_until: null,
  change_reason: 'Initial bilingual Registry.',
  changed_by: 'PHI OS',
  reviewed_by: null,
  supersedes: null
});
assert.equal(version.historical_report_reference_supported, true);

const projection =
  projectionModule.buildExternalReaderWorkspaceProjection(
    workspace,
    registry,
    {
      interpretations: [interpretation],
      correspondences: [correspondence]
    }
  );
assert.equal(projection.readers.length, 5);
assert.equal(projection.interpretations.length, 1);
assert.equal(projection.correspondences.length, 1);
assert.equal(projection.runtime_reading_modified, false);
assert.equal(projection.runtime_evidence_written, false);
assert.equal(projection.runtime_memory_written, false);
assert.equal(projection.professional_review_replaced, false);

for (const token of [
  'data-professional-view="readers"',
  'id="professionalExternalReaders"'
]) {
  assert.ok(page.includes(token), `Workspace page missing ${token}`);
}
for (const token of [
  'external_reader_framework',
  'renderExternalReaders',
  'EXTERNAL_SOURCE_TRANSLATION_KEYS'
]) {
  assert.ok(controller.includes(token), `Workspace controller missing ${token}`);
}
assert.equal(controller.includes('human_design'), false);
for (const forbidden of [
  'fetch(',
  'sessionStorage',
  'localStorage',
  '/api/',
  'runtime-persistence'
]) {
  assert.equal(
    controller.includes(forbidden),
    false,
    `Reader Workspace crossed its data boundary: ${forbidden}`
  );
}
for (const key of [
  'readerWorkspace',
  'readerRegistry',
  'readerInfrastructureReady',
  'externalReaderBoundary',
  'readerSourceRegistry',
  'readerSourceUnverified'
]) {
  assert.ok(enLocale.includes(`${key}:`), `English locale missing ${key}`);
  assert.ok(zhLocale.includes(`${key}:`), `Chinese locale missing ${key}`);
}
assert.ok(css.includes('.professional-reader-grid'));
assert.ok(css.includes('grid-template-columns: repeat(3'));
assert.ok(css.includes('max-width: 768px'));
assert.ok(css.includes('max-width: 520px'));

assert.equal(milestone.baseline.commit,
  '17b56ae2ab7590c8ed70df3ff3ff653dd5fdeee1');
for (const boundary of Object.values(milestone.boundaries)) {
  assert.equal(boundary, false);
}
assert.equal(milestone.humanDesignRegistry.entryCount, 14);
assert.equal(milestone.humanDesignRegistry.directTranslationUsed, false);

const trackedFiles = await fs.readdir(root);
assert.equal(trackedFiles.some(name => name.endsWith('.xlsx')), false);

const packageJson = await json('package.json');
assert.equal(
  packageJson.scripts['check:m4b-external-reader-framework'],
  'node scripts/check-m4b-external-reader-framework.mjs'
);
assert.ok(packageJson.scripts.precheck.includes(
  'scripts/check-m4b-external-reader-framework.mjs'
));

console.log('✓ M4B External Reader Framework passed: one bilingual Registry model, five pluggable Readers, shared source/birth/chart/interpretation/correspondence contracts and generic Workspace projection are aligned.');
console.log('  Human Design: 14 bilingual PHI OS-native entries; missing translations 0; duplicate IDs/concepts 0. BaZi, Zi Wei, Gene Keys and Astrology remain empty infrastructure-only Registries.');
console.log('  Runtime Reading, Runtime Evidence, Reading/Navigation Contracts, Runtime Memory, Customer Journey and Professional Review remain unchanged.');
