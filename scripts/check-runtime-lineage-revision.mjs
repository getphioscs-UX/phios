import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import {
  createMemoryDriver
} from '../functions/runtime/persistence/index.js';
import {
  LINEAGE_CONTRACT_ID,
  LineageContractError,
  assertLineageService,
  createD1LineageStore,
  createLineageRevisionService,
  createMemoryLineageStore
} from '../functions/runtime/lineage/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => fs.readFileSync(
  path.join(root, relativePath),
  'utf8'
);
const readJson = relativePath => JSON.parse(read(relativePath));

function sequenceClock() {
  let tick = 0;
  return () => new Date(
    Date.UTC(2026, 6, 23, 3, 0, tick++)
  ).toISOString();
}

function sequenceIds() {
  let count = 0;
  return prefix => `${prefix}_lineage_${String(++count).padStart(3, '0')}`;
}

const clock = sequenceClock();
const createId = sequenceIds();
const persistence = createMemoryDriver({ clock, createId });
const store = createMemoryLineageStore({ clock, createId });
const service = assertLineageService(
  createLineageRevisionService({
    persistence,
    store,
    clock,
    createId
  })
);
assert.equal(service.contract, LINEAGE_CONTRACT_ID);

await assert.rejects(
  () => service.createNewJourney({
    runtime_id: 'runtime_without_consent'
  }),
  error => error instanceof LineageContractError &&
    error.code === 'lineage_user_action_required'
);

const rootJourney = await service.createNewJourney({
  runtime_id: 'runtime_root',
  user_id: 'user_a',
  initial_state: {
    retained: 'root value',
    private_text: 'must not enter viewer'
  },
  user_initiated: true
});
assert.equal(rootJourney.mode, 'new_independent_runtime');
assert.equal(rootJourney.parent_runtime_id, null);
assert.equal(rootJourney.lineage, null);

const firstEdit = await service.editRuntime({
  runtime_id: 'runtime_root',
  revision_id: 'revision_root_1',
  reason: 'clarify evidence',
  changes: {
    evidence_status: 'clarified',
    private_revision_value: 'never expose this value'
  },
  user_initiated: true
});
assert.equal(firstEdit.runtime_id, 'runtime_root');
assert.equal(firstEdit.same_runtime, true);
assert.equal(firstEdit.revision.parent_revision_id, null);

const secondEdit = await service.editRuntime({
  runtime_id: 'runtime_root',
  revision_id: 'revision_root_2',
  reason: 'correct timing',
  changes: { timing_status: 'corrected' },
  user_initiated: true
});
assert.equal(
  secondEdit.revision.parent_revision_id,
  'revision_root_1'
);
const editedRoot = await persistence.read('runtime_root');
assert.equal(editedRoot.state.retained, 'root value');
assert.equal(editedRoot.state.evidence_status, 'clarified');
assert.equal(editedRoot.state.timing_status, 'corrected');

const independent = await service.createNewJourney({
  runtime_id: 'runtime_independent',
  user_id: 'user_a',
  initial_state: { topic: 'independent' },
  user_initiated: true
});
assert.equal(independent.independent_runtime, true);

const branch = await service.branchRuntime({
  parent_runtime_id: 'runtime_root',
  child_runtime_id: 'runtime_branch',
  reason: 'explore another bounded direction',
  initial_state: { topic: 'branch question' },
  user_initiated: true
});
assert.equal(branch.mode, 'new_child_runtime');
assert.equal(branch.parent_runtime_id, 'runtime_root');
assert.equal(branch.child_runtime_id, 'runtime_branch');
assert.equal(branch.lineage.relationship_type, 'branch');
assert.equal(branch.inherited_as_fact, false);
const child = await persistence.read('runtime_branch');
assert.equal(child.state.topic, 'branch question');
assert.equal(child.state.retained, undefined);
assert.equal(
  child.state.lineage_context.source_revision_id,
  'revision_root_2'
);
assert.equal(
  child.state.lineage_context.reference_only,
  true
);
assert.equal(
  child.state.lineage_context.inherited_as_fact,
  false
);

await assert.rejects(
  () => service.branchRuntime({
    parent_runtime_id: 'runtime_root',
    child_runtime_id: 'runtime_independent',
    reason: 'invalid duplicate',
    user_initiated: true
  }),
  error => error instanceof LineageContractError &&
    error.code === 'lineage_runtime_exists'
);

const viewer = await service.buildViewerData({ user_id: 'user_a' });
assert.equal(viewer.schema_version, 'phi-os.lineage-viewer-data.v1');
assert.equal(viewer.nodes.length, 3);
assert.equal(viewer.edges.length, 1);
assert.equal(viewer.revision_chains.length, 3);
assert.equal(
  viewer.nodes.find(node =>
    node.runtime_id === 'runtime_root'
  ).revision_count,
  2
);
assert.equal(
  viewer.nodes.find(node =>
    node.runtime_id === 'runtime_branch'
  ).parent_runtime_ids[0],
  'runtime_root'
);
assert.equal(
  viewer.nodes.find(node =>
    node.runtime_id === 'runtime_independent'
  ).root,
  true
);
assert.equal(viewer.guardrails.raw_runtime_state_exposed, false);
assert.equal(viewer.guardrails.raw_revision_values_exposed, false);
assert.equal(
  JSON.stringify(viewer).includes('must not enter viewer'),
  false
);
assert.equal(
  JSON.stringify(viewer).includes('never expose this value'),
  false
);
assert.deepEqual(
  [...viewer.revision_chains
    .find(chain => chain.runtime_id === 'runtime_root')
    .revisions[0].changed_fields].sort(),
  ['evidence_status', 'private_revision_value'].sort()
);

const rootViewer = await service.buildViewerData({
  runtime_id: 'runtime_branch'
});
assert.equal(rootViewer.nodes.length, 2);
assert.equal(rootViewer.edges.length, 1);

const rootEvents = await persistence.listEvents('runtime_root');
assert.equal(
  rootEvents.filter(event =>
    event.event_type === 'revision.created'
  ).length,
  2
);
const childEvents = await persistence.listEvents('runtime_branch');
assert.equal(childEvents[0].event_type, 'runtime.created');
assert.equal(childEvents[0].payload.origin, 'branch');

function createD1Adapter(database) {
  return {
    prepare(sql) {
      const statement = database.prepare(sql);
      let values = [];
      const adapter = {
        bind(...input) {
          values = input;
          return adapter;
        },
        async run() {
          const result = statement.run(...values);
          return {
            success: true,
            meta: { changes: result.changes }
          };
        },
        async all() {
          return {
            success: true,
            results: statement.all(...values)
          };
        }
      };
      return adapter;
    }
  };
}

const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys = ON;');
db.exec(read('db/migrations/0001_platform_foundation.sql'));
db.exec(read('db/schema/runtime-schema-v1.sql'));
db.prepare(`
  INSERT INTO runtime_users (
    user_id, status, created_at, updated_at
  ) VALUES ('user_d1', 'active', ?1, ?1)
`).run('2026-07-23T03:30:00.000Z');
const insertRuntime = db.prepare(`
  INSERT INTO runtimes (
    runtime_id, user_id, status, current_stage, schema_version,
    state, created_at, updated_at
  ) VALUES (?1, 'user_d1', 'active', 'entry_collecting',
    'phi-os.runtime-persistence.v1', '{}', ?2, ?2)
`);
insertRuntime.run(
  'runtime_d1_parent',
  '2026-07-23T03:30:01.000Z'
);
insertRuntime.run(
  'runtime_d1_child',
  '2026-07-23T03:30:02.000Z'
);

const d1Store = createD1LineageStore({
  db: createD1Adapter(db),
  clock,
  createId
});
await d1Store.createRevision({
  revision_id: 'revision_d1',
  runtime_id: 'runtime_d1_parent',
  reason: 'D1 revision',
  changes: { established: true }
});
await d1Store.createLineage({
  lineage_id: 'lineage_d1',
  parent_runtime_id: 'runtime_d1_parent',
  child_runtime_id: 'runtime_d1_child',
  relationship_type: 'branch',
  metadata: { reference_only: true }
});
assert.equal(
  (await d1Store.listRevisions('runtime_d1_parent')).length,
  1
);
assert.equal(
  (await d1Store.listChildLinks('runtime_d1_parent'))[0]
    .child_runtime_id,
  'runtime_d1_child'
);
db.close();

const registry = readJson(
  'content/registry/runtime-lineage-revision.json'
);
assert.equal(registry.id, LINEAGE_CONTRACT_ID);
assert.equal(registry.status, 'stable');
assert.equal(registry.modes.edit.new_runtime, false);
assert.equal(registry.modes.new_journey.lineage_edge, false);
assert.equal(registry.modes.branch.lineage_edge, true);
assert.equal(registry.guardrails.old_migration_modified, false);

assert(
  fs.existsSync(path.join(
    root,
    'docs/runtime/M2-W7-LINEAGE-AND-REVISION.md'
  ))
);

console.log(
  '✓ M2-W7 Parent–Child Runtime, Revision Chain, Edit/New Journey/' +
  'Branch semantics, D1 Store, and Lineage Viewer Data checks passed.'
);
