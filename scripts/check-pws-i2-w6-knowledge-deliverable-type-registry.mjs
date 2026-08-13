import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { loadKnowledgeBlueprintRegistry } from './lib/knowledge-blueprint/blueprint-registry-loader.mjs';
import { DatabaseSync } from 'node:sqlite';
import {
  createKnowledgeDeliverableTypeRegistry,
  DEFAULT_DELIVERABLE_TYPE_DEFINITIONS,
  DEFAULT_PUBLISHED_ASSET_TYPE_DEFINITIONS
} from '../functions/pws/registry/knowledge-deliverable-type-registry.js';
import {
  RegistryValidationError
} from '../functions/pws/registry/universal-registry-schema.js';
import {
  createUniversalRegistry
} from '../functions/pws/registry/universal-registry.js';
import {
  applyRuntimeMigrations
} from '../functions/runtime/migrations/migration-runner.js';
import {
  createSqliteD1Adapter,
  loadRuntimeMigrations
} from './runtime-migration-loader.mjs';

const readJson = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const [nodesBefore, questionsBefore, knowledgeBefore] = await Promise.all([
  readJson('content/knowledge/registry/nodes.json'),
  readJson('content/knowledge/registry/supporting-questions.json'),
  loadKnowledgeBlueprintRegistry(process.cwd())
]);

const database = new DatabaseSync(':memory:');
database.exec('PRAGMA foreign_keys = ON;');
const db = createSqliteD1Adapter(database);
await applyRuntimeMigrations({
  db,
  migrations: loadRuntimeMigrations(process.cwd()).migrations,
  now: () => '2026-07-30T06:00:00.000Z'
});

let sequence = 0;
const universalRegistry = createUniversalRegistry({
  db,
  clock: () => '2026-07-30T06:30:00.000Z',
  createId: prefix => `${prefix}_${++sequence}`
});
const context = {
  actor_id: 'pws_governance',
  correlation_id: 'pws_i2_w6_acceptance'
};
const registry = createKnowledgeDeliverableTypeRegistry({
  universalRegistry
});

assert.deepEqual(await registry.seedDefaults(context), {
  published_asset_types: { created: 7, existing: 0, total: 7 },
  deliverable_types: { created: 5, existing: 0, total: 5 }
});
assert.deepEqual(await registry.seedDefaults(context), {
  published_asset_types: { created: 0, existing: 7, total: 7 },
  deliverable_types: { created: 0, existing: 5, total: 5 }
});

const publishedAssetTypes = await registry.listPublishedAssetTypes();
assert.deepEqual(
  publishedAssetTypes.map(item => item.metadata.value).sort(),
  DEFAULT_PUBLISHED_ASSET_TYPE_DEFINITIONS.map(item => item.code).sort()
);
assert(
  publishedAssetTypes.every(item =>
    item.metadata.type_authority === 'pws_i2' &&
    item.metadata.canonical_node_authority === 'pkr' &&
    item.metadata.supporting_question_authority === 'pkr' &&
    item.metadata.book_i_planning_authority === 'kh_w3_5g_blueprint' &&
    item.metadata.creates_canonical_knowledge_node === false &&
    item.metadata.creates_supporting_question === false &&
    item.metadata.starts_content_production === false &&
    item.metadata.creates_published_asset === false
  )
);

const deliverableTypes = await registry.listDeliverableTypes();
assert.deepEqual(
  deliverableTypes.map(item => item.metadata.value).sort(),
  DEFAULT_DELIVERABLE_TYPE_DEFINITIONS.map(item => item.code).sort()
);
assert(
  deliverableTypes.every(item =>
    item.metadata.definition_only === true &&
    item.metadata.requires_source_lineage === true &&
    item.metadata.requires_versioning === true &&
    item.metadata.requires_explicit_release === true &&
    item.metadata.creates_deliverable_instance === false &&
    item.metadata.creates_signature === false &&
    item.metadata.creates_professional_responsibility === false
  )
);

await assert.rejects(
  () => registry.registerPublishedAssetType({
    code: 'Canonical Node',
    name: 'Canonical Node',
    definition: 'Invalid attempt to register a PKR-owned object.'
  }, context),
  RegistryValidationError
);
await assert.rejects(
  () => registry.registerDeliverableType({
    code: 'unowned_deliverable',
    name: 'Unowned Deliverable',
    definition: 'Invalid deliverable without an owner.'
  }, context),
  RegistryValidationError
);

const [nodesAfter, questionsAfter, knowledgeAfter] = await Promise.all([
  readJson('content/knowledge/registry/nodes.json'),
  readJson('content/knowledge/registry/supporting-questions.json'),
  loadKnowledgeBlueprintRegistry(process.cwd())
]);
assert.deepEqual(nodesAfter, nodesBefore);
assert.deepEqual(questionsAfter, questionsBefore);
assert.deepEqual(knowledgeAfter.registry, knowledgeBefore.registry);
assert.deepEqual(knowledgeAfter.books, knowledgeBefore.books);
assert.deepEqual(knowledgeAfter.authorities.nodes, knowledgeBefore.authorities.nodes);
const activeNodesAfter = knowledgeAfter.authorities.nodes;
assert.equal(activeNodesAfter.nodes.length, knowledgeAfter.totals.nodes);
assert.deepEqual(
  new Set(activeNodesAfter.nodes.map(node => node.nodeCode)),
  new Set(knowledgeAfter.nodes.map(node => node.nodeCode))
);
const book1Blueprint = knowledgeAfter.byBookCode.get('BOOK-1');
assert(book1Blueprint);
assert.equal(
  activeNodesAfter.nodes.filter(node => node.nodeCode.startsWith('KN-PREFACE-')).length,
  book1Blueprint.prefaceCanonicalNodes
);
assert.equal(questionsAfter.supportingQuestions.length, 23);
assert.equal(book1Blueprint.nodes.length, book1Blueprint.plannedCanonicalNodes);
assert.equal(book1Blueprint.activeProductionLimit, 8);
assert.equal(knowledgeAfter.totals.books, 5);

assert.equal(loadRuntimeMigrations(process.cwd()).migrations.length, 5);
database.close();
console.log('✓ PWS-I2-W6 Knowledge and Deliverable Type Registry passed.');
console.log('  Seven Published Asset Types and five Deliverable Types registered.');
console.log('  PKR Canonical Nodes/Questions and the five-volume Blueprint Registry remain unchanged.');
console.log('  Type registration creates no content, Deliverable, Signature or responsibility.');
console.log('  W1 Universal Registry reused; W5 path restored; no Migration added.');
