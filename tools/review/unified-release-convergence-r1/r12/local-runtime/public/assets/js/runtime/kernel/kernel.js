import { RuntimeContractManager } from './contract-manager.js';
import { RuntimeEventBus, emitRuntimeEvent } from './event-bus.js';
import { RuntimeLineageManager } from './lineage-manager.js';
import { RuntimePersistenceManager } from './persistence-manager.js';
import { RuntimeRecoveryManager } from './recovery-manager.js';
import { RuntimeRevisionManager } from './revision-manager.js';
import { RuntimeTransitionManager } from './transition-manager.js';
import { RuntimeWorkspaceManager } from './workspace-manager.js';
import { createRuntimeEntity } from '../../core/runtime.js';
import { SESSION_KEYS } from '../../core/session.js';

let started = false;
let startedAt = '';

export function startRuntimeKernel(options = {}) {
  if (started) return getRuntimeKernelStatus();
  started = true;
  startedAt = new Date().toISOString();
  RuntimePersistenceManager.initialize();
  const restored = options.restore === false ? null : RuntimeRecoveryManager.recover({ force: options.forceRestore === true });
  const status = getRuntimeKernelStatus();
  emitRuntimeEvent('kernel.started', { ...status, restored });
  return { ...status, restored };
}

export function getRuntimeKernelStatus() {
  return Object.freeze({
    schemaVersion: 'phi-os.runtime-kernel.v1',
    started,
    startedAt,
    managers: Object.freeze([
      'contracts', 'workspace', 'persistence', 'transition', 'revision', 'lineage', 'recovery', 'events'
    ]),
    guardrails: Object.freeze({
      automaticRuntimeCreation: false,
      automaticTransitionExecution: false,
      historicalOverwriteAllowed: false,
      reportedExperienceRemainsUnverified: true
    })
  });
}

export function initializeRuntime(options = {}) {
  const status = startRuntimeKernel(options);
  if (options.createEntity !== true) return status;
  const existing = RuntimeContractManager.get(SESSION_KEYS.runtimeEntity, null);
  if (existing) return { ...status, runtimeEntity: existing, created: false };
  const runtimeEntity = createRuntimeEntity();
  RuntimeContractManager.save(SESSION_KEYS.runtimeEntity, runtimeEntity);
  emitRuntimeEvent('runtime.initialized', { runtimeEntity, userInitiated: options.userInitiated === true });
  return { ...status, runtimeEntity, created: true };
}

export const RuntimeKernel = Object.freeze({
  start: startRuntimeKernel,
  status: getRuntimeKernelStatus,
  initializeRuntime,
  loadRuntime: RuntimeRecoveryManager.recover,
  applyTransition: RuntimeTransitionManager.execute,
  commitRevision: RuntimeRevisionManager.commit,
  appendEvent: emitRuntimeEvent,
  recoverRuntime: RuntimeRecoveryManager.recover,
  contracts: RuntimeContractManager,
  workspace: RuntimeWorkspaceManager,
  persistence: RuntimePersistenceManager,
  transition: RuntimeTransitionManager,
  revision: RuntimeRevisionManager,
  lineage: RuntimeLineageManager,
  recovery: RuntimeRecoveryManager,
  events: RuntimeEventBus
});
