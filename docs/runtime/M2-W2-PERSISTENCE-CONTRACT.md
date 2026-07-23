# M2-W2 Persistence Contract

Status: **Complete**  
Boundary: **Persistence abstraction only; D1 schema begins in M2-W3**

M2-W2 introduces one persistence interface for every Runtime storage driver.
It does not add a Runtime Stage, create D1 tables, bind a database, or migrate
the current browser snapshot automatically.

## Canonical interface

`functions/runtime/persistence/persistence-contract.js` freezes eight
asynchronous operations:

```text
create()
read()
update()
delete()
list()
appendEvent()
saveSnapshot()
loadSnapshot()
```

Runtime, Event, and Snapshot records use the frozen snake_case identifiers:
`runtime_id`, `user_id`, `event_id`, `snapshot_id`, and `schema_version`.

## Driver selection

`functions/runtime/persistence/persistence-router.js` selects exactly one
driver:

| Environment | Driver | Use |
| --- | --- | --- |
| `test` | `memory` | Isolated automated checks |
| `development` | `local` | Browser Storage or an injected local adapter |
| `production` | `d1` | Cloudflare D1 through `env.RUNTIME_DB` |

Production never falls back to Local or Memory storage. If `RUNTIME_DB` is
missing, Router creation throws `persistence_binding_missing`; this prevents a
successful-looking response whose Runtime was never durably saved.

## Driver responsibilities

### Memory Driver

Provides deterministic CRUD, Event, and Snapshot behavior for tests. Deleting
a Runtime also removes its in-memory Events and Snapshots.

### Local Driver

Persists the same records as JSON under `phiOSRuntimePersistenceV1`. A
Storage-compatible adapter can be injected for browser or development use.
Invalid stored JSON fails closed and is not silently discarded.

The pre-existing `assets/js/modules/runtime-persistence.js` remains an M1
browser compatibility layer. M2-W2 does not delete or rewrite it.

### D1 Driver

Uses D1 prepared statements and the future M2-W3 tables:

```text
runtimes
runtime_events
runtime_snapshots
```

The driver expects `runtimes.state` to store the canonical Runtime state as
JSON. M2-W3 must create the matching columns, foreign keys, and cascading delete
rules. Until that migration and the `RUNTIME_DB` binding exist, the D1 Driver is
implemented but not production-ready.

## Cloudflare configuration boundary

Do not add a placeholder database ID to `wrangler.jsonc`. In M2-W3, create the
D1 database first, then add or download the real Pages configuration using the
binding name:

```text
RUNTIME_DB
```

Pages Functions obtain this binding from `context.env.RUNTIME_DB`.

## Verification

Run:

```text
npm run check:runtime-persistence-contract
npm run check
```

Expected M2-W2 result:

```text
✓ M2-W2 Persistence Contract, Router, Memory, Local, D1, and environment selection checks passed.
```
