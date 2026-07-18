/*
 * PHI OS Reading Pattern Threshold
 * File: functions/runtime/reading/pattern-threshold.js
 * Version: 1.0.0
 */

function list(value) {
  return Array.isArray(value) ? value : [];
}

function clamp(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

export const PATTERN_THRESHOLD = Object.freeze({
  minimumObservedEvidence: 2,
  minimumReportedExperience: 1,
  minimumGrammarConfidence: 0.55
});

export function assessPatternThreshold(boundary, grammar) {
  const observedCount = list(boundary?.observedEvidence).length;
  const experienceCount = list(boundary?.reportedExperience).length;
  const grammarConfidence = clamp(grammar?.confidence);
  const blockers = [];

  if (observedCount < PATTERN_THRESHOLD.minimumObservedEvidence) {
    blockers.push('insufficient_observed_evidence');
  }

  if (experienceCount < PATTERN_THRESHOLD.minimumReportedExperience) {
    blockers.push('insufficient_reported_experience');
  }

  if (!grammar || grammarConfidence < PATTERN_THRESHOLD.minimumGrammarConfidence) {
    blockers.push('insufficient_grammar_confidence');
  }

  return {
    established: blockers.length === 0,
    classification: blockers.length === 0
      ? 'primary_pattern'
      : 'possible_reading',
    blockers,
    counts: {
      observedEvidence: observedCount,
      reportedExperience: experienceCount
    },
    grammarConfidence,
    threshold: PATTERN_THRESHOLD
  };
}

export default assessPatternThreshold;
