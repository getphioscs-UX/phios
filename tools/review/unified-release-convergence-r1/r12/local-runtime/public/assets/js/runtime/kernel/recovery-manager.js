import { RuntimePersistenceManager } from './persistence-manager.js';

export function recoverRuntime(options = {}) {
  return RuntimePersistenceManager.restore(options);
}

export function inspectRuntimeRecovery() {
  const snapshot = RuntimePersistenceManager.loadSnapshot();
  const validation = snapshot ? RuntimePersistenceManager.validateSnapshot(snapshot) : { valid: false, reason: 'snapshot_missing' };
  return {
    snapshot,
    validation,
    recoveryState: RuntimePersistenceManager.recoveryState()
  };
}

export const RuntimeRecoveryManager = Object.freeze({
  recover: recoverRuntime,
  inspect: inspectRuntimeRecovery
});
