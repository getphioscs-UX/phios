# Membership cost governance R1.2

Local implementation candidate · PARTIAL · HUMAN_REVIEW_READY

HEAD: 883c41766072c7f8df3c83947ed9774906f8e35c
Actual uncommitted source digest: 592f492ef8e9becc48e841c9a85009dd3f37dc0e274b49d6d39f9de65c38e70d
Source scope: VERIFIED-SOURCE.json (586 imported/source dependencies). HEAD alone does not identify the tested candidate.


Canonical owners: continuity-quota-d1.js, continuity-credit-d1.js, product-cost-envelope.js. No new ledger/tables.

- RM19 membership uses one USD3 ceiling across account requests and both existing dispatchers. The atomic INSERT predicate sums pending reserves, actual known platform cost (including failed delivery), and old dispatcher entries; unknown cost blocks further calls. Known unused reserve is released. Task replay is idempotent.
- Billing period comes from a verified INVOICE quota and active subscription current_period_end. It is not calendar-month inferred. Ambiguous overlapping paid periods fail closed. Old pending requests cannot begin after rollover.
- Old rollover/refill balances remain in the ledger; they cannot expand the new provider-period cap. Balance projection separately exposes monthlyBudget and executionAvailableMicroUSD. New refill sales are held, not erased.
- Existing provider receipt storage now retains a bounded provider request reference and ANSWER/REVIEW operation metadata. No Provider was called to validate this. Existing metering/model policy remains unchanged.
- Personal Evidence PDF/language selection uses zero Provider; optional Personal Evidence AI has not been activated. Future admitted AI must use this shared owner, never the old standalone USD6 envelope.
- Tarot USD1 and I Ching USD2 complete-reading envelopes remain separate, including their old cost attribution and follow-up scope.

Local tests: concurrent cap, mixed-dispatch cap, failure actual-cost retention, released reserve, replay, invoice rollover, exact account isolation and preserved old reading caps. Real invoice renewal/runtime and production migration availability are UNVERIFIED; zero live subscriptions does not validate a real customer's billing anchor.

