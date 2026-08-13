import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));
const exists = file =>
  fs.access(path.join(root, file)).then(() => true, () => false);
const listFiles = async (directory, suffix) =>
  (await fs.readdir(path.join(root, directory)))
    .filter(file => !suffix || file.endsWith(suffix));

const auditPath =
  'docs/pws/audit/pws-i2-w0-registry-baseline-audit.json';
const audit = await readJson(auditPath);

assert.equal(
  audit.auditId,
  'phi-os.pws-i2-w0.registry-baseline-audit.v1'
);
assert.equal(audit.status, 'audit_complete');
assert.equal(
  audit.baseline.commit,
  '025f06ef5b18e54f2ad22f6883d1cf30d6288c44'
);
assert.equal(audit.baseline.prerequisite, 'PWS-I1-v1.0.0-Frozen');
assert.deepEqual(audit.scope, [
  'Registry','Persistence','D1','Migration','Read Model','Static JSON',
  'Legacy Configuration','Multiple Source of Truth'
]);

const runtimeRegistryFiles = await listFiles(
  'functions/runtime/registry',
  '.js'
);
assert.equal(runtimeRegistryFiles.length, 6);

const registryIndex = await readJson('content/registry/index.json');
const contentRegistryFiles = await listFiles('content/registry', '.json');
const authorisedKnowledgeSuccessorRegistryFiles = new Set([
  'm3c-w3-wrangler-successor-reconciliation-v1.json'
]);
const indexedFiles = Object.values(registryIndex.registries)
  .map(file => file.replace(/^\.\//, ''));
assert.equal(contentRegistryFiles.length, 114);
assert.equal(indexedFiles.length, 51);
assert.equal(registryIndex.registries.public_assets, './public-assets.json');
assert.equal(registryIndex.registries.book_5_manifest, './book-5-manifest.json');
assert.equal(
  contentRegistryFiles.filter(file =>
    file !== 'index.json' && !indexedFiles.includes(file)
  ).length,
  62
);

const knowledgeData = await listFiles('content/knowledge/registry', '.json');
assert(
  [...authorisedKnowledgeSuccessorRegistryFiles].every(file =>
    knowledgeData.includes(file)
  )
);
const baselineKnowledgeData = knowledgeData.filter(
  file => !authorisedKnowledgeSuccessorRegistryFiles.has(file)
);
const knowledgeSchemas = await listFiles(
  'content/knowledge/registry/schemas',
  '.json'
);
const pwsContracts = await listFiles('docs/pws/contracts', '.json');
assert.equal(baselineKnowledgeData.length, 12);
assert.equal(knowledgeSchemas.length, 12);
const postAuditContracts = new Set([
  'pws-i2-v1-freeze.json',
  'pws-i8-free-observation-privacy-foundation-v1.json',
  'pws-i9-rule-engine-foundation-v1.json'
]);
assert.equal(
  pwsContracts.filter(file => !postAuditContracts.has(file)).length,
  10
);

const runtimeContracts = await import(
  '../functions/runtime/registry/contract-registry.js'
);
const runtimeSchemas = await import(
  '../functions/runtime/registry/schema-registry.js'
);
const runtimeVersions = await import(
  '../functions/runtime/registry/version-registry.js'
);
const runtimeDeclarations = await import(
  '../functions/runtime/registry/migration-registry.js'
);
assert.equal(runtimeContracts.RUNTIME_CONTRACTS.length, 20);
assert.equal(runtimeSchemas.RUNTIME_SCHEMAS.length, 20);
assert.equal(runtimeVersions.RUNTIME_VERSIONS.length, 20);
assert.equal(runtimeDeclarations.RUNTIME_MIGRATIONS.length, 20);
assert(
  runtimeDeclarations.RUNTIME_MIGRATIONS.every(
    migration =>
      migration.executable === false &&
      migration.kind === 'baseline-declaration'
  )
);

const persistence = await import(
  '../functions/runtime/persistence/persistence-contract.js'
);
assert.equal(persistence.PERSISTENCE_METHODS.length, 9);
assert.deepEqual(persistence.PERSISTENCE_DRIVERS, {
  test: 'memory',
  development: 'local',
  production: 'd1'
});

const migrationRegistry = await readJson(
  'content/registry/runtime-migrations.json'
);
const migrationFiles = await listFiles('db/migrations', '.sql');
assert(migrationRegistry.migrations.length >= 4);
assert(migrationFiles.length >= 4);
for (const migration of migrationRegistry.migrations.slice(0, 4)) {
  assert(await exists(migration.file));
  assert.equal(migration.immutable, true);
}

const wranglerText = await read('wrangler.jsonc');
assert(wranglerText.includes('"binding": "RUNTIME_DB"'));
assert(wranglerText.includes('"migrations_dir": "db/migrations"'));

for (const source of audit.protectedSources) {
  assert(await exists(source.source), `Protected source missing: ${source.source}`);
}
for (const item of audit.legacyReconciliationQueue) {
  assert(item.sources.length > 1);
  for (const source of item.sources) {
    assert(await exists(source), `Reconciliation source missing: ${source}`);
  }
}
assert.equal(audit.findings.length, 10);
assert(
  audit.findings.some(finding =>
    finding.area === 'Multiple Source of Truth' &&
    finding.severity === 'confirmed_risk'
  )
);

for (const [rule, expected] of Object.entries({
  businessCodeChanged: false,
  registryEntryCountChanged: false,
  migrationAdded: false,
  migrationModified: false,
  d1SchemaChanged: false,
  legacyDeleted: false,
  pageBehaviourChanged: false,
  universalRegistryImplemented: false
})) {
  assert.equal(audit.w0Boundaries[rule], expected, `W0 boundary changed: ${rule}`);
}

const packageJson = await readJson('package.json');
assert.equal(
  packageJson.scripts['check:pws-i2-w0'],
  'node scripts/check-pws-i2-w0-registry-baseline-audit.mjs'
);
assert(
  packageJson.scripts.precheck.includes(
    'node scripts/check-pws-i2-w0-registry-baseline-audit.mjs'
  )
);

console.log('✓ PWS-I2-W0 Registry Baseline Audit passed.');
console.log('  Registry 6 modules; Runtime Contracts/Schemas/Versions 20 each.');
console.log('  Persistence 9 methods; D1 1 binding; W0 executable Migrations 4.');
console.log('  Static JSON 114; Knowledge Registry 12 frozen + 1 authorised M3C successor reconciliation; registry index 51; unindexed excluding index 62.');
console.log('  Multiple-source risks recorded; no Registry or Migration changed.');
