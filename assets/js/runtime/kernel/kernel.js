import { RuntimeContractManager } from './contract-manager.js';
import { RuntimeEventBus, emitRuntimeEvent } from './event-bus.js';
import { RuntimeLineageManager } from './lineage-manager.js';
import { RuntimePersistenceManager } from './persistence-manager.js';
import { RuntimeRecoveryManager } from './recovery-manager.js';
import { RuntimeTransitionManager } from './transition-manager.js';
import { RuntimeWorkspaceManager } from './workspace-manager.js';

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
      'contracts', 'workspace', 'persistence', 'transition', 'lineage', 'recovery', 'events'
    ]),
    guardrails: Object.freeze({
      automaticRuntimeCreation: false,
      automaticTransitionExecution: false,
      historicalOverwriteAllowed: false,
      reportedExperienceRemainsUnverified: true
    })
  });
}

export const RuntimeKernel = Object.freeze({
  start: startRuntimeKernel,
  status: getRuntimeKernelStatus,
  contracts: RuntimeContractManager,
  workspace: RuntimeWorkspaceManager,
  persistence: RuntimePersistenceManager,
  transition: RuntimeTransitionManager,
  lineage: RuntimeLineageManager,
  recovery: RuntimeRecoveryManager,
  events: RuntimeEventBus
});
