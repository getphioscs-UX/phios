# PHI OS ALR-W36～W41 Presentation

Baseline: `main@9f6642e753fe381ff0e6deb8cb4b2858df9f3966`

Status: frozen validation-presentation runtime. The Academy Dashboard and Lesson Experience are presentational projections; Canonical Presentation creation, Published Asset creation, Academy delivery and learner-data persistence remain inactive.

## Closed work

- **ALR-W36 CPR Academy Contract:** binds ALR learning semantics to the frozen CPR `ACADEMY` surface and existing CPR presentation types. ALR may construct a presentation request, but only CPR can own Canonical Presentation and only CAR Published Assets can satisfy its publication gate.
- **ALR-W37 Academy Dashboard:** presents one Program, five Paths, five Lessons and ten Objectives. Missing Progress remains `NOT_PROVIDED`; the dashboard does not infer `NOT_STARTED`, select a next Lesson, enrol, unlock, complete or recommend.
- **ALR-W38 Lesson Experience:** presents one registered Lesson, its localized Objectives and Published Knowledge source lineage. Teaching, Practice and Assessment remain clearly labelled definition/reference states; no response or result is captured.
- **ALR-W39 Responsive Academy:** maps compact, standard, expanded and print-fixed modes to the frozen CPR/PDS responsive contracts. Semantic order and boundary visibility remain stable at the 360, 768 and 1440 acceptance widths.
- **ALR-W40 Accessibility:** closes skip links, landmarks, one-H1 structure, heading and reading order, keyboard operation, visible focus, 44px target references, non-colour state signals, reduced motion, zoom/reflow and current-Lesson announcement.
- **ALR-W41 Locale Learning Projection:** supplies complete `en` and `zh-Hans` projections for all five Lessons and ten Objectives. Learning identity, order, state meaning and action hierarchy remain unchanged across locales.

## Presentation surfaces

- `/academy` — Academy Dashboard validation projection.
- `/academy-lesson?lesson=<lessonCode>` — read-only Lesson Experience validation projection.

The public surface uses the existing locale runtime and PDS token source. Locale changes rerender labels and learning projections without writing Progress, Assessment, Capability or Entitlement state.

## Authority boundary

- **ALR:** Learning structure, Objectives, Learning Capability semantics and Locale Learning Projection.
- **CPR:** Canonical Presentation, composition and render state.
- **CAR:** Published Learning Asset and publication state.
- **Published Knowledge Authority:** source Article authority.
- **PDS:** design variables, breakpoints, interaction and accessibility baseline.
- **RDG:** learning-data purpose, permission, persistence, retention and deletion.
- **runtime/entitlement:** canonical Academy Entitlement and access enforcement.

`Academy validation projection ≠ Canonical Presentation ≠ Published Asset ≠ Learning Progress ≠ Capability State ≠ Credential ≠ Professional authority`.

## Production gate

The CAR Published Asset Registry contains zero production publications at this baseline. Every Academy presentation therefore remains `VALIDATION_PROJECTION_SOURCE_ASSET_BLOCKED`. This work does not create a substitute publication, infer a released Lesson, or activate delivery.

## Baseline compatibility note

`VAP-W0` and `VAP-W1` appended their checkers after `check:wave1-production`. The earlier ALR-W33～W35 checker still required the pre-VAP tail. This package updates only that checker-order assertion; no ALR-W33～W35 contract, Registry, Runtime or Freeze artifact is changed.

ALR-W0 also froze the original `academy.html` orientation-page digest before Academy presentation was authorized. Its checker now accepts a changed Academy page only when the W36～W41 successor Freeze exists, includes `academy.html`, and confirms that CPR, CAR, PDS, RDG, Knowledge and Professional authorities remain unchanged. The original W0 audit record is preserved.

The legacy CPR-W0 audit also contains historical PDS content digests that had already drifted before this work. W36 validates the current frozen CPR contracts and boundaries without rewriting the CPR audit or any CPR freeze artifact.

The new `academy-lesson.html` page is registered through the existing post-freeze PJA Page Capability Extension as `validation_projection_delivery_inactive`, with `writeAuthority: none`; the frozen PJA-W0 record is not rewritten.

## Checker

```bash
npm run check:alr-w36-w41
npm run check:alr-presentation
```

Next governed work: **ALR-W42 RG Checker Integration**.
