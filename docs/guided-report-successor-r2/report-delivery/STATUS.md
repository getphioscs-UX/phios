# Report Delivery R1 — BaZi pilot

The new work order extends the existing visual-commerce checkpoint; it does not restart the calculation, interpretation, Financial/Will or Addendum E owners.

## Repository implementation

- Eight method-to-product mappings derive from existing Commerce contracts. No product, entitlement, eligible bundle pool or Stripe base price was added or changed.
- One shared server access resolver loads existing account-owned purchases and validates purchased language. States: FREE, LOCKED, ENTITLED, UNAVAILABLE, DATA_REQUIRED. Browser payment assertions are not an authority.
- BaZi is the only QA pilot. The BaZi adapter retains its existing admitted-native projection and filters paid data before the response. Other methods are registered but not activated by this change.
- A shared browser publication shell owns the unlock presentation and optional detail placement. The existing BaZi specialist renderer remains its detail provider. Publication failure does not expose the full specialist payload.
- Full publication uses the existing publication IR and governed T2 fallback. This does not waive the separate Addendum E T3 acceptance failures.
- Production activation and human acceptance remain false. No new migration or private material store was created.

## Canonical language price policy

All amounts are integer MYR minor units. New orders use `REPORT-LANGUAGE-R3-2026-09-23`.

| Product | Base / SINGLE | BILINGUAL surcharge | BILINGUAL total |
|---|---:|---:|---:|
| Current RM39 single reports | 3900 | 1000 | 4900 |
| Bundle 2 | 6900 | 1000 | 7900 |
| Bundle 3 | 9900 | 1000 | 10900 |
| Bundle 5+ | 15900 | 2000 | 17900 |

Other single reports keep their canonical base plus 1000. A bundle has one modifier line with quantity 1, regardless of the selected report count. Client amount/surcharge/total hints are ignored; identity, currency and price-ID tampering remain rejected.

The existing `commerce_checkout_attempts` stores `amount_minor` (total), `selected_products_json` (selected reports), and the canonical `context_json.reportPresentation` containing `baseAmountMinor`, `reportLanguageMode`, `surchargeAmountMinor`, `amountMinor`, locale and pricing version. These are the existing schema equivalents of the requested fields; no duplicate schema is introduced. Child entitlements retain the selected language attribute and existing entitlement identities.

Historical R2 orders retain their server-persisted pricing version, including the former Bundle 2 zero modifier. New checkout cannot select that version. Webhook validation compares the exact stored quote and Stripe lines; historical orders are not silently repriced.

## Acceptance still required

- New revision: full check, Pages build and 390/768/1440 browser results must be recorded after completion.
- Real QA purchase → webhook → entitlement → purchased-language full report remains unverified. The current owner's checkout form had Bilingual selected and an enabled submit button, but the required terms checkbox was unchecked. Its browser validation message was “Please check this box if you want to proceed.” The owner subsequently confirmed that Continue to checkout is now clickable. A completed payment has not yet been reported. No terms have been accepted on the owner's behalf.
- Real paid HTML/PDF/private delivery acceptance is not established by synthetic review PDFs.
- Owner review of BaZi Free, Locked, Full, PDF and Details is pending. Do not freeze the transport as human-accepted or roll out other methods yet.
- Each remaining method must complete Batch 0 before its publication migration; the mapping alone is not evidence of runtime or customer exposure acceptance.

`REPORT_DELIVERY_R1_ACCEPTED = false`

`PRODUCTION_ACTIVE = false`
