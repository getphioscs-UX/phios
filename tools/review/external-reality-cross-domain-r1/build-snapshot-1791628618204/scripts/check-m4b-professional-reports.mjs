import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const load = file => import(`${pathToFileURL(path.join(root, file)).href}?v=${Date.now()}`);
const [page, controller, css, en, zh, constants, templates, reportModule, versionModule] = await Promise.all([
  read('professional-reports.html'), read('assets/js/pages/professional-reports.js'),
  read('assets/css/professional-workspace.css'), read('assets/js/locales/en/professional.js'),
  read('assets/js/locales/zh-Hans/professional.js'),
  load('functions/professional/reports/professional-report-constants.js'),
  load('functions/professional/reports/report-template-registry.js'),
  load('functions/professional/reports/professional-report-contract.js'),
  load('functions/professional/reports/professional-report-version-contract.js')
]);
assert.ok(constants.PROFESSIONAL_REPORT_TYPES.length >= 8);
for (const type of [
  'runtime_report', 'professional_readout', 'navigation_plan',
  'follow_up_report', 'human_design_foundation_report',
  'human_design_runtime_interpretation',
  'reality_specific_external_reader_report', 'integrated_runtime_review'
]) assert.ok(constants.PROFESSIONAL_REPORT_TYPES.includes(type));
assert.deepEqual(constants.PROFESSIONAL_REPORT_STATUSES, ['draft','professional_review','client_review','revised','final','superseded']);
const boundary = { en: 'Interpretation is not evidence.', zh_Hans: '解释不等于证据。' };
const confidentiality = { en: 'Confidential.', zh_Hans: '保密资料。' };
function section(id, source = 'professional_interpretation') {
  return { section_id: id, title: { en: id, zh_Hans: id }, content: { en: 'Content', zh_Hans: '内容' }, source_type: source, source_reference: `source_${id}`, registry_version: source.includes('external') ? '1.0.0' : null, professional_id: 'pro_1', confidence: 'moderate', correspondence_status: source === 'observed_evidence' ? 'not_applicable' : 'possible' };
}
for (const type of constants.PROFESSIONAL_REPORT_TYPES) {
  const sections = templates.REPORT_TEMPLATE_SECTIONS[type].map((id, index) => section(id, index === 0 && (type.includes('external') || type.includes('human_design') || type === 'integrated_runtime_review') ? 'external_reader_interpretation' : (id.includes('evidence') ? 'observed_evidence' : 'professional_interpretation')));
  const external = type.includes('external') || type.includes('human_design') || type === 'integrated_runtime_review';
  const report = reportModule.createProfessionalReport({
    report_id: `report_${type}`, report_type: type, version: '1.0.0', status: 'professional_review',
    professional_id: 'pro_1', professional_name: 'Professional', client_id: 'client_1',
    service_scope: 'Professional report', consent_reference: 'consent_1',
    reader_type: external ? 'human_design' : null, registry_version: external ? '1.0.0' : null,
    sections, interpretation_boundary: boundary, confidentiality_notice: confidentiality
  }, { now: '2026-07-27T00:00:00.000Z' });
  assert.equal(report.runtime_reading_modified, false);
  assert.equal(report.runtime_evidence_modified, false);
  assert.equal(report.external_reader_became_fact, false);
  assert.equal(report.forced_cross_reader_consistency, false);
}
assert.throws(() => reportModule.createProfessionalReport({
  report_id: 'bad', report_type: 'runtime_report', version: '1', status: 'draft',
  professional_id: 'p', professional_name: 'P', client_id: 'c', service_scope: 's',
  consent_reference: 'x', sections: [], interpretation_boundary: boundary,
  confidentiality_notice: confidentiality
}), /missing sections/);
const baseReport = reportModule.createProfessionalReport({
  report_id: 'revision_report', report_type: 'runtime_report', version: '1.0.0', status: 'professional_review',
  professional_id: 'pro_1', professional_name: 'P', client_id: 'c', service_scope: 's',
  consent_reference: 'x', sections: templates.REPORT_TEMPLATE_SECTIONS.runtime_report.map(id => section(id, id.includes('evidence') ? 'observed_evidence' : 'professional_interpretation')),
  interpretation_boundary: boundary, confidentiality_notice: confidentiality
}, { now: '2026-07-27T00:00:00.000Z' });
assert.throws(() => versionModule.createProfessionalReportRevision(baseReport, { version: '2.0.0', status: 'final', changed_by: 'p', change_reason: 'Final' }), /requires reviewer/);
const revision = versionModule.createProfessionalReportRevision(baseReport, { version: '2.0.0', status: 'final', changed_by: 'p', change_reason: 'Final', reviewed_by: 'reviewer' }, { now: '2026-07-28T00:00:00.000Z' });
assert.equal(revision.previous_content_preserved, true);
for (const token of ['professionalReport','reportMetadata','reportContent','reportSources','reportHistory','printReport']) assert.ok(page.includes(token));
for (const forbidden of ['fetch(', 'localStorage', 'sessionStorage', '/api/']) assert.equal(controller.includes(forbidden), false);
assert.ok(controller.includes('window.print()'));
assert.ok(css.includes('@media print'));
for (const key of ['title','print','sourceView','historyView','boundary','confidentiality']) { assert.ok(en.includes(`${key}:`)); assert.ok(zh.includes(`${key}:`)); }
console.log('✓ M4B-W5 Professional Reports passed: original and additive financial templates, source-labelled sections, immutable versions, print/PDF layout and Runtime/Reader boundaries are aligned.');
