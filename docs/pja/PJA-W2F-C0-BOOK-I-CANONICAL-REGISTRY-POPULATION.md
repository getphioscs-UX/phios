# PJA-W2F-C0｜Book I Canonical Registry Population

## Responsibility

This stage converts the 65 Book I Blueprint-only Canonical Nodes into legal Registry Inventory. It does not produce articles and does not establish Production Readiness.

```text
Book I Blueprint 78
↓
Canonical Registry 78
```

The existing `PJA-W2F-B1` Preface Pilot remains unchanged. `check:pja-w2f-c0` is an independent stage command and does not expand the meaning of `check:pja-w2f-b1` or the dependency of `PJA-W2F-B2`.

## Authority model

```text
Blueprint Identity
+
PJA-W2F-C0 Population Policy
+
Collection / Theme Policy
+
Existing Source and Supporting Question Registries
↓
Canonical Node Record
```

Book and Part membership continues to be resolved from the Book I Blueprint by `nodeCode`. No `bookCode`, `partCode` or `blueprintIdentity` field is added to Canonical Node records.

## Commands

Dry-run:

```powershell
npm run knowledge:sync-registry -- BOOK-1
```

Apply:

```powershell
npm run knowledge:sync-registry -- BOOK-1 --apply
```

Acceptance:

```powershell
npm run check:pja-w2f-c0
npm run check
```

## Source and Supporting Question boundary

Only already registered mappings may be bound. Missing mappings remain explicit:

```text
sourceReferences: []
supportingQuestionCodes: []
```

The synchronizer never creates `SRC-BOOK1-P1` through `SRC-BOOK1-P5`, never invents Supporting Questions, and never edits Source or Supporting Question Registries.

## Completion state

```text
Blueprint Nodes          78
Registered Nodes         78
Blueprint-only Nodes      0
zh-Hans Identity         78
Schema Extensions         0
Sources Fabricated        0
Questions Fabricated      0
Articles Created          0
Readiness Created         0
Approvals Changed         0
Publication Changed       0
```

The Export acceptance for this stage is limited to the removal of `NODE_NOT_FOUND` for a newly registered Book I node. Later gates may still correctly block export.
