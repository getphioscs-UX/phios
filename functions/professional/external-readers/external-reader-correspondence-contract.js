import {
  EXTERNAL_READER_CORRESPONDENCE_STATUSES,
  assertActiveWorkspace,
  assertReaderType,
  cleanText,
  isoDate,
  requiredText
} from './external-reader-constants.js';

export const EXTERNAL_READER_CORRESPONDENCE_CONTRACT_VERSION =
  'phi-os.external-reader-correspondence.v1';

export function createExternalReaderCorrespondence(
  workspace,
  input = {}
) {
  assertActiveWorkspace(workspace);
  const status = cleanText(input.status);
  if (!EXTERNAL_READER_CORRESPONDENCE_STATUSES.includes(status)) {
    throw new TypeError('Unsupported External Reader correspondence status.');
  }
  const evidence = Array.isArray(input.runtime_evidence_references)
    ? input.runtime_evidence_references.map(item =>
      requiredText(item, 'runtime_evidence_reference')
    )
    : [];
  if (
    ['professionally_supported', 'professionally_supported_correspondence']
      .includes(status) &&
    !evidence.length
  ) {
    throw new TypeError(
      'Professionally supported correspondence requires Runtime Evidence.'
    );
  }
  if (
    ['client_confirmed', 'client_confirmed_correspondence']
      .includes(status) &&
    input.client_confirmed !== true
  ) {
    throw new TypeError(
      'Client-confirmed correspondence requires explicit confirmation.'
    );
  }
  return Object.freeze({
    schema_version: EXTERNAL_READER_CORRESPONDENCE_CONTRACT_VERSION,
    correspondence_id: requiredText(
      input.correspondence_id,
      'correspondence_id'
    ),
    workspace_id: workspace.workspace_id,
    client_id: workspace.client_id,
    reader_type: assertReaderType(input.reader_type),
    interpretation_id: requiredText(
      input.interpretation_id,
      'interpretation_id'
    ),
    runtime_evidence_references: Object.freeze(evidence),
    runtime_evidence_id: cleanText(input.runtime_evidence_id) || null,
    status,
    summary: requiredText(input.summary, 'summary'),
    supporting_evidence: Object.freeze(
      Array.isArray(input.supporting_evidence)
        ? input.supporting_evidence.map(item =>
          requiredText(item, 'supporting_evidence')
        )
        : []
    ),
    conflicting_evidence: Object.freeze(
      Array.isArray(input.conflicting_evidence)
        ? input.conflicting_evidence.map(item =>
          requiredText(item, 'conflicting_evidence')
        )
        : []
    ),
    limitations: Object.freeze(
      Array.isArray(input.limitations)
        ? input.limitations.map(item => requiredText(item, 'limitation'))
        : []
    ),
    client_confirmation: input.client_confirmed === true,
    professional_confirmation:
      input.professional_confirmation === true,
    client_confirmed: input.client_confirmed === true,
    professional_id: requiredText(
      input.professional_id || workspace.professional_id,
      'professional_id'
    ),
    created_at: isoDate(
      input.created_at || new Date().toISOString(),
      'created_at'
    ),
    updated_at: isoDate(
      input.updated_at || input.created_at || new Date().toISOString(),
      'updated_at'
    ),
    reader_became_reality_fact: false,
    runtime_evidence_required_for_support: true,
    runtime_evidence_written: false,
    runtime_reading_modified: false
  });
}

export default Object.freeze({ createExternalReaderCorrespondence });
