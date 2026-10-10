import { RUNTIME_CONTRACTS } from './contract-registry.js';
import { RUNTIME_SCHEMAS } from './schema-registry.js';
import { RUNTIME_VERSIONS } from './version-registry.js';
import { RUNTIME_MIGRATIONS } from './migration-registry.js';

function duplicates(items, field) {
  const seen = new Set();
  const repeated = new Set();

  for (const item of items) {
    const value = String(item?.[field] || '').trim();
    if (!value) continue;
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }

  return [...repeated];
}

export function validateRuntimeRegistries(source = {}) {
  const contracts = source.contracts || RUNTIME_CONTRACTS;
  const schemas = source.schemas || RUNTIME_SCHEMAS;
  const versions = source.versions || RUNTIME_VERSIONS;
  const migrations = source.migrations || RUNTIME_MIGRATIONS;
  const errors = [];

  for (const id of duplicates(contracts, 'id')) {
    errors.push(`duplicate_contract_id:${id}`);
  }
  for (const id of duplicates(schemas, 'id')) {
    errors.push(`duplicate_schema_id:${id}`);
  }
  for (const current of duplicates(schemas, 'current')) {
    errors.push(`duplicate_schema_version:${current}`);
  }
  for (const id of duplicates(versions, 'id')) {
    errors.push(`duplicate_version_id:${id}`);
  }
  for (const id of duplicates(migrations, 'id')) {
    errors.push(`duplicate_migration_id:${id}`);
  }

  const contractIds = new Set(contracts.map(item => item.id));
  const schemasById = new Map(schemas.map(item => [item.id, item]));
  const schemaVersions = new Set(
    schemas.flatMap(item => item.accepted || [])
  );
  const versionsById = new Map(versions.map(item => [item.id, item]));
  const migrationsById = new Map(migrations.map(item => [item.id, item]));

  for (const contract of contracts) {
    const version = versionsById.get(contract.id);
    const schema = schemasById.get(contract.id);

    if (!contract.version || !version) {
      errors.push(`missing_version:${contract.id}`);
    } else if (!(version.supported || []).includes(contract.version)) {
      errors.push(`unsupported_contract_version:${contract.id}:${contract.version}`);
    }

    if (!contract.schemaId || !schema ||
        !schemaVersions.has(contract.schemaId) ||
        !(schema.accepted || []).includes(contract.schemaId)) {
      errors.push(`schema_not_found:${contract.id}:${contract.schemaId || 'empty'}`);
    }

    const migration = migrationsById.get(contract.migrationId);
    if (!contract.migrationId || !migration ||
        migration.schemaId !== contract.id ||
        migration.to !== contract.schemaId) {
      errors.push(`migration_not_found:${contract.id}:${contract.migrationId || 'empty'}`);
    }

    for (const dependency of contract.dependencies || []) {
      if (!contractIds.has(dependency)) {
        errors.push(
          `dependency_not_found:${contract.id}:${dependency}`
        );
      }
    }
  }

  for (const schema of schemas) {
    if (!schema.current || !(schema.accepted || []).includes(schema.current)) {
      errors.push(`missing_schema_version:${schema.id}`);
    }
    if (!schema.authority) {
      errors.push(`schema_authority_not_found:${schema.id}`);
    }
  }

  for (const version of versions) {
    if (!version.current || !(version.supported || []).includes(version.current)) {
      errors.push(`missing_version:${version.id}`);
    }
    if (!contractIds.has(version.id)) {
      errors.push(`orphan_version:${version.id}`);
    }
  }

  for (const migration of migrations) {
    if (!schemasById.has(migration.schemaId)) {
      errors.push(`migration_schema_not_found:${migration.id}`);
    }
    if (migration.kind === 'baseline-declaration') {
      if (migration.version !== 0 || migration.executable !== false) {
        errors.push(`invalid_baseline_migration:${migration.id}`);
      }
    } else if (!Number.isInteger(migration.version) ||
               migration.version < 1 ||
               migration.executable !== true ||
               !migration.migrationFile) {
      errors.push(`invalid_executable_migration:${migration.id}`);
    }
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
    counts: Object.freeze({
      contracts: contracts.length,
      schemas: schemas.length,
      versions: versions.length,
      migrations: migrations.length
    })
  });
}

export function assertValidRuntimeRegistries(source) {
  const report = validateRuntimeRegistries(source);

  if (!report.valid) {
    throw new Error(
      `Runtime Registry validation failed: ${report.errors.join(', ')}`
    );
  }

  return report;
}

export default validateRuntimeRegistries;
