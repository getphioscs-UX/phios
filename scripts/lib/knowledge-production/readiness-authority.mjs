import fs from 'node:fs/promises';
import path from 'node:path';
import { resolveProductionState } from './production-resolver.mjs';

export const UNIVERSAL_READINESS_AUTHORITY = 'canonical-node-registry+production-readiness-record';
export const HISTORICAL_BOOK_I_PILOT_PATH = 'content/knowledge/editorial/c3/universal-production-readiness-index.json';

export async function loadHistoricalBookIPilot(root) {
  const value = JSON.parse(await fs.readFile(path.join(root, HISTORICAL_BOOK_I_PILOT_PATH), 'utf8'));
  return Object.freeze({ ...value, authority: 'historical_read_only', mayLimitUniversalRuntime: false });
}

export async function resolveUniversalReadiness(root, record) {
  return resolveProductionState(root, record.node, {
    publicationContext: record.publicationContext,
    readiness: record.binding?.productionState?.readiness || undefined
  });
}
