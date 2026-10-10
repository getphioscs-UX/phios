import {
  LINEAGE_ERROR_CODES,
  LineageContractError
} from './lineage-contract.js';
import { createD1LineageStore } from
  './stores/d1-lineage-store.js';
import { createMemoryLineageStore } from
  './stores/memory-lineage-store.js';

const requiredMethods = [
  'createRevision',
  'listRevisions',
  'createLineage',
  'listParentLinks',
  'listChildLinks',
  'listLineages'
];

export function assertLineageStore(store) {
  if (!store || typeof store !== 'object') {
    throw new LineageContractError(
      LINEAGE_ERROR_CODES.STORAGE_REQUIRED,
      'Lineage Store must be an object.'
    );
  }
  for (const method of requiredMethods) {
    if (typeof store[method] !== 'function') {
      throw new LineageContractError(
        LINEAGE_ERROR_CODES.STORAGE_REQUIRED,
        `Lineage Store is missing method: ${method}`
      );
    }
  }
  return store;
}

export function selectLineageStore(options = {}) {
  if (options.store) return assertLineageStore(options.store);
  const db = options.db || options.env?.RUNTIME_DB;
  return db
    ? createD1LineageStore({ ...options, db })
    : createMemoryLineageStore(options);
}
