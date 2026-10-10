import {
  FINANCIAL_WORKSPACE_SECTIONS
} from './financial-workspace-contract.js';

export const FINANCIAL_WORKSPACE_PROJECTION_VERSION =
  'phi-os.financial-workspace-projection.v1';

const SECTION_CAPABILITY = Object.freeze({
  income: 'view_income',
  expenses: 'view_expenses',
  assets: null,
  liabilities: 'view_liabilities',
  cash_flow: null,
  net_worth: null,
  insurance: 'view_insurance',
  investments: 'view_investments',
  properties: 'view_properties',
  tax: 'view_tax',
  retirement: 'view_retirement',
  education: 'view_education',
  estate: 'view_estate',
  documents: 'view_financial_documents'
});

function freezeRecord(record) {
  return Object.freeze({ ...record });
}

function records(value) {
  if (Array.isArray(value)) return value.map(freezeRecord);
  if (Array.isArray(value?.records)) return value.records.map(freezeRecord);
  return [];
}

function sectionProjection(workspace, name, value) {
  const capability = SECTION_CAPABILITY[name];
  const accessible = capability
    ? workspace.financial_capabilities?.[capability] === true
    : workspace.view_financial_reality === true;
  return Object.freeze({
    accessible,
    summary: accessible && typeof value?.summary === 'string'
      ? value.summary.trim()
      : null,
    records: Object.freeze(accessible ? records(value) : []),
    source_lineage_preserved: true
  });
}

export function buildFinancialWorkspaceProjection(
  workspace,
  input = {}
) {
  if (
    workspace?.consent_validated !== true ||
    workspace?.status === 'access_revoked' ||
    workspace?.view_financial_reality !== true
  ) {
    throw new TypeError(
      'Financial Reality requires active financial-data consent.'
    );
  }
  const sections = Object.fromEntries(
    FINANCIAL_WORKSPACE_SECTIONS.map(name => [
      name,
      sectionProjection(workspace, name, input.sections?.[name])
    ])
  );
  return Object.freeze({
    schema_version: FINANCIAL_WORKSPACE_PROJECTION_VERSION,
    workspace_id: workspace.workspace_id,
    client_id: workspace.client_id,
    service_id: workspace.service_id,
    data_date: input.data_date || null,
    sections: Object.freeze(sections),
    financial_facts_separate: true,
    calculations_separate: true,
    professional_assessments_separate: true,
    recommendations_separate: true,
    system_inferences_separate: true,
    runtime_evidence_written: false,
    runtime_reading_modified: false,
    runtime_memory_written: false
  });
}

export default Object.freeze({ buildFinancialWorkspaceProjection });
