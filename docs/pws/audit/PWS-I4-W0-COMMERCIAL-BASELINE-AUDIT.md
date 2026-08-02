# PWS-I4-W0 Commercial Baseline Audit

## Decision

`PWS-I4-W0-Passed` means the read-only audit is complete. It does not mean the commercial runtime is complete or production-ready.

Baseline: `fd402e6b0565430078707a588cc5ae63e675f483` on `main`  
Production reference: `https://phios-github.pages.dev`  
Audit date: 2026-08-02

No Schema, Migration, Registry, payment or entitlement behaviour, or public page was changed.

## Executive finding

PHI OS has a single canonical Product/Offer definition source, but not yet a single operational commercial write source. Book I has a real, bounded Stripe checkout, verified webhook, purchase, receipt, refund and digital-entitlement implementation in immutable migration `0004_book_commerce.sql`. That implementation is deliberately Book-specific and Stripe-specific. The canonical PWS objects for Price, Order, Payment and Entitlement are frozen as contracts, but a provider-independent operational implementation does not yet exist.

| Required confirmation | Result | Evidence |
|---|---|---|
| Single Product Source | **Yes for canonical definitions** | `functions/pws/registry/product-offer-registry.js`; the old module is a re-export and `book-product-registry.js` is an operational adapter |
| Single Offer Source | **Yes for approved offers** | Two approved offers in the canonical PWS registry; the 18-item W1A catalog is planning input, not write authority |
| Single Payment Source | **No** | Book payment facts are stored in `commerce_purchases`; professional payment is a non-persistent record contract; no canonical generic Payment store exists |
| Single Entitlement Source | **No** | Book access uses `digital_entitlements`; membership is preview-only; the generic PWS Entitlement owner has no operational store |
| Multiple Provider Ready | **No** | Stripe names appear in API, schema, persistence keys and errors; no provider adapter or normalized provider event exists |
| Provider-independent Journey Runtime | **Yes, currently** | Book commerce does not write Journey Runtime; formal Journey activation retains nine independent gates and cannot be created by payment alone |
| Legacy write sources | **Closed for ServiceProduct/ServiceEntitlement aliases** | PWS-I2 reconciliation sets `legacyWriteAllowed: false`; legacy files remain read/reference inputs |
| Migration requirements | **Additive migration required before generic commercial runtime** | Immutable `0004` is Book/MYR/RM89-specific; `0005` owns Universal Registry definitions, not operational commercial instances |

## Scope inventory

The evidence-backed inventory is in `pws-i4-w0-commercial-inventory.json`. It covers Product, Offer, Price, Order, Payment, Payment Provider, Receipt, Refund, Credit, Entitlement, Activation, Settlement, Checkout, Webhook, ServiceProduct, ServiceEntitlement and legacy payment configuration.

Key counts:

- 6 Product types, 2 approved Products and 2 approved Offers in the canonical Product/Offer registry.
- 18 planned offers in the W1A catalog; Registry presence does not make them purchasable.
- 1 active operational commerce family: Book I digital PDF.
- 10 Book-specific D1 tables in immutable migration `0004`.
- 1 payment provider integration: Stripe.
- 0 generic operational Order, Payment, Credit or Settlement stores.

## Authority and write-source decision

Definitions and instances are separate authorities:

1. `runtime/product` owns canonical Product definitions.
2. `runtime/commercial` owns canonical Offer, Price, Order and Payment definitions and future operations.
3. `runtime/entitlement` owns canonical Entitlement.
4. The Universal Registry stores governed definitions and relationships; it must not become the transaction ledger.
5. Book commerce currently owns only the bounded Book I operational projection and transaction records.
6. Stripe is a provider of payment facts, not the canonical Payment owner.
7. Client membership previews and professional payment records are projections, not verified payment or entitlement facts.

The complete map is in `pws-i4-w0-write-source-map.json`.

## Legacy reconciliation

`ServiceProduct` maps to Product plus a required Service reference. `ServiceEntitlement` maps to Entitlement plus a required Service reference. Neither alias may accept new writes. Static Book product JSON remains a legacy operational input/read adapter, while the approved Product/Offer definition is canonical in PWS. Unpublished professional prices and preview membership configurations are not migrated into active offers.

The complete dispositions are in `pws-i4-w0-legacy-reconciliation-map.json`.

## Commercial boundary

Payment confirmation is necessary but insufficient for a formal Reality Journey. Identity, Order, verified Payment, active Entitlement, purpose Consent, data Consent, Governance, Journey Identity and Provider Budget remain independent gates. Payment does not create Professional Assignment, responsibility, Provider invocation, Journey Report or Deliverable.

Book entitlement activation on a verified paid webhook is valid only for Book access. That shortcut must not be copied into formal Journey activation.

## Risk decision

There are 0 P0, 7 P1 and 5 P2 findings. The highest risks are the absence of a generic canonical commercial transaction service, Stripe-coupled persistence, and the temptation to reuse Book entitlement activation for Journey activation. Details and mandatory closures are in `pws-i4-w0-risk-register.json`.

## Required implementation order

The next implementation must follow `pws-i4-w0-recommended-implementation-sequence.json`. The first and only next step is `PWS-I4-W1 Commercial Contract and Source-of-Truth Freeze`. No migration or provider integration may precede that freeze.

## Verification status

- Dedicated audit check: `npm run check:pws-i4-w0`
- Full check baseline before audit edits: **Failed** at `scripts/check-pws-i2-w0-registry-baseline-audit.mjs:58` (`13 !== 12`).
- This is a pre-existing latest-main blocker. This work does not change Registry data or the failing assertion.
- Automated checks validate files and boundaries; they do not replace this audit decision.

## Freeze

`PWS-I4-W0-Passed`
