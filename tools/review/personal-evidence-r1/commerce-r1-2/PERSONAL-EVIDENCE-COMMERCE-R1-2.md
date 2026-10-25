# Personal Evidence commerce R1.2

Local implementation candidate · PARTIAL · HUMAN_REVIEW_READY

HEAD: 883c41766072c7f8df3c83947ed9774906f8e35c
Actual uncommitted source digest: 592f492ef8e9becc48e841c9a85009dd3f37dc0e274b49d6d39f9de65c38e70d
Source scope: VERIFIED-SOURCE.json (586 imported/source dependencies). HEAD alone does not identify the tested candidate.


## Actual changes

- COM-REPORT-PROFILE-FULL remains a historical identity with the original QA/live IDs and RM129/USD6 history. It is excluded from future catalog sales and blocked at both checkout and createCommerceOrder. Old purchased quote validation explicitly retains the old pricing version.
- Dossier R1.2 uses active COM-SUBSCRIPTION-MONTHLY or legitimate existing Profile purchase, not another report payment. The original local free introductory/bilingual path is preserved without expansion.
- Tarot RM19, I Ching RM39: three presentation choices at the same price; one existing product and exact reading-bound purchase. No new Stripe product or price was created.
- Current source reference classifications: COMMERCIAL-REFERENCE-MATRIX.json (109 files). Frozen blueprints, reports, invoices and generated bundle history were not rewritten.

## Real Stripe read-only evidence

Connected account is the repository's PHI OS live account. All 32 returned products were read with has_more=false. RM19 monthly membership and RM19/RM39 one-time prices are active. The old Profile Product and Price each returned No such product/price. This is NOT described as archival. Tarot/I Ching still carry old BILINGUAL_ONLY metadata remotely. The local monthly live binding now points to the verified existing monthly product/price; no feature flag was activated.

Historical audit: 1 checkout session (expired/unpaid); 2 charges, one paid RM10 with no product mapping; zero returned subscriptions, has_more=false. Therefore zero historical customers is NOT asserted. Production application orders, receipts, download history and out-of-band invoices were not read. Nothing was deleted or remapped. See STRIPE-READONLY.json.

New refill checkout is held for commercial reconciliation with the $3 monthly maximum; existing purchased refill units and balances are preserved. No assumption that deletion, archival or deactivation are equivalent.

