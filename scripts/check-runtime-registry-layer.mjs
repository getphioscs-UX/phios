import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RUNTIME_CONTRACTS,
  RUNTIME_SCHEMAS,
  RUNTIME_VERSIONS,
  RUNTIME_MIGRATIONS,
  RUNTIME_REGISTRY_STARTUP,
  getRuntimeContract,
  resolveRuntimeSchema,
  validateRuntimeRegistries,
  assertValidRuntimeRegistries
} from '../functions/runtime/registry/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = relativePath => JSON.parse(
  fs.readFileSync(path.join(root, relativePath), 'utf8')
);

assert.equal(RUNTIME_REGISTRY_STARTUP.valid, true);
assert.deepEqual(RUNTIME_REGISTRY_STARTUP.counts, {
  contracts: 20,
  schemas: 20,
  versions: 20,
  migrations: 20
});
assert.equal(
  getRuntimeContract('continuity').dependencies.includes('runtime-memory'),
  true
);
assert.equal(
  resolveRuntimeSchema('runtime-entry', 'phi-os.rule-entry.v1'),
  'phi-os.runtime-entry.v1'
);

const m1Inventory = readJson('content/registry/runtime-contracts.json');
assert.equal(m1Inventory.status, 'closed');
assert.equal(m1Inventory.contracts.length, RUNTIME_CONTRACTS.length);

const executableById = new Map(
  RUNTIME_CONTRACTS.map(contract => [contract.id, contract])
);
const frozenFields = [
  'id',
  'version',
  'status',
  'schemaId',
  'owner',
  'kind',
  'input',
  'output',
  'required_fields',
  'optional_fields',
  'errors',
  'validator'
];

for (const frozenContract of m1Inventory.contracts) {
  const executable = executableById.get(frozenContract.id);
  assert(executable, `M1 Contract is not registered: ${frozenContract.id}`);

  for (const field of frozenFields) {
    assert.deepEqual(
      executable[field],
      frozenContract[field],
      `M1 Contract drift: ${frozenContract.id}.${field}`
    );
  }

  assert(
    fs.existsSync(path.join(root, executable.validator)),
    `Contract validator authority is missing: ${executable.validator}`
  );
}

for (const schema of RUNTIME_SCHEMAS) {
  assert(
    fs.existsSync(path.join(root, schema.authority)),
    `Schema authority is missing: ${schema.authority}`
  );
}

const base = {
  contracts: RUNTIME_CONTRACTS,
  schemas: RUNTIME_SCHEMAS,
  versions: RUNTIME_VERSIONS,
  migrations: RUNTIME_MIGRATIONS
};

const duplicate = validateRuntimeRegistries({
  ...base,
  contracts: [...RUNTIME_CONTRACTS, RUNTIME_CONTRACTS[0]]
});
assert.equal(duplicate.valid, false);
assert(duplicate.errors.includes('duplicate_contract_id:runtime-entry'));

const missingVersionContract = {
  ...RUNTIME_CONTRACTS[0],
  id: 'missing-version',
  version: ''
};
const missingVersion = validateRuntimeRegistries({
  ...base,
  contracts: [...RUNTIME_CONTRACTS, missingVersionContract]
});
assert(missingVersion.errors.includes('missing_version:missing-version'));

const wrongVersionContract = {
  ...RUNTIME_CONTRACTS[0],
  version: '99.0.0'
};
const wrongVersion = validateRuntimeRegistries({
  ...base,
  contracts: [wrongVersionContract, ...RUNTIME_CONTRACTS.slice(1)]
});
assert(
  wrongVersion.errors.includes(
    'unsupported_contract_version:runtime-entry:99.0.0'
  )
);

const missingSchemaContract = {
  ...RUNTIME_CONTRACTS[0],
  schemaId: 'phi-os.not-registered.v1'
};
const missingSchema = validateRuntimeRegistries({
  ...base,
  contracts: [missingSchemaContract, ...RUNTIME_CONTRACTS.slice(1)]
});
assert(
  missingSchema.errors.includes(
    'schema_not_found:runtime-entry:phi-os.not-registered.v1'
  )
);

const missingMigrationContract = {
  ...RUNTIME_CONTRACTS[0],
  migrationId: 'baseline:not-present'
};
const missingMigration = validateRuntimeRegistries({
  ...base,
  contracts: [missingMigrationContract, ...RUNTIME_CONTRACTS.slice(1)]
});
assert(
  missingMigration.errors.includes(
    'migration_not_found:runtime-entry:baseline:not-present'
  )
);

const missingDependencyContract = {
  ...RUNTIME_CONTRACTS[0],
  dependencies: ['not-present']
};
const missingDependency = validateRuntimeRegistries({
  ...base,
  contracts: [missingDependencyContract, ...RUNTIME_CONTRACTS.slice(1)]
});
assert(
  missingDependency.errors.includes(
    'dependency_not_found:runtime-entry:not-present'
  )
);
assert.throws(
  () => assertValidRuntimeRegistries({
    ...base,
    contracts: [missingDependencyContract, ...RUNTIME_CONTRACTS.slice(1)]
  }),
  /dependency_not_found/
);

for (const endpoint of [
  'reconstruct-reality.js',
  'read-runtime.js',
  'navigate-runtime.js'
]) {
  const source = fs.readFileSync(
    path.join(root, 'functions', 'api', endpoint),
    'utf8'
  );
  assert(
    source.includes("../runtime/registry/index.js"),
    `${endpoint} does not run Registry startup validation.`
  );
}

console.log(
  '✓ M2-W1 Contract, Schema, Version, Migration Registries, ' +
  'M1 parity, and startup validation passed.'
);
