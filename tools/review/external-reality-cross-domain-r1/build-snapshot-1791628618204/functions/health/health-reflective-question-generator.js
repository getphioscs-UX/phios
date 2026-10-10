import { questionContract } from './health-reflective-runtime-data.js';
import { resolveHealthReflectivePerspective } from './health-reflective-resolver.js';

export function generateHealthReflectiveQuestions({ conceptId, optedIn = false } = {}) {
  const resolved = resolveHealthReflectivePerspective({ conceptId });
  if (!resolved.available) return { ...resolved, questions: [] };
  if (!optedIn) return { available: true, state: 'REFLECTIVE_PERSPECTIVE_NOT_CONSUMED', questions: [], requiresOptIn: true };
  if (resolved.governance.highRiskMedicalConcept) return { available: true, state: 'REFLECTIVE_PERSPECTIVE_REQUIRES_EXPLICIT_SOURCE_VIEW', questions: [], requiresExplicitSourceView: true };
  if (resolved.governance.pastLifeLanguagePresent) return { available: true, state: 'PAST_LIFE_CLAIM_NOT_AUTO_PROJECTED', questions: [], requiresExplicitSourceView: true };
  const questions = resolved.normalizedThemes.flatMap(theme => questionContract.templates[theme] || []).slice(0, 3);
  return {
    available: true,
    state: 'OPTIONAL_REFLECTION',
    conceptId: resolved.conceptId,
    sourceId: resolved.sourceId,
    sourceTitle: resolved.sourceTitle,
    questions,
    responseOptions: [...questionContract.userStates],
    governance: { medicalCausalityAsserted: false, questionFormOnly: true, userMaySkip: true }
  };
}
