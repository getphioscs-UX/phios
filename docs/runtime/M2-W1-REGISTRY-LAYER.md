# M2-W1 Registry Layer

Status: **Complete**  
Boundary: **M1 frozen contracts → M2 executable infrastructure**

M2-W1 turns the M1 contract closure record into a queryable Runtime Registry
Layer. It does not add a Runtime Stage and does not implement persistence or
execute database migrations.

## Registry authorities

| Registry | Authority | Responsibility |
| --- | --- | --- |
| Contract | `functions/runtime/registry/contract-registry.js` | Query the 20 frozen Runtime contracts and their dependencies |
| Schema | `functions/runtime/registry/schema-registry.js` | Resolve canonical and backward-compatible schema IDs |
| Version | `functions/runtime/registry/version-registry.js` | Resolve supported semantic contract versions |
| Migration | `functions/runtime/registry/migration-registry.js` | Register readable baseline declarations for M2-W4 |
| Validation | `functions/runtime/registry/registry-validation.js` | Fail closed on invalid cross-registry references |
| Startup | `functions/runtime/registry/index.js` | Validate the layer when a canonical API module loads |

The M1 file `content/registry/runtime-contracts.json` remains the immutable
closure record. The M2 check compares every frozen Contract field against that
file, so the executable layer cannot silently redefine M1.

## Startup validation

The canonical Runtime endpoints import the startup entry before processing a
request:

- `/api/reconstruct-reality`
- `/api/read-runtime`
- `/api/navigate-runtime`

Validation fails closed for:

- duplicate Contract, Schema, Version, Migration, or schema-version IDs;
- missing or unsupported Contract versions;
- missing or mismatched Schema references;
- missing or mismatched Migration declarations;
- dependencies that are not registered Contracts;
- orphan Versions or Migrations;
- missing Schema authority declarations;
- invalid baseline or executable Migration metadata.

The Node verification also confirms that every Contract validator and Schema
authority file exists in the repository.

## Migration boundary

M2-W1 baseline declarations use:

```text
version: 0
kind: baseline-declaration
executable: false
migrationFile: null
```

They are not SQL migrations. M2-W4 will add ordered, executable migration
records with version `1` or above and a real migration file. Existing baseline
records must not be edited.

## Verification

Run:

```text
npm run check:runtime-registry
npm run check
```

Expected M2-W1 result:

```text
✓ M2-W1 Contract, Schema, Version, Migration Registries, M1 parity, and startup validation passed.
```
