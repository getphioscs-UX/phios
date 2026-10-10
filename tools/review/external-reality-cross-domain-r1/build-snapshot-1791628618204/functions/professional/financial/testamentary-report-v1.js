import { runFinancialCalculator, PTRC_FINANCIAL_FORMULA_VERSION } from './financial-runtime-v1.js';
import { PTRC_TESTAMENTARY_SECTIONS } from './testamentary-intake-v1.js';
import { redactTestamentaryExport } from './testamentary-security-v1.js';

export const PTRC_TESTAMENTARY_REPORT_VERSION = 'ptrc-testamentary-report.v1';
export const PTRC_TESTAMENTARY_REPORT_DISCLAIMER =
  'DRAFT — PROFESSIONAL REVIEW REQUIRED. This report is an information and review aid, not an executed will, trust instrument, legal opinion, or determination of legal validity.';

const REPORT_OUTLINE = Object.freeze([
  Object.freeze({ id: 'scope_and_status', sources: ['identity', 'review_consent'] }),
  Object.freeze({ id: 'identity_and_family', sources: ['identity', 'family'] }),
  Object.freeze({ id: 'executors_and_guardians', sources: ['executors', 'guardians'] }),
  Object.freeze({ id: 'beneficiaries', sources: ['beneficiaries'] }),
  Object.freeze({ id: 'estate_financial_summary', sources: ['assets', 'liabilities'] }),
  Object.freeze({ id: 'trusts_gifts_and_exclusions', sources: ['trusts', 'gifts', 'exclusions'] }),
  Object.freeze({ id: 'digital_assets', sources: ['digital_assets'] }),
  Object.freeze({ id: 'funeral_wishes', sources: ['funeral_wishes'] }),
  Object.freeze({ id: 'advisors_and_documents', sources: ['advisors', 'documents'] }),
  Object.freeze({ id: 'gaps_and_conflicts', sources: PTRC_TESTAMENTARY_SECTIONS }),
  Object.freeze({ id: 'review_consent', sources: ['review_consent'] }),
  Object.freeze({ id: 'legal_review_boundary', sources: ['review_consent'] })
]);

const text = value => String(value ?? '').trim();
const numberValues = section => (section?.items || []).flatMap(item =>
  typeof item?.value === 'number' && Number.isFinite(item.value) ? [item.value] : []
);

function assertSnapshot(snapshot) {
  if (snapshot?.schemaVersion !== 'ptrc-testamentary-approved-snapshot.v1' || !snapshot.immutableApprovedSnapshot) {
    throw new TypeError('PTRC_W9_APPROVED_SNAPSHOT_REQUIRED');
  }
}

function sectionProvenance(snapshot, sourceIds) {
  return Object.freeze(sourceIds.flatMap(sectionId => {
    const section = snapshot.normalizedFacts.sections[sectionId];
    if (!section) return [];
    const refs = section.sourceReferences.length ? section.sourceReferences : [`${sectionId}:${section.status}`];
    return refs.map(sourceReference => Object.freeze({
      sectionId, sourceReference, sourceStatus: section.status, dataVersion: snapshot.dataVersion
    }));
  }));
}

export function deriveTestamentaryCalculations(snapshot, options = {}) {
  assertSnapshot(snapshot);
  const assetsSection = snapshot.normalizedFacts.sections.assets;
  const liabilitiesSection = snapshot.normalizedFacts.sections.liabilities;
  const assets = numberValues(assetsSection);
  const liabilities = numberValues(liabilitiesSection);
  const missingNumeric = [];
  if (!assets.length) missingNumeric.push('assets.value');
  if (!liabilities.length) missingNumeric.push('liabilities.value');
  if (missingNumeric.length) {
    return Object.freeze({
      status: 'NEEDS_INPUT', missing: Object.freeze(missingNumeric),
      calculatorId: 'ESTATE_SUMMARY', guessedInputs: false, modelMayFillMissingNumericInputs: false
    });
  }
  const result = runFinancialCalculator({
    calculatorId: 'ESTATE_SUMMARY',
    inputs: { assets, liabilities },
    jurisdiction: snapshot.jurisdiction,
    currency: snapshot.currency,
    asOfDate: snapshot.dataDate,
    assumptions: ['PTRC-W9 approved testamentary snapshot only'],
    ...(options.formulaVersion ? { formulaVersion: options.formulaVersion } : {})
  });
  if (!result.ok || result.formulaVersion !== (options.formulaVersion || PTRC_FINANCIAL_FORMULA_VERSION)) {
    throw new Error('PTRC_W9_W8_RECONCILIATION_FAILED');
  }
  return Object.freeze({
    status: 'CALCULATED',
    sourceRuntime: result.runtimeVersion,
    calculatorId: result.calculatorId,
    formulaVersion: result.formulaVersion,
    asOfDate: result.asOfDate,
    currency: result.currency,
    jurisdiction: result.jurisdiction,
    values: result.values,
    provenance: result.provenance,
    notices: result.notices,
    reconciledWithPtrcW8: true,
    modelGeneratedNumericInputs: false,
    distributionCalculated: false,
    legalValidityDetermined: false
  });
}

function narrativeFor(sectionId, snapshot, calculation) {
  const sourceIds = REPORT_OUTLINE.find(item => item.id === sectionId)?.sources || [];
  if (sectionId === 'estate_financial_summary') {
    if (calculation.status !== 'CALCULATED') return 'Estate totals are not calculated because required numeric asset or liability inputs are missing.';
    const { grossEstate, totalLiabilities, netEstateBeforeTaxFeesAndDistribution } = calculation.values;
    return `Deterministic estate summary: gross ${snapshot.currency} ${grossEstate}; liabilities ${snapshot.currency} ${totalLiabilities}; net before tax, fees and distribution ${snapshot.currency} ${netEstateBeforeTaxFeesAndDistribution}. Distribution and legal validity are not calculated.`;
  }
  if (sectionId === 'gaps_and_conflicts') {
    const gapCount = snapshot.warnings.gaps.length;
    const conflictCount = snapshot.warnings.conflicts.length;
    return `${gapCount} explicit information gap(s) and ${conflictCount} declared conflict(s) require review.`;
  }
  if (sectionId === 'legal_review_boundary') return PTRC_TESTAMENTARY_REPORT_DISCLAIMER;
  const states = sourceIds.map(id => `${id}:${snapshot.normalizedFacts.sections[id]?.status || 'UNSET'}`);
  return states.length ? `Recorded status: ${states.join(', ')}.` : 'No source section is assigned.';
}

export function buildTestamentaryReportOutline(snapshot, calculation = deriveTestamentaryCalculations(snapshot)) {
  assertSnapshot(snapshot);
  return Object.freeze(REPORT_OUTLINE.map((definition, index) => Object.freeze({
    order: index + 1,
    sectionId: definition.id,
    sourceSections: definition.sources,
    provenance: sectionProvenance(snapshot, definition.sources),
    gaps: Object.freeze(snapshot.warnings.gaps.filter(item => definition.sources.includes(item.sectionId))),
    conflicts: Object.freeze(snapshot.warnings.conflicts.filter(item => definition.sources.includes(item.sectionId))),
    narrative: narrativeFor(definition.id, snapshot, calculation)
  })));
}

export function buildTestamentaryDraftReport(snapshot, options = {}) {
  assertSnapshot(snapshot);
  const calculation = deriveTestamentaryCalculations(snapshot, options);
  const outline = buildTestamentaryReportOutline(snapshot, calculation);
  return Object.freeze({
    schemaVersion: PTRC_TESTAMENTARY_REPORT_VERSION,
    reportId: `${snapshot.caseId}:report:v${snapshot.dataVersion}`,
    caseId: snapshot.caseId,
    snapshotId: snapshot.snapshotId,
    snapshotFingerprint: snapshot.snapshotFingerprint,
    jurisdiction: snapshot.jurisdiction,
    currency: snapshot.currency,
    informationDate: snapshot.dataDate,
    dataVersion: snapshot.dataVersion,
    rawUserInput: snapshot.rawUserInput,
    normalizedFacts: snapshot.normalizedFacts,
    derivedCalculations: calculation,
    warnings: snapshot.warnings,
    generatedNarrative: Object.freeze(outline.map(item => Object.freeze({ sectionId: item.sectionId, text: item.narrative }))),
    outline,
    disclaimer: PTRC_TESTAMENTARY_REPORT_DISCLAIMER,
    professionalReviewRequired: true,
    jurisdictionReviewRequired: true,
    executedInstrument: false,
    automaticExecution: false,
    legalValidityDetermined: false,
    fieldsInvented: false,
    modelGeneratedFacts: false,
    modelMayOverrideCalculations: false
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

export function renderTestamentaryReportHtml(report) {
  if (report?.schemaVersion !== PTRC_TESTAMENTARY_REPORT_VERSION) throw new TypeError('PTRC_W9_REPORT_REQUIRED');
  const sections = report.outline.map(item => `
    <section data-section="${escapeHtml(item.sectionId)}">
      <h2>${escapeHtml(item.order)}. ${escapeHtml(item.sectionId.replaceAll('_', ' '))}</h2>
      <p>${escapeHtml(item.narrative)}</p>
      ${item.gaps.length ? `<p class="warning">Gaps: ${escapeHtml(item.gaps.map(g => `${g.sectionId} (${g.code})`).join('; '))}</p>` : ''}
      ${item.conflicts.length ? `<p class="warning">Conflicts: ${escapeHtml(item.conflicts.map(c => c.message).join('; '))}</p>` : ''}
      <small>Provenance: ${escapeHtml(item.provenance.map(p => `${p.sectionId}:${p.sourceReference}`).join(' | ') || 'none')}</small>
    </section>`).join('\n');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Testamentary Draft Report</title>
<style>@page{size:A4;margin:14mm}body{font-family:system-ui,sans-serif;line-height:1.45;color:#111}header{border-bottom:1px solid #999;margin-bottom:16px}section{break-inside:avoid;margin:0 0 18px}.warning{border-left:3px solid currentColor;padding-left:10px}small{display:block;margin-top:8px;word-break:break-word}@media print{a{color:inherit;text-decoration:none}}</style></head>
<body data-ptrc-w9="reviewable-draft"><header><h1>Testamentary Information Draft</h1><p><strong>${escapeHtml(report.disclaimer)}</strong></p><p>Jurisdiction: ${escapeHtml(report.jurisdiction)} · Information date: ${escapeHtml(report.informationDate)} · Snapshot: ${escapeHtml(report.snapshotId)}</p></header>${sections}</body></html>`;
}

export function createTestamentaryPdfProjection(report) {
  const html = renderTestamentaryReportHtml(report);
  const redacted = redactTestamentaryExport(report);
  return Object.freeze({
    schemaVersion: 'ptrc-testamentary-pdf-projection.v1',
    reportId: report.reportId,
    snapshotId: report.snapshotId,
    snapshotFingerprint: report.snapshotFingerprint,
    mimeType: 'application/pdf',
    renderSource: 'PRINT_HTML_FROM_APPROVED_SNAPSHOT',
    printHtml: html,
    exportPayload: redacted,
    page: Object.freeze({ size: 'A4', marginMm: 14 }),
    visualQa: Object.freeze({
      required: true,
      checks: Object.freeze(['NO_CLIPPED_TEXT', 'PAGE_BREAKS_REVIEWED', 'WARNINGS_VISIBLE', 'DISCLAIMER_VISIBLE', 'PROVENANCE_READABLE']),
      status: 'READY_FOR_VISUAL_QA'
    }),
    rawDocumentsEmbedded: false,
    executedInstrument: false,
    legalValidityDetermined: false
  });
}
