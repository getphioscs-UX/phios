# Canonical person owner and Zi Wei QA delivery

Current work: CPA-W0–W7 and QA-W0–W15. Production and Astrology remain closed.

The user's CPA-W0 acceptance freezes the V1 composer, publication adapter, generation adapter, 12-structure evidence, 24 browser reports, person-access evidence and full prior npm lifecycle evidence. `content/reports/ziwei/production-v1-acceptance.json` records 74 exact hashes. Earlier BaZi and Zi Wei R2 acceptance remains unchanged.

## Owner inventory and implementation

Existing `oidc-auth.js` owns verified account identity; it does not own birth data. `person-use-policy.js` owns person-use consent admission. `report-cover-subject.js` owns subject presentation and binding. Financial/will encrypted drafts are product drafts, not canonical birth profiles. Existing symbolic reading persistence stores reading projections. None supplied an account-owned, versioned canonical person loader.

The shared `functions/account/canonical-person-store.js` now provides that owner through `/api/account-persons`. It uses existing verified server identity, same-origin protection, the canonical birth validator and existing consent policy. Only SELF intake is enabled; dependent and third-party authority is not inferred. Birth values are explicit declarations, never recovered from charts or OIDC metadata. Person IDs, owner IDs, consent IDs and source references are server-owned. Names, birth data and consent are encrypted using AES-GCM with account/person/version authenticated data. Secrets remain outside Git.

Migration 0009 stores append-only encrypted person versions. Migration 0010 indexes rendered method report material alongside the existing immutable snapshot owner. Both are registered with the existing migration runner's normalized SQL checksums. Current migration-count checks now expect all ten files; none of the first eight migrations changed.

`ziwei-canonical-person-binding.js` injects this owner into the frozen V1 generator. Generation JSON accepts person ID, language and explicit observation target context; arbitrary birth/owner/entitlement substitutions are rejected. Other birth-based methods can consume the shared person contract without duplicating person persistence.

## QA deployment and evidence boundaries

Canonical QA: https://qa.phios-github.pages.dev. Pages deployment `ebe64c5f-a643-4fde-9b3a-38e55d5e466c` is on branch `qa`, bound to the existing sandbox D1 and private report bucket. Production bindings are unchanged. The private browser verifier has no workers.dev endpoint or public preview URL and is bound only to Preview.

The real customer auth flow is authenticated. A governed synthetic person was created through the deployed account form, not inserted by SQL. `cpa-v1/qa-person-lineage.json` records only stable account/person IDs, version, creation time and digest. Its birth values derive from the explicitly synthetic controlled-subject mechanism; they are not the user's personal birth data or recovered historical provenance.

Actual QA observations so far:

- Account form persisted the controlled person and displayed active consent, version 1.
- Anonymous person and method-report GET requests returned 401.
- Generating Zi Wei without the product entitlement was rejected; no report material was created.
- Read-only sandbox queries found no Zi Wei purchase for this account.
- Preview secret inventory lacked `STRIPE_WEBHOOK_SECRET`; real checkout → verified webhook → entitlement is not yet proven. The user was asked to configure the existing QA webhook without sharing its secret.

The release adapter accepts verification only from the private browser service, tied to the semantic snapshot and output digest. It requires actual 33-page PDF output, zero overflows, zero broken images and zero browser errors. Ordinary report open reads stored rendered bytes and the existing immutable snapshot; it does not invoke generation, composition or a provider.

Local SQL/calculation/access/versioning tests and isolated browser-service tests are separate evidence. They do not establish authenticated deployed positive delivery, cross-account QA isolation or logout/login release immutability. Those gates remain NOT_PROVEN until exercised through real QA accounts and entitlements.

## Cleanup and current verification

Nineteen obsolete diagnostic logs/results were removed after reference checks; their paths and hashes are in `cpa-v1/cleanup-manifest.json`. The successful prior lifecycle log and all accepted evidence remain. Similar-looking historical files with governance references or different contents were retained; deleting them would remove required provenance rather than a duplicate.

Current work evidence lives in `cpa-v1/` and the four `qa-*.json` files in this directory. `cpa-v1/npm-check.log` is the current full-lifecycle run; final status must be taken from its completed exit result and final-validation record, not from intermediate PASS lines.

No production mutations, production admission or Astrology work are authorized by these local/QA partial results.
