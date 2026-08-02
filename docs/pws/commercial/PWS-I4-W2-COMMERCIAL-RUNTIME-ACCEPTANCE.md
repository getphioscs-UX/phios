# PWS-I4-W2 Commercial Runtime Acceptance

## Baseline

Starting commit: `854bcd03b392cbf56401bdbdbf08191c4a04385b`  
Production reference: `https://phios-github.pages.dev`

## Runtime decision

The Commercial Runtime separates commercial definition, transaction and provider-adapter concerns.

```text
Product Version ← Offer → Price → Currency
                    ↓
             Region + Customer Segment
                    ↓
                  Order
                    ↓
                 Payment
                    ↓
             Payment Attempt → Provider Policy/Status
                    ↓
        Receipt / Refund / Settlement
```

Offer references Product Version but does not own Product. Price contains monetary terms but contains no Product reference. Order snapshots the selected Offer, Price and Product Version but contains no Payment. Payment references Order but contains no Provider; only Payment Attempt references a Provider and the Policy that admitted it.

## Provider Registry

The Registry contains Stripe, FPX, DuitNow and Touch 'n Go eWallet definitions and supports future Provider registration. Stripe is marked as the existing Book integration. FPX, DuitNow and Touch 'n Go remain `registered` only; this status cannot start an attempt. Registry presence explicitly creates no production requirement.

Payment Provider Configuration stores an external configuration reference only. Secret-, token-, password-, credential- and private-key-shaped fields fail closed. Provider Policy independently restricts Currency, Region, Customer Segment and payment method. Provider Status must be `configured` or `available` before an attempt can begin.

This step does not call any Provider. The current Book I Stripe client/webhook remains the active legacy adapter and its behaviour is unchanged.

## Acceptance evidence

| Requirement | Result | Evidence |
|---|---|---|
| Offer and Product separated | Pass | Offer holds a Product Version reference; Product Runtime remains byte-independent from transaction mutations |
| Price and Product separated | Pass | Price has `product_code: null`; amount/currency live only in Price and Order snapshot |
| Order and Payment separated | Pass | Order and Payment use separate IDs, records and state transitions |
| Provider and Payment Contract separated | Pass | Payment has `provider_code: null`; Payment Attempt carries Provider/Policy references |
| Provider failure does not change Product | Pass | failed-attempt fixture compares Product before/after and leaves Order pending payment |
| Receipt bounded | Pass | only succeeded Payment may issue one receipt |
| Refund bounded | Pass | cumulative refund cannot exceed Payment amount |
| Settlement reconciled | Pass | gross minus fee must equal net and Provider must resolve |
| Future Providers supported | Pass | fixture registers an available future gateway without changing Product or Payment schemas |

## Change boundary

- Runtime Contract: Commercial Runtime and Payment Provider Registry contracts added.
- Product Runtime: unchanged.
- Existing Product/Offer Registry authority: unchanged.
- Existing Stripe checkout/webhook: unchanged.
- Entitlement, Journey, Consent, Assignment and Provider invocation: unchanged.
- Schema, Migration and D1: unchanged.
- Public pages and locale: unchanged.

## Verification

- `npm run check:pws-i4-w2`
- `npm run check:pws-i4-w1`
- `npm run check:pws-i2-w5`
- `npm run check:m3b-book-access-payment`
- `npm run check`

The full suite reaches `scripts/check-m3c-navigation-visual-alignment.mjs:237` and stops on the existing M3C-W6 frozen hash mismatch for `assets/js/modules/navigation-render.js`: actual `fe8f09e6eac7f8712dc347d72295fb79e2a4e57462567317a3ae4b067db411a8`, expected `e973cc1afe8c95b6a01558ee4b747439453a773e746fbc9a4bb74886e76c0583`. This step changes neither file nor assertion. Passing Commercial Runtime contracts does not make an unconfigured or merely registered Provider production-ready.

## Freeze

`PWS-I4-W2-Passed`
