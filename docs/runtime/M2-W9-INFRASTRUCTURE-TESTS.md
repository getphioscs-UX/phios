# M2-W9 Infrastructure Tests

## Acceptance matrix

M2-W9 consolidates the existing M2 contract tests and adds a D1-compatible
cross-layer integration run:

1. Persistence CRUD, Events, and Snapshots.
2. Immutable Migration validation and ordered application.
3. Session and partial-write Recovery.
4. Timeline replay, legacy event adaptation, deterministic same-timestamp
   ordering by `created_at` then `event_id`, and customer projection.
5. Revision chains and Parent–Child Runtime Lineage.
6. D1 integration across Migration, Persistence, Recovery, Timeline, Lineage,
   and Privacy.
7. Read-only Production Smoke after deployment.

## D1 integration

`check-runtime-d1-integration.mjs` creates an isolated SQLite database through
the same D1-compatible interface used by the Runtime drivers. It applies the
registered migrations, executes the complete infrastructure flow, validates
foreign-key cascades, and finishes with `PRAGMA integrity_check`.

It never connects to Production and never modifies the repository migrations.
The SQLite adapter implements the D1 `run()`, `all()`, and `first()` result
shapes so the integration run exercises actual Runtime read-back, deletion,
and cascade behavior instead of recording SQL calls only.

## Production health

`/api/runtime-infrastructure-health` performs read-only checks for:

- the `RUNTIME_DB` binding;
- D1 reachability;
- all canonical Runtime tables;
- at least two recorded migrations in either the PHI OS
  `runtime_migration_history` table or Wrangler's `d1_migrations` table.

The response contains status metadata only. It does not return Runtime content,
user identifiers, SQL errors, or stack traces.

## Production prerequisites

The GitHub package cannot create or authorize a Cloudflare database. Before the
live smoke run:

1. Create or select the production D1 database in Cloudflare.
2. Add the Pages binding with the exact variable name `RUNTIME_DB`.
3. Apply `db/migrations/0001_platform_foundation.sql` and
   `db/migrations/0002_initial_runtime.sql` in order. When Wrangler migration
   tracking is configured for `db/migrations`, the remote command is:

   ```bash
   npx wrangler d1 migrations apply <D1_DATABASE_NAME> --remote
   ```

4. Confirm that the production and preview environments use the intended D1
   database before deploying.

The live smoke intentionally fails while the binding, schema, or migration
history is missing. A local green result alone does not certify production D1.

## Commands

Local acceptance:

```bash
npm run check:runtime-infrastructure
npm run check
```

After deploying M2-W9, PowerShell live smoke:

```powershell
$env:PHIOS_SMOKE_BASE_URL="https://phios-github.pages.dev"
npm run check:runtime-production-smoke
Remove-Item Env:PHIOS_SMOKE_BASE_URL
```

The live smoke is read-only. M2 is complete only after it reports:

```text
✓ M2-W9 live Production Smoke passed
```
