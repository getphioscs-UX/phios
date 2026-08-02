# KNR-W0–W2 Knowledge Runtime Foundation

## Baseline

- Repository: `getphioscs-UX/phios`
- Branch: `main`
- Baseline: `e2b3ed10568d9c0d1d6d1ca692bfd94a23d9b8bb`
- Audit date: 2026-08-02

## W0 finding

PJA currently governs Book → Canonical Knowledge → Candidate Production → Editorial Progress → Production Progress → Publication. It does not route a public question, rank nodes or fragments, evaluate answerability, or assemble an adaptive response.

The Canonical Registry contains 78 nodes. The public article store contains six approved and published localized assets representing three unique nodes in `zh-Hans` and `en`. Those assets contain 24 sections and 48 paragraph fragments. The Search Alias and Supporting Question registries currently contain no populated records.

The audit excludes 77 C2 candidates, 78 C3 assessments, all production packages and drafts, paid manuscript material, review records, readiness projections, Runtime records, and Professional notes. Existing Entry question routing and Provider code belong to Reality Runtime and do not constitute a public Knowledge Runtime.

## Authority boundary

Canonical Articles remain fixed, reviewable publication assets written through PJA. Adaptive Knowledge Projection is a transient, non-canonical reading assembled only from published-safe assets. KNR is read-only toward PJA authority and does not write Runtime, Journey, Professional, Provider, Payment, Entitlement, or Publication state.

## W1 contract

`public-knowledge-question.schema.json` freezes the bilingual ephemeral input envelope. The companion contract freezes length, sanitation, prompt-injection, duplicate, rate-limit, sensitive-data, personal/professional, persistence, Provider, and authority boundaries. W1 does not expose an API or public input.

## W2 index

The index builder reads only article JSON whose publication state is `published`, review state is `approved`, and content state is `content_reviewed`. It emits deterministic localized node, fragment, alias, question, relationship, and publication projections. Registry nodes supply identity and topology only after a published article establishes eligibility. Article sections and paragraphs are the only fragment text source.

Dry-run performs no writes. Apply uses atomic replacement, and identical output is a no-op. The generated index is disposable and rebuildable; it is not a second canonical authority.

## Explicitly deferred

Question routing, ranking, coverage evaluation, adaptive assembly, reading paths, API, public UI, fixtures beyond W0–W2, Provider projection, gap reporting, and publication integration remain outside this package.
