import { cleanText, isoDate, requiredText } from '../external-readers/external-reader-constants.js';
import { createProfessionalReport } from './professional-report-contract.js';
import {
  FINANCIAL_REPORT_TYPES,
  FINANCIAL_REPORT_SOURCE_TYPES,
  FINANCIAL_REPORT_REDACTED_FIELDS
} from './professional-report-constants.js';

export const FINANCIAL_REPORT_CONTRACT_VERSION = 'phi-os.financial-report.v1';

const forbiddenKeys = new Set([
  ...FINANCIAL_REPORT_REDACTED_FIELDS,
  'identity_number', 'bank_account_number', 'account_number',
  'policy_number', 'home_address', 'exact_address'
]);

function assertNoRestrictedIdentifiers(value, path = 'report') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenKeys.has(key) && child !== null && child !== '') {
      throw new TypeError(`${path}.${key} cannot be included in a Financial Report.`);
    }
    assertNoRestrictedIdentifiers(child, `${path}.${key}`);
  }
}

export function createFinancialReport(input = {}, options = {}) {
  if (!FINANCIAL_REPORT_TYPES.includes(cleanText(input.report_type))) {
    throw new TypeError('A supported Financial Report type is required.');
  }
  const informationDate = isoDate(
    requiredText(input.information_date, 'information_date'),
    'information_date'
  );
  assertNoRestrictedIdentifiers(input);
  for (const item of input.sections || []) {
    if (!FINANCIAL_REPORT_SOURCE_TYPES.includes(cleanText(item.source_type))) {
      throw new TypeError(
        `Financial Report section ${item.section_id || ''} requires a Financial source label.`
      );
    }
  }
  const report = createProfessionalReport(input, options);
  return Object.freeze({
    ...report,
    financial_schema_version: FINANCIAL_REPORT_CONTRACT_VERSION,
    information_date: informationDate,
    intake_id: requiredText(input.intake_id, 'intake_id'),
    intake_data_version: Number(input.intake_data_version || 1),
    calculation_id: cleanText(input.calculation_id) || null,
    navigation_plan_id: cleanText(input.navigation_plan_id) || null,
    previous_report_id: cleanText(input.previous_report_id) || null,
    missing_evidence: Object.freeze([...(input.missing_evidence || [])]),
    source_labels_restricted_to_financial_set: true,
    full_identity_number_included: false,
    full_bank_account_included: false,
    full_policy_number_included: false,
    full_home_address_included: false,
    unauthorised_household_data_included: false,
    financial_evidence_became_runtime_evidence: false,
    calculation_became_observed_fact: false,
    recommendation_became_required_action: false
  });
}

export default Object.freeze({ createFinancialReport });
