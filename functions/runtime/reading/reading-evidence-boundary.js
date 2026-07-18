/*
 * PHI OS Reading Evidence Boundary
 * File: functions/runtime/reading/reading-evidence-boundary.js
 * Version: 1.0.0
 */
import {
  READING_EVIDENCE_CLASSES,
  evidencePermission
} from './reading-evidence-contract.js';

function list(value) {
  return Array.isArray(value) ? value : [];
}

function cleanText(value) {
  return typeof value === 'string'
    ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    : '';
}

function uniqueText(values) {
  const output = [];
  const seen = new Set();

  for (const value of list(values)) {
    const text = cleanText(value);
    const key = text.toLocaleLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    output.push(text);
  }

  return output;
}

export function normalizeReadingEvidenceBoundary(value = {}) {
  return {
    observedEvidence: uniqueText(value.observedEvidence),
    reportedExperience: uniqueText(value.reportedExperience),
    interpretation: uniqueText(value.interpretation),
    professionalAssessment: uniqueText(value.professionalAssessment),
    aiInterpretation: uniqueText(value.aiInterpretation),
    unknownReality: uniqueText(value.unknownReality)
  };
}

export function allowedEvidenceFor(boundary, operation) {
  const source = normalizeReadingEvidenceBoundary(boundary);
  const fieldMap = {
    observedEvidence: READING_EVIDENCE_CLASSES.OBSERVED,
    reportedExperience: READING_EVIDENCE_CLASSES.EXPERIENCE,
    interpretation: READING_EVIDENCE_CLASSES.INTERPRETATION,
    professionalAssessment: READING_EVIDENCE_CLASSES.PROFESSIONAL,
    aiInterpretation: READING_EVIDENCE_CLASSES.AI_INTERPRETATION,
    unknownReality: READING_EVIDENCE_CLASSES.UNKNOWN
  };

  return Object.entries(fieldMap).flatMap(([field, evidenceClass]) => {
    const permission = evidencePermission(evidenceClass);
    if (permission[operation] !== true) return [];

    return source[field].map(statement => ({
      statement,
      evidenceClass,
      source: field
    }));
  });
}

export function buildReadingEvidenceAudit(boundary) {
  const source = normalizeReadingEvidenceBoundary(boundary);

  return {
    counts: {
      observedEvidence: source.observedEvidence.length,
      reportedExperience: source.reportedExperience.length,
      interpretation: source.interpretation.length,
      professionalAssessment: source.professionalAssessment.length,
      aiInterpretation: source.aiInterpretation.length,
      unknownReality: source.unknownReality.length
    },
    patternSources: allowedEvidenceFor(source, 'maySupportPattern'),
    regionSources: allowedEvidenceFor(source, 'maySupportRegion'),
    configurationSources: allowedEvidenceFor(
      source,
      'maySupportConfiguration'
    ),
    navigationSources: allowedEvidenceFor(source, 'maySupportNavigation'),
    excludedFromInference: [
      ...source.interpretation.map(statement => ({
        statement,
        evidenceClass: READING_EVIDENCE_CLASSES.INTERPRETATION
      })),
      ...source.professionalAssessment.map(statement => ({
        statement,
        evidenceClass: READING_EVIDENCE_CLASSES.PROFESSIONAL
      })),
      ...source.aiInterpretation.map(statement => ({
        statement,
        evidenceClass: READING_EVIDENCE_CLASSES.AI_INTERPRETATION
      })),
      ...source.unknownReality.map(statement => ({
        statement,
        evidenceClass: READING_EVIDENCE_CLASSES.UNKNOWN
      }))
    ]
  };
}

export default {
  normalizeReadingEvidenceBoundary,
  allowedEvidenceFor,
  buildReadingEvidenceAudit
};
