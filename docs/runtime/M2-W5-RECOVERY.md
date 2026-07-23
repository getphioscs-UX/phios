# M2-W5 Runtime Recovery

Status: implemented and structurally verified.

## Contract

`phi-os.runtime-recovery.v1` coordinates recovery through the canonical
Persistence interface. Recovery is infrastructure behavior, not a new Runtime
Stage.

## Session Recovery

`recoverSession()` restores the Runtime identifier, current stage, latest
snapshot, state, and conversation without calling a Provider or regenerating a
completed result.

## Partial Write Recovery

`recoverPartialWrite()` reads Runtime events after the latest persisted event
cursor, replays their state changes, writes a replacement snapshot, updates the
Runtime record, and records `runtime.partial_write_recovered`.

The event cursor includes timestamp and event ID so an Event written in the
same clock tick as a Snapshot is not silently skipped.

## Provider Failure Recovery

Provider requests receive stable request IDs. Pending, completed, and failed
requests are recorded in the Runtime recovery ledger. A completed request is
served from the recovery cache. A pending or failed request is not called again
unless the user explicitly retries. Provider failure preserves all state and
stores only a bounded failure code.

## Page Refresh Recovery

Runtime browser contracts and request-state records are included in the local
snapshot. Reading and Navigation:

- reuse a compatible completed response;
- retain input through refresh;
- do not automatically repeat an interrupted request;
- expose explicit Retry as the only path to another request.

Entry, Reconstruction, Reading, Navigation, Review, Memory, Continuity,
Workspace, and revision contracts remain covered by browser snapshot recovery.

## Acceptance

Run:

```bash
npm run check:runtime-recovery
npm run check
```

The M2-W5 check exercises Session Recovery, same-timestamp Partial Write
Recovery, Provider success de-duplication, failure preservation, and browser
refresh guards.
