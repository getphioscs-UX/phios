# PJA Claim Governance Policy

## Purpose

A Claim is the smallest material assertion that needs identification,
traceability or review. It is not a paragraph store, a Canonical Node, a
Source, a Review record or a publication decision.

## Claim identity

Use `CLM-<NODE-CODE>-<NNN>`. Sequence numbers are unique within a Node, stable
across wording revisions and never reused. Deprecated Claims stay recorded.

Every Claim records a Node, locale, statement, type, section/block location,
usage, materiality, support requirement, source mappings, contrary evidence,
assessments and status.

## Types

- `externally_verifiable`: an external factual assertion. It normally needs
  direct, accessible evidence; high materiality prefers a primary source.
- `phi_os_interpretation`: a PHI OS theoretical interpretation. It requires
  Canonical traceability and must be identified as interpretation, not external
  consensus.
- `editorial_inference`: a bounded inference from stated material. It must not
  masquerade as fact and may need qualification.
- `mixed`: inseparable factual and interpretive portions. Split it when
  practical; otherwise record both portions and any partial support.
- `canonical_transition`: a controlled transition to the Registry next Node.
  It must not answer the next Node in full.
- `boundary_statement`: a concrete public knowledge or professional boundary.
  It cannot hide factual errors or act as a generic disclaimer.

## Materiality and usage

Materiality is `low`, `medium`, `high` or `critical`. Active high and critical
Claims require human approval before publication. Critical Claims cannot rely
only on general web material.

Usage is `direct`, `paraphrased`, `contextual`, `illustrative` or
`transitional`. A dossier contains only material Claims, not every sentence.

## Mapping

Structured Article Blocks may cite `sourceClaimCodes`. The validator checks
that the Claim exists, matches the Article Node and locale, and points to a
real section and Block. Claim Codes are internal and are not rendered.

Textual semantic equivalence is a human Canonical/Factual Review judgment; an
automated match of strings cannot prove meaning.

## Status and authority

Claim status is:

```text
draft | mapped | ready_for_review | changes_required
approved | rejected | deprecated
```

AI may prepare through `ready_for_review` and may revise under explicit human
direction. `approved` and `rejected` require a human reviewer ID and timestamp.
Missing evidence must remain unresolved; no Source Code, DOI, ISBN, author or
URL may be invented.
