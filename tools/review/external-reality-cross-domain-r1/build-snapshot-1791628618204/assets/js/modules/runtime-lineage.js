import { SESSION, cleanText, getSession, safeJSON } from '../shared.js';
import {
  REVIEW_KEY,
  MEMORY_KEY,
  CONTINUITY_KEY
} from './runtime-workspace-state.js';
import {
  RUNTIME_HISTORY_KEY,
  TRANSITION_EXECUTION_KEY
} from './runtime-transition-engine.js';
import {
  ENTRY_INITIALIZATION_KEY,
  READING_REVISION_INITIALIZATION_KEY,
  READING_REVISION_HISTORY_KEY
} from './runtime-revision-initializer.js';

export const RUNTIME_LINEAGE_SCHEMA = 'phi-os.runtime-lineage.v1';

const readJson = key => safeJSON(getSession(key), null);
const array = value => Array.isArray(value) ? value : [];
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : null;
const firstText = (...values) => values.map(cleanText).find(Boolean) || '';
const timestamp = (...values) => firstText(...values);

function runtimeIdFromContracts(contracts = {}) {
  const entity = object(contracts[SESSION.runtimeEntity]);
  const entry = object(contracts[SESSION.entry]);
  const memory = object(contracts[MEMORY_KEY]);
  return firstText(
    entity?.currentRuntimeId,
    entry?.runtimeId,
    entry?.lineage?.currentRuntimeId,
    memory?.lineage?.currentRuntimeId,
    memory?.sourceRuntimeId
  );
}

function runtimeEntryIdFromContracts(contracts = {}) {
  const entity = object(contracts[SESSION.runtimeEntity]);
  const entry = object(contracts[SESSION.entry]);
  const memory = object(contracts[MEMORY_KEY]);
  return firstText(entity?.currentRuntimeEntryId, entry?.runtimeEntryId, memory?.runtimeEntryId);
}

function runtimeEntityIdFromContracts(contracts = {}) {
  const entity = object(contracts[SESSION.runtimeEntity]);
  const entry = object(contracts[SESSION.entry]);
  const memory = object(contracts[MEMORY_KEY]);
  return firstText(entity?.runtimeEntityId, entry?.runtimeEntityId, memory?.runtimeEntityId);
}

function addEvent(events, event) {
  if (!event || !cleanText(event.type)) return;
  const normalized = {
    eventId: firstText(event.eventId) || `${event.type}_${events.length + 1}`,
    type: cleanText(event.type),
    occurredAt: timestamp(event.occurredAt),
    titleKey: firstText(event.titleKey),
    summary: firstText(event.summary),
    revision: Number(event.revision || 0) || null,
    pathTitle: firstText(event.pathTitle),
    outcome: firstText(event.outcome),
    sourceContract: firstText(event.sourceContract),
    evidenceClass: firstText(event.evidenceClass),
    historicalOverwrite: false
  };
  events.push(normalized);
}

function eventsFromContracts(contracts = {}, context = {}) {
  const events = [];
  const entry = object(contracts[SESSION.entry]);
  const reconstruction = object(contracts[SESSION.reconstruction]);
  const reading = object(contracts[SESSION.reading]);
  const navigation = object(contracts[SESSION.navigation]);
  const review = object(contracts[REVIEW_KEY]);
  const memory = object(contracts[MEMORY_KEY]);
  const continuity = object(contracts[CONTINUITY_KEY]);

  if (entry) addEvent(events, {
    type: 'entry', titleKey: 'lineage.event.entry',
    occurredAt: timestamp(entry.createdAt, entry.completedAt, entry.updatedAt),
    summary: firstText(entry.summary?.observedChange, entry.observedChange, entry.whatStartedToChange),
    sourceContract: SESSION.entry,
    evidenceClass: 'reported_experience'
  });
  if (reconstruction) addEvent(events, {
    type: 'reconstruction', titleKey: 'lineage.event.reconstruction',
    occurredAt: timestamp(reconstruction.createdAt, reconstruction.completedAt, reconstruction.updatedAt),
    sourceContract: SESSION.reconstruction
  });
  if (reading) addEvent(events, {
    type: 'reading', titleKey: 'lineage.event.reading',
    occurredAt: timestamp(reading.createdAt, reading.generatedAt, reading.updatedAt),
    revision: reading.revisionContext?.revisionNumber || context.readingRevision || 1,
    sourceContract: SESSION.reading
  });
  array(navigation?.selectionHistory).forEach((selection, index) => addEvent(events, {
    eventId: `path_history_${index + 1}`,
    type: 'path_changed', titleKey: 'lineage.event.pathChanged',
    occurredAt: timestamp(selection.clearedAt, selection.selectedAt),
    pathTitle: firstText(selection.title, selection.label, selection.selectedPathId),
    sourceContract: SESSION.navigation
  }));
  if (navigation?.navigationState?.selectedPathId || navigation?.selectedPath) addEvent(events, {
    type: 'navigation', titleKey: 'lineage.event.navigation',
    occurredAt: timestamp(navigation.navigationState?.selectedAt, navigation.createdAt, navigation.updatedAt),
    pathTitle: firstText(navigation.selectedPath?.title, navigation.selectedPath?.label, navigation.navigationState?.selectedPathId),
    revision: navigation.navigationState?.revision || 1,
    sourceContract: SESSION.navigation
  });
  if (review) addEvent(events, {
    type: 'review', titleKey: 'lineage.event.review',
    occurredAt: timestamp(review.reviewedAt, review.updatedAt, review.createdAt),
    outcome: firstText(review.reviewOutcome?.nextRuntimeState, review.outcome?.nextRuntimeState),
    sourceContract: REVIEW_KEY,
    evidenceClass: 'reported_experience'
  });
  if (memory) addEvent(events, {
    type: 'memory', titleKey: 'lineage.event.memory',
    occurredAt: timestamp(memory.createdAt, memory.preparedAt, memory.updatedAt),
    outcome: firstText(memory.outcomeMemory?.nextRuntimeState),
    sourceContract: MEMORY_KEY
  });
  if (continuity) addEvent(events, {
    type: 'continuity', titleKey: 'lineage.event.continuity',
    occurredAt: timestamp(continuity.userChoice?.confirmedAt, continuity.createdAt),
    outcome: firstText(continuity.userChoice?.nextRuntimeState),
    sourceContract: CONTINUITY_KEY
  });
  return events;
}

function activeContracts() {
  const keys = [
    SESSION.runtimeEntity, SESSION.entry, SESSION.reconstruction,
    SESSION.readingInput, SESSION.reading, SESSION.navigationInput,
    SESSION.navigation, REVIEW_KEY, MEMORY_KEY, CONTINUITY_KEY
  ];
  return Object.fromEntries(keys.map(key => [key, readJson(key)]).filter(([, value]) => value !== null));
}

function sortEvents(events) {
  return [...events].sort((a, b) => {
    if (!a.occurredAt && !b.occurredAt) return 0;
    if (!a.occurredAt) return 1;
    if (!b.occurredAt) return -1;
    return new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
  });
}

export function buildRuntimeLineage() {
  const archived = array(readJson(RUNTIME_HISTORY_KEY));
  const revisionHistory = array(readJson(READING_REVISION_HISTORY_KEY));
  const active = activeContracts();
  const entryInitialization = object(readJson(ENTRY_INITIALIZATION_KEY));
  const revisionInitialization = object(readJson(READING_REVISION_INITIALIZATION_KEY));
  const execution = object(readJson(TRANSITION_EXECUTION_KEY));

  const runtimes = archived.map((record, index) => {
    const contracts = object(record.contracts) || {};
    return {
      runtimeId: firstText(record.sourceRuntimeId, runtimeIdFromContracts(contracts), `runtime_archived_${index + 1}`),
      runtimeEntryId: firstText(record.runtimeEntryId, runtimeEntryIdFromContracts(contracts)),
      runtimeEntityId: firstText(record.runtimeEntityId, runtimeEntityIdFromContracts(contracts)),
      status: 'archived',
      startedAt: timestamp(object(contracts[SESSION.entry])?.createdAt),
      endedAt: timestamp(record.archivedAt),
      events: sortEvents(eventsFromContracts(contracts)),
      appendOnly: record.appendOnly === true
    };
  });

  const activeRuntimeId = firstText(
    entryInitialization?.runtimeId,
    runtimeIdFromContracts(active),
    object(active[SESSION.runtimeEntity])?.currentRuntimeId
  );
  const activeEvents = eventsFromContracts(active, {
    readingRevision: revisionInitialization?.revisionNumber || 1
  });

  revisionHistory
    .filter(record => !record.sourceRuntimeId || record.sourceRuntimeId === activeRuntimeId)
    .forEach(record => addEvent(activeEvents, {
      eventId: `reading_revision_${record.requestId || record.revisionNumber}`,
      type: 'reading_revision',
      titleKey: 'lineage.event.readingRevision',
      occurredAt: record.archivedAt,
      revision: Number(record.revisionNumber || 1) + 1,
      sourceContract: READING_REVISION_HISTORY_KEY
    }));

  if (execution && (!execution.sourceRuntimeId || execution.sourceRuntimeId === activeRuntimeId)) {
    addEvent(activeEvents, {
      eventId: execution.executionId,
      type: 'transition',
      titleKey: 'lineage.event.transition',
      occurredAt: execution.executedAt,
      outcome: execution.action,
      sourceContract: TRANSITION_EXECUTION_KEY
    });
  }

  if (activeRuntimeId || Object.keys(active).length) {
    runtimes.push({
      runtimeId: activeRuntimeId || 'runtime_active',
      runtimeEntryId: firstText(entryInitialization?.runtimeEntryId, runtimeEntryIdFromContracts(active)),
      runtimeEntityId: firstText(entryInitialization?.runtimeEntityId, runtimeEntityIdFromContracts(active)),
      previousRuntimeId: firstText(entryInitialization?.previousRuntimeId),
      status: 'active',
      startedAt: timestamp(entryInitialization?.initializedAt, object(active[SESSION.entry])?.createdAt),
      endedAt: '',
      events: sortEvents(activeEvents),
      appendOnly: false
    });
  }

  const runtimeEntityId = firstText(
    entryInitialization?.runtimeEntityId,
    object(active[SESSION.runtimeEntity])?.runtimeEntityId,
    runtimes.find(runtime => runtime.runtimeEntityId)?.runtimeEntityId
  );

  return {
    schemaVersion: RUNTIME_LINEAGE_SCHEMA,
    generatedAt: new Date().toISOString(),
    runtimeEntityId,
    activeRuntimeId,
    runtimeCount: runtimes.length,
    runtimes,
    guardrails: {
      appendOnlyHistory: true,
      historicalOverwriteAllowed: false,
      inferredEventsAreLabelsOnly: true,
      reportedExperienceRemainsUnverified: true
    }
  };
}
