# Financial + Will successor — implementation in progress

Execution baseline: `d9e727d4223dc6f3e411a704ceb46beb66e08840`, branch `main`, initially clean. The supplied [master work](MASTER-WORK.md) is preserved verbatim. **The complete attachment is not yet accepted or fully implemented.**

## Implemented in the existing customer route

- `/professional/financial/` keeps the existing nine-stage intake, My Reality handoff, professional gates and RR released-report gate.
- Optional detailed inventory adds household members, income streams, expenses, eleven broad asset categories, liabilities, separate guarantees, protection, goals and explicit calculation assumptions. Summary amounts remain available as the previous mode.
- The inventory adapter feeds the existing FCR/FAR owners, then the existing HFP composer. It does not create a financial calculation engine or infer ownership shares. Entered asset amounts are explicitly the customer's declared interest value.
- Corrected product-to-FCR metric names for liabilities, income and expenses. Missing quick-intake amounts now remain unknown instead of silently disappearing from totals.
- The HFP preliminary customer view retains all 22 semantic sections and thirteen summary cards. Three existing governed financial figures are reused. It is clearly distinct from a paid/released full report. Missing professional recommendations and assumptions remain open.
- Explicit assumptions have no prefilled financial values. The original calculation owner evaluates them; they are presented as unverified customer assumptions.
- Estate entry is on the same existing page (`#estate-planning`). Direct entry and reviewed, explicitly consented financial-input copy are supported. Existing estate entries are never silently overwritten or merged.
- Estate intake uses the existing PTRC 15-section intake, approval snapshot, report and redaction owners. It retains the existing 12 report sections and calls the existing Will share-integrity and escalation checks.
- An estate total is withheld when any declared inventory value, currency or estate-inclusion status is unresolved. Guarantees are not automatically deducted. Estate inclusion is a declaration for review, not a legal conclusion.
- Draft reports have an explicit local print action. No permanent report URL or storage record is created. No customer data is stored in local/session storage by the new flow.

## Verified

- `node scripts/check-financial-will-successor.mjs`: concrete zero/missing/range/declined/FX/guarantee/annual/irregular-income cases, source-owner reuse, 22 HFP sections, separate consent, unresolved roles, partial estate totals and unbalanced distributions.
- Existing CX-R13, Stage14 and PTRC-W9 checks pass. Stage14's stale sitemap assertion was changed to require the current canonical financial route; compatibility redirects remain checked.
- `scripts/verify-financial-will-browser.mjs`: real local request handlers, nine financial stages, report, explicitly consented financial-to-estate copy and estate report in both languages at 1440px and 390px, no horizontal overflow or page errors. This is local browser evidence, not deployed production acceptance.
- Pages Functions build-only check passes; Worker gzip is 1,273,714 bytes. No deployment performed.
- Full repository check: `npm.cmd run check` completed with exit code **0**; see `npm-check.log`. Targeted successor checks are rerun after later local refinements.

## Still required for complete attachment acceptance

1. Full canonical Will-schema round trip, every specialized field (nomination, EPF/PRS, insurance treatment, trusts, substitutes, business succession, translators, witnesses and conditions), all distribution models and detailed review questions. The current customer form is a working subset of the existing testamentary intake, not a replacement Will schema.
2. Financial inventory field completeness, editable revision history, explicit scenario comparison, the complete capacity/load interpretation and all 22+19 required fixture cases.
3. Account-bound encrypted draft save/restore, explicit reverse-sync, signed PFR contributions, RR assembly/release, paid entitlement, Account/Reports cards and released-facts-only Ask integration. Existing gates remain closed; this implementation does not invent approval, authentication or release state.
4. Complete Financial → Will canonical fact lineage. The current copy is explicitly presented as re-declared input, not a validated persistent FDR→DAR binding or legal instruction.
5. Final financial/estate PDF artifacts and visual acceptance, print-dialog execution, Back/Refresh/save/restore and direct-entry matrix, and deployed production E2E. Print buttons exist; that does not imply the full download-security or PDF acceptance matrix passed.

The existing HFP owner explicitly rejects non-fixture PROFESSIONAL mode with `PFR_PRODUCTION_AUTHORITY_NOT_INSTALLED`. This is an upstream production-authority prerequisite, not permission to bypass PFR or synthesize professional review. Professional/legal decisions remain attributable to the responsible humans.

Rockwills live portal verification: **NOT_RUN**, as specified in the attachment. No portal inspection is claimed.

## Boundaries

`NO_PARALLEL_FINANCIAL_RUNTIME_CREATED`

`NO_PARALLEL_WILL_RUNTIME_CREATED`

`NO_AUTOMATIC_LEGAL_VALIDITY_CLAIM`

`NO_MODEL_GENERATED_FINANCIAL_CALCULATION`

`PROFESSIONAL_RECOMMENDATIONS_REMAIN_PFR_GATED`

Full DAR person schema privacy reconciliation remains required: `person-role-contract-v1.json` requires `idNumber` and `address`, while the testamentary security contract forbids full identity-number storage. No dummy identity, inferred address or relaxed security rule was introduced to claim full-schema acceptance.
