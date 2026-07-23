import assert from 'node:assert/strict';
import {
  PERSISTENCE_CONTRACT_ID,
  PERSISTENCE_METHODS,
  PersistenceContractError,
  assertPersistenceDriver,
  createD1Driver,
  createLocalDriver,
  createMemoryDriver,
  createPersistenceRouter,
  resolvePersistenceEnvironment
} from '../functions/runtime/persistence/index.js';

function sequenceClock() {
  let tick = 0;
  return () => new Date(Date.UTC(2026, 6, 23, 0, 0, tick++)).toISOString();
}

function sequenceId(prefix) {
  sequenceId.count = (sequenceId.count || 0) + 1;
  return `${prefix}_test_${sequenceId.count}`;
}

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

async function exerciseDriver(driver) {
  assertPersistenceDriver(driver);
  for (const method of PERSISTENCE_METHODS) {
    assert.equal(typeof driver[method], 'function');
  }

  const created = await driver.create({
    runtime_id: 'runtime_a',
    user_id: 'user_a',
    current_stage: 'entry_complete',
    state: { conversation: ['preserved'] }
  });
  assert.equal(created.runtime_id, 'runtime_a');
  assert.equal(created.status, 'active');

  await assert.rejects(
    () => driver.create({ runtime_id: 'runtime_a' }),
    error => error instanceof PersistenceContractError &&
      error.code === 'persistence_conflict'
  );

  const read = await driver.read('runtime_a');
  assert.deepEqual(read.state, { conversation: ['preserved'] });

  const updated = await driver.update('runtime_a', {
    current_stage: 'reading_ready',
    state: { conversation: ['preserved'], reading_id: 'reading_a' }
  });
  assert.equal(updated.current_stage, 'reading_ready');

  const event = await driver.appendEvent({
    runtime_id: 'runtime_a',
    event_type: 'reading.generated',
    payload: { reading_id: 'reading_a' }
  });
  assert.equal(event.runtime_id, 'runtime_a');
  assert.equal(event.event_version, '1.0.0');

  const firstSnapshot = await driver.saveSnapshot({
    runtime_id: 'runtime_a',
    stage: 'reading_ready',
    state: { revision: 1 }
  });
  const secondSnapshot = await driver.saveSnapshot({
    runtime_id: 'runtime_a',
    stage: 'navigation_ready',
    state: { revision: 2 }
  });
  assert.notEqual(firstSnapshot.snapshot_id, secondSnapshot.snapshot_id);

  const latest = await driver.loadSnapshot('runtime_a');
  assert.equal(latest.stage, 'navigation_ready');
  const selected = await driver.loadSnapshot('runtime_a', {
    snapshot_id: firstSnapshot.snapshot_id
  });
  assert.equal(selected.stage, 'reading_ready');

  const listed = await driver.list({
    user_id: 'user_a',
    current_stage: 'reading_ready'
  });
  assert.equal(listed.length, 1);

  assert.equal(await driver.delete('runtime_a'), true);
  assert.equal(await driver.read('runtime_a'), null);
  assert.equal(await driver.loadSnapshot('runtime_a'), null);
  assert.equal(await driver.delete('runtime_a'), false);
}

const memory = createMemoryDriver({
  clock: sequenceClock(),
  createId: sequenceId
});
await exerciseDriver(memory);

const storage = createStorage();
const local = createLocalDriver({
  storage,
  storageKey: 'm2-w2-test',
  clock: sequenceClock(),
  createId: sequenceId
});
await local.create({
  runtime_id: 'runtime_local',
  current_stage: 'reconstruction_ready',
  state: { retained: true }
});
const reloadedLocal = createLocalDriver({
  storage,
  storageKey: 'm2-w2-test',
  clock: sequenceClock(),
  createId: sequenceId
});
assert.deepEqual(
  (await reloadedLocal.read('runtime_local')).state,
  { retained: true }
);

const calls = [];
function createRecordingD1() {
  return {
    prepare(sql) {
      const call = { sql: sql.replace(/\s+/g, ' ').trim(), values: [] };
      calls.push(call);
      const statement = {
        bind(...values) {
          call.values = values;
          return statement;
        },
        async run() {
          return { success: true, meta: { changes: 1 } };
        },
        async first() {
          return null;
        },
        async all() {
          return { success: true, results: [] };
        }
      };
      return statement;
    }
  };
}

const d1 = createD1Driver({
  db: createRecordingD1(),
  clock: sequenceClock(),
  createId: sequenceId
});
await d1.create({
  runtime_id: 'runtime_d1',
  current_stage: 'entry_collecting',
  state: { safe: true }
});
assert(calls[0].sql.includes('INSERT INTO runtimes'));
assert.equal(calls[0].values[0], 'runtime_d1');
assert.equal(calls[0].values[5], JSON.stringify({ safe: true }));

assert.equal(resolvePersistenceEnvironment({ environment: 'test' }), 'test');
assert.equal(
  resolvePersistenceEnvironment({ environment: 'development' }),
  'development'
);
assert.equal(
  resolvePersistenceEnvironment({ env: { RUNTIME_DB: createRecordingD1() } }),
  'production'
);

const testRouter = createPersistenceRouter({ environment: 'test' });
assert.equal(testRouter.contract, PERSISTENCE_CONTRACT_ID);
assert.equal(testRouter.driver, 'memory');

const developmentRouter = createPersistenceRouter({
  environment: 'development',
  storage: createStorage()
});
assert.equal(developmentRouter.driver, 'local');

const productionRouter = createPersistenceRouter({
  environment: 'production',
  env: { RUNTIME_DB: createRecordingD1() }
});
assert.equal(productionRouter.driver, 'd1');

assert.throws(
  () => createPersistenceRouter({ environment: 'production', env: {} }),
  error => error instanceof PersistenceContractError &&
    error.code === 'persistence_binding_missing'
);
assert.throws(
  () => assertPersistenceDriver({ name: 'incomplete', create() {} }),
  /missing method: read/
);

console.log(
  '✓ M2-W2 Persistence Contract, Router, Memory, Local, D1, and ' +
  'environment selection checks passed.'
);
