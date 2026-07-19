const SNAPSHOT_KEY = 'phiOSRuntimeSnapshot';
const RECOVERY_KEY = 'phiOSRuntimeRecovery';
const SNAPSHOT_SCHEMA = 'phi-os.runtime-snapshot.v1';
const DRIVER = 'localStorage';

export const RUNTIME_PERSISTENCE_KEYS = Object.freeze([
  'phiOSInitialMessage',
  'phiOSEntryState',
  'phiOSRuntimeEntity',
  'phiOSRuntimeEntry',
  'phiOSRealityReconstruction',
  'phiOSReconstructionInquiry',
  'phiOSRealityReadingInput',
  'phiOSRealityReading',
  'phiOSNavigationInput',
  'phiOSRealityNavigation',
  'phiOSRealityReview',
  'phiOSRuntimeMemory',
  'phiOSRealityContinuity',
  'phiOSRuntimeWorkspaceState',
  'phiOSRuntimeTransitionExecution',
  'phiOSRuntimeHistory',
  'phiOSReadingRevisionRequest',
  'phiOSReadingRevisionHistory',
  'phiOSReadingRevisionInitialization',
  'phiOSEntryContinuityHandoff',
  'phiOSEntryInitialization',
  'phiOSReviewContinuation'
]);

function safeParse(value, fallback = null) {
  try { return JSON.parse(value); } catch { return fallback; }
}

function hashText(text = '') {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function getAvailableStorage(name) {
  try {
    const storage = window[name];
    const probe = '__phi_os_storage_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

function collectContracts(session = getAvailableStorage('sessionStorage')) {
  const contracts = {};
  if (!session) return contracts;
  RUNTIME_PERSISTENCE_KEYS.forEach(key => {
    const value = session.getItem(key);
    if (value !== null) contracts[key] = value;
  });
  return contracts;
}

function activeRuntimeIdentity(contracts) {
  const entry = safeParse(contracts.phiOSRuntimeEntry, {});
  const entity = safeParse(contracts.phiOSRuntimeEntity, {});
  const workspace = safeParse(contracts.phiOSRuntimeWorkspaceState, {});
  return {
    runtimeId: entry.runtimeId || entity.runtimeId || '',
    runtimeEntityId: entry.runtimeEntityId || entity.runtimeEntityId || workspace.runtimeEntityId || '',
    runtimeEntryId: entry.runtimeEntryId || workspace.runtimeEntryId || '',
    workspaceStage: workspace.currentStage || ''
  };
}

export function createRuntimeSnapshot(reason = 'manual') {
  const contracts = collectContracts();
  const identity = activeRuntimeIdentity(contracts);
  const savedAt = new Date().toISOString();
  const payload = JSON.stringify({ contracts, identity });
  return {
    schemaVersion: SNAPSHOT_SCHEMA,
    driver: DRIVER,
    reason,
    savedAt,
    updatedAt: savedAt,
    contractCount: Object.keys(contracts).length,
    ...identity,
    contracts,
    integrity: {
      algorithm: 'fnv1a-32',
      checksum: hashText(payload),
      valid: true
    },
    guardrails: {
      historicalOverwriteAllowed: false,
      automaticRuntimeCreation: false,
      reportedExperienceRemainsUnverified: true
    }
  };
}

export function validateRuntimeSnapshot(snapshot) {
  if (!snapshot || snapshot.schemaVersion !== SNAPSHOT_SCHEMA) {
    return { valid: false, reason: 'unsupported_schema' };
  }
  if (!snapshot.contracts || typeof snapshot.contracts !== 'object') {
    return { valid: false, reason: 'missing_contracts' };
  }
  const payload = JSON.stringify({ contracts: snapshot.contracts, identity: {
    runtimeId: snapshot.runtimeId || '',
    runtimeEntityId: snapshot.runtimeEntityId || '',
    runtimeEntryId: snapshot.runtimeEntryId || '',
    workspaceStage: snapshot.workspaceStage || ''
  }});
  const checksum = hashText(payload);
  if (snapshot.integrity?.checksum !== checksum) {
    return { valid: false, reason: 'checksum_mismatch' };
  }
  return { valid: true, reason: '' };
}

export function saveRuntimeSnapshot(reason = 'contract_change') {
  const local = getAvailableStorage('localStorage');
  if (!local) return null;
  const snapshot = createRuntimeSnapshot(reason);
  if (!snapshot.contractCount) return null;
  local.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  local.setItem(RECOVERY_KEY, JSON.stringify({
    schemaVersion: 'phi-os.runtime-recovery-state.v1',
    status: 'saved',
    savedAt: snapshot.savedAt,
    restoredAt: null,
    runtimeId: snapshot.runtimeId,
    workspaceStage: snapshot.workspaceStage,
    driver: DRIVER
  }));
  return snapshot;
}

export function loadRuntimeSnapshot() {
  const local = getAvailableStorage('localStorage');
  if (!local) return null;
  return safeParse(local.getItem(SNAPSHOT_KEY), null);
}

export function hasActiveRuntimeSession() {
  const session = getAvailableStorage('sessionStorage');
  if (!session) return false;
  return RUNTIME_PERSISTENCE_KEYS.some(key => session.getItem(key) !== null);
}

export function restoreRuntimeSnapshot({ force = false } = {}) {
  const local = getAvailableStorage('localStorage');
  const session = getAvailableStorage('sessionStorage');
  if (!local || !session) return { restored: false, reason: 'storage_unavailable' };
  if (!force && hasActiveRuntimeSession()) return { restored: false, reason: 'active_session_present' };

  const snapshot = loadRuntimeSnapshot();
  const validation = validateRuntimeSnapshot(snapshot);
  if (!validation.valid) return { restored: false, reason: validation.reason };

  Object.entries(snapshot.contracts).forEach(([key, value]) => {
    if (RUNTIME_PERSISTENCE_KEYS.includes(key)) session.setItem(key, value);
  });

  const restoredAt = new Date().toISOString();
  local.setItem(RECOVERY_KEY, JSON.stringify({
    schemaVersion: 'phi-os.runtime-recovery-state.v1',
    status: 'restored',
    savedAt: snapshot.savedAt,
    restoredAt,
    runtimeId: snapshot.runtimeId,
    workspaceStage: snapshot.workspaceStage,
    driver: DRIVER
  }));
  return { restored: true, snapshot, restoredAt };
}

export function getRuntimeRecoveryState() {
  const local = getAvailableStorage('localStorage');
  if (!local) return null;
  return safeParse(local.getItem(RECOVERY_KEY), null);
}

export function clearPersistedRuntime() {
  const local = getAvailableStorage('localStorage');
  if (!local) return;
  local.removeItem(SNAPSHOT_KEY);
  local.removeItem(RECOVERY_KEY);
}

export function removePersistedContract(key) {
  if (!RUNTIME_PERSISTENCE_KEYS.includes(key)) return;
  const snapshot = loadRuntimeSnapshot();
  if (!snapshot?.contracts) return;
  delete snapshot.contracts[key];
  const identity = activeRuntimeIdentity(snapshot.contracts);
  Object.assign(snapshot, identity, {
    updatedAt: new Date().toISOString(),
    contractCount: Object.keys(snapshot.contracts).length
  });
  const payload = JSON.stringify({ contracts: snapshot.contracts, identity });
  snapshot.integrity = { algorithm: 'fnv1a-32', checksum: hashText(payload), valid: true };
  getAvailableStorage('localStorage')?.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
}

let initialized = false;
let saveTimer = null;

export function scheduleRuntimeSnapshot(reason = 'contract_change') {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => saveRuntimeSnapshot(reason), 80);
}

export function initializeRuntimePersistence() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  restoreRuntimeSnapshot();
  window.addEventListener('pagehide', () => saveRuntimeSnapshot('pagehide'));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveRuntimeSnapshot('visibility_hidden');
  });
}

export const RUNTIME_PERSISTENCE = Object.freeze({
  snapshotKey: SNAPSHOT_KEY,
  recoveryKey: RECOVERY_KEY,
  schemaVersion: SNAPSHOT_SCHEMA,
  driver: DRIVER
});
