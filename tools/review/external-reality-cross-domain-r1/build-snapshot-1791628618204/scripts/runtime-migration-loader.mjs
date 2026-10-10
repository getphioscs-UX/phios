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


export function enableSqliteNumberedParameterCompatibility(database) {
  const prepare = database.prepare.bind(database);
  database.prepare = sql => {
    const statement = prepare(sql);
    if (!/\?\d+/u.test(sql)) return statement;
    const convert = bindings => Object.fromEntries(
      bindings.map((value, index) => [`?${index + 1}`, value])
    );
    return new Proxy(statement, {
      get(target, property, receiver) {
        if (['run', 'get', 'all'].includes(property)) {
          return (...bindings) => target[property](...(bindings.length === 1 && bindings[0] && typeof bindings[0] === 'object' && !Array.isArray(bindings[0]) ? bindings : [convert(bindings)]));
        }
        const value = Reflect.get(target, property, receiver);
        return typeof value === 'function' ? value.bind(target) : value;
      }
    });
  };
  return database;
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

    sqliteArguments() {
      if (/\?\d+/u.test(this.sql)) {
        return [Object.fromEntries(this.bindings.map((value, index) => [`?${index + 1}`, value]))];
      }
      return this.bindings;
    }

    async run() {
      const result = database.prepare(this.sql).run(...this.sqliteArguments());
      const changes = Number(result.changes || 0);
      return {
        success: true,
        changes,
        meta: {
          changes,
          last_row_id:
            result.lastInsertRowid === undefined
              ? null
              : Number(result.lastInsertRowid)
        }
      };
    }

    async all() {
      return {
        success: true,
        results: database.prepare(this.sql).all(...this.sqliteArguments())
      };
    }

    async first() {
      return database.prepare(this.sql).get(...this.sqliteArguments()) || null;
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
