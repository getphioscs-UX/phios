import {
  assertExternalReaderBoundary
} from './professional-source-contract.js';

export const PROFESSIONAL_RUNTIME_PROJECTION_VERSION =
  'phi-os.professional-runtime-projection.v1';

const STAGES = Object.freeze([
  ['entry', 'view_entry'],
  ['reconstruction', 'view_reconstruction'],
  ['reading', 'view_reading'],
  ['navigation', 'view_navigation'],
  ['runtime_memory', 'view_runtime_memory']
]);

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function projectItems(values) {
  const source = Array.isArray(values) ? values : [];
  return Object.freeze(source.map(item => {
    if (!item?.source_reference) {
      throw new TypeError('Every Professional Runtime item needs a source.');
    }
    assertExternalReaderBoundary(item.source_reference);
    return Object.freeze({
      record_id: cleanText(item.record_id),
      text: cleanText(item.text),
      source_reference: item.source_reference
    });
  }));
}

export function buildProfessionalRuntimeProjection(
  workspace,
  input = {}
) {
  if (
    workspace?.consent_validated !== true ||
    workspace?.status === 'access_revoked'
  ) {
    throw new TypeError(
      'Professional Runtime projection requires active consent.'
    );
  }
  const stages = {};
  for (const [stage, capability] of STAGES) {
    stages[stage] = Object.freeze({
      accessible: workspace.capabilities?.[capability] === true,
      items: workspace.capabilities?.[capability] === true
        ? projectItems(input[stage])
        : Object.freeze([])
    });
  }
  const externalPerspectives = projectItems(input.external_perspectives);
  if (
    externalPerspectives.some(item =>
      item.source_reference.source_type !==
        'external_reader_interpretation'
    )
  ) {
    throw new TypeError(
      'External Perspectives must use External Reader source labels.'
    );
  }
  return Object.freeze({
    schema_version: PROFESSIONAL_RUNTIME_PROJECTION_VERSION,
    workspace_id: workspace.workspace_id,
    client_id: workspace.client_id,
    runtime_id: workspace.current_runtime_id,
    stages: Object.freeze(stages),
    external_perspectives: externalPerspectives,
    external_perspectives_merged_into_runtime_evidence: false,
    read_only: true,
    runtime_mutation_allowed: false
  });
}

export default Object.freeze({ buildProfessionalRuntimeProjection });
