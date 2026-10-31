import {
  initializeNewRuntimeEntry,
  initializeReadingRevision
} from '../../modules/runtime-revision-initializer.js';
import { emitRuntimeEvent } from './event-bus.js';

export function commitRuntimeRevision(options = {}) {
  const revision = initializeReadingRevision(options);
  emitRuntimeEvent('revision.committed', { revision });
  return revision;
}

export function initializeRuntimeEntry(options = {}) {
  const initialization = initializeNewRuntimeEntry(options);
  emitRuntimeEvent('entry.initialized', { initialization });
  return initialization;
}

export const RuntimeRevisionManager = Object.freeze({
  commit: commitRuntimeRevision,
  initializeEntry: initializeRuntimeEntry
});
