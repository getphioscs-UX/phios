import {
  assertExternalReaderBoundary
} from './professional-source-contract.js';

export const PROFESSIONAL_READING_REVISION_CONTRACT_VERSION =
  'phi-os.professional-reading-revision.v1';

export const PROFESSIONAL_READING_REVISION_ACTIONS = Object.freeze([
  'approve',
  'revise',
  'add_clarification',
  'mark_unverified',
  'request_more_evidence',
  'remove_unsupported_inference'
]);

export const PROFESSIONAL_READING_REVISION_TARGETS = Object.freeze([
  'runtime_reading',
  'external_reader_interpretation'
]);

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requiredText(value, field) {
  const text = cleanText(value);
  if (!text) throw new TypeError(`${field} is required.`);
  return text;
}

function positiveInteger(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new TypeError(`${field} must be a positive integer.`);
  }
  return number;
}

function isoDate(value, field) {
  const time = Date.parse(cleanText(value));
  if (!Number.isFinite(time)) throw new TypeError(`${field} must be a date.`);
  return new Date(time).toISOString();
}

function assertWorkspace(workspace) {
  if (
    workspace?.consent_validated !== true ||
    workspace?.status === 'access_revoked' ||
    workspace?.capabilities?.view_reading !== true
  ) {
    throw new TypeError(
      'Reading Revision requires active consent with Reading access.'
    );
  }
}

function assertSource(target, source) {
  if (!source || typeof source !== 'object') {
    throw new TypeError('A Professional source reference is required.');
  }
  assertExternalReaderBoundary(source);
  const isExternal =
    source.source_type === 'external_reader_interpretation';
  if (isExternal && target !== 'external_reader_interpretation') {
    throw new TypeError(
      'External Reader content must be revised in its independent layer.'
    );
  }
  if (!isExternal && target === 'external_reader_interpretation') {
    throw new TypeError(
      'External Reader revisions require an External Reader source.'
    );
  }
}

export function createProfessionalReadingRevision(
  workspace,
  input = {},
  options = {}
) {
  assertWorkspace(workspace);
  const action = cleanText(input.action);
  if (!PROFESSIONAL_READING_REVISION_ACTIONS.includes(action)) {
    throw new TypeError('Unsupported Professional Reading action.');
  }
  const target = cleanText(input.target) || 'runtime_reading';
  if (!PROFESSIONAL_READING_REVISION_TARGETS.includes(target)) {
    throw new TypeError('Unsupported Professional Reading target.');
  }
  assertSource(target, input.source_reference);
  const originalVersion = positiveInteger(
    input.original_version,
    'original_version'
  );
  const revisedVersion = positiveInteger(
    input.revised_version,
    'revised_version'
  );
  if (revisedVersion <= originalVersion) {
    throw new TypeError(
      'revised_version must be newer than original_version.'
    );
  }
  return Object.freeze({
    schema_version: PROFESSIONAL_READING_REVISION_CONTRACT_VERSION,
    revision_id: requiredText(input.revision_id, 'revision_id'),
    previous_revision_id: null,
    workspace_id: workspace.workspace_id,
    client_id: workspace.client_id,
    service_id: workspace.service_id,
    runtime_id: requiredText(
      input.runtime_id || workspace.current_runtime_id,
      'runtime_id'
    ),
    original_reading_id: requiredText(
      input.original_reading_id,
      'original_reading_id'
    ),
    target,
    action,
    original_version: originalVersion,
    revised_version: revisedVersion,
    original_text: requiredText(input.original_text, 'original_text'),
    revised_text: requiredText(input.revised_text, 'revised_text'),
    changed_by: requiredText(
      input.changed_by || workspace.professional_id,
      'changed_by'
    ),
    changed_at: isoDate(
      options.now || input.changed_at || new Date().toISOString(),
      'changed_at'
    ),
    reason: requiredText(input.reason, 'reason'),
    client_visible: input.client_visible === true,
    source_reference: input.source_reference,
    professional_overlay_only: true,
    runtime_reading_overwritten: false,
    runtime_evidence_written: false
  });
}

export function reviseProfessionalReadingRevision(
  workspace,
  previous,
  input = {},
  options = {}
) {
  if (
    !previous ||
    previous.workspace_id !== workspace?.workspace_id
  ) {
    throw new TypeError(
      'A matching previous Professional Reading Revision is required.'
    );
  }
  const next = createProfessionalReadingRevision(workspace, {
    ...input,
    runtime_id: previous.runtime_id,
    original_reading_id: previous.original_reading_id,
    target: previous.target,
    original_version: previous.revised_version,
    original_text: previous.revised_text
  }, options);
  return Object.freeze({
    ...next,
    previous_revision_id: previous.revision_id
  });
}

export default Object.freeze({
  createProfessionalReadingRevision,
  reviseProfessionalReadingRevision
});
