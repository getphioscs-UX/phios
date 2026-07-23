# M3B-W8 Payment Provider Comparison

Date checked: 2026-07-23  
Product: PHI OS Book I  
Price: RM89 MYR  
Decision state: owner confirmation required before production integration

## Outcome

For a Malaysia-first RM89 launch, **ToyyibPay Standard is the recommended first candidate** when most buyers will use FPX. Its published FPX B2C fee is RM1 per transaction, versus Stripe Malaysia's published 3% + RM1 for FPX. At RM89, that is approximately RM1 through ToyyibPay versus RM3.67 through Stripe before any other applicable fees.

Choose **Stripe instead** if international cards, a broader developer platform, or future multi-country commerce matters more than the initial Malaysia FPX cost.

No provider is selected by this package. The checkout page does not collect money.

## Current official comparison

| Capability | ToyyibPay Standard | Stripe Malaysia |
| --- | --- | --- |
| FPX B2C published fee | RM1 / transaction | 3% + RM1 |
| FPX B2B published fee | RM2 / transaction | Published Malaysia pricing groups cards or bank transactions at 3% + RM1 |
| Local card published fee | 1.5% | 3% + RM1 |
| Foreign card published fee | 3.5% | 3% + RM1, plus 1% for international cards and 2% if currency conversion is required |
| Setup / recurring | FPX Standard: no setup fee shown; card onboarding RM100 and RM100 yearly from the subsequent year | Standard pricing states no setup or monthly fee |
| Malaysia bank coverage | FPX, all users / local banks | FPX in MYR for Malaysia customers |
| Checkout flow | Bill creation, redirect, server callback, bill status lookup | Hosted Checkout and Payment Intents |
| Refunds | Must be confirmed against the chosen ToyyibPay product contract | FPX full and partial refunds supported; refund request window up to 60 days |
| International expansion | Malaysia-focused | Stronger multi-market path |

Official sources:

- ToyyibPay pricing: <https://toyyibpay.com/pricing/>
- ToyyibPay API reference: <https://toyyibpay.com/apireference/>
- Stripe Malaysia pricing: <https://stripe.com/en-my/pricing>
- Stripe FPX documentation: <https://docs.stripe.com/payments/fpx>

## Security and implementation requirements

ToyyibPay's official API reference documents a callback hash made from the user secret key, status, order ID and reference number. If ToyyibPay is selected:

1. Validate the documented callback hash server-side.
2. Independently call the bill transaction status endpoint before granting access.
3. Make webhook/callback processing idempotent.
4. Never grant `purchased` from a browser redirect alone.
5. Store the provider transaction reference and state transition in D1.
6. Grant Book I access only after the verified provider status has settled.

If Stripe is selected:

1. Create Checkout Sessions server-side.
2. Validate the Stripe webhook signature against the raw request body.
3. Grant access from a verified successful payment event, not from the success-page redirect.
4. Make webhook processing idempotent.
5. Revoke or update access through verified refund events.

## Owner decision required

Confirm one:

- `ToyyibPay Standard` — recommended for Malaysia-first FPX cost.
- `Stripe Malaysia` — recommended for international cards and platform breadth.

After confirmation, the remaining work is provider-specific checkout, verified webhook/callback handling, D1 purchase records, receipt email, refund behavior and live acceptance testing.
