# M2-W3 Cloudflare D1 Schema

Status: **Schema frozen for migration**  
Authority: `db/schema/runtime-schema-v1.sql`

M2-W3 defines and validates the Runtime database structure expected by the
M2-W2 D1 Driver. It does not yet create a remote Cloudflare database, add a
placeholder binding, or apply a migration.

## Table architecture

| Table | Responsibility |
| --- | --- |
| `runtime_users` | Minimal Runtime ownership boundary without storing email or profile text |
| `runtimes` | Canonical Runtime identity, current stage, status, schema, and JSON state |
| `runtime_events` | Append-oriented Runtime event records |
| `runtime_snapshots` | Recoverable state at a specific Runtime stage |
| `runtime_revisions` | Same-Runtime revision chain with an optional parent revision |
| `runtime_lineages` | Parent–child Runtime relationships without deleting either Runtime through lineage alone |
| `runtime_artifacts` | Stage outputs and other typed Runtime artifacts |

JSON values are stored as `TEXT` and protected with `json_valid()` checks. The
schema uses foreign keys and explicit delete actions; D1 enforces foreign keys
by default.

## Delete behavior

Deleting a Runtime deletes its own Events, Snapshots, Revisions, Artifacts, and
Lineage edges. It does not delete another Runtime connected by a Lineage edge.

Deleting a parent Revision sets the child's `parent_revision_id` to `NULL`, so
the remaining Revision stays readable instead of being deleted accidentally.

Deleting a `runtime_users` row deletes the Runtime records owned by that user.
This supports the future M2-W8 account deletion boundary; authentication and
authorization are not implemented in M2-W3.

## Indexes

The schema indexes the required access paths:

- Runtime by `user_id`, `current_stage`, `status`, and `created_at`;
- Event by `runtime_id`, `event_type`, and `created_at`;
- Snapshot by `runtime_id`, `stage`, and `created_at`;
- Revision by `runtime_id`, `parent_revision_id`, and `created_at`;
- Lineage by parent or child Runtime;
- Artifact by Runtime or artifact type.

Primary-key fields already receive unique indexes from SQLite and are not
duplicated manually.

## Existing Migration boundary

The repository already contains:

```text
db/migrations/0001_platform_foundation.sql
```

It is immutable. Creating another `0001_initial_runtime.sql` would produce a
duplicate migration version. Therefore the frozen M2-W3 registry reserves:

```text
db/migrations/0002_initial_runtime.sql
```

M2-W4 must generate that file from the frozen schema and must not alter
`0001_platform_foundation.sql`.

## D1 binding boundary

The production binding remains:

```text
RUNTIME_DB
```

No placeholder `database_id` is added to `wrangler.jsonc`. M2-W4 supplies the
numbered migration, Runner, and deployment checks. Creating the real D1
database, adding its real ID, and applying the migration remain explicit
Cloudflare production actions.

## Verification

`scripts/check-runtime-d1-schema.mjs` executes the legacy foundation and the
new schema in an in-memory SQLite database, then checks:

- all seven tables and every frozen column;
- JSON constraints;
- foreign keys and delete actions;
- Revision and Lineage behavior;
- required indexes;
- M2-W2 D1 Driver column alignment;
- absence of a duplicate `0001` migration.

Run:

```text
npm run check:runtime-d1-schema
npm run check
```

Expected result:

```text
✓ M2-W3 Runtime D1 tables, JSON constraints, foreign keys, cascades, Driver alignment, and indexes passed.
```
