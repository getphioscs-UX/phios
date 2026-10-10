import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createFinancialIntake, FINANCIAL_INTAKE_SECTIONS } from '../functions/professional/financial/financial-intake-contract.js';
import { calculateFinancialPosition, FINANCIAL_METRICS } from '../functions/professional/financial/financial-calculation-layer.js';
import { createFinancialRevision, FINANCIAL_WORKSPACE_SECTIONS, FINANCIAL_NOTE_TYPES, FINANCIAL_QUEUE_TYPES, FINANCIAL_NAVIGATION_DOMAINS, FINANCIAL_TIMELINE_EVENTS } from '../functions/professional/financial/financial-workspace-contract.js';
import { createProfessionalClientIndex, FINANCIAL_CLIENT_FILTERS } from '../functions/professional/workspace/professional-client-contract.js';
import { PROFESSIONAL_NOTE_TYPES } from '../functions/professional/workspace/professional-note-contract.js';
import { PROFESSIONAL_TASK_TYPES } from '../functions/professional/workspace/professional-task-contract.js';
import { PROFESSIONAL_FOLLOW_UP_EVENT_TYPES } from '../functions/professional/workspace/professional-follow-up-timeline-contract.js';
import { REPORT_TEMPLATE_SECTIONS } from '../functions/professional/reports/report-template-registry.js';
import { PROFESSIONAL_REPORT_TYPES, PROFESSIONAL_REPORT_SOURCE_TYPES, FINANCIAL_REPORT_REDACTED_FIELDS } from '../functions/professional/reports/professional-report-constants.js';
import { APPOINTMENT_SERVICE_TYPES, PRE_APPOINTMENT_CHECKS, FINANCIAL_APPOINTMENT_MATERIALS, FINANCIAL_MATERIAL_DELIVERY_BOUNDARY } from '../functions/professional/appointments/professional-appointment-constants.js';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const registry = JSON.parse(await read('content/registry/m4a-financial-reality-navigation.json'));
const page = await read('professional/financial/index.html');
const services = await read('services.html');
const en = await read('assets/js/locales/en/professional.js');
const zh = await read('assets/js/locales/zh-Hans/professional.js');

assert.equal(registry.baseline, 'a918811a98762a1042c4aa54ec10e2fad8876f8b');
assert.deepEqual(registry.intake.sections, FINANCIAL_INTAKE_SECTIONS);
assert.deepEqual(registry.workspace.financial_sections, FINANCIAL_WORKSPACE_SECTIONS);
assert.ok(FINANCIAL_CLIENT_FILTERS.length === 8);
for (const type of FINANCIAL_NOTE_TYPES) assert.ok(PROFESSIONAL_NOTE_TYPES.includes(type));
for (const type of FINANCIAL_QUEUE_TYPES) assert.ok(PROFESSIONAL_TASK_TYPES.includes(type));
for (const type of FINANCIAL_TIMELINE_EVENTS) assert.ok(PROFESSIONAL_FOLLOW_UP_EVENT_TYPES.includes(type));
assert.equal(FINANCIAL_NAVIGATION_DOMAINS.length, 12);

const intakeInput = {
  intake_id: 'financial_intake_acceptance',
  client_id: 'client_acceptance',
  service_id: 'financial_service',
  household_type: 'family',
  data_date: '2026-07-27',
  bank_cash: [{
    institution: 'Example Bank', account_type: 'savings',
    last_four_digits: '1234', balance: 30000, ownership: 'joint',
    share_percentage: 50, evidence_date: '2026-07-01'
  }],
  evidence_map: [{
    evidence_class: 'document_extracted',
    source_reference: 'bank_statement_masked',
    information_date: '2026-07-01'
  }]
};
const intake = createFinancialIntake(intakeInput, { now: '2026-07-27' });
assert.equal(intake.full_bank_accounts_stored, false);
assert.equal(intake.runtime_evidence_written, false);
assert.throws(() => createFinancialIntake({
  ...intakeInput,
  bank_cash: [{ ...intakeInput.bank_cash[0], account_number: '123456789' }]
}), /Full bank account/);

const calculation = calculateFinancialPosition({
  income: [10000, 2000], expenses: [7000], assets: [500000],
  liquid_assets: [30000], liabilities: [180000],
  current_liabilities: [12000], monthly_debt_repayment: 2000,
  insurance_need: 500000, insurance_cover: 300000,
  retirement_target: 1000000, retirement_assets: 250000,
  education_target: 300000, education_fund: 50000
}, {
  calculation_id: 'calculation_acceptance',
  input_date: '2026-07-01',
  input_sources: ['financial_intake_acceptance'],
  assumptions: ['monthly values'],
  calculated_at: '2026-07-27'
});
assert.deepEqual(Object.keys(calculation.values), FINANCIAL_METRICS);
assert.equal(calculation.values.monthly_surplus_deficit, 5000);
assert.equal(calculation.values.net_worth, 320000);
assert.equal(calculation.projected_outcome_guaranteed, false);
assert.equal(calculation.required_product_action, null);

const revision = createFinancialRevision({
  revision_id: 'financial_revision_1', data_date: '2026-07-01',
  field_path: 'income.0.amount', previous_value: 10000, updated_value: 11000,
  source_document: 'payslip_july', changed_by: 'professional_1',
  changed_at: '2026-07-27', reason: 'Updated evidence',
  calculation_impact: 'cash_flow_recalculation',
  recommendation_impact: 'professional_review_required'
});
assert.equal(revision.previous_value_preserved, true);
assert.equal(revision.silent_overwrite, false);
assert.equal(revision.recalculation_required, true);

const client = createProfessionalClientIndex({
  client_id: 'client_1', display_name: 'Client',
  financial_service_type: 'financial_stamina_analysis',
  financial_data_date: '2026-07-01', household_type: 'family',
  financial_intake_status: 'received', documents_status: 'partial',
  financial_review_status: 'professional_review_required',
  financial_risk_level: 'review_required',
  next_financial_review: '2027-07-01',
  assigned_financial_professional: 'professional_1'
});
assert.equal(client.financial_intake_status, 'received');
assert.equal(client.runtime_content_embedded, false);

for (const reportType of registry.report_types) {
  assert.ok(PROFESSIONAL_REPORT_TYPES.includes(reportType));
  assert.ok(REPORT_TEMPLATE_SECTIONS[reportType]?.length);
}
for (const source of registry.source_labels) assert.ok(PROFESSIONAL_REPORT_SOURCE_TYPES.includes(source));
assert.equal(FINANCIAL_REPORT_REDACTED_FIELDS.length, 5);
assert.ok(APPOINTMENT_SERVICE_TYPES.includes('financial_discovery_meeting'));
assert.ok(PRE_APPOINTMENT_CHECKS.includes('missing_evidence_identified'));
assert.equal(FINANCIAL_APPOINTMENT_MATERIALS.length, 10);
assert.equal(FINANCIAL_MATERIAL_DELIVERY_BOUNDARY.ordinary_email_sensitive_documents_allowed, false);

// CX-P1 succeeds the PX2 presentation while preserving M4A financial authority.
// The current surface must consume the one customer design system; re-importing
// phios-public-v2.css would violate the frozen legacy-CSS boundary.
const px2 = JSON.parse(await fs.readFile(path.join(root, 'content/web-production/px2/successors/px2-w11-checker-successor-v1.json'), 'utf8'));
assert.equal(px2.status, 'ACTIVE');
const cx = JSON.parse(await fs.readFile(path.join(root, 'content/customer-experience-rebuild/migration/px2-cx-p1-public-ia-successor-v1.json'), 'utf8'));
const cutover = JSON.parse(await fs.readFile(path.join(root, cx.currentAuthority.priorityCutover), 'utf8'));
const financialSurface = cutover.surfaces.find(surface => surface.surfaceId === 'FINANCIAL_REALITY');
assert.equal(cx.status, 'ACTIVE_CX_P1_PUBLIC_IA_SUCCESSOR');
assert.equal(cx.priorityCanonicalDestinations.FINANCIAL_REALITY, '/professional/financial/');
assert.equal(financialSurface?.canonicalPath, '/professional/financial/');
assert.equal(financialSurface?.htmlPath, 'professional/financial/index.html');
for (const marker of [
  'data-cx-surface="FINANCIAL_REALITY"',
  '/assets/customer-ui/tokens.css',
  '/assets/customer-ui/surfaces/p1.css',
  '/assets/customer-ui/js/shell.js',
  '/assets/customer-ui/js/surfaces/financial-reality.js',
  'data-cx-financial-form',
  'data-cx-financial-results',
  'Financial Reality'
]) assert.ok(page.includes(marker), `CX financial surface missing: ${marker}`);
assert.equal(page.includes('/assets/css/phios-public-v2.css'), false);
assert.equal(page.includes('/assets/js/public-shell-v2.js'), false);
for (const authorityLabel of ['Financial Reality Navigation', 'Financial Stamina Analysis', 'Financial Navigation Plan']) {
  assert.ok(en.includes(authorityLabel), `M4A English authority missing: ${authorityLabel}`);
}
assert.ok(services.includes('/professional/financial'));
assert.ok(en.includes('financialPublic')); assert.ok(zh.includes('financialPublic'));
for (const changed of Object.values(registry.boundaries)) assert.equal(changed, false);

console.log('✓ M4A Financial Reality Navigation passed: Intake, calculations, evidence lineage, Workspace, reports, appointments, bilingual public service and product-neutral boundaries are aligned.');
