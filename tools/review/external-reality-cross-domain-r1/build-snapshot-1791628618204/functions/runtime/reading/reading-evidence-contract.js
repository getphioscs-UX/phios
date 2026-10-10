/*
 * PHI OS Reading Evidence Contract
 * File: functions/runtime/reading/reading-evidence-contract.js
 * Version: 1.0.0
 *
 * Canonical evidence classes and the operations each class may support.
 */

export const READING_EVIDENCE_CLASSES = Object.freeze({
  OBSERVED: 'observed_evidence',
  EXPERIENCE: 'reported_experience',
  INTERPRETATION: 'interpretation',
  PROFESSIONAL: 'professional_assessment',
  AI_INTERPRETATION: 'ai_interpretation',
  UNKNOWN: 'unknown_reality'
});

export const READING_EVIDENCE_PERMISSIONS = Object.freeze({
  observed_evidence: Object.freeze({
    maySupportFact: true,
    maySupportPattern: true,
    maySupportRegion: true,
    maySupportConfiguration: true,
    maySupportNavigation: true
  }),
  reported_experience: Object.freeze({
    maySupportFact: false,
    maySupportPattern: true,
    maySupportRegion: true,
    maySupportConfiguration: true,
    maySupportNavigation: true
  }),
  interpretation: Object.freeze({
    maySupportFact: false,
    maySupportPattern: false,
    maySupportRegion: false,
    maySupportConfiguration: false,
    maySupportNavigation: false
  }),
  professional_assessment: Object.freeze({
    maySupportFact: false,
    maySupportPattern: false,
    maySupportRegion: false,
    maySupportConfiguration: false,
    maySupportNavigation: false
  }),
  ai_interpretation: Object.freeze({
    maySupportFact: false,
    maySupportPattern: false,
    maySupportRegion: false,
    maySupportConfiguration: false,
    maySupportNavigation: false
  }),
  unknown_reality: Object.freeze({
    maySupportFact: false,
    maySupportPattern: false,
    maySupportRegion: false,
    maySupportConfiguration: false,
    maySupportNavigation: false
  })
});

export function evidencePermission(evidenceClass) {
  return READING_EVIDENCE_PERMISSIONS[evidenceClass] ||
    READING_EVIDENCE_PERMISSIONS.unknown_reality;
}

export default {
  classes: READING_EVIDENCE_CLASSES,
  permissions: READING_EVIDENCE_PERMISSIONS,
  evidencePermission
};
