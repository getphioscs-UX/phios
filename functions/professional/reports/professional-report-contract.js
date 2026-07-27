import { cleanText, isoDate, requiredText } from '../external-readers/external-reader-constants.js';
import {
  PROFESSIONAL_REPORT_CONTRACT_VERSION, PROFESSIONAL_REPORT_TYPES,
  PROFESSIONAL_REPORT_STATUSES, PROFESSIONAL_REPORT_SOURCE_TYPES,
  PROFESSIONAL_REPORT_CONFIDENCE, PROFESSIONAL_REPORT_CORRESPONDENCE
} from './professional-report-constants.js';
import { REPORT_TEMPLATE_SECTIONS } from './report-template-registry.js';

function allowed(value, values, field) {
  const text = requiredText(value, field);
  if (!values.includes(text)) throw new TypeError(`Unsupported ${field}.`);
  return text;
}
function section(input = {}) {
  const sourceType = allowed(input.source_type, PROFESSIONAL_REPORT_SOURCE_TYPES, 'source_type');
  const correspondence = allowed(input.correspondence_status || 'not_applicable', PROFESSIONAL_REPORT_CORRESPONDENCE, 'correspondence_status');
  if (sourceType === 'observed_evidence' && correspondence !== 'not_applicable') {
    throw new TypeError('Runtime Evidence cannot carry Reader correspondence status.');
  }
  return Object.freeze({
    section_id: requiredText(input.section_id, 'section_id'),
    title: Object.freeze({
      en: requiredText(input.title?.en, 'title.en'),
      zh_Hans: requiredText(input.title?.zh_Hans, 'title.zh_Hans')
    }),
    content: Object.freeze({
      en: requiredText(input.content?.en, 'content.en'),
      zh_Hans: requiredText(input.content?.zh_Hans, 'content.zh_Hans')
    }),
    source_type: sourceType,
    source_reference: requiredText(input.source_reference, 'source_reference'),
    registry_version: cleanText(input.registry_version) || null,
    professional_id: cleanText(input.professional_id) || null,
    confidence: allowed(input.confidence || 'not_assessed', PROFESSIONAL_REPORT_CONFIDENCE, 'confidence'),
    correspondence_status: correspondence,
    client_visible: input.client_visible !== false
  });
}

export function createProfessionalReport(input = {}, options = {}) {
  const type = allowed(input.report_type, PROFESSIONAL_REPORT_TYPES, 'report_type');
  const status = allowed(input.status || 'draft', PROFESSIONAL_REPORT_STATUSES, 'status');
  const sections = Object.freeze((Array.isArray(input.sections) ? input.sections : []).map(section));
  const requiredSections = REPORT_TEMPLATE_SECTIONS[type];
  const present = new Set(sections.map(item => item.section_id));
  const missing = requiredSections.filter(id => !present.has(id));
  if (missing.length) throw new TypeError(`Report missing sections: ${missing.join(', ')}.`);
  if (type.includes('external_reader') || type.includes('human_design') || type === 'integrated_runtime_review') {
    if (!cleanText(input.reader_type) || !cleanText(input.registry_version)) {
      throw new TypeError('External Reader report requires reader_type and registry_version.');
    }
  }
  return Object.freeze({
    schema_version: PROFESSIONAL_REPORT_CONTRACT_VERSION,
    report_id: requiredText(input.report_id, 'report_id'),
    report_type: type,
    version: requiredText(input.version, 'version'),
    status,
    generated_at: isoDate(options.now || input.generated_at || new Date().toISOString(), 'generated_at'),
    professional_id: requiredText(input.professional_id, 'professional_id'),
    professional_name: requiredText(input.professional_name, 'professional_name'),
    client_id: requiredText(input.client_id, 'client_id'),
    service_scope: requiredText(input.service_scope, 'service_scope'),
    consent_reference: requiredText(input.consent_reference, 'consent_reference'),
    reader_type: cleanText(input.reader_type) || null,
    registry_version: cleanText(input.registry_version) || null,
    sections,
    interpretation_boundary: Object.freeze({
      en: requiredText(input.interpretation_boundary?.en, 'interpretation_boundary.en'),
      zh_Hans: requiredText(input.interpretation_boundary?.zh_Hans, 'interpretation_boundary.zh_Hans')
    }),
    confidentiality_notice: Object.freeze({
      en: requiredText(input.confidentiality_notice?.en, 'confidentiality_notice.en'),
      zh_Hans: requiredText(input.confidentiality_notice?.zh_Hans, 'confidentiality_notice.zh_Hans')
    }),
    runtime_reading_modified: false,
    runtime_evidence_modified: false,
    runtime_memory_written: false,
    external_reader_became_fact: false,
    required_action_generated: false,
    forced_cross_reader_consistency: false
  });
}
