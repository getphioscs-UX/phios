# PHI Configuration R3.1 — Author-led local workflow

This is a local engineering candidate. No customer checkout, paid adapter, registry cutover, production database or Provider is activated.

## Current manuscript intake

| Section | Language | Requested version | Actual input | Author state |
|---|---|---|---|---|
| 01 | zh-Hans | V2 | Complete text not supplied | AUTHOR_DRAFT / awaiting input |
| 01 | en | Not supplied | Complete text not supplied | AUTHOR_DRAFT / awaiting input |
| 02 | zh-Hans | Bilingual Author Draft V1 | Complete text not supplied | AUTHOR_DRAFT / awaiting input |
| 02 | en | Bilingual Author Draft V1 | Complete text not supplied | AUTHOR_DRAFT / awaiting input |

These are intake slots, not claims that complete manuscripts have been ingested or accepted. No text was reconstructed from another ChatGPT conversation. No Section03–10 prose was written. No actual reusable interpretation was extracted, accepted or published.

## Layer A: private case manuscript

Use the existing private author directory outside C:/phios. Supply a private JSON request to:

`node --import ./scripts/lib/pages-json-import-preload.mjs scripts/ecr-r31-ingest-author-manuscript.mjs PRIVATE_REQUEST_FILE`

The request contains privateDirectory, manuscripts (each with inputPath and record), optional bilingual claims, calculationRows and glossary. Record fields follow the existing author version contract: sectionId, language, manuscriptVersion, calculationRef, sourcePackVersion, claimRefs, rightsStatus, authorDecision, decisionDate, replacedVersion, authorState. Defaults stay AUTHOR_DRAFT; complete UTF-8 bytes are saved without trimming, normalization or shortening. A version collision is rejected; identical retry is idempotent. Both languages must reference the same calculation version. Do not paste personal input, manuscript or positions into public fixtures or command-line arguments.

For an explicit author decision, send a private JSON request to `scripts/ecr-r31-record-author-review.mjs` with action MANUSCRIPT_DECISION, privateDirectory, stored folder and receipt. Receipt must identify receiptId, sectionId, language, manuscriptVersion, exactTextDigest, decision (ACCEPT / REVISE / REJECT), reviewer, reviewedAt and evidenceRef. “Continue” is rejected. Accepted status binds exactly one section/language/version/digest. Receipt is immutable and separate; original manuscript bytes and draft record remain preserved. Updated text, version or language needs a new decision.

The CLI is a trusted local recording tool, not an authenticated public API. Only use a receipt based on an explicit human decision actually provided in this session or a verified author source; software cannot itself establish authorship. No real acceptance receipt was recorded in this run. Synthetic receipts live only in separately named private test folders.

## Layer B: reusable meaning candidates

Prefer the existing `functions/embodied-configuration/ecr-semantic-composition-r2.js` extension; no competing semantic registry or calculator was created. Input is an explicitly supplied, reviewed candidate, not an automatic extraction of personal biography.

The same local review CLI supports STORE_REUSABLE_CANDIDATE and REUSABLE_DECISION. Candidate intake strips inherited review receipts. Reusable decisions require a distinct REUSABLE_SEMANTIC scope, moduleId, exactVersionDigest, reviewer/date/evidence and explicit ACCEPT / REVISE / REJECT. A case-manuscript acceptance is rejected as a reusable decision. Rights require their own exact-version receipt before selection; commercial admission remains independently closed.

Each unit binds complete Gate, Line, Driver, Layer, body and mapping version dependencies. All required positions must match. Existing admitted factor records and meaning references are checked through the existing four-factor resolver. Unsupported conditions fail closed; declared counterexamples, context restrictions and authorized personal-evidence requirements are enforced. Personal-case-only prose is never selected. Changing editorial text or any condition invalidates the old digest-bound review. Selected prose is returned verbatim; no Provider writes an interpretation.

## Bilingual QA and preview

Both complete languages are required from Section02. Checks compare claim IDs, position bindings, conditions, limitations, prohibited inferences and glossary presence. Unaligned numeric coordinates and English-only claims fail. Matching numbers or annotations remain PARTIAL_HUMAN_SEMANTIC_REVIEW_REQUIRED; they cannot prove semantic equivalence. Full source terminology and English extra-claim review still require human examination.

The preview adapter uses the existing ECR section list and approved BODY owner renderer. It creates no interpretation and marks the result private draft, incomplete report and not customer-publishable. Paragraph boundaries preserve original textContent; no rewriting or abridgment occurs. The public PDF in this folder contains only long synthetic pagination text, visibly marked on every page. It is **not Section02 author prose** and does not satisfy the blocked author-PDF delivery.

## Shared HD authorities

See shared-authority-impact.json: 11 key initialization/astronomy/88-degree/P64/line/node/input files match the R3 calculation baseline after line-ending normalization. HD substructure changes in activation-builder and personal-structure-runtime do not form the ECR initialization path. The original calculation digest and minute-boundary warning remain in private storage. Color/Tone/Base/Variables have not been admitted into ECR meaning. If these shared authorities later change, replay the private case and emit an explicit section-dependency diff before accepting affected manuscripts.

## Exact unresolved decisions

- Complete Section01 Chinese V2 and Section02 Chinese/English V1 texts, with exact human decisions if any; Section01 English also absent.
- No actual reusable units have received independent semantic or rights approval.
- Book I v3 / active v2 registry, figure namespace/original-position and exact Book II/III source restrictions from Stage A remain open; code does not resolve them by implication.
- Current fixed-page asset approvals are read from the existing visual-convergence manifest. This run reverified bytes of BODY, SECTION-STYLE, SEC-01 and SEC-02; it did not reapprove wording or modify artwork. SEC-05/SEC-07 remain unresolved in that manifest; complete fixed-report composition is therefore not claimed.
- Original membership full suite still fails its old “same-period refill permits more spend after USD3” expectation. Preserve that failure; the focused successor verifies the current required USD3 period-wide cap. No production policy was weakened to satisfy an outdated assertion.

ECR remains RM129 Chinese / RM129 English / RM139 bilingual, four report questions and USD6 order cap. Membership RM19 has a separate USD3 paid-period cap. Financial RM69 bilingual and Will bilingual remain independent. Provider 0, Stripe 0, production D1/R2 writes 0, migrations 0, commit/push/deploy 0.
