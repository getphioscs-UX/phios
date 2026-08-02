# PJA-W2F-C0｜Book I Canonical Registry Population

## Stage and baseline

- Repository: `getphioscs-UX/phios`
- Baseline: `main@5f23d44060797b3eb5d0d6b7f3a5e339b6ba9217`
- Baseline message: `KH-W3.5H｜Universal Knowledge Blueprint Schema v2`
- Stage: `PJA-W2F-C0｜Book I Canonical Registry Population`

## Scope

C0 registers the 65 Book I Blueprint-only Canonical Node identities and their
`zh-Hans` localized identities. It preserves the existing 13 Preface records,
so the final Canonical Registry covers exactly the Blueprint's 78 Node Codes.

C0 does not create Readiness Skeletons, Canonical Theses, Article or Claim
boundaries, Sources, Supporting Questions, Articles, approvals, publication
state, public projections, Runtime records, Provider calls, Payment,
Entitlement or D1 writes. Registry presence is not Production Readiness, and
Blueprint presence is not a production requirement.

## Authority hierarchy and population policy

```text
Blueprint identity and explicit sequence
+ independent C0 Population Policy
+ existing Collection and Theme Registries
+ existing explicit Source and Supporting Question ownership
→ Canonical Registry identity
```

The target set is the exact difference between the 78 Blueprint Node Codes and
the 13 existing Preface Node Codes. Existing Preface records are preserved.
Collection and Theme references must already exist; the synchronizer never
creates either registry. Source and Supporting Question mappings are accepted
only when explicitly owned by their existing registries. Missing mappings are
legal empty arrays and are reported as unresolved. Relationships are limited to
explicit Blueprint Previous/Next sequence plus policy-declared Related targets.
Conflicts block the complete apply before any write. Apply uses deterministic
sorting and atomic replacement of only the Node and Localized Identity files.

## Target set

| Blueprint part | Exact target Node Codes | Count |
|---|---|---:|
| P1 | `KN-B1-P1-001`–`KN-B1-P1-012` | 12 |
| P2 | `KN-B1-P2-001`–`KN-B1-P2-013` | 13 |
| P3 | `KN-B1-P3-001`–`KN-B1-P3-015` | 15 |
| P4 | `KN-B1-P4-001`–`KN-B1-P4-012` | 12 |
| P5 | `KN-B1-P5-001`–`KN-B1-P5-013` | 13 |
| Total | Blueprint-only targets | 65 |

## Assignment and mapping result

All 65 Nodes use pre-existing Collection and Theme records: `KC-BOOK1-P1` to
`KC-BOOK1-P5` and `TH-BOOK1-P1-01` to `TH-BOOK1-P5-01`. All assignments pass
the Theme-to-Collection ownership check.

Previous/Next mappings follow the explicit 78-Node Blueprint sequence. Related
mappings are zero because neither the Blueprint nor the C0 policy explicitly
declares any for these targets. There are no self-references, duplicates or
dangling targets.

Explicit Source mappings are zero; unresolved Source mappings are the complete
65-Node target set and remain `sourceReferences: []`. Explicit Supporting
Question mappings are zero; unresolved Supporting Question mappings are the
complete 65-Node target set and remain `supportingQuestionCodes: []`. No Source,
Question or ownership was inferred or created.

## Synchronizer contract and results

```powershell
npm run knowledge:sync-registry -- --dry-run
npm run knowledge:sync-registry -- --apply
```

No argument and `--dry-run` are read-only. Only `--apply` writes. The first
authorized apply normalized the prior over-broad C0 records by removing
Blueprint-derived `requiredPublicLanguages` and `publicationPriority`, along
with production queue/effort, asset/derivative policy, and localized content,
review, approval/publication and article-asset fields. The records now contain
Registry identity only. A second apply is a byte-stable no-op and the following
dry-run reports zero files that would change.

Fixture acceptance proves that default dry-run and explicit dry-run preserve
hashes, clean apply populates 65 missing identities, second apply is a no-op,
unresolved mappings remain empty and non-blocking, and a missing Theme conflict
returns a non-zero status without partial writes. Conflict entries contain
`code`, `nodeCode`, `field`, `currentValue`, `proposedValue`, `authoritySource`
and `resolutionRequired`.

## W2F-A compatibility

W2F-A now distinguishes 78 registered Canonical Node identities, the 13-Node
Preface Readiness pilot, and 65 Registry-present but production-deferred Nodes.
It does not execute or depend on C0 and does not require the 65 Nodes to have
Readiness. C0 independently proves that every target resolver result is beyond
`NODE_NOT_FOUND`; later readiness errors remain legal.

## Protected topology and historical naming conflict

`check:pja-w2f-b1` remains byte-identical and directly follows W2F-A.
`check:pja-w2f-b2` remains byte-identical and directly follows B1. C0 is an
independent branch that directly follows B1; it is absent from the Preface B2
production chain.

Historical commands named C1/C2/C3 still describe the old article-production
pilot, universal batch infrastructure and registered-ready production stages.
Historical C0A/C0B documents also remain in the repository. They were not
renamed or deleted because they do not block C0. A separately approved topology
migration should archive or alias those historical names before the new
Readiness C1/C2/C3 stages are implemented.

## Acceptance

The acceptance set is `check:pja-w2f-a`, `check:pja-w2f-b1`,
`check:pja-w2f-b2`, `check:pja-w2f-c0`, the actual package command
`check:kh-w3.5g`, the KH-W3.5H checker (no package alias exists at this
baseline), and the complete `npm run check`, plus the explicit
dry-run/apply/idempotency sequence.

All C0, PJA and KH checks pass. The complete check reaches the unrelated
baseline failure in `scripts/check-runtime-security-privacy.mjs`: the fixture
expects a different error code while the Runtime correctly throws
`security_professional_consent_required`. The same failure reproduces in an
untouched `main@5f23d44` worktree. Runtime/Security is outside C0 scope and was
not modified, so C0 cannot yet receive the frozen label.

```text
PJA-W2F-C0-v1.0.0-Conditional-Passed
```
