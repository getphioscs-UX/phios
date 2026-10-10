import {
  FINANCIAL_REPORT_TYPES,
  FINANCIAL_REPORT_REDACTED_FIELDS
} from './professional-report-constants.js';
import { FINANCIAL_REPORT_CONTRACT_VERSION } from './financial-report-contract.js';

export const FINANCIAL_REPORT_PDF_CONTRACT_VERSION =
  'phi-os.financial-report-pdf.v1';

const restrictedKeys = new Set([
  ...FINANCIAL_REPORT_REDACTED_FIELDS,
  'identity_number', 'bank_account_number', 'account_number',
  'policy_number', 'home_address', 'exact_address'
]);

function redact(value) {
  if (Array.isArray(value)) {
    return value
      .filter(item => item?.authorised !== false)
      .map(redact);
  }
  if (!value || typeof value !== 'object') return value;
  return Object.freeze(Object.fromEntries(
    Object.entries(value).flatMap(([key, child]) => {
      if (restrictedKeys.has(key)) return [];
      if (key === 'household_member' && child?.authorised === false) return [];
      return [[key, redact(child)]];
    })
  ));
}

export function createFinancialReportPdfProjection(report, options = {}) {
  if (
    report?.financial_schema_version !== FINANCIAL_REPORT_CONTRACT_VERSION ||
    !FINANCIAL_REPORT_TYPES.includes(report.report_type)
  ) {
    throw new TypeError('A valid Financial Report is required for PDF projection.');
  }
  if (!report.consent_reference) {
    throw new TypeError('Financial PDF requires an active consent reference.');
  }
  const requestedMembers = new Set(options.authorised_household_member_ids || []);
  const sections = report.sections
    .filter(section => section.client_visible !== false)
    .filter(section => {
      const memberId = section.household_member_id;
      return !memberId || requestedMembers.has(memberId);
    })
    .map(redact);
  return Object.freeze({
    pdf_contract_version: FINANCIAL_REPORT_PDF_CONTRACT_VERSION,
    report_id: report.report_id,
    report_type: report.report_type,
    report_version: report.version,
    information_date: report.information_date,
    consent_reference: report.consent_reference,
    generated_for_print: true,
    automatic_download_started: false,
    sections: Object.freeze(sections),
    interpretation_boundary: report.interpretation_boundary,
    confidentiality_notice: report.confidentiality_notice,
    redacted_fields: FINANCIAL_REPORT_REDACTED_FIELDS,
    unauthorised_household_data_removed: true,
    raw_source_documents_embedded: false,
    runtime_memory_written: false
  });
}

export default Object.freeze({ createFinancialReportPdfProjection });
