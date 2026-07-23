# M2-W6 Runtime Timeline

Status: implemented and structurally verified.

## Canonical Source

M2 Timeline reads the append-only `runtime_events` table through the
Persistence Contract. The M1 browser Lineage view remains available for
session compatibility, but it is not the canonical persisted event source.

## Runtime Event Types

The customer journey event vocabulary is frozen at version `1.0.0`:

1. `runtime.created`
2. `entry.answer_added`
3. `entry.completed`
4. `reconstruction.generated`
5. `reconstruction.revised`
6. `reading.generated`
7. `navigation.generated`
8. `review.completed`
9. `memory.committed`
10. `continuity.started`
11. `revision.created`

Recovery and Provider infrastructure events are registered separately and are
not included in the customer projection.

## Append Service

The Event Append Service validates the Runtime ID, registered event type,
object payload, and current event version before delegating to Persistence.
New writes must use `1.0.0`.

## Reader

The Timeline Reader returns chronological, append-only events. Unknown types
or unsupported historical versions are isolated as bounded warnings so one
unreadable event does not prevent the rest of the Timeline from loading.

## Projection

The Timeline Projection converts canonical events into English or Simplified
Chinese customer-facing entries. It exposes fixed titles and summaries, not
raw payloads or sensitive Entry text.

## Versioning

Version `0.9.0` remains readable through an adapter that normalizes legacy
camelCase payload fields. All Reader results are returned as version `1.0.0`
while retaining `source_event_version` and `version_adapted`.

## Acceptance

Run:

```bash
npm run check:runtime-timeline
npm run check
```

M2-W6 does not add a Runtime Stage and does not overwrite M1 Lineage history.
