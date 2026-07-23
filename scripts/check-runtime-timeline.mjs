import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMemoryDriver } from
  '../functions/runtime/persistence/index.js';
import {
  RUNTIME_EVENT_TYPES,
  RUNTIME_EVENT_VERSION,
  TIMELINE_CONTRACT_ID,
  TimelineContractError,
  assertTimelineService,
  createTimelineService
} from '../functions/runtime/timeline/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => fs.readFileSync(
  path.join(root, relativePath),
  'utf8'
);
const readJson = relativePath => JSON.parse(read(relativePath));

function sequenceClock() {
  let tick = 0;
  return () => new Date(
    Date.UTC(2026, 6, 23, 1, 0, tick++)
  ).toISOString();
}

function sequenceIds() {
  let count = 0;
  return prefix => `${prefix}_timeline_${String(++count).padStart(3, '0')}`;
}

const requiredCustomerEvents = [
  'runtime.created',
  'entry.answer_added',
  'entry.completed',
  'reconstruction.generated',
  'reconstruction.revised',
  'reading.generated',
  'navigation.generated',
  'review.completed',
  'memory.committed',
  'continuity.started',
  'revision.created'
];

assert.deepEqual(
  RUNTIME_EVENT_TYPES
    .filter(event => event.customer_visible)
    .map(event => event.type),
  requiredCustomerEvents
);
for (const event of RUNTIME_EVENT_TYPES) {
  assert.equal(event.current_version, RUNTIME_EVENT_VERSION);
  assert(event.supported_versions.includes('0.9.0'));
  assert(event.supported_versions.includes('1.0.0'));
}

const clock = sequenceClock();
const createId = sequenceIds();
const persistence = createMemoryDriver({ clock, createId });
await persistence.create({
  runtime_id: 'runtime_timeline_a',
  current_stage: 'entry_collecting',
  state: { retained: true }
});
const timeline = assertTimelineService(
  createTimelineService({ persistence, clock, createId })
);
assert.equal(timeline.contract, TIMELINE_CONTRACT_ID);

for (const eventType of requiredCustomerEvents) {
  const payload = eventType === 'entry.answer_added'
    ? {
        message: {
          content: 'PRIVATE ENTRY TEXT MUST NOT ENTER PROJECTION'
        }
      }
    : eventType === 'revision.created'
      ? { revision_id: 'revision_a' }
      : {};
  const appended = await timeline.append({
    runtime_id: 'runtime_timeline_a',
    event_type: eventType,
    payload
  });
  assert.equal(appended.event_version, '1.0.0');
}

await timeline.append({
  runtime_id: 'runtime_timeline_a',
  event_type: 'provider.failed',
  payload: { failure_code: 'provider_timeout' }
});

await assert.rejects(
  () => timeline.append({
    runtime_id: 'runtime_timeline_a',
    event_type: 'runtime.not_registered'
  }),
  error => error instanceof TimelineContractError &&
    error.code === 'timeline_unknown_event_type'
);
await assert.rejects(
  () => timeline.append({
    runtime_id: 'runtime_timeline_a',
    event_type: 'reading.generated',
    event_version: '0.9.0'
  }),
  error => error instanceof TimelineContractError &&
    error.code === 'timeline_unsupported_event_version'
);

await persistence.appendEvent({
  event_id: 'event_legacy_reading',
  runtime_id: 'runtime_timeline_a',
  event_type: 'reading.generated',
  event_version: '0.9.0',
  payload: {
    currentStage: 'reading_ready',
    revisionId: 'revision_legacy'
  }
});
await persistence.appendEvent({
  event_id: 'event_unknown_future',
  runtime_id: 'runtime_timeline_a',
  event_type: 'future.unknown',
  event_version: '9.0.0',
  payload: {}
});

const customerTimeline = await timeline.read({
  runtime_id: 'runtime_timeline_a'
});
assert.equal(customerTimeline.source, 'runtime_events');
assert.equal(customerTimeline.append_only, true);
assert.equal(customerTimeline.event_count, 12);
assert.equal(
  customerTimeline.events.some(event =>
    event.event_type === 'provider.failed'
  ),
  false
);
assert.equal(customerTimeline.warnings.length, 1);
assert.equal(
  customerTimeline.warnings[0].event_id,
  'event_unknown_future'
);

const legacy = customerTimeline.events.find(event =>
  event.event_id === 'event_legacy_reading'
);
assert.equal(legacy.source_event_version, '0.9.0');
assert.equal(legacy.event_version, '1.0.0');
assert.equal(legacy.version_adapted, true);
assert.equal(legacy.payload.current_stage, 'reading_ready');
assert.equal(legacy.payload.revision_id, 'revision_legacy');

const internalTimeline = await timeline.read({
  runtime_id: 'runtime_timeline_a',
  include_internal: true
});
assert.equal(
  internalTimeline.events.some(event =>
    event.event_type === 'provider.failed'
  ),
  true
);

const onlyRevision = await timeline.read({
  runtime_id: 'runtime_timeline_a',
  event_types: ['revision.created']
});
assert.equal(onlyRevision.event_count, 1);

const english = await timeline.project({
  runtime_id: 'runtime_timeline_a',
  locale: 'en',
  generated_at: '2026-07-23T02:00:00.000Z'
});
assert.equal(english.schema_version, TIMELINE_CONTRACT_ID);
assert.equal(english.locale, 'en');
assert.equal(english.entry_count, 12);
assert.equal(english.guardrails.raw_payload_exposed, false);
assert.equal(
  JSON.stringify(english).includes('PRIVATE ENTRY TEXT'),
  false
);
assert.equal(
  english.entries.find(entry =>
    entry.type === 'revision.created'
  ).revision_id,
  'revision_a'
);

const chinese = await timeline.project({
  runtime_id: 'runtime_timeline_a',
  locale: 'zh-Hans'
});
assert.equal(chinese.locale, 'zh-Hans');
assert.equal(chinese.entries[0].title, '现实旅程已建立');

const registry = readJson('content/registry/runtime-timeline.json');
assert.equal(registry.id, TIMELINE_CONTRACT_ID);
assert.equal(registry.status, 'stable');
assert.deepEqual(registry.customer_events, requiredCustomerEvents);
assert.equal(registry.projection.raw_payload_exposed, false);
assert.equal(registry.compatibility.new_runtime_stage, false);

const recovery = read(
  'functions/runtime/recovery/recovery-service.js'
);
assert(recovery.includes('createEventAppendService'));
assert(recovery.includes('timeline.append'));

assert(
  fs.existsSync(path.join(
    root,
    'docs/runtime/M2-W6-TIMELINE.md'
  ))
);

console.log(
  '✓ M2-W6 Runtime Event Types, Append Service, Timeline Reader, ' +
  'customer Projection, and Event Versioning checks passed.'
);
