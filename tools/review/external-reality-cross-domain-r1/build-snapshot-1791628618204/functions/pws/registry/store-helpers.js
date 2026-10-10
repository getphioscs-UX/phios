import { RegistryValidationError, requiredText } from './universal-registry-schema.js';

export const defaultClock = () => new Date().toISOString();
export const defaultId = prefix =>
  `${prefix}_${crypto.randomUUID().replaceAll('-', '')}`;

export function assertDb(db) {
  if (!db?.prepare) {
    throw new RegistryValidationError('RUNTIME_DB D1 binding is required.', {
      binding: 'RUNTIME_DB'
    });
  }
  return db;
}

export async function all(statement) {
  const result = await statement.all();
  return Array.isArray(result) ? result : (result?.results || []);
}

export function boundedLimit(value, fallback = 50) {
  const number = Number(value ?? fallback);
  return Number.isInteger(number) && number > 0 ? Math.min(number, 100) : fallback;
}

export function id(value, field = 'object_id') {
  return requiredText(value, field);
}
