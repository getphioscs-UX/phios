import {
  assertExternalReaderBoundary
} from './professional-source-contract.js';

export const PROFESSIONAL_NOTE_CONTRACT_VERSION =
  'phi-os.professional-note.v1';

export const PROFESSIONAL_NOTE_TYPES = Object.freeze([
  'private_professional_note',
  'client_visible_note',
  'evidence_clarification',
  'interpretive_observation',
  'consultation_note',
  'follow_up_note',
  'chart_accuracy_note',
  'birth_time_reliability',
  'human_design_observation',
  'possible_runtime_correspondence',
  'unverified_interpretation',
  'client_confirmation',
  'financial_fact_note',
  'document_verification_note',
  'assumption_note',
  'calculation_note',
  'risk_observation',
  'product_neutral_recommendation',
  'regulated_advice_note',
  'client_decision',
  'implementation_note',
  'review_note'
]);

const PRIVATE_TYPES = new Set([
  'private_professional_note',
  'chart_accuracy_note',
  'birth_time_reliability'
]);

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requiredText(value, field) {
  const text = cleanText(value);
  if (!text) throw new TypeError(`${field} is required.`);
  return text;
}

function isoDate(value, field) {
  const time = Date.parse(cleanText(value));
  if (!Number.isFinite(time)) throw new TypeError(`${field} must be a date.`);
  return new Date(time).toISOString();
}

function assertWorkspace(workspace) {
  if (
    workspace?.consent_validated !== true ||
    workspace?.status === 'access_revoked'
  ) {
    throw new TypeError(
      'An active consent-gated Professional Workspace is required.'
    );
  }
}

export function createProfessionalNote(
  workspace,
  input = {},
  options = {}
) {
  assertWorkspace(workspace);
  const noteType = cleanText(input.note_type);
  if (!PROFESSIONAL_NOTE_TYPES.includes(noteType)) {
    throw new TypeError('Unsupported professional note_type.');
  }
  const source = input.source_reference;
  if (!source || typeof source !== 'object') {
    throw new TypeError('A Professional source reference is required.');
  }
  assertExternalReaderBoundary(source);
  if (source.source_type === 'external_reader_interpretation') {
    const allowed = [
      'human_design_observation',
      'possible_runtime_correspondence',
      'unverified_interpretation'
    ];
    if (!allowed.includes(noteType)) {
      throw new TypeError(
        'External Reader content requires an interpretation note type.'
      );
    }
  }
  const privateNote = PRIVATE_TYPES.has(noteType);
  if (privateNote && input.client_visible === true) {
    throw new TypeError('A private Professional Note cannot be client-visible.');
  }
  return Object.freeze({
    schema_version: PROFESSIONAL_NOTE_CONTRACT_VERSION,
    note_id: requiredText(input.note_id, 'note_id'),
    workspace_id: workspace.workspace_id,
    client_id: workspace.client_id,
    service_id: workspace.service_id,
    professional_id: workspace.professional_id,
    note_type: noteType,
    content: requiredText(input.content, 'content'),
    source_reference: source,
    client_visible: privateNote ? false : input.client_visible === true,
    version: 1,
    previous_note_id: null,
    revision_reason: null,
    created_at: isoDate(
      options.now || input.created_at || new Date().toISOString(),
      'created_at'
    ),
    runtime_evidence_written: false,
    runtime_reading_overwritten: false
  });
}

export function reviseProfessionalNote(note, input = {}, options = {}) {
  if (!note || typeof note !== 'object') {
    throw new TypeError('A Professional Note is required.');
  }
  return Object.freeze({
    ...note,
    note_id: requiredText(input.note_id, 'note_id'),
    content: requiredText(input.content, 'content'),
    version: Number(note.version || 1) + 1,
    previous_note_id: note.note_id,
    revision_reason: requiredText(input.reason, 'reason'),
    created_at: isoDate(
      options.now || input.created_at || new Date().toISOString(),
      'created_at'
    )
  });
}

export default Object.freeze({
  createProfessionalNote,
  reviseProfessionalNote
});
