# KAU-E1｜Legacy Unified Language Reconciliation

## Scope

KAU-E1 turns the two registered Unified Language legacy manuscripts into a governed reconciliation queue without changing Canonical Knowledge Authority.

```text
KAU-E0 registered supporting sources
↓
KAU-E1A section inventory
↓
KAU-E1B concept / terminology inventory
↓
KAU-E1C existing 716-node candidate matching
↓
KAU-E1D cross-book reconciliation candidates
↓
KAU-E1E human review queue
↓
KAU-E2 (later) extension acceptance / freeze
```

### Non-authority rule

All node matches in KAU-E1 are candidates only. Similarity scores do not create canonical relationships, ownership, Meaning, production readiness or publication state.

### Source basis

- Unified Language Part 1: 494-page legacy manuscript.
- Unified Language Part 2: 429-page legacy manuscript.
- Both remain `supportingOnly=true`.

### Matching method

The first candidate pass is deterministic character n-gram TF-IDF over legacy TOC section titles versus the 716 current Canonical Node titles. It is deliberately conservative and is only a queueing aid for human review.

### Human review

Every candidate requires review for duplicate mechanism, boundary overlap, cross-book relationship, ownership, supporting-vs-canonical status and terminology consistency.

### Freeze boundary

KAU-E1 is an acceptance checkpoint, not KAU-E2. No final supporting relationship is frozen in this package.
