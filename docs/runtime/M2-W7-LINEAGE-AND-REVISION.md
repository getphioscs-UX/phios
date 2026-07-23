# M2-W7 Lineage and Revision

Status: implemented and structurally verified.

## Frozen Semantics

| User action | Runtime result | Revision result | Lineage result |
| --- | --- | --- | --- |
| Edit | Same Runtime | New Revision | No new edge |
| New Journey | New independent Runtime | Empty chain | No new edge |
| Branch | New child Runtime | Independent chain | Parent → child branch edge |

All three actions require explicit user initiation.

## Revision Chain

Each Edit writes one append-only `runtime_revisions` record. Its
`parent_revision_id` points to the latest Revision from the same Runtime. The
Runtime state is updated and a `revision.created` Timeline event and Snapshot
are appended. Earlier Revision records are not replaced.

## Parent–Child Runtime

Branch creates a new Runtime and a `runtime_lineages` relationship with
`relationship_type = branch`. Parent data is not automatically copied into the
child as established fact. The child stores only a reference context with
`reference_only = true` and `inherited_as_fact = false`.

New Journey creates an independent Runtime and therefore writes no Lineage
edge.

## Lineage Viewer Data

`buildViewerData()` produces:

- Runtime nodes;
- Parent–child edges;
- Revision chains;
- current Revision references;
- root Runtime markers.

It does not expose Runtime state values, Revision values, Entry text, or other
sensitive payloads. This data will later feed My Reality.

## D1

M2-W7 uses the already deployed `runtime_revisions` and `runtime_lineages`
tables. It does not alter `0002_initial_runtime.sql` and requires no new
Migration.

## Acceptance

Run:

```bash
npm run check:runtime-lineage-revision
npm run check
```
