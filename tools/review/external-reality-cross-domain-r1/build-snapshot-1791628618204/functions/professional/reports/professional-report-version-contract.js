import { cleanText, isoDate, requiredText } from '../external-readers/external-reader-constants.js';
import { PROFESSIONAL_REPORT_CONTRACT_VERSION, PROFESSIONAL_REPORT_STATUSES } from './professional-report-constants.js';

export function createProfessionalReportRevision(report, input = {}, options = {}) {
  if (report?.schema_version !== PROFESSIONAL_REPORT_CONTRACT_VERSION) throw new TypeError('Valid report required.');
  const status = requiredText(input.status, 'status');
  if (!PROFESSIONAL_REPORT_STATUSES.includes(status)) throw new TypeError('Unsupported report status.');
  if (status === 'final' && !cleanText(input.reviewed_by)) throw new TypeError('Final report requires reviewer.');
  return Object.freeze({
    report_id: report.report_id,
    previous_version: report.version,
    version: requiredText(input.version, 'version'),
    status,
    changed_by: requiredText(input.changed_by, 'changed_by'),
    changed_at: isoDate(options.now || new Date().toISOString(), 'changed_at'),
    change_reason: requiredText(input.change_reason, 'change_reason'),
    reviewed_by: cleanText(input.reviewed_by) || null,
    previous_content_preserved: true,
    runtime_reading_modified: false,
    source_lineage_preserved: true
  });
}
