# PWS-I9 Rule Engine Foundation

Status: **PWS-I9-Rule-Engine-Foundation-v1.0.0-Frozen**  
Programme: **PHASE 4 — Free Explore Foundation**  
Step: **4.2**  
Baseline: `getphioscs-UX/phios` `main@e52a1d154291d51737d837226439bd2ddd8cd9a2`

## Foundation decision

PWS-I9 provides a deterministic, rule-first routing projection for public
questions. It reads existing PKR, PJA-W1 and Book I Blueprint sources and does
not create another Knowledge Registry, publish unpublished content, invoke a
Provider, or form a case judgment.

The foundation classifies only to the level supported by the question and the
existing sources. A question that cannot be classified is returned as
`unclassified` with empty matches and zero confidence.

## Required output

Every evaluation returns:

```text
questionId
detectedThemes
complexityLevel
matchedConcepts
matchedResources
observationPrompts
individualAnalysisRequired
professionalResponsibilityRequired
routingBoundary
confidence
```

`questionId` is an input reference or a deterministic ephemeral identifier. It
is not a canonical Question Route identifier and is not persisted.

## Complexity

| Level | Boundary |
| --- | --- |
| 1 | simple public knowledge or unclassified question |
| 2 | multi-concept knowledge or unpublished/planned knowledge boundary |
| 3 | personal decision requiring individual analysis |
| 4 | personal high-impact question requiring professional responsibility |
| 5 | urgent or emergency professional boundary |

Complexity is a routing signal only. It is not a diagnosis, risk score,
professional opinion or service recommendation.

## Routing boundaries

```text
public_knowledge
free_observation
individual_analysis_required
professional_responsibility_required
unclassified
```

Only reviewed and published locale assets can appear in `matchedResources`.
Canonical Registry presence or Book I Blueprint planning does not create a
production or publication requirement.

## Prohibitions

The Rule Engine must not:

- default-recommend a specific Service;
- form an individual or case judgment;
- invoke a high-cost or case Provider;
- force a classification when evidence is insufficient;
- persist a formal Question Route;
- create Journey, Evidence, Assignment, Queue or Professional Responsibility;
- promote unpublished knowledge into a public resource.

## Preservation

This step adds no API endpoint, D1 migration, Product, Offer, Price,
Entitlement, Consent, Runtime state, Provider invocation, Provider usage or
Provider cost record. Existing Core Runtime Entry and Provider adapters remain
unchanged.

## Acceptance

Run:

```text
npm run check:pws-i9-rule-engine
```

The gate evaluates published PKR/PJA-W1 knowledge, an unpublished Theme, an
unrelated question, a personal decision question and a high-impact medical
question. It also verifies the frozen output shape, publication gate,
non-forced classification and Provider/Service/Runtime preservation.
