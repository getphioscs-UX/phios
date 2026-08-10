# ALR-W10～W14 Learning Architecture

Baseline: `1e99186e5bc5fafa705f61cc15ef57370bec07e9`

Status: frozen structural semantics; Learning Delivery and learner-data persistence remain inactive.

## Canonical structure

- **ALR-W10 Program:** one `PHI OS Reality Navigation Formation` Program.
- **ALR-W11 Learning Path:** five ordered Paths aligned one-to-one with the five frozen `ALR-CAP-*` capabilities.
- **ALR-W12 Module:** five Modules, each owned by exactly one Path.
- **ALR-W13 Lesson:** five structural Lessons with explicit future-integration slots and activation gates.
- **ALR-W14 Learning Objective:** ten Objectives mapped one-to-one to the registered Capability evidence criteria.

The hierarchy is explicit and reciprocal:

`Program → Learning Path → Module → Lesson → Learning Objective`

Path prerequisites project the W6 Capability Dependency Graph. They do not grant Capability State, Academy Level, completion or access.

## Structural boundary

The W2 Learning Object Registry remains the frozen type authority. W10～W14 owner registries hold typed instances without mutating W2. Every registered object is `APPROVED` as structure and remains `STRUCTURE_ONLY` for delivery.

Lessons contain no Knowledge body, Teaching Explanation, Example, Case Study, Figure projection, Practice, Assessment, Published Asset or Presentation payload. Their integration arrays remain empty until the named owner works.

Objectives describe observable learning behavior but are not Assessment items, Capability Evidence or Capability State decisions.

## Cross-runtime boundary

- KPP Academy Need is a planning signal, not Program or Lesson authority.
- CAR Lesson Brief is an Asset Production object, not ALR Lesson Runtime.
- RDG governs future Learning Data; it does not own Learning Architecture semantics.
- ICR Canonical Input and Case data cannot be embedded in Program, Path, Module, Lesson or Objective definitions.
- Program registration grants no enrollment, Entitlement, Credential or Professional authority.
- CPR/PDS presentation and Academy surface work remain outside this scope.

## Checks

```sh
npm run check:alr-foundation
npm run check:alr-capability
npm run check:alr-learning-architecture
npm run check
```

The next permitted work is **ALR-W15 Knowledge-to-Learning Projection**.
