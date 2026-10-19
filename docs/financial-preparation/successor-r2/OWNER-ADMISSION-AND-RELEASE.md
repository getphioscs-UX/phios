# Finance R1 successor — owner admission and release candidate

Change classes: bug-fix, security-fix, acceptance-fix, explicit-contract-version-upgrade. Existing account/FCR/RR/DAR and PWS-I3/I5/I8 owners remain authoritative. No new household ledger, qualification authority, provider or transport is created.

## Contracts and compatibility

- `RENTAL_METRICS_V2`: absent precision/timing remains unconfirmed; metric-level dependencies and grouping are explicit in `content/financial/calculation-runtime/contracts/rental-metrics-successor-v2.json`. Old input/ciphertext and historical report bytes are retained. Client confirmation creates a new draft revision. The frozen FCR v1 is unchanged.
- `FINANCIAL_PREPARATION_PACKAGE_V2`: the nine `preparation.*` scopes are versioned in the existing consent owner. Old asset/liability/guarantee grants do not expand. Optional Will section references and optional report source are frozen in the grant binding, not accepted later from the recipient's browser. Household subject scopes are checked before projection; free text is not automatically claimed to be fully de-identified.
- Note receipts use the existing private report objects and report-generation store. The source/professional/grant/assignment/scope index is not a new consent ledger. Reservation precedes object publication; list/read repairs an interrupted publication. Historical receipt metadata is filtered by authorised source, client, professional and grant before compatibility discovery. New grants do not inherit old note access.
- The handoff transport contract is implemented with a local fake only. Production transport remains unadmitted. OUTCOME_UNKNOWN requires receipt lookup before another action; no automatic redispatch.

## Controlled professional admission

`scripts/prepare-finance-professional-admission.mjs CANDIDATE_JSON` performs a read-only structural review using the existing eligibility and authorisation contracts. It prints a digest, scope summary and missing evidence; it writes no authority records. A structurally valid candidate is only READY_FOR_OWNER_REVIEW.

Input envelope: `payload` matching the existing owner-record JSON contract, `effectiveAt`, `expiresAt`, and `ownerEvidence.identity/qualification/assignment/consent` each with actual receipt references. The identity owner must bind the authenticated subject; the qualification owner must verify current issuer/evidence, jurisdiction and service scope; assignment and consent owners must verify explicit actors, exact source and permitted purpose/time. Household links need independent adult self-consent or recorded guardian authority. Do not populate these with fabricated receipts.

No real candidate or qualification evidence was supplied. No import has occurred. Use a protected owner-operated admission process after review; there is deliberately no customer HTTP authority-writing endpoint. Revalidate subject/current qualification/assignment/consent immediately before any real read, note or handoff action.

## Migration candidate and release sequence

1. Allocate official migration numbers with the current migration owner. Do not move candidates into production automatically.
2. Review existing `0019_financial_purpose_grants.sql` and `professional_owner_access_records.sql` candidates plus `financial_preparation_grant_bindings.sql`. The new binding row is inserted atomically with its grant; APIs never create tables. Local SQLite tests apply the candidates in disposable databases.
3. Read authorised current production schema/bindings and obtain separate release authority before any production operation. No production schema was inspected or mutated for this task.
4. Preserve account/authentication, draft encryption, RUNTIME_DB and PRIVATE_REPORTS bindings. Do not include secret values in release evidence. Finance model/product/entitlement/budget and production transport remain closed.
5. Deploy only an explicitly reviewed source revision using the normal release owner after approval. This task does not commit, push, deploy, migrate or activate production writes.
6. Validate real OIDC, exact saved-source summary, packet preview, current professional checks, scope revocation, note list/read and privacy clearing against the actual deployed topology. Local TEST_ONLY identities are not production proof.

## Recovery and reversibility

The reader must support both original and successor drafts; reverting to a v1-only reader after v2 writes is unsafe. Restore selected data using account revision controls, not filesystem resets. Keep new grant-binding and note-receipt rows when rolling back UI; use a compatible reader. Disable unapproved generation or transport without deleting historical reports.

Recover pending note publication from the current authorised receipt list. Missing private objects remain RECOVERY_REQUIRED, not an empty successful note. For handoff unknown outcome, inspect the owner job/transport receipt; do not blindly resend. Revocation stops new reads and dispatch; it cannot recall previously transferred bytes. A customer may cancel a still-PREPARED/FAILED delivery through the owner cancellation function.

## Concrete external conditions still absent

Real professional/subject evidence; effective tax-year/residency/deduction/loss-order approval; approved legal text, language, execution and case assessment; finance-specific product/model/content/entitlement and budget; exact external recipient/channel/send instruction; migration numbering and production release authority. Each blocks only its corresponding real action. Approved and remaining paid-model budget for this task: USD0. Real provider calls, sends, payments, refunds and production operations: 0.
