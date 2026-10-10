import {
  PERSISTENCE_ERROR_CODES,
  PersistenceContractError
} from '../persistence-contract.js';
import { createMemoryDriver } from './memory-driver.js';

export const LOCAL_PERSISTENCE_KEY = 'phiOSRuntimePersistenceV1';

const developmentStorage = new Map();
const developmentAdapter = Object.freeze({
  getItem(key) {
    return developmentStorage.has(key) ? developmentStorage.get(key) : null;
  },
  setItem(key, value) {
    developmentStorage.set(key, String(value));
  },
  removeItem(key) {
    developmentStorage.delete(key);
  }
});

function resolveStorage(provided) {
  let storage = provided;
  if (!storage) {
    try {
      storage = globalThis.localStorage;
    } catch {
      storage = null;
    }
  }
  storage ||= developmentAdapter;
  if (!storage || typeof storage.getItem !== 'function' ||
      typeof storage.setItem !== 'function') {
    throw new PersistenceContractError(
      PERSISTENCE_ERROR_CODES.STORAGE_UNAVAILABLE,
      'Local persistence requires a Storage-compatible adapter.'
    );
  }
  return storage;
}

function readState(storage, key) {
  const raw = storage.getItem(key);
  if (!raw) return { runtimes: [], events: [], snapshots: [] };
  try {
    const parsed = JSON.parse(raw);
    return {
      runtimes: Array.isArray(parsed.runtimes) ? parsed.runtimes : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
      snapshots: Array.isArray(parsed.snapshots) ? parsed.snapshots : []
    };
  } catch {
    throw new PersistenceContractError(
      PERSISTENCE_ERROR_CODES.STORAGE_UNAVAILABLE,
      'Local persistence state is not valid JSON.',
      { storage_key: key }
    );
  }
}

export function createLocalDriver(options = {}) {
  const storage = resolveStorage(options.storage);
  const storageKey = options.storageKey || LOCAL_PERSISTENCE_KEY;
  const memory = createMemoryDriver({
    initialState: readState(storage, storageKey),
    clock: options.clock,
    createId: options.createId,
    onMutation(state) {
      try {
        storage.setItem(storageKey, JSON.stringify({
          schema_version: 'phi-os.runtime-persistence-local.v1',
          ...state
        }));
      } catch {
        throw new PersistenceContractError(
          PERSISTENCE_ERROR_CODES.STORAGE_UNAVAILABLE,
          'Local persistence could not save state.',
          { storage_key: storageKey }
        );
      }
    }
  });

  return Object.freeze({
    ...memory,
    name: 'local',
    storageKey
  });
}

export default createLocalDriver;
