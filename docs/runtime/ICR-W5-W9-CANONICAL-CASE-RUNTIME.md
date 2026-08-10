# PHASE ICR v2 — ICR-W5–W9 Canonical Case Runtime

Status: `ICR-v1.0.0-FROZEN`

Baseline: `1e99186e5bc5fafa705f61cc15ef57370bec07e9`

## Result

ICR now owns the immutable Canonical Case envelope that groups eligible Verified Input references for a bounded purpose. A Case is neither Reality nor Runtime state. It contains no Customer DB record, Account Record, raw input payload or Method-owned copy of a Shared Data fact.

| Concern | Authority |
| --- | --- |
| Canonical Input, verification decision and Canonical Case | ICR |
| Verified shared facts | Shared Data Authority |
| Persistence, consent, retention and deletion | RDG |
| Reality v1 and later Reality state | RMO |

## W5 — Canonical Case Runtime

The Canonical Case is an immutable `REALITY_INPUT_RECORD` snapshot. It contains Case identity, version lineage, eligible Verified Input references and RDG lifecycle references. The initial validation snapshot is `READY_FOR_RMO`.

The W5 runtime is deterministic and fail-closed. It does not create a database, persistence entitlement, Evidence, Reality or Runtime state.

## W6 — RDG integration

Legacy ICR Privacy and Retention ownership is formally `MOVED_TO_RDG`.

ICR retains references to:

- the RDG persistence class and external persistence decision;
- the RDG consent class and consent reference;
- the RDG retention class;
- the RDG deletion state and deletion contract.

ICR does not copy policy entries, grant consent, decide persistence, extend retention, execute deletion or create tombstones.

## W7 — Canonical Reality initialization

The completed handoff is:

`Verified Inputs → Canonical Case → Reality Initialization Request → RMO acceptance → Reality v1`

ICR produces only the initialization request. RMO remains the sole owner of Reality identity and `RUNTIME_STATE_RECORD`. This work does not implement RMO or create a Reality object.

## W8 — Case versioning

Every revision produces a new immutable snapshot with:

- stable `caseCode`;
- increasing semantic `caseVersion`;
- monotonic `caseVersionSequence`;
- explicit previous version digest;
- controlled state transition and change reason;
- deterministic new `caseDigest`.

Previous snapshots are never mutated or rewritten.

## W9 — Acceptance and Freeze

ICR-W0–W4 files are protected by a SHA-256 byte-preservation manifest. W5–W9 closes the Case and RMO handoff contracts while keeping persistent Case storage, database migrations, RMO execution, Reality creation, Provider/AI authority and user-data population disabled.

Run the standalone checker before package wiring:

```bash
node scripts/check-icr-w5-w9-canonical-case-runtime.mjs
```

`package.json` is deliberately excluded from this delivery to avoid conflicts with parallel ALR work. Follow the separate manual wiring note after merging both deltas.

