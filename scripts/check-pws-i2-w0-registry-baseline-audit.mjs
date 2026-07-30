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
const indexedFiles = Object.values(registryIndex.registries)
  .map(file => file.replace(/^\.\//, ''));
assert.equal(contentRegistryFiles.length, 110);
assert.equal(indexedFiles.length, 48);
assert.equal(
  contentRegistryFiles.filter(file =>
    file !== 'index.json' && !indexedFiles.includes(file)
  ).length,
  61
);

const knowledgeData = await listFiles('content/knowledge/registry', '.json');
const knowledgeSchemas = await listFiles(
  'content/knowledge/registry/schemas',
  '.json'
);
const pwsContracts = await listFiles('docs/pws/contracts', '.json');
assert.equal(knowledgeData.length, 12);
assert.equal(knowledgeSchemas.length, 12);
assert.equal(pwsContracts.length, 10);

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
assert.equal(migrationRegistry.migrations.length, 4);
assert.equal(migrationFiles.length, 4);
for (const migration of migrationRegistry.migrations) {
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
console.log('  Persistence 9 methods; D1 1 binding; executable Migrations 4.');
console.log('  Static JSON 110; legacy index 48; unindexed excluding index 61.');
console.log('  Multiple-source risks recorded; no Registry or Migration changed.');
