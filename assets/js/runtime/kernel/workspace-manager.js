import { deriveRuntimeWorkspaceState, getWorkspaceOptions, markWorkspaceStage } from '../../modules/runtime-workspace-state.js';
import { initializeRuntimeWorkspace } from '../../modules/runtime-workspace.js';
import { emitRuntimeEvent } from './event-bus.js';

export function getRuntimeWorkspaceState(currentStage = '') {
  return deriveRuntimeWorkspaceState(currentStage);
}

export function mountRuntimeWorkspace(options = {}) {
  const state = initializeRuntimeWorkspace(options);
  emitRuntimeEvent('workspace.mounted', { currentStage: options.currentStage || state?.currentStage || '' });
  return state;
}

export function goToRuntimeStage(stage) {
  const state = markWorkspaceStage(stage);
  emitRuntimeEvent('workspace.stage.changed', { stage, state });
  return state;
}

export const RuntimeWorkspaceManager = Object.freeze({
  current: getRuntimeWorkspaceState,
  options: getWorkspaceOptions,
  mount: mountRuntimeWorkspace,
  goto: goToRuntimeStage
});
