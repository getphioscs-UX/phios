import {
  EXTERNAL_READER_FRAMEWORK_VERSION,
  EXTERNAL_READER_RUNTIME_DOMAINS,
  SUPPORTED_EXTERNAL_READERS,
  assertReaderType,
  cleanText,
  requiredText
} from './external-reader-constants.js';

export const EXTERNAL_READER_REGISTRY_CONTRACT_VERSION =
  'phi-os.external-reader-registry.v1';

const READER_STATUSES = new Set([
  'infrastructure_only',
  'registry_ready',
  'professional_only'
]);
const RENDERER_STATUSES = new Set([
  'not_implemented',
  'upload_only',
  'uploaded_chart_only',
  'available'
]);

function textList(value, field) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${field} must be an array.`);
  }
  return Object.freeze(value.map(item => requiredText(item, field)));
}

function localizedName(value) {
  return Object.freeze({
    en: requiredText(value?.en, 'reader_name.en'),
    'zh-Hans': requiredText(value?.['zh-Hans'], 'reader_name.zh-Hans')
  });
}

export function createExternalReaderRegistry(input = {}) {
  const readers = Array.isArray(input.readers) ? input.readers : [];
  if (!readers.length) {
    throw new TypeError('External Reader Registry requires readers.');
  }
  const seen = new Set();
  const normalized = readers.map(reader => {
    const readerId = assertReaderType(reader.reader_id);
    if (seen.has(readerId)) {
      throw new TypeError('External Reader reader_id must be unique.');
    }
    seen.add(readerId);
    const rendererStatus = cleanText(reader.renderer_status);
    const interpretationStatus = cleanText(reader.interpretation_status);
    if (!RENDERER_STATUSES.has(rendererStatus)) {
      throw new TypeError('Unsupported External Reader renderer status.');
    }
    if (!READER_STATUSES.has(interpretationStatus)) {
      throw new TypeError(
        'Unsupported External Reader interpretation status.'
      );
    }
    return Object.freeze({
      reader_id: readerId,
      reader_name: localizedName(reader.reader_name),
      reader_version: requiredText(
        reader.reader_version,
        'reader_version'
      ),
      reader_category: requiredText(
        reader.reader_category,
        'reader_category'
      ),
      description: cleanText(reader.description) || null,
      input_requirements: textList(
        reader.input_requirements,
        'input_requirements'
      ),
      output_schema: requiredText(reader.output_schema, 'output_schema'),
      registry_schema_version:
        cleanText(reader.registry_schema_version) || null,
      renderer_status: rendererStatus,
      calculation_status:
        cleanText(reader.calculation_status) || 'not_implemented',
      registry_status: cleanText(reader.registry_status) || 'scaffold',
      interpretation_status: interpretationStatus,
      professional_scope: textList(
        reader.professional_scope,
        'professional_scope'
      ),
      legal_or_license_notes: Object.freeze(
        Array.isArray(reader.legal_or_license_notes)
          ? reader.legal_or_license_notes.map(note =>
            requiredText(note, 'legal_or_license_note')
          )
          : []
      ),
      supported_languages: Object.freeze(
        Array.isArray(reader.supported_languages)
          ? [...reader.supported_languages]
          : []
      ),
      active: reader.active === true
    });
  });
  return Object.freeze({
    schema_version: EXTERNAL_READER_REGISTRY_CONTRACT_VERSION,
    framework_version: EXTERNAL_READER_FRAMEWORK_VERSION,
    readers: Object.freeze(normalized),
    supported_reader_types: SUPPORTED_EXTERNAL_READERS,
    runtime_domains: EXTERNAL_READER_RUNTIME_DOMAINS,
    automatic_chart_calculation: false,
    automatic_report_generation: false,
    runtime_reading_authority: false,
    runtime_evidence_authority: false,
    runtime_memory_write_allowed: false
  });
}

export function registerExternalReader(registry, reader) {
  return createExternalReaderRegistry({
    readers: [...(registry?.readers || []), reader]
  });
}

export default Object.freeze({
  createExternalReaderRegistry,
  registerExternalReader
});
