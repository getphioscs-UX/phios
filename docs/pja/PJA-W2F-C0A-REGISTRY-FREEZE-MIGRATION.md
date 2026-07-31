# PJA-W2F-C0A｜Registry Freeze Migration

## Purpose

Migrate historical checks from the obsolete invariant:

```text
Canonical Node Registry total = 13
```

to the current two-level invariant:

```text
Book I Canonical Node Registry total = Blueprint plannedCanonicalNodes
Preface Canonical Node Registry total = Blueprint prefaceCanonicalNodes
```

## Preserved boundaries

```text
Population ≠ Publication
Registry identity ≠ Article
Localized identity ≠ Published localization
PJA does not own Canonical Node creation
PWS Deliverable Type Registry does not mutate PKR
```

## Acceptance

```text
Book I Registry count             78
Preface Registry count            13
Deferred Wave 1 published assets   0
PJA-created Registry identities    0
PWS-created Canonical Nodes         0
Supporting Questions              23 unchanged
Blueprint Nodes                   78 unchanged
Readiness created                  0
Articles created                   0
```

Status remains pending until `npm run check` passes.
