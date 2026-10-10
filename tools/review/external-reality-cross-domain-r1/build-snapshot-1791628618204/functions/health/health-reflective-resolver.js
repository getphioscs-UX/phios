import { symptomRegistry, bodyRegistry, sourceRegistry } from './health-reflective-runtime-data.js';

const byConcept = new Map([...symptomRegistry.entries, ...bodyRegistry.entries].map(entry => [entry.conceptId, entry]));
const sourceById = new Map(sourceRegistry.sources.map(source => [source.sourceId, source]));

export function resolveHealthReflectivePerspective({ conceptId } = {}) {
  const key = String(conceptId || '').trim();
  const entry = byConcept.get(key);
  if (!entry) return { available: false, state: 'REFLECTIVE_PERSPECTIVE_UNAVAILABLE', conceptId: key || null };
  const source = sourceById.get(entry.sourceId);
  if (!source || source.medicalAuthority !== false || source.causalityAllowed !== false) throw new Error('HRP_REFLECTIVE_SOURCE_AUTHORITY_DRIFT');
  return {
    available: true,
    state: 'OPTIONAL_REFLECTION',
    conceptId: entry.conceptId,
    sourceId: entry.sourceId,
    sourceTitle: source.title,
    perspectiveType: source.sourceType,
    sourceClaim: entry.sourceClaim,
    normalizedThemes: [...entry.normalizedThemes],
    governance: {
      sourceAttributed: true,
      medicalAuthority: false,
      causalityAllowed: false,
      urgencyAuthority: false,
      labAuthority: false,
      medicationAuthority: false,
      prognosisAuthority: false,
      pastLifeLanguagePresent: entry.pastLifeLanguagePresent === true,
      highRiskMedicalConcept: entry.highRiskMedicalConcept === true
    }
  };
}
