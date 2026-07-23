import {
  PERSISTENCE_DRIVERS,
  PERSISTENCE_ERROR_CODES,
  PersistenceContractError,
  assertPersistenceDriver
} from './persistence-contract.js';
import { createMemoryDriver } from './drivers/memory-driver.js';
import { createLocalDriver } from './drivers/local-driver.js';
import { createD1Driver } from './drivers/d1-driver.js';

const environmentAliases = Object.freeze({
  test: 'test',
  testing: 'test',
  development: 'development',
  dev: 'development',
  local: 'development',
  production: 'production',
  prod: 'production'
});

export function resolvePersistenceEnvironment(options = {}) {
  const env = options.env || {};
  const processEnvironment = globalThis.process?.env || {};
  const supplied = String(
    options.environment ||
    env.PHIOS_ENV ||
    env.ENVIRONMENT ||
    processEnvironment.PHIOS_ENV ||
    processEnvironment.NODE_ENV ||
    ''
  ).trim().toLowerCase();

  if (!supplied && env.RUNTIME_DB) return 'production';
  if (!supplied) return 'development';

  const resolved = environmentAliases[supplied];
  if (!resolved) {
    throw new PersistenceContractError(
      PERSISTENCE_ERROR_CODES.INVALID_INPUT,
      `Unsupported persistence environment: ${supplied}`,
      { environment: supplied }
    );
  }
  return resolved;
}

export function selectPersistenceDriver(options = {}) {
  if (options.driver) return assertPersistenceDriver(options.driver);

  const environment = resolvePersistenceEnvironment(options);
  const driverName = PERSISTENCE_DRIVERS[environment];
  const shared = {
    clock: options.clock,
    createId: options.createId
  };

  if (driverName === 'memory') {
    return createMemoryDriver(shared);
  }
  if (driverName === 'local') {
    return createLocalDriver({
      ...shared,
      storage: options.storage,
      storageKey: options.storageKey
    });
  }
  if (driverName === 'd1') {
    return createD1Driver({
      ...shared,
      db: options.env?.RUNTIME_DB
    });
  }

  throw new PersistenceContractError(
    PERSISTENCE_ERROR_CODES.INVALID_DRIVER,
    `No persistence driver is registered for: ${environment}`,
    { environment }
  );
}

export function createPersistenceRouter(options = {}) {
  const environment = resolvePersistenceEnvironment(options);
  const driver = selectPersistenceDriver({ ...options, environment });
  assertPersistenceDriver(driver);

  return Object.freeze({
    contract: 'phi-os.runtime-persistence.v1',
    environment,
    driver: driver.name,
    create: input => driver.create(input),
    read: runtimeId => driver.read(runtimeId),
    update: (runtimeId, input) => driver.update(runtimeId, input),
    delete: runtimeId => driver.delete(runtimeId),
    list: input => driver.list(input),
    appendEvent: input => driver.appendEvent(input),
    listEvents: (runtimeId, input) => driver.listEvents(runtimeId, input),
    saveSnapshot: input => driver.saveSnapshot(input),
    loadSnapshot: (runtimeId, input) =>
      driver.loadSnapshot(runtimeId, input)
  });
}

export default createPersistenceRouter;
