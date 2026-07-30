# PWS-I1-T02/T03 Object Registry and Schema Version

Status: **Passed / frozen**  
Baseline: `main@ada3dc9229af299573df02d0986c7d6ce6616b46`

## Numbering boundary

The previously delivered Identifier Contract used the programme label
`PWS-I1-T02`. The current programme instruction also assigns `PWS-I1-T02` to
Canonical Object Registry. Both artifacts remain valid and are distinguished
by unique Contract IDs and check names. No historical file is renamed or
deleted.

## Canonical Object Registry

`pws-canonical-object-registry-v1.json` registers the 35 Canonical Glossary
objects. Every object contains exactly the required fields:

`objectId`, `objectCode`, `canonicalName`, `displayName`, `definition`, `scope`,
`schemaVersion`, `status`, `introducedVersion`, `deprecatedAliases` and
`ownerModule`.

This is a PWS Contract artifact, not an entry in the existing Runtime/content
Registry. It therefore does not change the frozen Registry count.

## Schema version

All registry entries are introduced under:

```text
pws-v1
```

Backward-compatible additions may remain in `pws-v1` only when every previously
valid payload remains readable and its meaning does not change. A breaking
change requires `pws-v2`, explicit approval, compatibility adapter and
Migration assessment.

Migration is never inferred from a version label. It is a separate authorised
action and is required only when persisted data, identity, relationships,
constraints or ownership transfer demand it. Applied Migration files remain
immutable.

Deprecation forbids new Legacy writes, preserves declared read compatibility
and cannot silently remove a name before `pws-v2`.

Schema Validation runs before persistence or side effects. UI, API and Provider
output cannot bypass validation or invent a schema version.

## Preserved boundaries

- Runtime Schema Registry remains authoritative for Runtime.
- Existing Commerce and Financial schemas remain under their current owners.
- No business module, generator, API, page or persistence implementation is
  added.
- Content Registry remains 48, Runtime Contracts remain 20 and Migrations
  remain 4.
