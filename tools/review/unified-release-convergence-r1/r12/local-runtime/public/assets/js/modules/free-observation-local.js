export const FREE_OBSERVATION_SCHEMA_VERSION =
  'phi-os.free-observation.local.v1';
export const FREE_OBSERVATION_STORAGE_KEY =
  'phiOSFreeObservations.v1';
export const FREE_OBSERVATION_MAXIMUM_RECORDS = 12;
export const FREE_OBSERVATION_RETENTION_DAYS = 30;

export const FREE_OBSERVATION_OPTIONS = Object.freeze({
  focus: Object.freeze([
    'change',
    'direction',
    'constraint',
    'continuity'
  ]),
  signal: Object.freeze([
    'new_difference',
    'unclear_context',
    'competing_priorities',
    'repeating_pattern'
  ]),
  horizon: Object.freeze([
    'today',
    'this_week',
    'this_month'
  ])
});

export const FREE_OBSERVATION_UPLOAD_POLICY = Object.freeze({
  serverUploadAvailable: false,
  explicitConsentRequired: true,
  canonicalConsentCreatedByBrowser: false,
  allowedScope: Object.freeze([
    'focus',
    'signal',
    'horizon',
    'orientation_keys'
  ]),
  prohibitedScope: Object.freeze([
    'free_text',
    'identity',
    'contact_details',
    'government_identifiers',
    'health_records',
    'financial_records',
    'account_credentials',
    'files'
  ]),
  purpose: 'free_observation_continuity',
  retentionDecisionOwner: 'PWS-I8'
});

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function dateFrom(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error('invalid_free_observation_date');
  }

  return date;
}

function canonicalOption(group, value) {
  const clean = typeof value === 'string' ? value.trim() : '';

  if (!FREE_OBSERVATION_OPTIONS[group]?.includes(clean)) {
    throw new Error(`invalid_free_observation_${group}`);
  }

  return clean;
}

function defaultIdFactory() {
  if (globalThis.crypto?.randomUUID) {
    return `free_obs_${globalThis.crypto.randomUUID()}`;
  }

  return `free_obs_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function browserStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new Error('free_observation_local_storage_unavailable');
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
    formalJourneyCreated: false,
    formalEvidenceCreated: false,
    professionalQueueEntryCreated: false,
    serverUploadPerformed: false,
    providerInvoked: false
  };
}

export function createFreeObservation(
  selection,
  {
    now = new Date(),
    idFactory = defaultIdFactory
  } = {}
) {
  const createdAt = dateFrom(now);
  const focus = canonicalOption('focus', selection?.focus);
  const signal = canonicalOption('signal', selection?.signal);
  const horizon = canonicalOption('horizon', selection?.horizon);

  return {
    schemaVersion: FREE_OBSERVATION_SCHEMA_VERSION,
    observationId: idFactory(),
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(
      createdAt.getTime() +
      (FREE_OBSERVATION_RETENTION_DAYS * DAY_IN_MILLISECONDS)
    ).toISOString(),
    selection: {
      focus,
      signal,
      horizon
    },
    orientation: {
      focusKey: `freeObservation.orientation.focus.${focus}`,
      signalKey: `freeObservation.orientation.signal.${signal}`,
      nextStepKey: `freeObservation.orientation.next.${focus}`
    },
    boundary: localBoundary()
  };
}

function normalizeStoredObservation(record) {
  if (
    !record ||
    record.schemaVersion !== FREE_OBSERVATION_SCHEMA_VERSION ||
    typeof record.observationId !== 'string' ||
    !record.observationId.startsWith('free_obs_')
  ) {
    return null;
  }

  try {
    const createdAt = dateFrom(record.createdAt);
    const expiresAt = dateFrom(record.expiresAt);
    const focus = canonicalOption('focus', record.selection?.focus);
    const signal = canonicalOption('signal', record.selection?.signal);
    const horizon = canonicalOption('horizon', record.selection?.horizon);

    return {
      schemaVersion: FREE_OBSERVATION_SCHEMA_VERSION,
      observationId: record.observationId,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      selection: {
        focus,
        signal,
        horizon
      },
      orientation: {
        focusKey: `freeObservation.orientation.focus.${focus}`,
        signalKey: `freeObservation.orientation.signal.${signal}`,
        nextStepKey: `freeObservation.orientation.next.${focus}`
      },
      boundary: localBoundary()
    };
  } catch {
    return null;
  }
}

function writeRecords(storage, records) {
  if (!records.length) {
    storage.removeItem(FREE_OBSERVATION_STORAGE_KEY);
    return;
  }

  storage.setItem(
    FREE_OBSERVATION_STORAGE_KEY,
    JSON.stringify(records)
  );
}

export function loadFreeObservations(
  storage,
  { now = new Date() } = {}
) {
  const target = storageOrDefault(storage);
  const currentTime = dateFrom(now).getTime();
  let source = [];

  try {
    const parsed = JSON.parse(
      target.getItem(FREE_OBSERVATION_STORAGE_KEY) || '[]'
    );
    source = Array.isArray(parsed) ? parsed : [];
  } catch {
    source = [];
  }

  const records = source
    .map(normalizeStoredObservation)
    .filter(record => (
      record &&
      dateFrom(record.expiresAt).getTime() > currentTime
    ))
    .slice(0, FREE_OBSERVATION_MAXIMUM_RECORDS);

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

export function saveFreeObservation(
  observation,
  storage,
  { now = new Date() } = {}
) {
  const target = storageOrDefault(storage);
  const normalized = normalizeStoredObservation(observation);

  if (!normalized) {
    throw new Error('invalid_free_observation_record');
  }

  const records = loadFreeObservations(target, { now })
    .filter(record => record.observationId !== normalized.observationId);
  const nextRecords = [normalized, ...records]
    .slice(0, FREE_OBSERVATION_MAXIMUM_RECORDS);

  writeRecords(target, nextRecords);

  return normalized;
}

export function clearFreeObservation(observationId, storage) {
  const target = storageOrDefault(storage);
  const records = loadFreeObservations(target)
    .filter(record => record.observationId !== observationId);

  writeRecords(target, records);

  return records;
}

export function clearAllFreeObservations(storage) {
  storageOrDefault(storage).removeItem(FREE_OBSERVATION_STORAGE_KEY);
}

export function createFreeObservationUploadConsentDraft(
  {
    explicitUserAction,
    purposeAcknowledged,
    scopeAcknowledged,
    retentionAcknowledged,
    revocationPathAcknowledged
  },
  { now = new Date() } = {}
) {
  if (
    explicitUserAction !== true ||
    purposeAcknowledged !== true ||
    scopeAcknowledged !== true ||
    retentionAcknowledged !== true ||
    revocationPathAcknowledged !== true
  ) {
    throw new Error('explicit_free_observation_upload_consent_required');
  }

  return {
    status: 'prepared_not_persisted',
    preparedAt: dateFrom(now).toISOString(),
    purpose: FREE_OBSERVATION_UPLOAD_POLICY.purpose,
    scope: [...FREE_OBSERVATION_UPLOAD_POLICY.allowedScope],
    retentionDecisionOwner:
      FREE_OBSERVATION_UPLOAD_POLICY.retentionDecisionOwner,
    revocationPathAcknowledged: true,
    explicitUserAction: true,
    canonicalConsentCreated: false
  };
}

export function prepareFreeObservationServerUpload(
  observation,
  consentDraft
) {
  const normalized = normalizeStoredObservation(observation);

  if (!normalized) {
    throw new Error('invalid_free_observation_record');
  }

  if (
    consentDraft?.status !== 'prepared_not_persisted' ||
    consentDraft.explicitUserAction !== true ||
    consentDraft.canonicalConsentCreated !== false ||
    consentDraft.purpose !== FREE_OBSERVATION_UPLOAD_POLICY.purpose ||
    JSON.stringify(consentDraft.scope) !== JSON.stringify(
      FREE_OBSERVATION_UPLOAD_POLICY.allowedScope
    ) ||
    consentDraft.retentionDecisionOwner !==
      FREE_OBSERVATION_UPLOAD_POLICY.retentionDecisionOwner ||
    consentDraft.revocationPathAcknowledged !== true
  ) {
    throw new Error('explicit_free_observation_upload_consent_required');
  }

  if (!FREE_OBSERVATION_UPLOAD_POLICY.serverUploadAvailable) {
    throw new Error('free_observation_server_upload_not_available');
  }

  return {
    observation: normalized,
    consent: consentDraft
  };
}
