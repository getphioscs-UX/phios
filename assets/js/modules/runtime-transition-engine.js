import { SESSION, getSession, safeJSON, setSession } from '../shared.js';
import { REVIEW_KEY, MEMORY_KEY, CONTINUITY_KEY, WORKSPACE_STATE_KEY } from './runtime-workspace-state.js';

export const TRANSITION_EXECUTION_KEY = 'phiOSRuntimeTransitionExecution';
export const RUNTIME_HISTORY_KEY = 'phiOSRuntimeHistory';
export const READING_REVISION_REQUEST_KEY = 'phiOSReadingRevisionRequest';
export const ENTRY_CONTINUITY_HANDOFF_KEY = 'phiOSEntryContinuityHandoff';
export const REVIEW_CONTINUATION_KEY = 'phiOSReviewContinuation';

const ROUTES = Object.freeze({
  continue_observation: '/reality-review.html',
  continue_selected_path: '/reality-navigation.html',
  return_to_reading: '/reality-reading.html?mode=revision',
  choose_another_path: '/reality-navigation.html?mode=reselect',
  start_new_entry: '/reality-entry.html?mode=new-runtime',
  professional_review: '/reality-navigation.html#professional',
  remain_open: '/my-reality.html#memory'
});

const ACTIVE_RUNTIME_KEYS = Object.freeze([
  SESSION.initial,
  SESSION.entryState,
  SESSION.runtimeEntity,
  SESSION.entry,
  SESSION.reconstruction,
  SESSION.reconstructionInquiry,
  SESSION.readingInput,
  SESSION.reading,
  SESSION.navigationInput,
  SESSION.navigation,
  REVIEW_KEY,
  MEMORY_KEY,
  CONTINUITY_KEY,
  WORKSPACE_STATE_KEY
]);

function cleanText(value) {
  return typeof value === 'string' ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';
}

function readJson(key) {
  return safeJSON(getSession(key), null);
}

function createId(prefix) {
  return `${prefix}_${new Date().toISOString().slice(0, 10).replaceAll('-', '')}_${crypto.randomUUID().slice(0, 8)}`;
}

function snapshotCurrentRuntime(continuity) {
  return {
    archivedAt: new Date().toISOString(),
    runtimeEntityId: cleanText(continuity.runtimeEntityId),
    runtimeEntryId: cleanText(continuity.sourceRuntimeEntryId),
    sourceRuntimeId: cleanText(continuity.sourceRuntimeId),
    sourceMemoryId: cleanText(continuity.sourceMemoryId),
    contracts: Object.fromEntries(ACTIVE_RUNTIME_KEYS.map(key => [key, readJson(key)]).filter(([, value]) => value !== null)),
    appendOnly: true
  };
}

function appendRuntimeHistory(snapshot) {
  const history = readJson(RUNTIME_HISTORY_KEY);
  const records = Array.isArray(history) ? history : [];
  records.push(snapshot);
  setSession(RUNTIME_HISTORY_KEY, records);
}

function preserveNavigationHistoryAndClearSelection() {
  const navigation = readJson(SESSION.navigation);
  if (!navigation) return;
  const history = Array.isArray(navigation.selectionHistory) ? [...navigation.selectionHistory] : [];
  if (navigation.navigationState?.selectedPathId) {
    history.push({
      selectedPathId: navigation.navigationState.selectedPathId,
      selectedAt: navigation.navigationState.selectedAt || '',
      clearedAt: new Date().toISOString(),
      source: 'runtime_transition_engine'
    });
  }
  navigation.selectionHistory = history;
  navigation.selectedPath = null;
  navigation.availablePaths = Array.isArray(navigation.availablePaths)
    ? navigation.availablePaths.map(path => ({ ...path, status: 'available' }))
    : [];
  navigation.navigationState = {
    ...(navigation.navigationState || {}),
    status: 'awaiting_user_choice',
    selectedPathId: null,
    selectedAt: '',
    changedAt: new Date().toISOString(),
    revision: Number(navigation.navigationState?.revision || 0) + 1,
    reviewGate: { ready: false, blockers: ['selected_path_required'], preparedAt: '' },
    professionalConsent: null,
    automaticSelection: false,
    userChoiceRequired: true
  };
  setSession(SESSION.navigation, navigation);
  sessionStorage.removeItem(REVIEW_KEY);
  sessionStorage.removeItem(MEMORY_KEY);
  sessionStorage.removeItem(CONTINUITY_KEY);
}

function prepareReadingRevision(continuity) {
  setSession(READING_REVISION_REQUEST_KEY, {
    schemaVersion: 'phi-os.reading-revision-request.v1',
    requestId: createId('reading_revision'),
    requestedAt: new Date().toISOString(),
    sourceRuntimeId: continuity.sourceRuntimeId,
    sourceRuntimeEntryId: continuity.sourceRuntimeEntryId,
    sourceMemoryId: continuity.sourceMemoryId,
    unresolvedReality: continuity.sourceMemory?.unresolvedReality || [],
    mode: 'new_revision',
    historicalOverwrite: false,
    userInitiated: true
  });
}

function prepareReviewContinuation(continuity, mode) {
  setSession(REVIEW_CONTINUATION_KEY, {
    schemaVersion: 'phi-os.review-continuation.v1',
    preparedAt: new Date().toISOString(),
    mode,
    sourceRuntimeId: continuity.sourceRuntimeId,
    sourceMemoryId: continuity.sourceMemoryId,
    preservesSelectedPath: mode === 'continue_selected_path',
    preservesObservationScope: mode === 'continue_observation',
    userInitiated: true
  });
}

function prepareNewEntry(continuity) {
  const snapshot = snapshotCurrentRuntime(continuity);
  appendRuntimeHistory(snapshot);
  setSession(ENTRY_CONTINUITY_HANDOFF_KEY, {
    schemaVersion: 'phi-os.entry-continuity-handoff.v1',
    handoffId: createId('entry_handoff'),
    createdAt: new Date().toISOString(),
    previousRuntimeId: continuity.sourceRuntimeId,
    previousRuntimeEntryId: continuity.sourceRuntimeEntryId,
    sourceMemoryId: continuity.sourceMemoryId,
    unresolvedReality: continuity.sourceMemory?.unresolvedReality || [],
    createsRuntimeAutomatically: false,
    historicalOverwrite: false,
    userInitiated: true
  });
  ACTIVE_RUNTIME_KEYS.forEach(key => sessionStorage.removeItem(key));
}

export function validateRuntimeTransitionExecution(continuity = {}) {
  const blockers = [];
  const choice = cleanText(continuity.userChoice?.nextRuntimeState);
  if (continuity.schemaVersion !== 'phi-os.continuity.v1') blockers.push('continuity_contract_required');
  if (continuity.userChoice?.confirmed !== true) blockers.push('continuity_confirmation_required');
  if (continuity.userChoice?.automaticSelection !== false) blockers.push('automatic_selection_prohibited');
  if (continuity.transition?.status !== 'prepared') blockers.push('prepared_transition_required');
  if (continuity.transition?.createsNextRuntime !== false) blockers.push('automatic_runtime_creation_prohibited');
  if (!ROUTES[choice]) blockers.push('supported_transition_required');
  if (continuity.guardrails?.historicalContractOverwriteAllowed !== false) blockers.push('historical_overwrite_prohibited');
  return { ready: blockers.length === 0, blockers, choice, route: ROUTES[choice] || null };
}

export function executeRuntimeTransition(continuity = {}, options = {}) {
  const readiness = validateRuntimeTransitionExecution(continuity);
  if (!readiness.ready) throw new Error(`Runtime transition invalid: ${readiness.blockers.join(', ')}`);

  const existing = readJson(TRANSITION_EXECUTION_KEY);
  if (existing?.continuityId === continuity.continuityId && existing?.status === 'executed') return existing;

  if (readiness.choice === 'continue_observation') prepareReviewContinuation(continuity, 'continue_observation');
  if (readiness.choice === 'continue_selected_path') prepareReviewContinuation(continuity, 'continue_selected_path');
  if (readiness.choice === 'return_to_reading') prepareReadingRevision(continuity);
  if (readiness.choice === 'choose_another_path') preserveNavigationHistoryAndClearSelection();
  if (readiness.choice === 'start_new_entry') prepareNewEntry(continuity);

  const execution = {
    schemaVersion: 'phi-os.runtime-transition-execution.v1',
    executionId: createId('transition'),
    continuityId: continuity.continuityId,
    executedAt: new Date().toISOString(),
    status: 'executed',
    action: readiness.choice,
    route: readiness.route,
    sourceRuntimeId: continuity.sourceRuntimeId,
    sourceMemoryId: continuity.sourceMemoryId,
    userInitiated: options.userInitiated !== false,
    automaticExecution: false,
    createsNextRuntime: false,
    historicalOverwrite: false
  };
  setSession(TRANSITION_EXECUTION_KEY, execution);
  return execution;
}

export function getRuntimeTransitionExecution() {
  return readJson(TRANSITION_EXECUTION_KEY);
}
