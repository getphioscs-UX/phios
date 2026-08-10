# ALR-W20～W23 Practice

Baseline: `e16f8e39ea09586833d848770c9d0eb042032144`

Status: frozen Practice content semantics; learner delivery, response capture, Assessment, Capability Evidence and learner-data persistence remain inactive.

## Canonical chain

The phase extends each of the five canonical Lessons with an additive learning chain:

`Knowledge → Lesson → Practice → Guided Practice → Synthetic Simulation → Reflection prompts`

- **ALR-W20 Practice Registry:** five structured, unscored Practice definitions specify tasks, learning-artifact requirements and self-check prompts.
- **ALR-W21 Guided Practice:** five static scaffold sequences use the fixed phases Orient, Model, Guided Rehearsal, Independent Rehearsal and Self Check. No learner profile, adaptive hint or provider call is used.
- **ALR-W22 Simulation Runtime:** five synthetic deterministic graphs expose both boundary-preserved and boundary-breached paths. Pure transition resolution returns static consequences and never creates a session, score, action or persisted trace.
- **ALR-W23 Reflection Runtime:** five governed prompt sets review the learning artifact and boundary. W23 defines prompts only; it does not collect, store or assess a response.

The new Practice binding registry is an additive overlay. W13 Lesson records and their empty future-integration arrays remain byte-preserved.

## Authority boundary

- Practice is not Assessment. A task, self-check, simulation path or reflection is not a score, criterion result or Capability Evidence.
- Learning completion cannot set Capability State or grant Credential, Entitlement, assignment or Professional authority.
- Simulations use only synthetic ALR Case Studies. They are not ICR canonical cases, Reality Evidence or professional records.
- Simulation resolution cannot recommend or execute a real-world action.
- Guided Practice is static and cannot infer a learner profile or call an external provider.
- Reflection prompts cannot require personal or sensitive disclosure. Any future response capture requires RDG permission plus sensitivity and retention classification.

## Runtime posture

Definition validation, reciprocal binding validation, lesson projection and static simulation transition resolution are active. Learner sessions, attempts, responses, scoring, adaptive guidance, provider/network calls, delivery surfaces and persistence are inactive and fail closed.

The W15～W19 checker now validates its `postcheck` commands as a unique ordered subsequence. This preserves the same governance order while allowing a parallel phase such as RMO to insert its own checker after ICR Runtime without breaking ALR checks.

## Checks

```sh
npm run check:alr-practice
npm run check:alr-knowledge-learning
npm run check:alr-learning-architecture
npm run check
```

The next permitted work is **ALR-W24 Assessment**.
