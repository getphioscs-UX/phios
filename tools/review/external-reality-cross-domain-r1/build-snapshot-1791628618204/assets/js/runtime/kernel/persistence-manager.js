import {
  clearPersistedRuntime,
  createRuntimeSnapshot,
  getRuntimeRecoveryState,
  initializeRuntimePersistence,
  loadRuntimeSnapshot,
  restoreRuntimeSnapshot,
  saveRuntimeSnapshot,
  validateRuntimeSnapshot
} from '../../modules/runtime-persistence.js';
import { emitRuntimeEvent } from './event-bus.js';

export function initializeRuntimeRecovery() {
  initializeRuntimePersistence();
  const state = getRuntimeRecoveryState();
  emitRuntimeEvent('persistence.initialized', { recoveryState: state });
  return state;
}

export function saveRuntime(reason = 'kernel_manual') {
  const snapshot = saveRuntimeSnapshot(reason);
  if (snapshot) emitRuntimeEvent('persistence.saved', { snapshot });
  return snapshot;
}

export function restoreRuntime(options = {}) {
  const result = restoreRuntimeSnapshot(options);
  emitRuntimeEvent(result.restored ? 'persistence.restored' : 'persistence.restore.skipped', result);
  return result;
}

export function clearRuntimePersistence() {
  clearPersistedRuntime();
  emitRuntimeEvent('persistence.cleared', {});
}

export const RuntimePersistenceManager = Object.freeze({
  initialize: initializeRuntimeRecovery,
  createSnapshot: createRuntimeSnapshot,
  validateSnapshot: validateRuntimeSnapshot,
  loadSnapshot: loadRuntimeSnapshot,
  save: saveRuntime,
  restore: restoreRuntime,
  recoveryState: getRuntimeRecoveryState,
  clear: clearRuntimePersistence
});
