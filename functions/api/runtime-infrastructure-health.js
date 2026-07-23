const requiredTables = Object.freeze([
  'runtime_users',
  'runtimes',
  'runtime_events',
  'runtime_snapshots',
  'runtime_revisions',
  'runtime_lineages',
  'runtime_artifacts',
  'runtime_migration_history'
]);
const requiredMigrationCount = 2;

function response(body, status) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

async function migrationHistory(db, tables) {
  const sources = [
    ['runtime_migration_history', 'migration_count'],
    ['d1_migrations', 'migration_count']
  ];
  let best = {
    source: '',
    count: 0
  };

  for (const [table, alias] of sources) {
    if (!tables.has(table)) continue;
    const row = await db.prepare(`
      SELECT COUNT(*) AS ${alias}
      FROM ${table}
    `).first();
    const count = Number(row?.[alias] || 0);
    if (count > best.count) {
      best = {
        source: table,
        count
      };
    }
  }

  return best;
}

export async function onRequestGet({ env = {} }) {
  const db = env?.RUNTIME_DB;
  if (!db || typeof db.prepare !== 'function') {
    return response({
      success: false,
      service: 'PHI OS Runtime Infrastructure',
      status: 'unavailable',
      checks: {
        runtime_database_bound: false,
        runtime_database_reachable: false,
        runtime_schema_ready: false,
        migration_history_ready: false
      }
    }, 503);
  }

  try {
    const tableResult = await db.prepare(`
      SELECT name
      FROM sqlite_schema
      WHERE type = 'table'
    `).all();
    const tables = new Set(
      (tableResult?.results || []).map(row => row.name)
    );
    const schemaReady = requiredTables.every(table => tables.has(table));
    const history = await migrationHistory(db, tables);
    const migrationReady =
      history.count >= requiredMigrationCount;
    const healthy = schemaReady && migrationReady;
    return response({
      success: healthy,
      service: 'PHI OS Runtime Infrastructure',
      status: healthy ? 'healthy' : 'not_ready',
      checks: {
        runtime_database_bound: true,
        runtime_database_reachable: true,
        runtime_schema_ready: schemaReady,
        migration_history_ready: migrationReady
      },
      migration_count: history.count,
      migration_history_source: history.source || 'none'
    }, healthy ? 200 : 503);
  } catch {
    return response({
      success: false,
      service: 'PHI OS Runtime Infrastructure',
      status: 'unavailable',
      checks: {
        runtime_database_bound: true,
        runtime_database_reachable: false,
        runtime_schema_ready: false,
        migration_history_ready: false
      }
    }, 503);
  }
}
