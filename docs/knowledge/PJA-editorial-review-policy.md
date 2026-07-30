# PJA Editorial Review Policy

## Review dimensions

Every Article Review record contains:

| Dimension | Core question |
| --- | --- |
| Canonical | Does the Article preserve the Node's question, thesis, boundary and next Node? |
| Factual | Are facts, dates, technical descriptions, causality and qualifications accurate? |
| Source | Do real, reviewed sources support the precise Claims, including contrary evidence? |
| Boundary | Does the Article avoid paid-content leakage, case advice and professional overreach? |
| Language | Is Chinese natural, consistent and free of advertising, translation or paper-like prose? |
| Readability | Can the public follow the opening, progression, rhythm and internal terms? |
| Cross-node | Does the Article avoid duplication and premature answers to later Nodes? |
| Continuity | Do the ending, connection and `next_node` agree with the Registry? |
| Visual | Is every registered visual explanatory, accurate, accessible and localizable? |
| Localization Readiness | Is Chinese stable and structurally safe to localize without semantic drift? |

`not_applicable` must be explicit. A missing dimension is not a bypass.

## Reviewer identity and authority

Reviewer types are `human`, `ai_assistant`, `automated_validator` and
`system`. AI suggestions remain attributed to AI. Validators report structural
results. System identity records automatic transitions only.

Canonical, Factual, Source, Boundary, Final Editorial and Publication approval
are human-only. `approved`, `conditionally_approved`, `rejected` and
`accepted_risk` require real human evidence. Never invent a person, date or
editorial board.

## Findings

Findings record severity, category, Article/Block/Claim location, description,
required action, status and resolution evidence.

- `critical` blocks approval until verified, withdrawn by a human, or accepted
  as risk by a human.
- `major` must be addressed and independently verified before publication.
- `minor` may be treated as blocking or non-blocking by a human.
- AI cannot close a critical Finding or accept risk.

## Version binding

Review binds to Article, Claim set and Source set versions. Hash fields are
reserved for workflows that calculate immutable content hashes. Body wording,
Claim wording or source replacement invalidates the affected decision; the
same filename does not preserve approval.

## Human workflow

1. ChatGPT creates an Article draft from the Production Brief.
2. ChatGPT drafts a Claim dossier and candidate sources.
3. A human or controlled research process verifies sources.
4. Automated validation checks structure and illegal state combinations.
5. Humans perform Canonical, Factual, Source and remaining reviews.
6. ChatGPT applies changes requested by Findings.
7. Humans verify resolutions and record the final decision.
8. A human moves the Article to publication-ready and separately authorizes
   publication.
9. Only then may commit, push, deploy and production retest occur.

A ZIP, a GitHub file, a passing Cloudflare build or a reachable page is not
evidence of editorial approval.
