# M1-W7 Schema Reference Cleanup

Status: **Complete**

## Boundary

This cleanup changes metadata and validation only. It does not add a Runtime Stage, change a frozen Runtime field, or alter customer evidence.

## JSON Schema rule

`$schema` is reserved for an actual JSON Schema URI. It may contain either:

- a valid HTTP or HTTPS Schema URI; or
- a relative path to an existing JSON Schema file.

PHI OS internal Contract identifiers such as `phi-os.runtime-bug-register.v1` are not Schema locations. Registry documents store those identifiers in `schema_id`.

## Book Manifest

`data/schemas/book-manifest.schema.json` is the canonical content-complete Book Manifest Schema. Both the canonical Book 1 manifest and the Registry copy reference that file through resolvable relative paths.

The Schema preserves the content-complete manifest structure, localized titles, Part definitions, G1–G16 Grammar entries, Figure count, and canonical data references.

## Automated guard

`scripts/check-schema-references.mjs` verifies:

- internal Registry IDs do not use `$schema`;
- every local `$schema` reference resolves to valid JSON;
- absolute local Schema paths are forbidden;
- the Book Manifest Schema identity and draft remain frozen;
- both Book 1 manifests retain all required fields;
- G1–G16 remain ordered and complete; and
- `figure_count` matches unique Part Figure references.

The guard is part of `npm run check` and must pass before Runtime v1 Freeze Audit closure.
