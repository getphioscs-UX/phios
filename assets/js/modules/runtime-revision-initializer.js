import { SESSION, cleanText, createId, getSession, safeJSON, setSession } from '../shared.js';
import {
  ENTRY_CONTINUITY_HANDOFF_KEY,
  READING_REVISION_REQUEST_KEY
} from './runtime-transition-engine.js';
import {
  REVIEW_KEY,
  MEMORY_KEY,
  CONTINUITY_KEY,
  WORKSPACE_STATE_KEY
} from './runtime-workspace-state.js';

export const ENTRY_INITIALIZATION_KEY = 'phiOSEntryInitialization';
export const READING_REVISION_INITIALIZATION_KEY = 'phiOSReadingRevisionInitialization';
export const READING_REVISION_HISTORY_KEY = 'phiOSReadingRevisionHistory';

function readJson(key) {
  return safeJSON(getSession(key), null);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function appendJsonRecord(key, record) {
  const existing = readJson(key);
  const records = Array.isArray(existing) ? existing : [];
  records.push(record);
  setSession(key, records);
}

function sameInitialization(existing, sourceId) {
  return isObject(existing) && cleanText(existing.sourceId) === cleanText(sourceId);
}

export function initializeNewRuntimeEntry(options = {}) {
  const mode = cleanText(options.mode || new URLSearchParams(location.search).get('mode'));
  if (mode !== 'new-runtime') return null;

  const handoff = readJson(ENTRY_CONTINUITY_HANDOFF_KEY);
  if (!isObject(handoff) || handoff.schemaVersion !== 'phi-os.entry-continuity-handoff.v1') {
    return {
      ready: false,
      blockers: ['entry_continuity_handoff_required']
    };
  }

  const existing = readJson(ENTRY_INITIALIZATION_KEY);
  if (sameInitialization(existing, handoff.handoffId)) return existing;

  const runtimeEntityId = cleanText(handoff.previousRuntimeEntityId) || createId('rt');
  const runtimeEntryId = createId('entry');
  const runtimeId = createId('runtime');

  const initialization = {
    schemaVersion: 'phi-os.entry-initialization.v1',
    initializationId: createId('entry_init'),
    sourceId: handoff.handoffId,
    initializedAt: new Date().toISOString(),
    status: 'initialized',
    mode: 'new_runtime',
    runtimeId,
    runtimeEntityId,
    runtimeEntryId,
    previousRuntimeId: cleanText(handoff.previousRuntimeId),
    previousRuntimeEntryId: cleanText(handoff.previousRuntimeEntryId),
    sourceMemoryId: cleanText(handoff.sourceMemoryId),
    continuityContext: {
      evidenceClass: 'continuity_reference',
      unresolvedReality: Array.isArray(handoff.unresolvedReality)
        ? handoff.unresolvedReality
        : [],
      referenceOnly: true,
      inheritedAsFact: false
    },
    automaticEntrySubmission: false,
    historicalOverwrite: false,
    userInitiated: handoff.userInitiated === true
  };

  setSession(ENTRY_INITIALIZATION_KEY, initialization);
  setSession(SESSION.runtimeEntity, {
    schemaVersion: 'phi-os.runtime-entity.v1',
    runtimeEntityId,
    currentRuntimeId: runtimeId,
    currentRuntimeEntryId: runtimeEntryId,
    previousRuntimeId: initialization.previousRuntimeId,
    updatedAt: initialization.initializedAt
  });

  return initialization;
}

export function initializeReadingRevision(options = {}) {
  const mode = cleanText(options.mode || new URLSearchParams(location.search).get('mode'));
  if (mode !== 'revision') return null;

  const request = readJson(READING_REVISION_REQUEST_KEY);
  if (!isObject(request) || request.schemaVersion !== 'phi-os.reading-revision-request.v1') {
    return {
      ready: false,
      blockers: ['reading_revision_request_required']
    };
  }

  const existing = readJson(READING_REVISION_INITIALIZATION_KEY);
  if (sameInitialization(existing, request.requestId)) return existing;

  const readingInput = readJson(SESSION.readingInput);
  if (!isObject(readingInput)) {
    return {
      ready: false,
      blockers: ['reading_input_required']
    };
  }

  const priorReading = readJson(SESSION.reading);
  const priorNavigationInput = readJson(SESSION.navigationInput);
  const priorNavigation = readJson(SESSION.navigation);
  const priorReview = readJson(REVIEW_KEY);
  const priorMemory = readJson(MEMORY_KEY);
  const priorContinuity = readJson(CONTINUITY_KEY);
  const history = readJson(READING_REVISION_HISTORY_KEY);
  const revisionNumber = (Array.isArray(history) ? history.length : 0) + 2;

  appendJsonRecord(READING_REVISION_HISTORY_KEY, {
    archivedAt: new Date().toISOString(),
    requestId: request.requestId,
    sourceRuntimeId: cleanText(request.sourceRuntimeId),
    sourceRuntimeEntryId: cleanText(request.sourceRuntimeEntryId),
    sourceMemoryId: cleanText(request.sourceMemoryId),
    revisionNumber: revisionNumber - 1,
    readingInput,
    reading: priorReading,
    downstreamContracts: {
      navigationInput: priorNavigationInput,
      navigation: priorNavigation,
      review: priorReview,
      memory: priorMemory,
      continuity: priorContinuity
    },
    appendOnly: true
  });

  const revisedInput = {
    ...readingInput,
    revisionContext: {
      schemaVersion: 'phi-os.reading-revision-context.v1',
      requestId: request.requestId,
      revisionNumber,
      sourceRuntimeId: cleanText(request.sourceRuntimeId),
      sourceRuntimeEntryId: cleanText(request.sourceRuntimeEntryId),
      sourceMemoryId: cleanText(request.sourceMemoryId),
      unresolvedReality: Array.isArray(request.unresolvedReality)
        ? request.unresolvedReality
        : [],
      evidenceClass: 'continuity_reference',
      referenceOnly: true,
      inheritedAsFact: false,
      historicalOverwrite: false,
      userInitiated: request.userInitiated === true
    }
  };

  setSession(SESSION.readingInput, revisedInput);
  sessionStorage.removeItem(SESSION.reading);
  sessionStorage.removeItem(SESSION.navigationInput);
  sessionStorage.removeItem(SESSION.navigation);
  sessionStorage.removeItem(REVIEW_KEY);
  sessionStorage.removeItem(MEMORY_KEY);
  sessionStorage.removeItem(CONTINUITY_KEY);
  sessionStorage.removeItem(WORKSPACE_STATE_KEY);

  const initialization = {
    schemaVersion: 'phi-os.reading-revision-initialization.v1',
    initializationId: createId('reading_revision_init'),
    sourceId: request.requestId,
    initializedAt: new Date().toISOString(),
    status: 'initialized',
    revisionNumber,
    sourceRuntimeId: cleanText(request.sourceRuntimeId),
    sourceRuntimeEntryId: cleanText(request.sourceRuntimeEntryId),
    sourceMemoryId: cleanText(request.sourceMemoryId),
    historicalOverwrite: false,
    downstreamContractsReset: true,
    automaticReadingConclusion: false,
    userInitiated: request.userInitiated === true
  };

  setSession(READING_REVISION_INITIALIZATION_KEY, initialization);
  return initialization;
}
