import { RUNTIME_PERSISTENCE_KEYS, scheduleRuntimeSnapshot, removePersistedContract } from '../../modules/runtime-persistence.js';
import { emitRuntimeEvent } from './event-bus.js';

function storage() {
  try { return window.sessionStorage; } catch { return null; }
}

function parse(value, fallback = null) {
  if (value === null || value === undefined) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function serialize(value) {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

export function getRuntimeContract(key, fallback = null) {
  if (!key) return fallback;
  return parse(storage()?.getItem(key), fallback);
}

export function getRuntimeContractRaw(key) {
  if (!key) return null;
  return storage()?.getItem(key) ?? null;
}

export function hasRuntimeContract(key) {
  return getRuntimeContractRaw(key) !== null;
}

export function saveRuntimeContract(key, value, options = {}) {
  if (!key) throw new Error('Runtime contract key is required.');
  if (value === undefined) throw new Error(`Runtime contract ${key} cannot be undefined.`);
  const session = storage();
  if (!session) throw new Error('Session storage is unavailable.');
  session.setItem(key, serialize(value));
  scheduleRuntimeSnapshot(`kernel:set:${key}`);
  if (options.emit !== false) emitRuntimeEvent('contract.saved', { key, value });
  return value;
}

export function removeRuntimeContract(key, options = {}) {
  if (!key) return false;
  const session = storage();
  const existed = session?.getItem(key) !== null;
  session?.removeItem(key);
  removePersistedContract(key);
  scheduleRuntimeSnapshot(`kernel:remove:${key}`);
  if (existed && options.emit !== false) emitRuntimeEvent('contract.removed', { key });
  return existed;
}

export function listRuntimeContracts() {
  return RUNTIME_PERSISTENCE_KEYS.reduce((contracts, key) => {
    const value = getRuntimeContract(key, undefined);
    if (value !== undefined) contracts[key] = value;
    return contracts;
  }, {});
}

export const RuntimeContractManager = Object.freeze({
  get: getRuntimeContract,
  getRaw: getRuntimeContractRaw,
  has: hasRuntimeContract,
  save: saveRuntimeContract,
  remove: removeRuntimeContract,
  list: listRuntimeContracts,
  keys: RUNTIME_PERSISTENCE_KEYS
});
