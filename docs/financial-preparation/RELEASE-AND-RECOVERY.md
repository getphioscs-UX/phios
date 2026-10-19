# Finance preparation R1 — local release and recovery boundaries

Source is an uncommitted successor in the shared main worktree. This document does not authorize production operation or claim the full Master Work complete.

## Actual entries

- `/professional/financial/`: loan/rental tools; existing financial intake, encrypted drafts and exact saved-version summary; explicit Will import proposal and update diff; seven capability view; factual-report preparation and handoff preview.
- `/account/` and `/professional/reports/`: financial report list and authorized stored-body open. These use the existing authentication bridge; local browser proof injects a test-only server identity, not production OAuth.
- Existing `/professional/appointments/` remains separate. A REQUESTED appointment does not create an assignment or permission to share data.

## Bindings and pending admission

Reuse `RUNTIME_DB`, `FINANCIAL_WILL_DRAFT_ENCRYPTION_KEY`, `PRIVATE_REPORTS` and Pages `ASSETS`. No secret value is included here. No financial paid-provider binding, model, budget, entitlement or live publication approval is admitted by this change. A finance-specific reviewed admission is required; BaZi/Zi Wei budgets are not transferable.

Unicode signing PDF export additionally requires the bounded `FINANCE_DOCUMENT_RENDERER` service. Only the isolated local browser adapter has been exercised. No service was deployed or configured. The existing ASCII DAR renderer and DOCX renderer remain intact. Native Word reopened the synthetic DOCX read-only, macros disabled, and exported six pages; all80 paragraphs and Chinese name reconcile. Codex inspected the six-page contact sheet. This is not production/legal acceptance.

The current official Will registry has no approved production jurisdiction, and the reference clauses have no approved legal text. Signing remains closed. A synthetic test package is accepted only by explicitly isolated local test calls; HTTP routes never accept such a package from a browser.

## Candidate migration and release order

`db/migration-candidates/0019_financial_purpose_grants.sql` is a proposal, not a numbered production migration. Its candidate location was coordinated by the concurrent migration work. Formal sequence allocation, current production schema check, migration authorization and deployment authorization are all outstanding. Do not move this file into `db/migrations/` automatically.

When separately authorized, first reconcile the target schema and allocate an unused migration number through the migration owner. Validate on a disposable database, then apply the authorized additive table/index change and deploy the exact reviewed source. Verify account authentication, encryption/private-store bindings and changed routes in that environment. Existing production READ_ONLY isolation is unchanged and may independently block POST operations; this task does not authorize turning it off.

## Recovery

- Reading a v1 draft dispatches its original schema and AES-GCM AAD. Reading never writes or extends retention. Explicit save writes v2 as a new CAS version.
- Once v2 records exist, a v1-only reader is not a safe code rollback. Use a compatible reader; do not delete new records or rewrite old digests.
- An import confirmation rechecks exact source version/digest, grant and target CAS. Atomic insert also checks that the source row and active grant still exist. A newer financial version does not force an older readable proposal to switch sources.
- Candidate/model outcome uncertainty must be reconciled before retry. The local report job retains candidate bytes before rendering; rendering repair reuses them. Opening reports does not call a provider.
- Purpose revocation is rechecked for new report and professional reads. No public/private-store URL is given as a substitute for authorization.
- Local QA SQLite/private-object stores and transient PDFs are under `.tmp/`; they are not release source and must not be staged. The user has not authorized cleanup.

## Evidence limits

Local synthetic checks, screenshot inspection, reference tests, source hashes, deployed behavior and Human ACCEPT are different evidence classes. Official-source discovery/fetch is not legal/tax approval. The five-page synthetic CJK PDF demonstrates local layout/text continuity only. No real professional recipient has received data. No model request, payment, refund, production write, commit, push or deployment was performed by this task.
