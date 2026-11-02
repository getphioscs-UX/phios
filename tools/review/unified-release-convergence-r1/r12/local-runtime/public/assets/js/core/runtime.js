import { createRuntimeId } from './ids.js';

export function createRuntimeEntity() {
  const now = new Date().toISOString();
  return {
    schemaVersion: '1.0',
    runtimeEntityId: createRuntimeId('rt'),
    status: 'active_session',
    createdAt: now,
    updatedAt: now,
    consent: { storageAllowed: false, reconstructionAllowed: true }
  };
}
