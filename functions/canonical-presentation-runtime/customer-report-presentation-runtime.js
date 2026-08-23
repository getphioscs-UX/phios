import { digestCanonical } from './report-release-runtime.js';
import {
  projectCustomerVisibleSections,
  assertNoForbiddenCustomerFields
} from './customer-report-visibility-runtime.js';

export const CUSTOMER_REPORT_PRESENTATION_VERSION = '2.0.0';
export const CUSTOMER_REPORT_PRESENTATION_CODE =
  'CPR-PRESENT-HDR-FOUNDATION-REPORT';

const SURFACES = Object.freeze(['CUSTOMER_WORKSPACE', 'PDF']);

const L1 = new Set(['type', 'strategy', 'authority', 'profile', 'definition']);
const L2 = new Set([
  'chart_overview', 'centers', 'channels', 'key_gates', 'variables_phs',
  'environment', 'cognition', 'motivation', 'general_operating_conditions'
]);

function object(value, code) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(code);
  }
  return value;
}

function authorizeCustomer(assertion, released) {
  object(assertion, 'CPR_CUSTOMER_AUTHORIZATION_REQUIRED');
  if (assertion.allowed !== true) {
    throw new Error('CPR_CUSTOMER_AUTHORIZATION_DENIED');
  }
  if (
    assertion.customerId !== released.customerReference.customerId ||
    assertion.reportId !== released.reportReference.reportId ||
    assertion.releaseId !== released.releaseReference.releaseId
  ) {
    throw new Error('CPR_CUSTOMER_AUTHORIZATION_IDENTITY_MISMATCH');
  }
  return true;
}

function layerRefs(sections, predicate) {
  return Object.freeze(
    sections.filter(section => predicate(section.sectionId))
      .map(section => section.sectionId)
  );
}

function evidenceRows(sections) {
  return Object.freeze(sections.map(section => Object.freeze({
    sectionId: section.sectionId,
    sourceType: section.sourceType,
    authorityClass: section.authorityClass,
    authorityLabel: section.authorityLabel,
    confidence: section.confidence,
    professionalAttribution: section.professionalAttribution,
    sourceAttribution: section.sourceAttribution,
    boundaryAlwaysVisible: section.boundaryAlwaysVisible
  })));
}

function surfaceHints(surface) {
  if (surface === 'PDF') {
    return Object.freeze({
      renderer: 'PDF_RENDERER',
      paginationMayDiffer: true,
      pageBreakMayDiffer: true,
      headerFooterMayDiffer: true,
      fontSizeMayDiffer: true,
      figurePlacementMayDiffer: true,
      semanticContentMayDiffer: false
    });
  }
  return Object.freeze({
    renderer: 'CUSTOMER_WORKSPACE_RENDERER',
    iframePdfEmbedding: false,
    responsiveMayDiffer: true,
    componentChoiceMayDiffer: true,
    semanticContentMayDiffer: false
  });
}

export function createCustomerReportPresentationProjection(
  released,
  input = {}
) {
  object(released, 'CPR_CUSTOMER_RELEASED_REPORT_REQUIRED');
  const report = object(
    released.canonicalReport,
    'CPR_CUSTOMER_CANONICAL_REPORT_REQUIRED'
  );
  authorizeCustomer(input.authorization, released);

  const surface = input.surface || 'CUSTOMER_WORKSPACE';
  if (!SURFACES.includes(surface)) {
    throw new Error('CPR_CUSTOMER_SURFACE_UNSUPPORTED');
  }
  const locale = input.locale || 'en';
  const sections = projectCustomerVisibleSections(report, locale);
  const limitations = sections.find(section => section.sectionId === 'limitations');
  if (!limitations) {
    throw new Error('CPR_CUSTOMER_LIMITATIONS_REQUIRED');
  }

  const semanticBody = Object.freeze({
    reportDigest: released.reportReference.reportDigest,
    releaseDigest: released.releaseReference.releaseDigest,
    locale,
    sections
  });
  const sourceContentDigest = digestCanonical(semanticBody);

  const projection = Object.freeze({
    schemaVersion: 'PHI-OS-CUSTOMER-REPORT-PRESENTATION-PROJECTION-v1.0.0',
    presentationCode:
      input.presentationCode || CUSTOMER_REPORT_PRESENTATION_CODE,
    presentationVersion: CUSTOMER_REPORT_PRESENTATION_VERSION,
    presentationMode: 'REPORT_BASED',
    reportReference: released.reportReference,
    releaseReference: released.releaseReference,
    customerReference: released.customerReference,
    surface,
    presentationType: 'REPORT_SECTION',
    locale,
    audience: 'CUSTOMER',
    informationLayer: 'L3_PROFESSIONAL_EVIDENCE',
    sections,
    layers: Object.freeze([
      Object.freeze({
        layerCode: 'L1_IMMEDIATE_UNDERSTANDING',
        title: locale === 'zh-Hans' ? '快速理解' : 'Immediate Understanding',
        reportHeader: Object.freeze({
          reportType: 'Human Design Foundation Report',
          preparedFor: released.customerReference.customerId,
          preparedBy: report.professional_name,
          reportDate: report.generated_at,
          reportVersion: report.version
        }),
        sectionIds: layerRefs(sections, id => L1.has(id))
      }),
      Object.freeze({
        layerCode: 'L2_CONFIRMATION',
        title: locale === 'zh-Hans' ? '探索我的结构' : 'Explore My Structure',
        sectionIds: layerRefs(sections, id => L2.has(id))
      }),
      Object.freeze({
        layerCode: 'L3_PROFESSIONAL_EVIDENCE',
        title: locale === 'zh-Hans'
          ? '依据、边界与来源'
          : 'Evidence, Boundary & Provenance',
        evidence: evidenceRows(sections),
        limitationsSectionId: 'limitations'
      })
    ]),
    sourceAssetReferences: Object.freeze([]),
    sourceProjectionReferences: Object.freeze([
      released.eligibilityCode
    ]),
    pdsReferences: Object.freeze([
      'content/registry/pds-w1-experience-contract.json',
      'content/professional/canonical-presentation-runtime/registries/pds-token-reference-registry-v1.json'
    ]),
    accessibilityContract: Object.freeze({
      source: 'CPR_W18_ACCESSIBILITY',
      boundaryAndUnknownCannotBeRemovedForSpace: true
    }),
    responsiveContract: Object.freeze({
      source: 'CPR_W14_RESPONSIVE',
      limitationsMayBeHiddenOnCompactSurface: false
    }),
    renderState: 'ready_for_render',
    sourceContentDigest,
    surfaceRenderHints: surfaceHints(surface),
    authority: Object.freeze({
      report: 'REFERENCE_ONLY',
      release: 'REFERENCE_ONLY',
      presentation: 'CPR',
      pds: 'REFERENCE_ONLY',
      renderer: 'LAYOUT_ONLY'
    })
  });

  assertNoForbiddenCustomerFields(projection);
  return projection;
}

export function createCustomerWorkspaceProjection(released, input = {}) {
  return createCustomerReportPresentationProjection(released, {
    ...input,
    surface: 'CUSTOMER_WORKSPACE'
  });
}

export function createCustomerPdfProjection(released, input = {}) {
  return createCustomerReportPresentationProjection(released, {
    ...input,
    surface: 'PDF'
  });
}

export default Object.freeze({
  createCustomerReportPresentationProjection,
  createCustomerWorkspaceProjection,
  createCustomerPdfProjection
});
