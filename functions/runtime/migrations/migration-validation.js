const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateMigrationSequence(migrations) {
  assert(Array.isArray(migrations), 'Migration registry must be an array.');
  assert(migrations.length > 0, 'Migration registry must not be empty.');

  const versions = new Set();
  const names = new Set();
  const files = new Set();

  migrations.forEach((migration, index) => {
    const expectedVersion = index + 1;
    assert(
      Number.isInteger(migration.version) && migration.version > 0,
      `Migration version must be a positive integer at index ${index}.`
    );
    assert(
      !versions.has(migration.version),
      `Duplicate migration version: ${migration.version}`
    );
    assert(
      migration.version === expectedVersion,
      `Migration order is invalid: expected ${expectedVersion}, received ${migration.version}.`
    );
    assert(
      typeof migration.name === 'string' && migration.name.trim(),
      `Migration ${migration.version} is missing a name.`
    );
    assert(
      !names.has(migration.name),
      `Duplicate migration name: ${migration.name}`
    );
    assert(
      typeof migration.file === 'string' && migration.file.trim(),
      `Migration ${migration.version} is missing a file.`
    );
    assert(
      !files.has(migration.file),
      `Duplicate migration file: ${migration.file}`
    );

    const fileVersion = migration.file.match(/(?:^|\/)(\d{4})_[^/]+\.sql$/);
    assert(fileVersion, `Invalid migration filename: ${migration.file}`);
    assert(
      Number(fileVersion[1]) === migration.version,
      `Migration filename/version mismatch: ${migration.file}`
    );
    assert(
      SHA256_PATTERN.test(migration.checksum || ''),
      `Migration ${migration.version} has an invalid SHA-256 checksum.`
    );
    assert(
      typeof migration.schema_id === 'string' && migration.schema_id.trim(),
      `Migration ${migration.version} is missing schema_id.`
    );
    assert(
      typeof migration.sql === 'string' && migration.sql.trim(),
      `Migration file is missing or empty: ${migration.file}`
    );

    versions.add(migration.version);
    names.add(migration.name);
    files.add(migration.file);
  });

  return true;
}

export function validateAppliedMigrations(migrations, appliedRows) {
  validateMigrationSequence(migrations);
  const registryByVersion = new Map(
    migrations.map(migration => [migration.version, migration])
  );
  const appliedVersions = new Set();

  for (const row of appliedRows) {
    assert(
      Number.isInteger(Number(row.version)),
      'Migration history contains an invalid version.'
    );
    const version = Number(row.version);
    assert(
      !appliedVersions.has(version),
      `Migration history contains duplicate version: ${version}`
    );
    const registered = registryByVersion.get(version);
    assert(registered, `Applied migration is missing from registry: ${version}`);
    assert(
      row.name === registered.name,
      `Applied migration name drift at version ${version}.`
    );
    assert(
      row.file_name === registered.file,
      `Applied migration file drift at version ${version}.`
    );
    assert(
      row.checksum === registered.checksum,
      `Applied migration checksum drift at version ${version}.`
    );
    appliedVersions.add(version);
  }

  const highestApplied = Math.max(0, ...appliedVersions);
  for (let version = 1; version <= highestApplied; version += 1) {
    assert(
      appliedVersions.has(version),
      `Migration history has a missing version before ${highestApplied}: ${version}`
    );
  }

  return true;
}

export function planPendingMigrations(migrations, appliedRows) {
  validateAppliedMigrations(migrations, appliedRows);
  const applied = new Set(appliedRows.map(row => Number(row.version)));
  return migrations.filter(migration => !applied.has(migration.version));
}

