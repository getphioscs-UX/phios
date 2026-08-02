# PJA-W3R2｜Governed Editorial Generation

## Stage

`PJA-W3R2-v1.0.0-Frozen`

## Baseline

Implementation baseline: `main@c428599d563cb4c98ca47ec99415ba93748d2e67` (`EXP-W4A`). W3R1 files remained present, while EXP-W4A had removed their package command entries; W3R2 restores those entries without changing W3R1 command semantics.

## Purpose and non-scope

W3R2 deterministically projects frozen authority into a governed prompt, isolates manually supplied ChatGPT output as a Candidate, reviews and compares that Candidate, and permits only TL to promote it into the human Working Draft. It does not generate Canonical Thesis, Boundary, Claims or Sources; call a Provider; approve editorial content; produce a Figure Asset, Production Export or Publication.

## Authority flow

Canonical Registry + C2 frozen Thesis/Boundary + C3 production readiness + W3A Package + W3R1 Style Bible and Article Archetype + approved source reference → governed prompt → manual AI Candidate → automated review and diff → TL selection → Working Draft. Candidate files are derived, replaceable and never authority. Reverse writes into C2, C3, Registry, Blueprint, Claims or Sources are forbidden.

## Manual ChatGPT workflow

1. Generate the prompt: `npm run knowledge:generate -- KN-PREFACE-001 --apply`.
2. Copy all of `content/knowledge/production/kn-preface-001/prompt.md` into ChatGPT.
3. Ask ChatGPT to return only the complete Markdown Candidate and save it as a local `.md` file.
4. Import it without touching the Working Draft: `npm run knowledge:import-candidate -- KN-PREFACE-001 --file "<PATH>" --apply`.
5. Compare it: `npm run knowledge:compare -- KN-PREFACE-001`.
6. Read `candidate-review.json` and `candidate-diff.json`, then decide accept or reject.
7. Promote an accepted Candidate: `npm run knowledge:promote-candidate -- KN-PREFACE-001 --reviewer TL --decision accepted --apply`. Reject with `--decision rejected`; rejection preserves `draft.md`.
8. Run `npm run knowledge:review -- KN-PREFACE-001`.
9. Complete the required Figure through its separate governed production stage.
10. Apply Human Editorial Approval with the existing approval command only after all blockers close.
11. Export only after approval and all export gates pass.

## Prompt contract

The prompt records node identity, language, archetype, Canonical Thesis and mechanism, necessity, system role, continuity, article and claim boundaries, approved claims and sources, Supporting Questions, Figure Decision, Style Bible, transformation permissions and output rules. Source material is wrapped as untrusted editorial content; instruction-like text inside it cannot override the governed prompt. Prompt generation is dry-run by default, deterministic, idempotent and has `providerInvocation = disabled`.

## Candidate import, review and diff

Import accepts a non-empty UTF-8 Markdown file below the size limit, rejects executable HTML, path injection, internal codes and unknown Figure placeholders, and requires `--replace-candidate` before replacing different content. Review checks Canonical fidelity, Boundary, Claims, Sources, Style, duplication and Figure placement. Diff stores structured section, claim, source, boundary, style and paragraph changes rather than a second full-text copy.

## Candidate promotion and human boundary

Promotion defaults to dry-run and requires a named human reviewer plus `accepted`, `accepted_with_manual_edits` or `rejected`. Accepted promotion atomically updates only the Working Draft and derived review/package state, increments `draftVersion`, makes prior editorial approval stale and records a non-authoritative Style Learning Candidate. Candidate acceptance is not Human Editorial Approval. Rejection records the decision and preserves Candidate and Draft.

## Figure, Provider and security boundaries

The required Figure finding remains open until a separate Figure Asset stage completes. A safe Figure placeholder may identify only a Figure in the official brief. W3R2 never calls OpenAI API, Workers AI, browser automation or another text provider. Source prompt-injection markers block generation, and imported Candidate security checks reject scripts, executable URLs, embedded objects and hidden privilege-escalation instructions.

## Version contract

Prompt, Candidate, Draft, Review, Approval, Export and Publication have distinct versions. Identical generate/import/compare operations are no-op. Authority, Style, Archetype, Package or source changes make the previous prompt and Candidate stale and block promotion.

## Wave generation and 300+ scale strategy

Wave generation prepares prompts and reports missing Candidates without calling AI, promoting, approving, exporting or publishing in bulk. Limits remain Pilot 1, Wave 1 up to 8, Wave 2 up to 12 and Mature up to 24. Generation manifests are derived projections from node files and never become a second Production Registry.

## Acceptance and final state

The Pilot has a governed prompt and no fabricated Candidate. Its existing Working Draft remains byte-identical, Human Editorial Approval is absent, the required Figure is missing, and Export and Publication remain blocked. W3R2 freezes governed prompt generation, Candidate isolation/import/review/diff, human promotion and the provider-disabled contract—not an approved or published article.
