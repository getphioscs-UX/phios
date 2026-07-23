import fs from 'node:fs';
import path from 'node:path';

export function hydrateRuntimeMigrations(root, registry) {
  const migrations = registry.migrations.map(migration => {
    const absolutePath = path.join(root, migration.file);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Missing migration file: ${migration.file}`);
    }
    return {
      ...migration,
      sql: fs.readFileSync(absolutePath, 'utf8')
    };
  });
  return { registry, migrations };
}

export function loadRuntimeMigrations(root) {
  const registryPath = path.join(
    root,
    'content/registry/runtime-migrations.json'
  );
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  return hydrateRuntimeMigrations(root, registry);
}

export function createSqliteD1Adapter(database) {
  class Statement {
    constructor(sql, bindings = []) {
      this.sql = sql;
      this.bindings = bindings;
    }

    bind(...bindings) {
      return new Statement(this.sql, bindings);
    }

    async run() {
      return database.prepare(this.sql).run(...this.bindings);
    }

    async all() {
      return { results: database.prepare(this.sql).all(...this.bindings) };
    }
  }

  return {
    async exec(sql) {
      database.exec(sql);
      return { count: 1 };
    },
    prepare(sql) {
      return new Statement(sql);
    },
    async batch(statements) {
      database.exec('BEGIN IMMEDIATE;');
      try {
        const results = [];
        for (const statement of statements) {
          results.push(await statement.run());
        }
        database.exec('COMMIT;');
        return results;
      } catch (error) {
        database.exec('ROLLBACK;');
        throw error;
      }
    }
  };
}
