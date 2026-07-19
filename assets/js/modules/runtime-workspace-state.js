import { SESSION, getSession, safeJSON, setSession } from '../shared.js';

export const WORKSPACE_STATE_KEY = 'phiOSRuntimeWorkspaceState';
export const REVIEW_KEY = 'phiOSRealityReview';
export const MEMORY_KEY = 'phiOSRuntimeMemory';
export const CONTINUITY_KEY = 'phiOSRealityContinuity';

export const STAGE_ORDER = Object.freeze([
  'entry','reconstruction','reading','navigation','review','memory','continuity'
]);

const present = key => Boolean(getSession(key));
const json = key => safeJSON(getSession(key), null);

export function deriveRuntimeWorkspaceState(currentStage = '') {
  const entryState = json(SESSION.entryState);
  const entry = json(SESSION.entry);
  const reconstruction = json(SESSION.reconstruction);
  const reading = json(SESSION.reading);
  const navigation = json(SESSION.navigation);
  const review = json(REVIEW_KEY);
  const memory = json(MEMORY_KEY);
  const continuity = json(CONTINUITY_KEY);

  const completed = new Set();
  if (entry || reconstruction || reading || navigation || review || memory || continuity || entryState?.ready) completed.add('entry');
  if (reconstruction || reading || navigation || review || memory || continuity) completed.add('reconstruction');
  if (reading || navigation || review || memory || continuity) completed.add('reading');
  if (navigation?.navigationState?.selectedPathId || review || memory || continuity) completed.add('navigation');
  if (review?.status === 'ready_for_memory' || memory || continuity) completed.add('review');
  if (memory || continuity) completed.add('memory');
  if (continuity?.userChoice?.confirmed) completed.add('continuity');

  const inferredCurrent = currentStage || (
    continuity ? 'continuity' :
    memory ? 'memory' :
    review ? 'review' :
    navigation ? 'navigation' :
    reading ? 'reading' :
    reconstruction ? 'reconstruction' : 'entry'
  );

  const state = {
    schemaVersion: 'phi-os.runtime-workspace-state.v1',
    runtimeEntityId: entry?.runtimeEntityId || navigation?.runtimeEntityId || review?.runtimeEntityId || memory?.runtimeEntityId || '',
    runtimeEntryId: entry?.runtimeEntryId || navigation?.runtimeEntryId || review?.runtimeEntryId || memory?.runtimeEntryId || '',
    currentStage: inferredCurrent,
    completedStages: STAGE_ORDER.filter(stage => completed.has(stage)),
    availableStages: STAGE_ORDER.filter(stage => {
      if (stage === 'entry') return true;
      if (stage === 'reconstruction') return present(SESSION.entry) || Boolean(entryState?.ready);
      if (stage === 'reading') return Boolean(reconstruction);
      if (stage === 'navigation') return Boolean(reading);
      if (stage === 'review') return Boolean(navigation?.navigationState?.reviewGate?.preparedAt);
      if (stage === 'memory') return Boolean(memory);
      if (stage === 'continuity') return Boolean(memory?.outcomeMemory?.nextRuntimeState || continuity);
      return false;
    }),
    updatedAt: new Date().toISOString()
  };
  setSession(WORKSPACE_STATE_KEY, state);
  return state;
}

export function markWorkspaceStage(currentStage) {
  return deriveRuntimeWorkspaceState(currentStage);
}

export function getWorkspaceOptions(currentStage) {
  const state = deriveRuntimeWorkspaceState(currentStage);
  return {
    currentStage: state.currentStage,
    completedStages: state.completedStages,
    availableStages: state.availableStages
  };
}
