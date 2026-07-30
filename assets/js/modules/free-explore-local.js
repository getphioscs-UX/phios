export const FREE_EXPLORE_SCHEMA_VERSION =
  'phi-os.pja.free-explore.local.v1';
export const FREE_EXPLORE_STORAGE_KEY =
  'phiOSFreeExploreSessions.v1';
export const FREE_EXPLORE_MAXIMUM_RECORDS = 8;
export const FREE_EXPLORE_RETENTION_DAYS = 30;

export const FREE_EXPLORE_OPTIONS = Object.freeze({
  question: Object.freeze([
    'phi_os_needed',
    'explanation_reality',
    'navigation_position',
    'computation_direction',
    'personal_decision_boundary'
  ]),
  theme: Object.freeze([
    'TH-PREFACE-01',
    'TH-PREFACE-02',
    'TH-PREFACE-03',
    'TH-PREFACE-04',
    'TH-PREFACE-05',
    'TH-PREFACE-06'
  ]),
  context: Object.freeze([
    'orientation',
    'learning',
    'change',
    'decision_boundary'
  ]),
  contentPreference: Object.freeze([
    'article',
    'visual',
    'book',
    'mixed'
  ]),
  depth: Object.freeze([
    'orientation',
    'working',
    'extended'
  ]),
  reflection: Object.freeze([
    'concept_clearer',
    'observe_more',
    'uncertainty_remains',
    'revisit_later'
  ]),
  routingBoundary: Object.freeze([
    'public_knowledge',
    'free_observation',
    'individual_analysis_required',
    'professional_responsibility_required',
    'unclassified'
  ])
});

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function dateFrom(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error('invalid_free_explore_date');
  }

  return date;
}

function canonicalOption(group, value) {
  const clean = typeof value === 'string' ? value.trim() : '';

  if (!FREE_EXPLORE_OPTIONS[group]?.includes(clean)) {
    throw new Error(`invalid_free_explore_${group}`);
  }

  return clean;
}

function canonicalOptionalOption(group, value) {
  if (value === '' || value === null || value === undefined) {
    return '';
  }

  return canonicalOption(group, value);
}

function canonicalIdList(values, prefix, maximum = 6) {
  if (!Array.isArray(values)) return [];

  return [...new Set(values)]
    .filter(value => (
      typeof value === 'string' &&
      value.startsWith(prefix) &&
      value.length <= 80
    ))
    .slice(0, maximum);
}

function defaultIdFactory() {
  if (globalThis.crypto?.randomUUID) {
    return `free_explore_${globalThis.crypto.randomUUID()}`;
  }

  return `free_explore_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function browserStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new Error('free_explore_local_storage_unavailable');
  }

  return window.localStorage;
}

function storageOrDefault(storage) {
  return storage || browserStorage();
}

function localBoundary() {
  return {
    anonymous: true,
    storageLocation: 'browser_local_only',
    sensitiveDataStored: false,
    fullLifeStoryCollected: false,
    formalJourneyCreated: false,
    formalEvidenceCreated: false,
    formalReconstructionCreated: false,
    individualReadingCreated: false,
    professionalAssignmentCreated: false,
    serverUploadPerformed: false,
    providerInvoked: false
  };
}

function normalizeRouteSummary(summary) {
  if (!summary) return null;

  return {
    routingBoundary: canonicalOption(
      'routingBoundary',
      summary?.routingBoundary
    ),
    detectedThemes: canonicalIdList(
      summary?.detectedThemes,
      'TH-',
      4
    ),
    matchedConcepts: canonicalIdList(
      summary?.matchedConcepts,
      '',
      6
    ).filter(value => /^[a-z][a-z0-9_]*$/.test(value)),
    matchedResourceNodeCodes: canonicalIdList(
      summary?.matchedResourceNodeCodes,
      'KN-',
      5
    )
  };
}

export function createFreeExploreSession(
  selection,
  routeSummary,
  {
    now = new Date(),
    idFactory = defaultIdFactory,
    currentStage = 0
  } = {}
) {
  const createdAt = dateFrom(now);
  const canonicalStage = Number(currentStage);

  if (
    !Number.isInteger(canonicalStage) ||
    canonicalStage < 0 ||
    canonicalStage > 5
  ) {
    throw new Error('invalid_free_explore_stage');
  }

  return {
    schemaVersion: FREE_EXPLORE_SCHEMA_VERSION,
    sessionId: idFactory(),
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(
      createdAt.getTime() +
      (FREE_EXPLORE_RETENTION_DAYS * DAY_IN_MILLISECONDS)
    ).toISOString(),
    currentStage: canonicalStage,
    selection: {
      question: canonicalOptionalOption('question', selection?.question),
      theme: canonicalOptionalOption('theme', selection?.theme),
      context: canonicalOptionalOption('context', selection?.context),
      contentPreference: canonicalOptionalOption(
        'contentPreference',
        selection?.contentPreference
      ),
      depth: canonicalOptionalOption('depth', selection?.depth),
      reflection: canonicalOptionalOption(
        'reflection',
        selection?.reflection
      )
    },
    routeSummary: normalizeRouteSummary(routeSummary),
    boundary: localBoundary()
  };
}

export function normalizeStoredFreeExploreSession(record) {
  if (
    !record ||
    record.schemaVersion !== FREE_EXPLORE_SCHEMA_VERSION ||
    typeof record.sessionId !== 'string' ||
    !record.sessionId.startsWith('free_explore_')
  ) {
    return null;
  }

  try {
    const createdAt = dateFrom(record.createdAt);
    const expiresAt = dateFrom(record.expiresAt);
    const currentStage = Number(record.currentStage);

    if (
      !Number.isInteger(currentStage) ||
      currentStage < 0 ||
      currentStage > 5
    ) {
      throw new Error('invalid_free_explore_stage');
    }

    return {
      schemaVersion: FREE_EXPLORE_SCHEMA_VERSION,
      sessionId: record.sessionId,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      currentStage,
      selection: {
        question: canonicalOptionalOption(
          'question',
          record.selection?.question
        ),
        theme: canonicalOptionalOption('theme', record.selection?.theme),
        context: canonicalOptionalOption(
          'context',
          record.selection?.context
        ),
        contentPreference: canonicalOptionalOption(
          'contentPreference',
          record.selection?.contentPreference
        ),
        depth: canonicalOptionalOption('depth', record.selection?.depth),
        reflection: canonicalOptionalOption(
          'reflection',
          record.selection?.reflection
        )
      },
      routeSummary: normalizeRouteSummary(record.routeSummary),
      boundary: localBoundary()
    };
  } catch {
    return null;
  }
}

function writeRecords(storage, records) {
  if (!records.length) {
    storage.removeItem(FREE_EXPLORE_STORAGE_KEY);
    return;
  }

  storage.setItem(
    FREE_EXPLORE_STORAGE_KEY,
    JSON.stringify(records)
  );
}

export function loadFreeExploreSessions(
  storage,
  { now = new Date() } = {}
) {
  const target = storageOrDefault(storage);
  const currentTime = dateFrom(now).getTime();
  let source = [];

  try {
    const parsed = JSON.parse(
      target.getItem(FREE_EXPLORE_STORAGE_KEY) || '[]'
    );
    source = Array.isArray(parsed) ? parsed : [];
  } catch {
    source = [];
  }

  const records = source
    .map(normalizeStoredFreeExploreSession)
    .filter(record => (
      record &&
      dateFrom(record.expiresAt).getTime() > currentTime
    ))
    .slice(0, FREE_EXPLORE_MAXIMUM_RECORDS);

  if (
    records.length !== source.length ||
    records.some((record, index) => (
      JSON.stringify(record) !== JSON.stringify(source[index])
    ))
  ) {
    writeRecords(target, records);
  }

  return records;
}

export function saveFreeExploreSession(
  session,
  storage,
  { now = new Date() } = {}
) {
  const target = storageOrDefault(storage);
  const normalized = normalizeStoredFreeExploreSession(session);

  if (!normalized) {
    throw new Error('invalid_free_explore_session');
  }

  const records = loadFreeExploreSessions(target, { now })
    .filter(record => record.sessionId !== normalized.sessionId);
  const nextRecords = [normalized, ...records]
    .slice(0, FREE_EXPLORE_MAXIMUM_RECORDS);

  writeRecords(target, nextRecords);

  return normalized;
}

export function clearFreeExploreSession(sessionId, storage) {
  const target = storageOrDefault(storage);
  const records = loadFreeExploreSessions(target)
    .filter(record => record.sessionId !== sessionId);

  writeRecords(target, records);

  return records;
}

export function clearAllFreeExploreSessions(storage) {
  storageOrDefault(storage).removeItem(FREE_EXPLORE_STORAGE_KEY);
}
