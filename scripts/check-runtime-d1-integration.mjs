import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { applyRuntimeMigrations } from
  '../functions/runtime/migrations/migration-runner.js';
import { createPersistenceRouter } from
  '../functions/runtime/persistence/persistence-router.js';
import { createRecoveryService } from
  '../functions/runtime/recovery/recovery-service.js';
import { createTimelineService } from
  '../functions/runtime/timeline/timeline-service.js';
import { createD1LineageStore } from
  '../functions/runtime/lineage/stores/d1-lineage-store.js';
import { createLineageRevisionService } from
  '../functions/runtime/lineage/lineage-revision-service.js';
import { createPrivacyService } from
  '../functions/runtime/security/privacy-service.js';
import { onRequestGet as infrastructureHealth } from
  '../functions/api/runtime-infrastructure-health.js';
import {
  createSqliteD1Adapter,
  loadRuntimeMigrations
} from './runtime-migration-loader.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

function sequenceClock() {
  let tick = 0;
  return () => new Date(
    Date.UTC(2026, 6, 23, 13, 0, tick++)
  ).toISOString();
}

function sequenceIds() {
  let value = 0;
  return prefix => `${prefix}_infra_${String(++value).padStart(3, '0')}`;
}

const memoryParity = createPersistenceRouter({
  environment: 'test'
});
await memoryParity.create({
  runtime_id: 'runtime_event_order',
  current_stage: 'entry_collecting',
  state: {}
});
const sameEventTime = '2026-07-23T12:59:59.000Z';
await memoryParity.appendEvent({
  event_id: 'event_order_002',
  runtime_id: 'runtime_event_order',
  event_type: 'reading.generated',
  payload: {},
  created_at: sameEventTime
});
await memoryParity.appendEvent({
  event_id: 'event_order_001',
  runtime_id: 'runtime_event_order',
  event_type: 'entry.completed',
  payload: {},
  created_at: sameEventTime
});
assert.deepEqual(
  (await memoryParity.listEvents('runtime_event_order'))
    .map(event => event.event_id),
  ['event_order_001', 'event_order_002']
);

const database = new DatabaseSync(':memory:');
database.exec('PRAGMA foreign_keys = ON;');
const db = createSqliteD1Adapter(database);
const { migrations } = loadRuntimeMigrations(root);
const migrationResult = await applyRuntimeMigrations({
  db,
  migrations,
  now: sequenceClock()
});
assert.equal(migrationResult.applied.length, migrations.length);
assert.equal(
  database.prepare(
    'SELECT COUNT(*) AS count FROM runtime_migration_history'
  ).get().count,
  migrations.length
);

const unboundHealth = await infrastructureHealth({ env: {} });
assert.equal(unboundHealth.status, 503);
const unboundBody = await unboundHealth.json();
assert.equal(unboundBody.success, false);
assert.equal(
  unboundBody.checks.runtime_database_bound,
  false
);

const health = await infrastructureHealth({
  env: { RUNTIME_DB: db }
});
assert.equal(health.status, 200);
const healthBody = await health.json();
assert.equal(healthBody.success, true);
assert.equal(healthBody.checks.runtime_schema_ready, true);
assert.equal(healthBody.checks.migration_history_ready, true);
assert.equal(
  healthBody.migration_history_source,
  'runtime_migration_history'
);

const clock = sequenceClock();
const createId = sequenceIds();
database.prepare(`
  INSERT INTO runtime_users (
    user_id, status, created_at, updated_at
  ) VALUES ('user_infra', 'active', ?1, ?1)
`).run(clock());

const persistence = createPersistenceRouter({
  environment: 'production',
  env: { RUNTIME_DB: db },
  clock,
  createId
});
assert.equal(persistence.driver, 'd1');
await persistence.create({
  runtime_id: 'runtime_infra_root',
  user_id: 'user_infra',
  current_stage: 'entry_complete',
  state: {
    stable_value: 'preserve',
    conversation: [{
      message_id: 'message_infra_1',
      role: 'user',
      content: 'Owner-controlled Runtime content.'
    }]
  }
});
assert.equal(
  (await persistence.read('runtime_infra_root')).user_id,
  'user_infra'
);
assert.equal(
  (await persistence.list({ user_id: 'user_infra' })).length,
  1
);

const baseline = clock();
await persistence.saveSnapshot({
  snapshot_id: 'snapshot_infra_baseline',
  runtime_id: 'runtime_infra_root',
  stage: 'entry_complete',
  state: { stable_value: 'preserve' },
  created_at: baseline
});
const timeline = createTimelineService({ persistence, clock, createId });
await timeline.append({
  event_id: 'event_infra_reading',
  runtime_id: 'runtime_infra_root',
  event_type: 'reading.generated',
  payload: {
    current_stage: 'reading_ready',
    state_patch: { reading_id: 'reading_infra' }
  },
  created_at: baseline
});

const recovery = createRecoveryService({
  persistence,
  clock,
  createId
});
const recovered = await recovery.recoverPartialWrite({
  runtime_id: 'runtime_infra_root'
});
assert.equal(recovered.status, 'partial_write_recovered');
assert.equal(recovered.current_stage, 'reading_ready');
assert.equal(
  recovered.latest_snapshot.state.stable_value,
  'preserve'
);
assert.equal(
  recovered.latest_snapshot.state.reading_id,
  'reading_infra'
);

const projected = await timeline.project({
  runtime_id: 'runtime_infra_root',
  locale: 'en'
});
assert.equal(projected.guardrails.raw_payload_exposed, false);
assert.equal(
  projected.entries.some(entry =>
    entry.type === 'reading.generated'
  ),
  true
);

const lineageStore = createD1LineageStore({
  db,
  clock,
  createId
});
const lineage = createLineageRevisionService({
  persistence,
  store: lineageStore,
  clock,
  createId,
  timeline
});
const edited = await lineage.editRuntime({
  runtime_id: 'runtime_infra_root',
  reason: 'Integrated D1 edit',
  changes: { evidence_status: 'revised' },
  user_initiated: true
});
assert.equal(edited.same_runtime, true);
assert.equal(
  (await lineageStore.listRevisions('runtime_infra_root')).length,
  1
);
const branched = await lineage.branchRuntime({
  parent_runtime_id: 'runtime_infra_root',
  child_runtime_id: 'runtime_infra_child',
  reason: 'Integrated D1 branch',
  user_initiated: true
});
assert.equal(branched.inherited_as_fact, false);
assert.equal(
  (await lineageStore.listChildLinks('runtime_infra_root')).length,
  1
);
const viewer = await lineage.buildViewerData({
  runtime_id: 'runtime_infra_root'
});
assert.equal(viewer.nodes.length, 2);
assert.equal(viewer.edges.length, 1);
assert.equal(viewer.guardrails.raw_runtime_state_exposed, false);

database.prepare(`
  INSERT INTO runtime_artifacts (
    artifact_id, runtime_id, artifact_type, stage, payload,
    schema_version, created_at, updated_at
  ) VALUES (
    'artifact_infra_child', 'runtime_infra_child', 'test',
    'entry_collecting', '{}', 'phi-os.runtime-artifact.v1', ?1, ?1
  )
`).run(clock());

const privacy = createPrivacyService({
  persistence,
  lineageStore,
  clock
});
const exported = await privacy.exportData({
  user_id: 'user_infra',
  user_initiated: true
});
assert.equal(exported.runtime_count, 2);
assert.equal(exported.classification, 'private');
const deleted = await privacy.deleteRuntime({
  runtime_id: 'runtime_infra_child',
  user_id: 'user_infra',
  user_initiated: true
});
assert.equal(deleted.deleted, true);
for (const table of [
  'runtime_events',
  'runtime_snapshots',
  'runtime_revisions',
  'runtime_artifacts'
]) {
  assert.equal(
    database.prepare(
      `SELECT COUNT(*) AS count FROM ${table} WHERE runtime_id = ?1`
    ).get('runtime_infra_child').count,
    0
  );
}
assert.equal(
  database.prepare(`
    SELECT COUNT(*) AS count
    FROM runtime_lineages
    WHERE parent_runtime_id = 'runtime_infra_child'
       OR child_runtime_id = 'runtime_infra_child'
  `).get().count,
  0
);
assert.notEqual(await persistence.read('runtime_infra_root'), null);

const integrity = database.prepare(
  'PRAGMA integrity_check'
).get().integrity_check;
assert.equal(integrity, 'ok');
database.close();

const registry = JSON.parse(read(
  'content/registry/runtime-infrastructure-tests.json'
));
assert.equal(registry.status, 'acceptance_ready');
assert.equal(registry.tests.d1_integration.automated, true);
assert.equal(registry.tests.production_smoke.live_run_required, true);

console.log(
  '✓ M2-W9 D1 integration passed: Migration → Persistence → Recovery → ' +
  'Timeline → Lineage → Privacy.'
);
