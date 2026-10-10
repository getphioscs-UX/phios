import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createMemoryDriver
} from '../functions/runtime/persistence/index.js';
import {
  RECOVERY_CONTRACT_ID,
  assertRecoveryService,
  createRecoveryService
} from '../functions/runtime/recovery/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => fs.readFileSync(
  path.join(root, relativePath),
  'utf8'
);
const readJson = relativePath => JSON.parse(read(relativePath));

function sequenceClock() {
  let tick = 0;
  return () => new Date(
    Date.UTC(2026, 6, 23, 0, 0, tick++)
  ).toISOString();
}

function sequenceIds() {
  let count = 0;
  return prefix => `${prefix}_recovery_${String(++count).padStart(3, '0')}`;
}

const clock = sequenceClock();
const createId = sequenceIds();
const persistence = createMemoryDriver({ clock, createId });
const recovery = assertRecoveryService(
  createRecoveryService({ persistence, clock, createId })
);

assert.equal(recovery.contract, RECOVERY_CONTRACT_ID);

await persistence.create({
  runtime_id: 'runtime_recovery_a',
  user_id: 'user_a',
  current_stage: 'entry_complete',
  state: {
    stable_value: 'must remain',
    conversation: [{
      message_id: 'message_1',
      role: 'user',
      content: 'Preserve this input.'
    }]
  }
});

const baselineTime = '2026-07-23T00:00:01.000Z';
await persistence.saveSnapshot({
  snapshot_id: 'snapshot_baseline',
  runtime_id: 'runtime_recovery_a',
  stage: 'entry_complete',
  state: {
    stable_value: 'must remain',
    conversation: [{
      message_id: 'message_1',
      role: 'user',
      content: 'Preserve this input.'
    }]
  },
  created_at: baselineTime
});

const session = await recovery.recoverSession({
  runtime_id: 'runtime_recovery_a'
});
assert.equal(session.runtime_id, 'runtime_recovery_a');
assert.equal(session.current_stage, 'entry_complete');
assert.equal(session.latest_snapshot.snapshot_id, 'snapshot_baseline');
assert.equal(session.conversation[0].content, 'Preserve this input.');
assert.equal(session.provider_called, false);
assert.equal(session.regenerated, false);

// The Event deliberately shares the Snapshot timestamp. Recovery must not
// miss it merely because a timestamp-only `>` query would exclude it.
await persistence.appendEvent({
  event_id: 'event_reading_same_tick',
  runtime_id: 'runtime_recovery_a',
  event_type: 'reading.generated',
  payload: {
    current_stage: 'reading_ready',
    state_patch: {
      reading_id: 'reading_recovered'
    }
  },
  created_at: baselineTime
});

const partial = await recovery.recoverPartialWrite({
  runtime_id: 'runtime_recovery_a'
});
assert.equal(partial.status, 'partial_write_recovered');
assert.equal(partial.current_stage, 'reading_ready');
assert.deepEqual(partial.replayed_event_ids, [
  'event_reading_same_tick'
]);
assert.equal(
  partial.latest_snapshot.state.stable_value,
  'must remain'
);
assert.equal(
  partial.latest_snapshot.state.reading_id,
  'reading_recovered'
);
assert(
  partial.latest_snapshot.state.recovery.event_cursor.event_id
);

const noSecondReplay = await recovery.recoverPartialWrite({
  runtime_id: 'runtime_recovery_a'
});
assert.equal(noSecondReplay.status, 'up_to_date');
assert.deepEqual(noSecondReplay.replayed_event_ids, []);

let providerCalls = 0;
const providerSuccess = await recovery.executeProviderOperation({
  runtime_id: 'runtime_recovery_a',
  request_id: 'provider_request_success',
  stage: 'reading_ready',
  provider: 'workers_ai',
  input: { retained: 'provider input' },
  async run() {
    providerCalls += 1;
    return { reading_id: 'reading_provider_a' };
  }
});
assert.equal(providerSuccess.success, true);
assert.equal(providerSuccess.source, 'provider');
assert.equal(providerCalls, 1);

const providerCached = await recovery.executeProviderOperation({
  runtime_id: 'runtime_recovery_a',
  request_id: 'provider_request_success',
  stage: 'reading_ready',
  provider: 'workers_ai',
  async run() {
    providerCalls += 1;
    return { should_not_run: true };
  }
});
assert.equal(providerCached.source, 'recovery_cache');
assert.equal(providerCached.output.reading_id, 'reading_provider_a');
assert.equal(providerCalls, 1);

let failedProviderCalls = 0;
const providerFailure = await recovery.executeProviderOperation({
  runtime_id: 'runtime_recovery_a',
  request_id: 'provider_request_failure',
  stage: 'reading_ready',
  provider: 'openai',
  async run() {
    failedProviderCalls += 1;
    const error = new Error('Sensitive provider detail is not persisted.');
    error.code = 'provider_timeout';
    throw error;
  }
});
assert.equal(providerFailure.source, 'provider_failure');
assert.equal(providerFailure.state_preserved, true);
assert.equal(providerFailure.automatic_retry, false);
assert.equal(failedProviderCalls, 1);

const guardedFailure = await recovery.executeProviderOperation({
  runtime_id: 'runtime_recovery_a',
  request_id: 'provider_request_failure',
  stage: 'reading_ready',
  provider: 'openai',
  async run() {
    failedProviderCalls += 1;
  }
});
assert.equal(guardedFailure.source, 'recovery_guard');
assert.equal(guardedFailure.status, 'failed');
assert.equal(failedProviderCalls, 1);

const recoveredAfterFailure = await recovery.recoverSession({
  runtime_id: 'runtime_recovery_a'
});
assert.equal(
  recoveredAfterFailure.state.stable_value,
  'must remain'
);
assert.equal(
  recoveredAfterFailure.conversation[0].content,
  'Preserve this input.'
);
assert.equal(
  recoveredAfterFailure.provider_requests.provider_request_failure
    .failure_code,
  'provider_timeout'
);
assert.equal(
  JSON.stringify(recoveredAfterFailure.state).includes(
    'Sensitive provider detail'
  ),
  false
);

const registry = readJson('content/registry/runtime-recovery.json');
assert.equal(registry.id, RECOVERY_CONTRACT_ID);
assert.equal(registry.status, 'stable');
assert.equal(
  registry.page_refresh_recovery.automatic_regeneration,
  false
);
assert.equal(
  registry.page_refresh_recovery
    .automatic_duplicate_provider_call,
  false
);

const browserPersistence = read(
  'assets/js/modules/runtime-persistence.js'
);
for (const key of [
  'phiOSReadingRequestState',
  'phiOSNavigationRequestState'
]) {
  assert(
    browserPersistence.includes(key),
    `Browser recovery does not persist ${key}.`
  );
}

const readingLoader = read('assets/js/modules/reading-loader.js');
for (const token of [
  'canReuseStoredReading',
  "source: 'session_cache'",
  "reason: 'reading_request_interrupted'",
  'automaticProviderRetry: false'
]) {
  assert(
    readingLoader.includes(token),
    `Reading refresh recovery is missing: ${token}`
  );
}

const navigationLoader = read(
  'assets/js/modules/navigation-loader.js'
);
for (const token of [
  'canReuseStoredNavigation',
  "source: 'session_cache'",
  "reason: 'navigation_request_interrupted'",
  'automaticRetry: false'
]) {
  assert(
    navigationLoader.includes(token),
    `Navigation refresh recovery is missing: ${token}`
  );
}

const d1Driver = read(
  'functions/runtime/persistence/drivers/d1-driver.js'
);
assert(d1Driver.includes('async listEvents'));
assert(d1Driver.includes('FROM runtime_events'));

assert(
  fs.existsSync(path.join(
    root,
    'docs/runtime/M2-W5-RECOVERY.md'
  ))
);

console.log(
  '✓ M2-W5 Session, Partial Write, Provider Failure, and Page Refresh ' +
  'Recovery checks passed.'
);
