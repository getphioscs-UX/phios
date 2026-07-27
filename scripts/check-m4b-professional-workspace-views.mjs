import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const read = relative => fs.readFile(path.join(root, relative), 'utf8');
const json = async relative => JSON.parse(await read(relative));
const module = relative => import(
  `${pathToFileURL(path.join(root, relative)).href}?w2b=${Date.now()}`
);

const [
  page,
  controller,
  css,
  enLocale,
  zhLocale,
  workspaceModule,
  clientModule,
  sourceModule,
  taskModule,
  noteModule,
  runtimeModule,
  projectionModule,
  consentModule
] = await Promise.all([
  read('professional-workspace.html'),
  read('assets/js/pages/professional-workspace.js'),
  read('assets/css/professional-workspace.css'),
  read('assets/js/locales/en/professional.js'),
  read('assets/js/locales/zh-Hans/professional.js'),
  module('functions/professional/workspace/professional-workspace-contract.js'),
  module('functions/professional/workspace/professional-client-contract.js'),
  module('functions/professional/workspace/professional-source-contract.js'),
  module('functions/professional/workspace/professional-task-contract.js'),
  module('functions/professional/workspace/professional-note-contract.js'),
  module('functions/professional/workspace/professional-runtime-projection.js'),
  module('functions/professional/workspace/professional-workspace-projection.js'),
  module('functions/professional/consent/professional-consent-contract.js')
]);

for (const token of [
  'data-workspace-status="unavailable"',
  'data-workspace-unavailable',
  'data-professional-view="clients"',
  'data-professional-view="runtime"',
  'data-professional-view="notes"',
  'data-professional-view="queue"',
  'id="professionalClientList"',
  'id="professionalRuntimeView"',
  'id="professionalNotes"',
  'id="professionalReviewQueue"',
  'professionalWorkspace.boundary'
]) {
  assert.ok(page.includes(token), `Workspace page missing: ${token}`);
}
for (const forbidden of [
  'fetch(',
  'sessionStorage',
  'localStorage',
  '/api/',
  'runtime-persistence',
  'loadRuntimeSnapshot',
  "from '../shared.js'"
]) {
  assert.equal(
    controller.includes(forbidden),
    false,
    `Workspace controller crossed its data boundary: ${forbidden}`
  );
}
assert.ok(controller.includes('__PHIOS_PROFESSIONAL_WORKSPACE_VIEW__'));
assert.ok(controller.includes("dataset.workspaceStatus = payload"));

const workspace = workspaceModule.createProfessionalWorkspace({
  workspace_id: 'workspace_w2b',
  client_id: 'client_w2b',
  professional_id: 'professional_w2b',
  service_id: 'human_design_runtime_interpretation',
  current_runtime_id: 'runtime_w2b'
});
const consent = consentModule.createProfessionalConsent({
  consent_id: 'consent_w2b',
  client_id: workspace.client_id,
  professional_id: workspace.professional_id,
  service_id: workspace.service_id,
  purpose: 'Professional Runtime and Human Design interpretation',
  consent_version: '1.0.0',
  duration: 'thirty_days',
  explicit_action: true,
  runtime_ids: [workspace.current_runtime_id],
  resource_scopes: [
    'entry',
    'reconstruction',
    'reading',
    'navigation',
    'human_design_chart'
  ],
  human_design_scopes: ['chart_image'],
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
const active = workspaceModule.activateProfessionalWorkspace(
  workspace,
  consent,
  { now: '2026-07-28T00:00:00.000Z' }
);

const userSource = sourceModule.createProfessionalSourceReference({
  source_reference_id: 'source_user',
  source_type: 'user_provided',
  source_record_id: 'entry_record'
});
const ruleSource = sourceModule.createProfessionalSourceReference({
  source_reference_id: 'source_rule',
  source_type: 'rule_inference',
  source_record_id: 'reading_record'
});
const hdSource = sourceModule.createProfessionalSourceReference({
  source_reference_id: 'source_hd',
  source_type: 'external_reader_interpretation',
  source_record_id: 'hd_record',
  reader_type: 'human_design',
  limitations: ['Interpretive perspective only']
});

const runtime = runtimeModule.buildProfessionalRuntimeProjection(active, {
  entry: [{
    record_id: 'entry_record',
    text: 'A reported change',
    source_reference: userSource
  }],
  reading: [{
    record_id: 'reading_record',
    text: 'A bounded inference',
    source_reference: ruleSource
  }],
  runtime_memory: [{
    record_id: 'memory_record',
    text: 'Must remain inaccessible',
    source_reference: userSource
  }],
  external_perspectives: [{
    record_id: 'hd_record',
    text: 'A Human Design perspective',
    source_reference: hdSource
  }]
});
assert.equal(runtime.stages.entry.accessible, true);
assert.equal(runtime.stages.reading.items.length, 1);
assert.equal(runtime.stages.runtime_memory.accessible, false);
assert.equal(runtime.stages.runtime_memory.items.length, 0);
assert.equal(runtime.external_perspectives.length, 1);
assert.equal(runtime.external_perspectives_merged_into_runtime_evidence, false);
assert.equal(runtime.runtime_mutation_allowed, false);
assert.throws(
  () => runtimeModule.buildProfessionalRuntimeProjection(active, {
    external_perspectives: [{
      record_id: 'wrong',
      text: 'Not an External Reader',
      source_reference: ruleSource
    }]
  }),
  /External Perspectives/
);

const note = noteModule.createProfessionalNote(active, {
  note_id: 'note_001',
  note_type: 'human_design_observation',
  content: 'Possible interpretive pattern.',
  source_reference: hdSource,
  client_visible: true
}, {
  now: '2026-07-28T00:00:00.000Z'
});
const revision = noteModule.reviseProfessionalNote(note, {
  note_id: 'note_002',
  content: 'Revised possible interpretive pattern.',
  reason: 'Clarified source boundary'
}, {
  now: '2026-07-29T00:00:00.000Z'
});
assert.equal(note.runtime_evidence_written, false);
assert.equal(revision.version, 2);
assert.equal(revision.previous_note_id, note.note_id);
assert.equal(note.content, 'Possible interpretive pattern.');
assert.throws(
  () => noteModule.createProfessionalNote(active, {
    note_id: 'private_visible',
    note_type: 'private_professional_note',
    content: 'Private',
    source_reference: userSource,
    client_visible: true
  }),
  /cannot be client-visible/
);

const clients = [
  clientModule.createProfessionalClientIndex({
    client_id: 'client_w2b',
    display_name: 'Client A',
    service_id: 'human_design_runtime_interpretation',
    professional_status: 'active_service',
    consent_status: 'granted'
  }),
  clientModule.createProfessionalClientIndex({
    client_id: 'client_other',
    display_name: 'Client B',
    service_id: 'professional_runtime_reading',
    professional_status: 'awaiting_consent',
    consent_status: 'not_granted'
  })
];
const filteredClients = projectionModule.buildProfessionalClientList(clients, {
  consent_status: 'granted'
});
assert.equal(filteredClients.length, 1);
assert.equal(filteredClients[0].client_id, 'client_w2b');

const tasks = [
  taskModule.createProfessionalTask({
    task_id: 'task_normal',
    workspace_id: active.workspace_id,
    client_id: active.client_id,
    service_id: active.service_id,
    task_type: 'report_draft_ready',
    priority: 'normal',
    due_at: '2026-07-30T00:00:00.000Z'
  }),
  taskModule.createProfessionalTask({
    task_id: 'task_urgent',
    workspace_id: active.workspace_id,
    client_id: active.client_id,
    service_id: active.service_id,
    task_type: 'client_clarification_required',
    priority: 'urgent',
    due_at: '2026-08-01T00:00:00.000Z'
  })
];
const queue = projectionModule.buildProfessionalReviewQueue(tasks);
assert.equal(queue[0].task_id, 'task_urgent');
assert.equal(tasks[0].priority, 'normal');

for (const key of [
  'clientList',
  'runtimeView',
  'notes',
  'reviewQueue',
  'sourceExternal',
  'notAuthorised',
  'localBoundary'
]) {
  assert.ok(enLocale.includes(`${key}:`), `English locale missing ${key}`);
  assert.ok(zhLocale.includes(`${key}:`), `Chinese locale missing ${key}`);
}
for (const width of ['768px', '520px']) {
  assert.ok(css.includes(`max-width: ${width}`));
}
assert.ok(css.includes('width: min(1440px'));
assert.ok(css.includes('min-height: 44px'));
assert.ok(css.includes(':focus-visible'));

const registry = await json(
  'content/registry/m4b-w2b-professional-workspace-views.json'
);
assert.deepEqual(registry.views, [
  'client_list',
  'runtime_view',
  'professional_notes',
  'review_queue'
]);
assert.equal(registry.boundaries.realClientDataIncluded, false);
assert.equal(registry.boundaries.apiCalled, false);
assert.equal(registry.boundaries.d1WorkspacePersistenceEnabled, false);
assert.equal(registry.boundaries.runtimeMutationAllowed, false);
assert.equal(registry.boundaries.externalReaderMergedIntoRuntimeEvidence, false);
assert.deepEqual(registry.responsiveAcceptance, [360, 768, 1440]);

const packageJson = await json('package.json');
assert.equal(
  packageJson.scripts['check:m4b-professional-workspace-views'],
  'node scripts/check-m4b-professional-workspace-views.mjs'
);
assert.ok(
  packageJson.scripts.precheck.includes(
    'scripts/check-m4b-professional-workspace-views.mjs'
  )
);

console.log('✓ M4B-W2B Professional Workspace Views passed: Client List, consent-scoped Runtime View, immutable Professional Notes and deterministic Review Queue are aligned.');
console.log('  The route remains read-only and empty without a prevalidated payload; API, browser Runtime storage, D1 persistence, real client data and professional actions remain disabled.');
