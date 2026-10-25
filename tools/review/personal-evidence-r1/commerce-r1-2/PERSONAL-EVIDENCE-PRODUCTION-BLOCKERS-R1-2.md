# Production blockers

Local implementation candidate · PARTIAL · HUMAN_REVIEW_READY

HEAD: 883c41766072c7f8df3c83947ed9774906f8e35c
Actual uncommitted source digest: 592f492ef8e9becc48e841c9a85009dd3f37dc0e274b49d6d39f9de65c38e70d
Source scope: VERIFIED-SOURCE.json (586 imported/source dependencies). HEAD alone does not identify the tested candidate.


1. ARTWORK_PENDING_HUMAN_ACCEPTANCE: fifteen redesigned assets and their dimensions/language approvals are absent. Local draft only.
2. Missing approved translations for private free text and some historical reading narratives; only supported modes can export.
3. Paid release admission for Personal Evidence/Tarot/I Ching, production private-PDF release binding is not admitted. Local encrypted PDF persistence and existing DAR signed-download ownership/expiry/replay checks now pass; this is not a production release. Local authenticated PDF is not a substitute for that release authority.
4. Existing required subscription/credit schema (including current candidates 0018/0019) and actual production ledger availability were not inspected or migrated. No new destructive schema was introduced.
5. No real IdP/TLS cookie transport, current production READ_ONLY state or production customer-account journey was verified. No production activation is authorized.
6. Stripe old Profile product/price is NOT_FOUND, not an assertion of archival. Tarot/I Ching remote BILINGUAL_ONLY metadata remains stale. One successful historic RM10 charge is unmapped; app orders/downloads remain uninspected. Preserve history.
7. Existing refill/rollover policy requires human commercial reconciliation with the new monthly provider ceiling. Old paid balances are retained; new refill checkout is held.
8. Actual subscription billing anchors cannot be proven from zero listed subscriptions. Local tests use explicit paid invoice periods; no calendar reset is assumed.

Next action: review this exact uncommitted local candidate, review the pending-art/translation and old refill choices, then supply the accepted artworks and approve the appropriate future release/production steps separately. No commit, push, deployment, Stripe change or migration is requested implicitly.

