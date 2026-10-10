export const CUSTOMER_REPORT_SUPPORTED_LOCALES =
  Object.freeze(['en', 'zh-Hans']);

const ALWAYS_VISIBLE = new Set(['limitations']);

const SAFE_SECTION_IDS = new Set([
  'chart_overview', 'type', 'strategy', 'authority', 'profile', 'definition',
  'centers', 'channels', 'key_gates', 'variables_phs', 'environment',
  'cognition', 'motivation', 'general_operating_conditions', 'limitations'
]);

export const CUSTOMER_REPORT_FORBIDDEN_FIELDS = Object.freeze([
  'loginAssertion', 'sessionId', 'professionalAccess', 'authorization',
  'authorizationDecision', 'internalCapabilityEvaluation',
  'internalReportReference', 'rawScopes', 'internalRegistryPath',
  'debugLineage', 'checkerState', 'governanceImplementation'
]);

function localeKey(locale) {
  if (!CUSTOMER_REPORT_SUPPORTED_LOCALES.includes(locale)) {
    throw new Error('CPR_CUSTOMER_LOCALE_UNSUPPORTED');
  }
  return locale === 'zh-Hans' ? 'zh_Hans' : 'en';
}

function authoritySemantics(section) {
  if (section.source_type === 'calculated') {
    return {
      authorityClass: 'CALCULATED_STRUCTURE',
      authorityLabel: {
        en: 'Calculated by PHI OS',
        'zh-Hans': '系统计算'
      }
    };
  }
  if (section.source_type === 'professional_interpretation') {
    return {
      authorityClass: 'PROFESSIONAL_INTERPRETATION',
      authorityLabel: {
        en: 'Professional interpretation',
        'zh-Hans': '专业人员解读'
      }
    };
  }
  return {
    authorityClass: section.section_id === 'limitations'
      ? 'BOUNDARY'
      : 'PROFESSIONAL_VERIFICATION',
    authorityLabel: {
      en: section.section_id === 'limitations'
        ? 'Boundary'
        : 'Professional verification',
      'zh-Hans': section.section_id === 'limitations'
        ? '边界'
        : '专业人员核验'
    }
  };
}

function customerSafeSourceAttribution(section) {
  if (section.source_type === 'calculated') return 'PHI OS calculation';
  const source = typeof section.source_reference === 'string'
    ? section.source_reference.trim()
    : '';
  if (!source) return null;
  if (
    source.includes('/') ||
    source.includes('\\') ||
    /(?:content|functions|scripts|registry|checker)/i.test(source)
  ) {
    return 'Source reference retained in the professional record';
  }
  return source;
}

export function projectCustomerVisibleSections(report, locale) {
  const key = localeKey(locale);
  const sections = Array.isArray(report?.sections) ? report.sections : [];
  const limitations = sections.find(section => section.section_id === 'limitations');
  if (!limitations || limitations.client_visible !== true) {
    throw new Error('CPR_CUSTOMER_LIMITATIONS_MUST_BE_CLIENT_VISIBLE');
  }

  return Object.freeze(
    sections
      .filter(section =>
        section.client_visible === true &&
        SAFE_SECTION_IDS.has(section.section_id)
      )
      .map(section => {
        const semantics = authoritySemantics(section);
        return Object.freeze({
          sectionId: section.section_id,
          title: section.title?.[key] || '',
          content: section.content?.[key] || '',
          sourceType: section.source_type,
          confidence: section.confidence || 'not_assessed',
          authorityClass: semantics.authorityClass,
          authorityLabel: semantics.authorityLabel[locale],
          professionalAttribution:
            section.source_type === 'calculated'
              ? null
              : (section.professional_id || report.professional_id || null),
          sourceAttribution: customerSafeSourceAttribution(section),
          boundaryAlwaysVisible: ALWAYS_VISIBLE.has(section.section_id)
        });
      })
  );
}

export function assertNoForbiddenCustomerFields(value) {
  const forbidden = new Set(CUSTOMER_REPORT_FORBIDDEN_FIELDS);
  function visit(node, path = '') {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if (forbidden.has(key)) {
        throw new Error(`CPR_CUSTOMER_FORBIDDEN_FIELD:${path}${key}`);
      }
      visit(child, `${path}${key}.`);
    }
  }
  visit(value);
  return true;
}

export default Object.freeze({
  projectCustomerVisibleSections,
  assertNoForbiddenCustomerFields
});
