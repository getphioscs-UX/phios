import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const read = async relative => (await fs.readFile(
  path.join(root, relative),
  'utf8'
)).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const json = async relative => JSON.parse(await read(relative));
const exists = relative => fs.access(path.join(root, relative))
  .then(() => true)
  .catch(() => false);
const importModule = relative => import(
  `${pathToFileURL(path.join(root, relative)).href}?m4b=${Date.now()}`
);
const sha256 = async relative => crypto.createHash('sha256')
  .update(await read(relative), 'utf8')
  .digest('hex');

const required = [
  'functions/professional/workspace/professional-workspace-contract.js',
  'functions/professional/workspace/professional-client-contract.js',
  'functions/professional/workspace/professional-task-contract.js',
  'functions/professional/workspace/professional-source-contract.js',
  'content/registry/m4b-w2-professional-workspace-foundation.json',
  'docs/professional/M4B-W2A-PROFESSIONAL-WORKSPACE-FOUNDATION.md'
];
for (const file of required) {
  assert.equal(await exists(file), true, `Missing M4B-W2A artifact: ${file}`);
}

const [
  workspaceModule,
  clientModule,
  taskModule,
  sourceModule,
  consentModule
] = await Promise.all([
  importModule('functions/professional/workspace/professional-workspace-contract.js'),
  importModule('functions/professional/workspace/professional-client-contract.js'),
  importModule('functions/professional/workspace/professional-task-contract.js'),
  importModule('functions/professional/workspace/professional-source-contract.js'),
  importModule('functions/professional/consent/professional-consent-contract.js')
]);

const workspace = workspaceModule.createProfessionalWorkspace({
  workspace_id: 'workspace_001',
  client_id: 'client_001',
  professional_id: 'professional_001',
  service_id: 'human_design_runtime_interpretation',
  current_runtime_id: 'runtime_001'
});
assert.equal(workspace.status, 'awaiting_consent');
assert.equal(workspace.consent_validated, false);
assert.equal(
  Object.values(workspace.capabilities).every(value => value === false),
  true
);
assert.equal(workspace.runtime_write_allowed, false);
assert.equal(workspace.d1_record_created, false);

const acknowledgements = {
  scope_selected: true,
  data_accuracy: true,
  future_access_revocable: true,
  birth_data_voluntarily_submitted: true,
  birth_time_accuracy_affects_result: true,
  interpretive_not_diagnostic: true,
  future_access_revocation_understood: true
};
const consent = consentModule.createProfessionalConsent({
  consent_id: 'consent_001',
  client_id: 'client_001',
  professional_id: 'professional_001',
  service_id: 'human_design_runtime_interpretation',
  purpose: 'Human Design Runtime Interpretation',
  consent_version: '1.0.0',
  duration: 'thirty_days',
  explicit_action: true,
  runtime_ids: ['runtime_001'],
  resource_scopes: ['reading', 'human_design_chart'],
  human_design_scopes: ['chart_image', 'derived_chart_fields'],
  acknowledgements
}, {
  now: '2026-07-27T00:00:00.000Z'
});
const active = workspaceModule.activateProfessionalWorkspace(
  workspace,
  consent,
  { now: '2026-07-28T00:00:00.000Z' }
);
assert.equal(active.status, 'awaiting_materials');
assert.equal(active.capabilities.view_reading, true);
assert.equal(active.capabilities.view_human_design_chart, true);
assert.equal(active.capabilities.view_entry, false);
assert.equal(active.capabilities.view_birth_information, false);
assert.equal(active.runtime_write_allowed, false);
assert.throws(
  () => workspaceModule.activateProfessionalWorkspace(
    workspace,
    { ...consent, professional_id: 'professional_other' },
    { now: '2026-07-28T00:00:00.000Z' }
  ),
  /does not match Workspace/
);
const revoked = workspaceModule.revokeProfessionalWorkspaceAccess(active, {
  explicit_action: true,
  revoked_at: '2026-07-29T00:00:00.000Z',
  reason: 'Client revoked future access'
});
assert.equal(revoked.status, 'access_revoked');
assert.equal(
  Object.values(revoked.capabilities).every(value => value === false),
  true
);

const client = clientModule.createProfessionalClientIndex({
  client_id: 'client_001',
  display_name: 'Example Client',
  current_runtime_id: 'runtime_001',
  service_id: 'human_design_runtime_interpretation',
  professional_status: 'active_service',
  consent_status: 'granted',
  pending_material_count: 1
});
assert.equal(client.index_only, true);
assert.equal(client.sensitive_birth_data_embedded, false);
assert.equal(client.uploaded_files_embedded, false);
assert.equal('birth_date' in client, false);
assert.equal('chart_pdf' in client, false);

const task = taskModule.createProfessionalTask({
  task_id: 'task_001',
  workspace_id: workspace.workspace_id,
  client_id: workspace.client_id,
  service_id: workspace.service_id,
  task_type: 'chart_awaiting_review',
  priority: 'high',
  status: 'assigned',
  assigned_professional_id: workspace.professional_id,
  due_at: '2026-08-03T00:00:00.000Z',
  consent_status: 'granted',
  data_completeness: 80,
  boundary_flags: ['birth_time_reliability_pending']
}, {
  now: '2026-07-27T00:00:00.000Z'
});
const inProgress = taskModule.transitionProfessionalTask(task, 'in_progress');
const completed = taskModule.transitionProfessionalTask(inProgress, 'completed');
assert.equal(completed.status, 'completed');
assert.throws(
  () => taskModule.transitionProfessionalTask(completed, 'pending'),
  /Illegal professional task transition/
);

const humanDesign = sourceModule.createProfessionalSourceReference({
  source_reference_id: 'source_001',
  source_type: 'external_reader_interpretation',
  source_record_id: 'interpretation_001',
  reader_type: 'human_design',
  client_visible: true,
  limitations: ['Interpretive perspective only']
});
assert.equal(humanDesign.evidence_eligible, false);
assert.equal(humanDesign.interpretation_only, true);
assert.equal(humanDesign.runtime_evidence_written, false);
assert.equal(sourceModule.assertExternalReaderBoundary(humanDesign), true);
assert.throws(
  () => sourceModule.assertExternalReaderBoundary({
    ...humanDesign,
    evidence_eligible: true
  }),
  /cannot become Runtime Evidence/
);

const registry = await json(
  'content/registry/m4b-w2-professional-workspace-foundation.json'
);
assert.equal(registry.baseline.commit, '5441a4fc29d894e3e470319a53bc1954c4a35765');
assert.equal(registry.boundaries.validConsentRequiredBeforeAccess, true);
assert.equal(registry.boundaries.preConsentCapabilitiesEnabled, false);
assert.equal(registry.boundaries.externalReaderBecomesRuntimeEvidence, false);
assert.equal(registry.boundaries.workspacePersistenceEnabled, false);
assert.equal(registry.boundaries.d1SchemaChanged, false);
assert.equal(Object.keys(registry.sourceLabels).length, 6);
for (const labels of Object.values(registry.sourceLabels)) {
  assert.equal(Boolean(labels.en), true);
  assert.equal(Boolean(labels['zh-Hans']), true);
}

const index = await json('content/registry/index.json');
assert.equal(
  index.registries.m4b_w2_professional_workspace_foundation,
  './m4b-w2-professional-workspace-foundation.json'
);

const frozen = {
  'content/registry/runtime-contracts.json':
    '32a630972e4978725e7efe1a0bdc58d96fb7a6bb1145f5c5b7f308d9909745d2',
  'functions/runtime/reading/reading-evidence-contract.js':
    'eb52b681592dc9eb3f2cecb082c3385b38db05188b81ba2d2e69e6ea73a488d9',
  'functions/runtime/navigation/navigation-contract.js':
    'e2231c43d98222efce013945720e208865f90a14727376a2a3dbe490d5c731d5',
  'functions/runtime/review/review-contract.js':
    '221e4e49ce112091f23d228d09c3e4047dd30e38cfb92a79bdd5dac71538229c',
  'functions/professional/consent/professional-consent-contract.js':
    'd4e7d27b99aeb520370d05ee147c07422168e86f33ea8ac1e94db15e11592880'
};
for (const [file, expected] of Object.entries(frozen)) {
  assert.equal(await sha256(file), expected, `Frozen boundary changed: ${file}`);
}

const packageJson = await json('package.json');
assert.equal(
  packageJson.scripts['check:m4b-professional-workspace-foundation'],
  'node scripts/check-m4b-professional-workspace-foundation.mjs'
);
assert.equal(
  packageJson.scripts.precheck.includes(
    'scripts/check-m4b-professional-workspace-foundation.mjs'
  ),
  true
);

console.log('✓ M4B-W2A Professional Workspace Foundation passed: consent-gated Workspace, minimal client index, Review Queue task state and source separation are contract-closed.');
console.log('  UI, D1 persistence, uploads, reports, appointments, payment, automated Human Design calculation and regulated advice remain disabled.');
