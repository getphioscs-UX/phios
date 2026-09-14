# PHI OS Production Truth & Repository Consolidation — Master Work v1.1.0

Status: executable master plan  
Baseline: `getphioscs-UX/phios@f9ba2940fd80553686833e068e03a74e72a825d3`  
Programme: `PTRC-W0–W10`  
Release rule: no stage is frozen until its checks, deployment evidence, and rollback evidence pass.

## 0. Binding decisions

1. The GitHub `main` branch is the only source-code authority.
2. The production hostname, Cloudflare Pages project, Worker routes, and DNS records must be mapped to a recorded commit SHA.
3. `LOGO-003` is the preferred canonical visible brand mark.
4. `LOGO-009` and `LOGO-011` are valid monochrome variants for explicitly approved background contexts only.
5. The mathematical glyph `Φ`, a circle-and-stem approximation, text-made icon, emoji, or browser-generated fallback is forbidden as a PHI OS logo or favicon.
6. Article JSON remains the only production article-body authority. Renderers may not invent, duplicate, or migrate article bodies.
7. Book V manuscript source is not uploaded; manuscript extraction and Article production are incomplete.
8. Civilization Atlas layers 2–8 exist and may be retrieved where their registered entities and evidence are available. They are structured Atlas data, not proof that Book V manuscript or Articles exist.
9. ASK2/CKA must separate the user question from a structured retrieval scope.
10. Insufficient evidence must stop long-form generation and return a short, useful abstention.

## 1. Programme gates

Every work package must produce:

- a machine-readable inventory or contract;
- deterministic checks runnable from `npm run check` or a named subordinate command;
- valid and invalid fixtures;
- a change list and rollback procedure;
- browser evidence for user-visible changes;
- a signed acceptance record containing commit SHA, deployment ID, hostname, UTC time, and reviewer.

No package may pass by weakening an existing frozen validator, deleting expected fixtures, or changing expected counts without an explicit governed predecessor/successor release record.

## 2. Execution order

`W0 → W1 → W2 → W3 → W4 → W5 → W6 → W7 → W8 → W9 → W10`

W2–W5 form one Ask quality chain. W6–W7 form one UX acceptance chain. W8 and W9 may be implemented after W5 but cannot be exposed as complete until W7 browser acceptance and W10 cutover.

---

## PTRC-W0 — Production truth baseline

### Objective

Establish one verifiable map from repository files to builds, routes, runtime bindings, and public hostnames before modifying behaviour.

### Work

1. Record repository owner, repository name, default branch, baseline SHA, package manager, Node version, and deployment commands.
2. Enumerate Pages projects, Workers, custom domains, route patterns, DNS targets, build branches, output directories, environment variables, secrets, D1/KV/R2/AI bindings, cron triggers, and deployment hooks.
3. Build a route-consumer graph for `/`, `/knowledge/ask/`, knowledge Articles, financial runtime, will intake, report generation, APIs, assets, favicons, and service workers.
4. Identify duplicate route authorities, unreferenced deploy configs, stale generated output, copied assets, legacy logo fallbacks, and code that can deploy outside the governed pipeline.
5. Capture HTTP status, headers, favicon declarations, visible logo asset, Ask response mode, and deployment fingerprint for production and Pages preview.
6. Add the PTRC-W0 validator and run it before all later PTRC validators.

### Acceptance

- All baseline JSON files parse and identify `f9ba294…`.
- Production and preview origins are explicitly distinguished.
- Unknown secrets are recorded as `UNVERIFIED`, never guessed.
- Book V status and Atlas 2–8 status match the binding decisions.
- The validator rejects a mathematical-phi canonical logo, a false Book V completion claim, and missing route ownership.

### Outputs

- `ptrc-w0-repository-census-v1.json`
- `ptrc-w0-route-consumer-graph-v1.json`
- `ptrc-w0-deployment-evidence-v1.json`
- `ptrc-w0-environment-binding-audit-v1.json`
- `check-ptrc-w0-production-truth-baseline.mjs`

---

## PTRC-W1 — Brand asset and favicon cutover

### Objective

Remove all accidental `Φ` brand rendering and make logo selection deterministic across backgrounds, routes, metadata, and caches.

### Work

1. Create a strict asset registry with IDs, filenames, MIME types, dimensions, checksums, intended backgrounds, and permitted roles.
2. Bind `LOGO-003` to primary header, primary hero, Open Graph image composition, default app icon, and favicon source where legible.
3. Retain `LOGO-009/011` only for declared monochrome contexts; each use must name the background token and reason.
4. Generate favicon files from an approved logo asset: SVG if supported plus 16, 32, 48, 180, 192, and 512 pixel raster variants and `site.webmanifest`.
5. Replace literal `Φ`, pseudo-element logo glyphs, inline mathematical SVGs, stale favicons, and uncontrolled remote fallbacks.
6. Version asset URLs or manifests so Cloudflare/browser caches cannot keep the prior mark.
7. Add DOM and repository scans that fail if forbidden fallbacks appear in brand-bearing contexts.

### Acceptance

- Desktop/mobile headers, pinned tabs, browser tabs, install icons, error pages, Ask, Articles, financial and will routes show an approved asset.
- No production page uses a literal mathematical phi as identity.
- Direct asset URLs return 200 with correct MIME and immutable cache policy.
- A browser cache-clear test and a clean-profile test agree.

---

## PTRC-W2 — ASK2/CKA intent and scope separation

### Objective

Stop context strings from corrupting the question and make every retrieval decision inspectable.

### Contract

The request is split into:

```json
{
  "question": "string",
  "locale": "zh-Hans|en",
  "intent": "DEFINE|EXPLAIN|COMPARE|TRACE|CALCULATE|NAVIGATE|REPORT|CLARIFY",
  "retrievalScope": {
    "atlasEntityIds": [],
    "atlasLayers": [],
    "partIds": [],
    "knowledgeNodeIds": [],
    "articleIds": [],
    "timeScope": null,
    "jurisdiction": null,
    "allowedCollections": []
  },
  "answerPolicy": {
    "citationRequired": true,
    "minimumEvidence": 2,
    "allowBroaderKnowledge": true
  }
}
```

### Work

1. Remove concatenated UI context, route labels, selected chips, and prior answers from the raw query.
2. Add a deterministic intent classifier with multilingual fixtures.
3. Resolve selected UI context to IDs, never prose appended to the question.
4. Persist a trace containing normalized question, intent, scope, retrieval stages, gate result, and answer mode; redact personal data.
5. Make follow-up questions inherit only explicit structured scope and user-confirmed entities.

### Acceptance

- Identical questions with different navigation context retain identical question text but different scope objects.
- ASK2 and CKA routes use the same request schema.
- Unknown IDs fail closed; they are not treated as search terms.
- Chinese questions do not silently switch to an English insufficient-evidence response.

---

## PTRC-W3 — Atlas-to-knowledge retrieval chain

### Objective

Connect the existing Atlas material to evidence and controlled broader knowledge without fabricating unavailable Book V content.

### Retrieval order

1. Resolve Atlas entity.
2. Retrieve evidence bound to that entity.
3. Traverse registered Part 12 relations where present.
4. Retrieve broader governed Knowledge only when the scope and answer policy allow it.
5. Rank, deduplicate, and hand evidence to W4.

### Book V boundary

- Available: registered Civilization Atlas entities/evidence in layers 2–8.
- Unavailable: Book V manuscript source, manuscript extraction, and production Article body.
- Required behaviour: return Atlas evidence with its true object type and provenance; skip missing Book V manuscript/Article stages; never synthesize a Book V quotation, section, article, or publication record.

### Work

1. Add typed adapters for Atlas entity, Atlas evidence, Part 12 node, governed Article JSON, Claim, Source, and canonical Knowledge node.
2. Use stable IDs and relation types, not keyword-only joins.
3. Record stage-level candidates, rejection reasons, scores, language, source state, and version.
4. Deduplicate the same claim across Atlas, Part 12, and Articles while retaining all valid source links.
5. Prevent test-only skeletons and fixture-only publications from production retrieval.

### Acceptance

- Production questions can reach Atlas layers 2–8 where registered.
- Missing Book V body yields an explicit boundary, not a fabricated answer.
- Part 12 and broader Knowledge are used only in the declared order.
- Every answer sentence that asserts a governed fact maps to evidence IDs.

---

## PTRC-W4 — Relevance, sufficiency, and abstention gate

### Objective

Prevent plausible but irrelevant long answers.

### Work

1. Score entity match, question-to-passage relevance, source state, language, freshness, contradiction, and coverage.
2. Require minimum evidence count plus minimum coverage of the question's requested dimensions.
3. Separate `SUFFICIENT`, `PARTIAL`, `AMBIGUOUS`, `CONTRADICTORY`, and `INSUFFICIENT` outcomes.
4. Permit long-form generation only for `SUFFICIENT`.
5. For `PARTIAL`, answer only supported parts and list the missing part in no more than a short paragraph.
6. For `INSUFFICIENT`, state the boundary, show the best matching governed nodes, and ask one focused clarification or offer navigation.
7. Never treat model confidence as evidence sufficiency.

### Acceptance

- Irrelevant high-similarity passages are rejected.
- Insufficient evidence cannot reach long-form generation.
- Contrary evidence is visible and blocks unconditional claims.
- Gate thresholds are versioned and covered by boundary fixtures.

---

## PTRC-W5 — Real production question regression

### Objective

Replace synthetic-only testing with the questions users actually ask.

### Work

1. Build a consented, redacted regression set covering Chinese/English, short/long, entity ambiguity, path dependence, civilization, Part 12, financial calculations, will/report requests, and hostile prompt injection.
2. For each case record expected intent, scope, required evidence IDs, prohibited claims, answer mode, language, and maximum unsupported-claim count of zero.
3. Add golden structural assertions instead of brittle full-string snapshots.
4. Add false-friend cases where lexical overlap points to the wrong node.
5. Run offline deterministically and run a smaller live canary set against the deployed Worker.

### Acceptance

- Critical set: 100% correct route, language, and evidence boundary.
- No `INSUFFICIENT` case produces a long answer.
- No test retrieves fixture-only or unpublished content.
- Regression failures block deployment.

---

## PTRC-W6 — Full-bleed responsive experience

### Objective

Rebuild the constrained hero and fragmented Ask surface as responsive HTML/CSS/SVG while preserving semantic content and accessibility.

### Work

1. Produce approved desktop and mobile posters using `LOGO-003` and the real content hierarchy.
2. Translate poster composition into semantic HTML, CSS tokens, and authored SVG ornament—not a full-page raster screenshot.
3. Make the hero full-bleed at the viewport level while keeping readable text on a responsive inner grid.
4. Use fluid type (`clamp`), container-aware spacing, safe-area insets, and art direction at defined breakpoints.
5. Remove cards or borders whose only function is to constrain the hero.
6. Preserve keyboard navigation, visible focus, reduced motion, contrast, alt text, heading order, and 44px mobile targets.
7. Design Ask states: idle, composing, retrieving, sufficient answer, partial, insufficient, error, and offline.

### Acceptance

- Viewports: 360×800, 390×844, 768×1024, 1440×900, and 1920×1080.
- No horizontal overflow, clipped primary copy, hidden CTA, or logo distortion.
- Hero background reaches viewport edges while content alignment remains controlled.
- Lighthouse/accessibility and screenshot-diff thresholds pass.

---

## PTRC-W7 — Real browser and human Q&A acceptance

### Objective

Prove deployed behaviour, not just source-code intent.

### Work

1. Test a clean browser profile and a previously cached profile on desktop and mobile emulation.
2. Verify DNS → hostname → Cloudflare project → deployment ID → commit SHA.
3. Record screenshots of home, Ask, evidence display, Article, financial, will intake, report, 404, and offline states.
4. Run the W5 canary questions manually; reviewers mark route, relevance, completeness, citations, language, and usefulness.
5. Test favicon refresh, service-worker update, back/forward, deep links, share URLs, and locale switching.
6. Capture network failures and confirm graceful abstention/error behaviour.

### Acceptance

- Two human reviewers approve all critical cases.
- Browser evidence identifies exact build and timestamp.
- Production hostname and preview show the intended release, or the difference is documented and intentional.
- Failed cases create blocking Findings.

---

## PTRC-W8 — Financial runtime completion

### Objective

Make calculation coverage explicit, deterministic, testable, and safe.

### Work

1. Inventory every promised calculation and mark `IMPLEMENTED`, `PARTIAL`, `UNAVAILABLE`, or `PROHIBITED`.
2. Define typed input/output schemas, units, currencies, dates, rounding, tax/jurisdiction assumptions, missing-value rules, and formula version for each calculator.
3. Implement a deterministic calculation engine separate from answer prose.
4. Cover cash flow, net worth, debt, savings, retirement scenarios, compounding, inflation, drawdown, affordability, estate summaries, and any other calculation actually advertised.
5. Add boundary, property, example, and cross-calculator reconciliation tests.
6. Display assumptions, formula version, as-of date, and non-advice notice with every result.
7. Prevent the language model from silently inventing numeric inputs or overriding engine results.

### Acceptance

- The capability matrix has no unexplained `PARTIAL` entry.
- Golden fixtures and independent recomputation agree within declared tolerances.
- Missing jurisdiction or required input produces a focused request, not a guessed result.
- Calculation coverage metrics are published with the release.

---

## PTRC-W9 — Will intake and automatic report assembly

### Objective

Collect testamentary information safely and generate a reviewable draft report without presenting it as an executed legal instrument.

### Work

1. Define jurisdiction-aware, versioned intake schemas for identity, family, executors, guardians, beneficiaries, assets, liabilities, trusts, gifts, exclusions, digital assets, funeral wishes, advisors, documents, and review consent.
2. Support save/resume, explicit unknowns, validation, review, correction, export, and deletion.
3. Separate raw user input, normalized facts, derived calculations, warnings, and generated narrative.
4. Generate a deterministic report outline first, then render HTML/PDF from the approved data snapshot.
5. Attach provenance to every section and clearly label missing or conflicting information.
6. Add encryption, least privilege, audit events, retention, redaction, and download-expiry controls.
7. Add jurisdiction and professional-review disclaimers; do not claim legal validity or automatic execution.

### Acceptance

- A complete fixture generates a complete report; partial fixtures generate explicit gaps.
- No field is invented, and calculations reconcile with W8.
- Users can review and correct the exact data snapshot used.
- Privacy, deletion, access control, and PDF visual QA pass.

---

## PTRC-W10 — Repository retirement, cutover, and freeze

### Objective

Remove ambiguity permanently and freeze a single deployable production truth.

### Work

1. Classify duplicates as `KEEP`, `REPLACE`, `ARCHIVE`, or `DELETE_AFTER_EVIDENCE` with owners and references.
2. Delete only after route/reference scans, build comparison, rollback bundle, and approval.
3. Remove stale generated output from source authority or make generation reproducible and checksum-verified.
4. Make CI run schema, semantic, brand, Ask, retrieval, relevance, regressions, finance, report, accessibility, and deployment-manifest checks.
5. Deploy to preview, complete W7, then promote the same immutable artifact to production.
6. Purge/version caches and verify the custom domain.
7. Create `PTRC-v1.0.0-Frozen` with manifest, hashes, commit, deployment IDs, environment schema, acceptance evidence, rollback command, and unresolved non-blocking items.

### Acceptance

- `npm ci` and `npm run check` pass from a clean checkout on the pinned Node version.
- No critical duplicate authority, forbidden logo fallback, unpublished retrieval, unsupported long answer, or unversioned calculator remains.
- Production serves the accepted commit/artifact.
- Rollback is tested and time-bounded.

---

## 3. Required CI order

1. Existing frozen validators in their governed predecessor order.
2. `check-ptrc-w0-production-truth-baseline.mjs`.
3. Brand registry and forbidden-fallback scan.
4. ASK2/CKA request-contract tests.
5. Retrieval-chain and publication-boundary tests.
6. Relevance/sufficiency gate tests.
7. Production-question regression.
8. Financial runtime tests.
9. Will/report schema, privacy, and rendering tests.
10. Browser smoke and immutable deployment-manifest verification.

Existing failures must be corrected at their owning contract. In particular, a PJA-W2D predecessor/successor publication mismatch must not be “fixed” by accepting extra publications; reconcile the governed release records or exclude records that are not valid members of that release.

## 4. Definition of done

The programme is complete only when:

- the custom domain serves the accepted immutable build;
- `LOGO-003` is the default visible mark and no mathematical `Φ` appears as identity;
- Ask routes questions through structured scope and the governed retrieval chain;
- insufficient evidence stops long answers;
- Atlas layers 2–8 are usable with honest provenance while Book V remains explicitly incomplete;
- the real production regression set passes;
- desktop/mobile full-bleed UI passes real-browser and human review;
- advertised financial calculations are implemented or removed from promises;
- will intake generates a reviewable, privacy-governed report;
- `npm run check` passes cleanly; and
- the freeze manifest can reproduce and roll back production.

## 5. Not completed by this W0 delta

This delta establishes the baseline and execution contract only. W1–W10 product changes, the PJA-W2D repair, production secrets verification, Cloudflare/DNS cutover, browser acceptance, financial calculation expansion, will intake/report generation, Book V source upload/extraction/Articles, and final freeze remain unimplemented until executed against the writable real repository and deployment environment.
