# RMO-W13-W15｜Reality Versioning, Diff and Freeze

Baseline: `94fd1887e75c4b4c95a9c2dc4fe010c3e350d0ec`

Status: `RMO-v1.0.0-FROZEN / VALIDATION_ONLY`

## Authority boundary

RMO owns immutable Reality snapshots, their version lineage, and deterministic structural comparison. RMO does not obtain Evidence, Meaning, Professional Judgment, Navigation, Action execution, Report, Presentation, persistence, consent, retention or deletion authority through versioning or comparison.

Every output remains an RDG-governed `RUNTIME_STATE_RECORD`. No production store, migration, network call, user-data population, Provider authority or AI authority is activated.

## RMO-W13｜Reality Versioning

Reality v1 remains immutable. A revision creates a new snapshot with:

- stable `realityCode`, subject, initialization and governance bindings;
- increasing semantic `realityVersion`;
- contiguous `realityVersionSequence`;
- exact previous Reality version and digest;
- a complete ordered ancestor reference chain;
- deterministic new `realityDigest`;
- controlled change type and explicit change references.

The versioned snapshot has eleven component lanes:

1. entities;
2. events;
3. signals;
4. relationships;
5. constraints;
6. states;
7. Evidence Bindings;
8. reasoning boundaries;
9. unknowns;
10. actions;
11. outcomes.

Each lane retains a code index for reading compatibility and a precise reference containing component code, semantic version, digest, and source Reality reference. Component dependency closure is fail-closed: a snapshot cannot include an Event without its Entities, an Outcome without its Action, or any component without its referenced RMO dependencies.

An Unknown is never mutated. `UNKNOWN_RESOLUTION_RECORDED` creates a new Reality version, removes or replaces the prior Unknown reference, and requires a new or replaced accepted RMO Evidence Binding. Silent defaults, inferred filling, Provider/AI resolution and historical rewriting remain forbidden.

## RMO-W14｜Reality Diff

Reality Diff compares two ordered snapshots of the same Reality lineage. The deterministic algorithm classifies exact component references as:

- `added`;
- `removed`;
- `replaced` — same component identity with a different version or digest;
- `unchanged`.

The Diff reports counts and changed component families. It does not explain why a change occurred, interpret its meaning, diagnose the subject, determine quality, claim causality, judge success or effectiveness, promote Evidence, create Professional Judgment, or select Navigation.

## RMO-W15｜RMO Freeze

The final freeze closes RMO-W0 through RMO-W15. A normalized `UTF8_NO_BOM_LF` SHA-256 preservation manifest covers every RMO W0-W14 authority and runtime artifact. CRLF conversion and a UTF-8 BOM do not create false drift; substantive content change fails closed.

RMO v1 is frozen with:

- immutable root and versioned Reality snapshots;
- Entity, Event, Signal, Relationship, Constraint and Reality State;
- Evidence Binding and reasoning authority boundary;
- Unknown, Action and Outcome representations;
- deterministic Reality Versioning and Reality Diff;
- all cross-runtime authority and non-activation boundaries preserved.

Run:

```bash
npm run check:rmo-w13-w15
npm run check:rmo
```

Next phase: `RRE-W0｜Authority Boundary`.
