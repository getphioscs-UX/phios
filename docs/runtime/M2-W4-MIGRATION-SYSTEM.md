# M2-W4 Migration System

Status: **Implemented and locally verified**  
Registry: `content/registry/runtime-migrations.json`

M2-W4 converts the frozen M2-W3 D1 schema into ordered, immutable SQL
migrations. It does not change Reading, Navigation, Runtime stages, or the
M1 contracts.

## Migration order

| Version | File | Responsibility |
| --- | --- | --- |
| 0001 | `db/migrations/0001_platform_foundation.sql` | Existing platform foundation; checksum frozen and file unchanged |
| 0002 | `db/migrations/0002_initial_runtime.sql` | Runtime users, runtimes, events, snapshots, revisions, lineages, artifacts, indexes, and PHI OS history table |

The repository already had migration 0001, so M2-W4 correctly uses 0002. A
second 0001 would be rejected by the validation layer.

## History tables

Cloudflare Wrangler maintains its own `d1_migrations` table when migrations
are applied with Wrangler. PHI OS additionally defines
`runtime_migration_history` for application-runner audit data:

- migration version;
- stable name and file path;
- SHA-256 checksum;
- target schema identity;
- applied timestamp;
- execution duration field.

The PHI OS Runner creates this table before planning and writes a history row
in the same D1 `batch()` as the migration statements. Re-running the Runner is
idempotent. An applied checksum, name, or filename that no longer matches the
registry fails closed.

## Runner

`functions/runtime/migrations/migration-runner.js` is environment-neutral and
accepts a D1-compatible binding. It:

1. validates positive, unique, contiguous versions;
2. canonicalizes transport-only SQL formatting and verifies each migration
   against its registered SHA-256 checksum;
3. loads and validates migration history;
4. plans only unapplied migrations;
5. executes each migration and its history insert in one transactional
   `batch()`;
6. returns `migrated` or `up_to_date`.

The Node loader is intentionally separate because Cloudflare Workers do not
have filesystem access. A Worker build must provide the registered SQL text to
`applyRuntimeMigrations()`, or production migrations can be applied with the
official Wrangler migration command.

## Immutable migration rule

After a migration has been deployed:

- do not edit or rename it;
- do not change its version;
- do not update the stored checksum to hide a change;
- add the next sequential file, such as `0003_add_runtime_feature.sql`;
- register the new migration and its real checksum.

The checksum of the pre-existing 0001 file is now pinned. The 0002 checksum is
pinned after generation. Before hashing, the Runner ignores UTF-8 BOM,
LF/CRLF differences, indentation, trailing whitespace, and SQL comments. This
prevents editors and Git on Windows from creating false failures. Executable
SQL changes—including tables, fields, constraints, and indexes—still fail
`npm run check`.

## Local validation and runner

Validate without changing a database:

```text
npm run migrate:check
npm run check:runtime-migrations
```

Apply to an explicitly named local SQLite file:

```text
npm run migrate:local -- .local/runtime-development.sqlite
```

The local command never chooses a database path automatically.

## Cloudflare D1 provisioning and apply

No placeholder `database_id` is committed. Create or identify the real D1
database, then add a real binding to `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "RUNTIME_DB",
    "database_name": "phios-runtime",
    "database_id": "REPLACE_WITH_REAL_DATABASE_ID",
    "migrations_dir": "db/migrations"
  }
]
```

Preview the pending migrations before applying them:

```text
npx wrangler d1 migrations list phios-runtime --remote
npx wrangler d1 migrations apply phios-runtime --remote
```

Cloudflare should be treated as a separate production acceptance step. A
successful Pages deployment alone does not prove that the D1 migration ran.

## Deployment checks

`scripts/check-runtime-migrations.mjs` verifies:

- missing migration files;
- duplicate or skipped versions;
- filename/version agreement;
- immutable SHA-256 checksums;
- Runner first-run and idempotent second-run behavior;
- migration-history structure;
- exact Runtime table and index alignment with the M2-W3 canonical schema;
- the M2-W3 manifest handoff to migration 0002.

Expected result:

```text
✓ M2-W4 immutable migrations, history, checksums, ordering, runner, and schema drift checks passed.
```
