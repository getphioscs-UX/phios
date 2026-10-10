import { compositionContract } from './health-reflective-runtime-data.js';
import { resolveHealthReflectivePerspective } from './health-reflective-resolver.js';
import { generateHealthReflectiveQuestions } from './health-reflective-question-generator.js';

const blockedSafetyStates = new Set(['EMERGENCY', 'URGENT_EVALUATION']);

export function composeHealthReflectivePerspective(input = {}) {
  const safetyState = String(input.safetyState || 'UNKNOWN');
  if (blockedSafetyStates.has(safetyState)) return { state: 'REFLECTIVE_PERSPECTIVE_SUPPRESSED_BY_SAFETY', shown: false };
  if (!input.governedHealthInformationPresent || !input.careNavigationPresent) return { state: 'REFLECTIVE_PERSPECTIVE_BLOCKED_UNTIL_CLINICAL_SECTIONS_PRESENT', shown: false };
  if (input.optedIn !== true) return { state: 'REFLECTIVE_PERSPECTIVE_NOT_CONSUMED', shown: false, entryLabel: compositionContract.ui.entryLabel };
  const resolved = resolveHealthReflectivePerspective({ conceptId: input.conceptId });
  if (!resolved.available) return { state: resolved.state, shown: false };
  const generated = generateHealthReflectiveQuestions({ conceptId: input.conceptId, optedIn: true });
  if (generated.state !== 'OPTIONAL_REFLECTION') return { state: generated.state, shown: false, source: resolved.sourceTitle, boundary: compositionContract.requiredBoundaryText };
  return {
    state: 'OPTIONAL_REFLECTION',
    shown: true,
    source: resolved.sourceTitle,
    perspective: `${resolved.perspectiveType} / symbolic reflection`,
    sourceAttribution: { sourceId: resolved.sourceId, sourceTitle: resolved.sourceTitle },
    themes: resolved.normalizedThemes,
    questions: generated.questions,
    boundary: compositionContract.requiredBoundaryText,
    governance: { medicalAuthority: false, medicalCausalityAsserted: false, userMaySkip: true, orderingContract: [...compositionContract.requiredOrder] }
  };
}
