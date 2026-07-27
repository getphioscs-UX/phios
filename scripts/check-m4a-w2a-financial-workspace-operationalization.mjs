import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createProfessionalConsent } from '../functions/professional/consent/professional-consent-contract.js';
import {
  createProfessionalWorkspace,
  activateProfessionalWorkspace
} from '../functions/professional/workspace/professional-workspace-contract.js';
import {
  buildProfessionalClientList,
  buildProfessionalReviewQueue,
  FINANCIAL_CLIENT_FILTERS,
  FINANCIAL_TASK_TYPES
} from '../functions/professional/workspace/professional-workspace-projection.js';
import {
  createProfessionalClientIndex
} from '../functions/professional/workspace/professional-client-contract.js';
import {
  createProfessionalSourceReference
} from '../functions/professional/workspace/professional-source-contract.js';
import {
  createProfessionalNote,
  FINANCIAL_NOTE_INFORMATION_CLASS
} from '../functions/professional/workspace/professional-note-contract.js';
import {
  buildFinancialWorkspaceProjection
} from '../functions/professional/financial/financial-workspace-projection.js';
import {
  FINANCIAL_WORKSPACE_SECTIONS
} from '../functions/professional/financial/financial-workspace-contract.js';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const registry = JSON.parse(await read(
  'content/registry/m4a-w2a-financial-workspace-operationalization.json'
));
const page = await read('professional-workspace.html');
const controller = await read('assets/js/pages/professional-workspace.js');
const css = await read('assets/css/professional-workspace.css');
const en = await read('assets/js/locales/en/professional.js');
const zh = await read('assets/js/locales/zh-Hans/professional.js');

assert.equal(registry.baseline, '1a50458281e0b5f3c80c49621bec62e01e72d33b');
assert.deepEqual(Object.keys(FINANCIAL_CLIENT_FILTERS), registry.client_filters);
assert.equal(FINANCIAL_TASK_TYPES.size, 12);
assert.deepEqual(registry.financial_sections, FINANCIAL_WORKSPACE_SECTIONS);

const clients = [
  createProfessionalClientIndex({
    client_id: 'client_intake', display_name: 'Intake Client',
    financial_intake_status: 'awaiting', documents_status: 'not_started',
    financial_review_status: 'not_started'
  }),
  createProfessionalClientIndex({
    client_id: 'client_review', display_name: 'Review Client',
    financial_intake_status: 'received', documents_status: 'complete',
    financial_review_status: 'professional_review_required'
  }),
  createProfessionalClientIndex({
    client_id: 'client_annual', display_name: 'Annual Client',
    financial_intake_status: 'received', documents_status: 'complete',
    financial_review_status: 'annual_review_due'
  })
];
assert.equal(buildProfessionalClientList(clients, {
  financial_filter: 'awaiting_financial_intake'
}).length, 1);
assert.equal(buildProfessionalClientList(clients, {
  financial_filter: 'professional_review_required'
})[0].client_id, 'client_review');
assert.equal(buildProfessionalClientList(clients, {
  financial_filter: 'annual_review_due'
})[0].client_id, 'client_annual');
assert.throws(() => buildProfessionalClientList(clients, {
  financial_filter: 'unsupported'
}), /Unsupported financial client filter/);

const tasks = [
  { task_id: 'financial', task_type: 'calculation_review_required', status: 'pending', priority: 'high', due_at: '2026-08-01' },
  { task_id: 'runtime', task_type: 'new_runtime_reading', status: 'pending', priority: 'urgent', due_at: '2026-07-30' }
];
const financialQueue = buildProfessionalReviewQueue(tasks, {
  financial_only: true
});
assert.equal(financialQueue.length, 1);
assert.equal(financialQueue[0].task_id, 'financial');

const workspace = createProfessionalWorkspace({
  workspace_id: 'workspace_financial', client_id: 'client_financial',
  professional_id: 'professional_financial',
  service_id: 'financial_stamina_analysis'
});
const consent = createProfessionalConsent({
  consent_id: 'consent_financial', client_id: workspace.client_id,
  professional_id: workspace.professional_id,
  service_id: workspace.service_id,
  purpose: 'Financial professional review', consent_version: '1.0.0',
  duration: 'thirty_days', explicit_action: true,
  financial_data_scopes: ['income', 'expenses', 'liabilities', 'insurance'],
  acknowledgements: {
    scope_selected: true, data_accuracy: true,
    future_access_revocable: true, information_and_date_basis: true,
    missing_or_incorrect_data_affects_analysis: true,
    projections_use_assumptions: true, future_results_not_guaranteed: true,
    client_retains_final_decision: true,
    regulated_professional_may_be_required: true
  }
}, { now: '2026-07-27T00:00:00.000Z' });
const active = activateProfessionalWorkspace(workspace, consent, {
  now: '2026-07-28T00:00:00.000Z'
});
assert.equal(active.view_financial_reality, true);
assert.equal(active.financial_capabilities.view_income, true);
assert.equal(active.financial_capabilities.view_investments, false);
const projection = buildFinancialWorkspaceProjection(active, {
  data_date: '2026-07-01',
  sections: {
    income: { summary: 'Income supplied', records: [{ amount: 12000, source: 'payslip' }] },
    investments: { summary: 'Must not be exposed', records: [{ value: 5000 }] }
  }
});
assert.equal(projection.sections.income.records.length, 1);
assert.equal(projection.sections.investments.accessible, false);
assert.equal(projection.sections.investments.records.length, 0);
assert.equal(projection.runtime_evidence_written, false);
assert.throws(() => buildFinancialWorkspaceProjection(workspace, {}), /active financial-data consent/);

const userSource = createProfessionalSourceReference({
  source_reference_id: 'source_financial_user',
  source_type: 'user_provided',
  source_record_id: 'financial_intake_record'
});
const factNote = createProfessionalNote(active, {
  note_id: 'financial_fact_1', note_type: 'financial_fact_note',
  information_class: 'client_fact', content: 'Client reported monthly income.',
  source_reference: userSource
}, { now: '2026-07-28T00:00:00.000Z' });
assert.equal(factNote.information_class, 'client_fact');
assert.equal(factNote.mixed_information_classes, false);
assert.throws(() => createProfessionalNote(active, {
  note_id: 'mixed_note', note_type: 'calculation_note',
  information_class: 'client_fact', content: 'Mixed content',
  source_reference: userSource
}), /requires information_class calculation_result/);
assert.throws(() => createProfessionalNote(active, {
  note_id: 'mixed_note_2', note_type: 'financial_fact_note',
  information_class: FINANCIAL_NOTE_INFORMATION_CLASS.financial_fact_note,
  information_classes: ['client_fact', 'professional_opinion'],
  content: 'Mixed content', source_reference: userSource
}), /cannot be mixed/);
assert.throws(() => createProfessionalNote(active, {
  note_id: 'regulated_note', note_type: 'regulated_advice_note',
  information_class: 'regulated_advice', content: 'Regulated advice',
  source_reference: userSource
}), /separately activated professional authority/);

for (const token of [
  'professionalFinancialClientFilter', 'professionalClientResultCount',
  'professionalNoteClassFilter', 'professionalFinancialQueueOnly',
  'professionalFinancialReality', 'professionalHumanDesign',
  '/professional-consent-sharing'
]) assert.ok(page.includes(token), `Missing operational control ${token}`);
for (const forbidden of ['fetch(', 'localStorage', 'sessionStorage', '/api/']) {
  assert.equal(controller.includes(forbidden), false);
}
assert.ok(controller.includes('bindOperationalFilters'));
assert.ok(controller.includes('financialStatus'));
assert.ok(css.includes('.professional-workspace-controls'));
assert.ok(css.includes('@media (max-width: 768px)'));
assert.ok(css.includes('@media (max-width: 520px)'));
for (const key of ['financialClientFilter', 'financialQueueOnly', 'noteInformationClass']) {
  assert.ok(en.includes(`${key}:`)); assert.ok(zh.includes(`${key}:`));
}
for (const changed of Object.values(registry.boundaries)) assert.equal(changed, false);

console.log('✓ M4A-W2A Financial Workspace Operationalization passed: client filters, consent-scoped Financial Reality, separated Notes and Financial Review Queue are operational and bilingual.');
