export {
  RUNTIME_CONTRACTS,
  getRuntimeContract,
  hasRuntimeContract,
  listRuntimeContracts
} from './contract-registry.js';
export {
  RUNTIME_SCHEMAS,
  getRuntimeSchema,
  getRuntimeSchemaByVersion,
  hasRuntimeSchema,
  acceptsRuntimeSchema,
  resolveRuntimeSchema
} from './schema-registry.js';
export {
  RUNTIME_VERSIONS,
  getRuntimeVersion,
  hasRuntimeVersion,
  supportsRuntimeVersion
} from './version-registry.js';
export {
  RUNTIME_MIGRATIONS,
  getRuntimeMigration,
  getRuntimeMigrationForSchema,
  hasRuntimeMigration
} from './migration-registry.js';
export {
  validateRuntimeRegistries,
  assertValidRuntimeRegistries
} from './registry-validation.js';

import { assertValidRuntimeRegistries } from './registry-validation.js';

// Cloudflare evaluates this once when the API module is loaded in an isolate.
// Invalid infrastructure fails closed before a request can mutate Runtime data.
export const RUNTIME_REGISTRY_STARTUP = assertValidRuntimeRegistries();
