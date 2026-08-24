const clean = value => String(value ?? '').normalize('NFKC').trim();
const clone = value => structuredClone(value);
const STATES = new Set(['SAVED', 'REVIEW_LATER', 'CONTINUED', 'ARCHIVED']);
const METHODS = new Set(['TAROT', 'I_CHING']);

export const SYMBOLIC_READING_PERSISTENCE_SCHEMA = 'PHI-OS-SYMBOLIC-READING-PERSISTENCE-v1.0.0';

function layer(reading, id) {
  return Array.isArray(reading?.hierarchy) ? reading.hierarchy.find(item => item?.id === id)?.data : null;
}

function methodFrom(reading, input) {
  const method = clean(input?.method || reading?.method).toUpperCase();
  if (!METHODS.has(method)) throw new TypeError('SYMBOLIC_PERSISTENCE_METHOD_REQUIRED');
  return method;
}

function contextConsent(reading = {}) {
  const reality = reading?.realityContext || {};
  const used = reality.usingCurrentRealityContext === true;
  return Object.freeze({
    currentRealityContextUsed: used,
    explicitUseConfirmed: used,
    silentPrivateContextConsumption: false,
    contextLabel: used ? clean(reality.label) || null : null,
    contextItems: used && Array.isArray(reality.contextItems) ? clone(reality.contextItems.slice(0, 12)) : []
  });
}

function readingIrPublicProjection(reading = {}, method, question) {
  const evidence = layer(reading, 'METHOD_EVIDENCE') || {};
  const projection = layer(reading, 'PROJECTION') || {};
  const interpretation = layer(reading, 'SYMBOLIC_INTERPRETATION') || {};
  const rcc = layer(reading, 'REALITY_COMPARISON') || {};
  const uncertainty = layer(reading, 'WHAT_REMAINS_UNCERTAIN') || [];
  const next = layer(reading, 'POSSIBLE_NEXT_QUESTIONS_ACTIONS') || [];
  return Object.freeze({
    schemaVersion: 'PHI-OS-SYMBOLIC-SAVED-READING-IR-PUBLIC-PROJECTION-v1.0.0',
    sourceReadingIrVersion: clean(reading?.readingIrVersion) || null,
    methodCode: method,
    question,
    contextDisclosure: contextConsent(reading),
    drawEvidence: clone(evidence),
    projection: clone(projection),
    interpretation: clone(interpretation),
    rcc: clone(rcc),
    uncertainty: clone(uncertainty),
    nextQuestionsActions: clone(next),
    agency: clone(reading?.tarotSurface?.agency || reading?.authority || {}),
    compositionEvidence: clone(reading?.tarotSurface?.compositionEvidence || {}),
    authority: clone(reading?.authority || {})
  });
}

export function createSymbolicReadingPersistenceEnvelope(input = {}) {
  const reading = input?.reading && typeof input.reading === 'object' ? input.reading : {};
  const method = methodFrom(reading, input);
  const question = clean(input.question || layer(reading, 'YOUR_INPUT')?.question).slice(0, 800);
  if (!question) throw new TypeError('SYMBOLIC_PERSISTENCE_QUESTION_REQUIRED');
  const reviewState = STATES.has(clean(input.reviewState).toUpperCase()) ? clean(input.reviewState).toUpperCase() : 'SAVED';
  const irProjection = readingIrPublicProjection(reading, method, question);
  return Object.freeze({
    schemaVersion: SYMBOLIC_READING_PERSISTENCE_SCHEMA,
    methodCode: method,
    question,
    contextConsent: irProjection.contextDisclosure,
    drawEvidence: clone(input.methodEvidence || irProjection.drawEvidence || {}),
    projection: clone(input.projection || irProjection.projection || {}),
    readingIrProjection: irProjection,
    publicReadingView: clone(reading),
    sourceVersions: clone(reading?.tarotSurface?.compositionEvidence || {}),
    userNotes: clean(input.userNotes).slice(0, 4000),
    realityHandoff: input.realityHandoff && typeof input.realityHandoff === 'object' ? clone(input.realityHandoff) : null,
    reviewState,
    governance: Object.freeze({
      canonicalRawReadingIrPersisted: false,
      publicIrProjectionPersisted: true,
      privateContextSilentlyPersisted: false,
      guestPersistenceAllowed: false,
      browserLocalFallbackAllowed: false,
      tarotBecomesRealityTruth: false
    })
  });
}

export function patchSymbolicReadingPersistenceEnvelope(current = {}, patch = {}) {
  if (current?.schemaVersion !== SYMBOLIC_READING_PERSISTENCE_SCHEMA) throw new TypeError('SYMBOLIC_PERSISTED_READING_REQUIRED');
  const reviewState = patch.reviewState == null ? current.reviewState : clean(patch.reviewState).toUpperCase();
  if (!STATES.has(reviewState)) throw new TypeError('SYMBOLIC_REVIEW_STATE_INVALID');
  return Object.freeze({
    ...clone(current),
    userNotes: patch.userNotes == null ? current.userNotes : clean(patch.userNotes).slice(0, 4000),
    realityHandoff: patch.realityHandoff === undefined ? clone(current.realityHandoff) : (patch.realityHandoff && typeof patch.realityHandoff === 'object' ? clone(patch.realityHandoff) : null),
    reviewState
  });
}
