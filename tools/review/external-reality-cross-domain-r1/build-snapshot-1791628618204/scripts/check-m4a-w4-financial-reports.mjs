import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  FINANCIAL_REPORT_TYPES,
  FINANCIAL_REPORT_SOURCE_TYPES,
  FINANCIAL_REPORT_REDACTED_FIELDS
} from '../functions/professional/reports/professional-report-constants.js';
import {
  REPORT_TEMPLATE_SECTIONS
} from '../functions/professional/reports/report-template-registry.js';
import {
  createFinancialReport
} from '../functions/professional/reports/financial-report-contract.js';
import {
  createFinancialReportPdfProjection
} from '../functions/professional/reports/financial-report-pdf-contract.js';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const registry = JSON.parse(await read(
  'content/registry/m4a-w4-financial-reports.json'
));
const controller = await read('assets/js/pages/professional-reports.js');
const page = await read('professional-reports.html');
const en = await read('assets/js/locales/en/professional.js');
const zh = await read('assets/js/locales/zh-Hans/professional.js');

assert.equal(
  registry.baseline,
  'b2febd3925f732921037a1247bea7bed00b955bd'
);
assert.deepEqual(registry.report_types, FINANCIAL_REPORT_TYPES);
assert.deepEqual(registry.source_labels, FINANCIAL_REPORT_SOURCE_TYPES);
assert.deepEqual(registry.pdf_redacted_fields, FINANCIAL_REPORT_REDACTED_FIELDS);

assert.deepEqual(REPORT_TEMPLATE_SECTIONS.financial_reality_snapshot, [
  'client_household', 'information_date', 'financial_objectives',
  'income_expenses', 'assets_liabilities', 'cash_flow', 'net_worth',
  'insurance', 'investments', 'properties', 'missing_evidence'
]);
assert.equal(REPORT_TEMPLATE_SECTIONS.financial_stamina_analysis.length, 22);
assert.deepEqual(REPORT_TEMPLATE_SECTIONS.financial_navigation_plan, [
  'priority', 'current_condition', 'confirmed_evidence', 'target_condition',
  'recommended_action', 'alternative_option', 'required_resources',
  'responsible_person', 'target_date', 'risk', 'dependency',
  'review_trigger', 'status'
]);
assert.deepEqual(REPORT_TEMPLATE_SECTIONS.financial_follow_up_report, [
  'previous_position', 'updated_position', 'actions_completed',
  'actions_not_completed', 'new_income_expense_data',
  'asset_liability_changes', 'ratio_changes', 'new_risks',
  'goal_progress', 'revised_recommendation', 'next_review_date'
]);

const bilingual = value => ({ en: value, zh_Hans: `中：${value}` });
const sections = REPORT_TEMPLATE_SECTIONS.financial_reality_snapshot.map(
  (sectionId, index) => ({
    section_id: sectionId,
    title: bilingual(sectionId),
    content: bilingual(`Content ${sectionId}`),
    source_type: index === 0 ? 'client_declared' :
      index === 1 ? 'document_supported' : 'calculated',
    source_reference: `source_${sectionId}`,
    professional_id: 'professional_1',
    confidence: 'moderate',
    correspondence_status: 'not_applicable',
    household_member_id:
      sectionId === 'client_household' ? 'member_authorised' : null
  })
);
sections.push({
  section_id: 'private_household_appendix',
  title: bilingual('Private household appendix'),
  content: bilingual('Authorised projection only'),
  source_type: 'client_declared',
  source_reference: 'source_private_member',
  confidence: 'moderate',
  correspondence_status: 'not_applicable',
  household_member_id: 'member_not_authorised',
  client_visible: true
});

const report = createFinancialReport({
  report_id: 'financial_snapshot_1',
  report_type: 'financial_reality_snapshot',
  version: '1.0.0',
  status: 'professional_review',
  information_date: '2026-07-27',
  intake_id: 'intake_1',
  intake_data_version: 2,
  calculation_id: 'calculation_1',
  professional_id: 'professional_1',
  professional_name: 'Professional',
  client_id: 'client_1',
  service_scope: 'Financial Reality Snapshot',
  consent_reference: 'consent_financial_1',
  sections,
  missing_evidence: ['Current insurance schedule'],
  interpretation_boundary: bilingual(
    'Financial interpretation is not Runtime Evidence.'
  ),
  confidentiality_notice: bilingual('Restricted financial information.')
}, { now: '2026-07-27T00:00:00.000Z' });

assert.equal(report.information_date, '2026-07-27T00:00:00.000Z');
assert.equal(report.intake_data_version, 2);
assert.equal(report.runtime_reading_modified, false);
assert.equal(report.runtime_evidence_modified, false);
assert.equal(report.financial_evidence_became_runtime_evidence, false);
assert.equal(report.recommendation_became_required_action, false);
assert.deepEqual(report.missing_evidence, ['Current insurance schedule']);

const pdf = createFinancialReportPdfProjection(report, {
  authorised_household_member_ids: ['member_authorised']
});
assert.equal(pdf.report_type, 'financial_reality_snapshot');
assert.equal(pdf.sections.length, 11);
assert.equal(
  pdf.sections.some(item =>
    item.household_member_id === 'member_not_authorised'),
  false
);
assert.equal(pdf.unauthorised_household_data_removed, true);
assert.equal(pdf.raw_source_documents_embedded, false);
assert.equal(pdf.runtime_memory_written, false);

for (const forbidden of [
  'identity_number', 'account_number', 'policy_number', 'exact_address'
]) {
  assert.throws(() => createFinancialReport({
    ...report,
    report_id: `bad_${forbidden}`,
    [forbidden]: 'restricted value'
  }), /cannot be included/);
}
assert.throws(() => createFinancialReport({
  ...report, report_id: 'bad_source',
  sections: report.sections.map((item, index) =>
    index ? item : { ...item, source_type: 'unknown' })
}), /requires a Financial source label/);
assert.throws(() => createFinancialReport({
  ...report, report_id: 'bad_date', information_date: ''
}), /information_date/);

for (const type of FINANCIAL_REPORT_TYPES) {
  assert.ok(REPORT_TEMPLATE_SECTIONS[type]?.length, `${type} template missing`);
}
for (const source of FINANCIAL_REPORT_SOURCE_TYPES) {
  assert.ok(en.includes(`${source}:`), `English label missing: ${source}`);
  assert.ok(zh.includes(`${source}:`), `Chinese label missing: ${source}`);
}
for (const forbidden of ['fetch(', 'localStorage', 'sessionStorage', '/api/']) {
  assert.equal(controller.includes(forbidden), false);
}
assert.ok(controller.includes('sourceLabel'));
assert.ok(controller.includes('window.print()'));
assert.ok(page.includes('data-financial-pdf-redaction="required"'));
for (const value of Object.values(registry.boundaries)) {
  assert.equal(value, false);
}

console.log('✓ M4A-W4 Financial Reports passed: six report templates, ten bilingual source labels, dated financial lineage and consent-filtered PDF redaction are aligned.');
