# M3B-W8 Payment Provider Comparison

Date checked: 2026-07-23  
Product: PHI OS Book I  
Price: RM89 MYR  
Decision state: **Stripe Malaysia selected by the owner**

## Outcome

The owner selected **Stripe Malaysia** for Book I on 2026-07-23. The decision
prioritizes hosted Checkout, cards, FPX, developer tooling and a path toward
future international commerce.

The checkout page still does not collect money. Provider selection is recorded;
production integration and acceptance are separate gates.

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

## Stripe implementation requirements

1. Create Checkout Sessions server-side.
2. Validate the Stripe webhook signature against the raw request body.
3. Grant access from a verified successful payment event, not from the success-page redirect.
4. Make webhook processing idempotent.
5. Revoke or update access through verified refund events.

## Remaining production gates

1. Activate the Stripe Malaysia merchant account and enable cards plus FPX.
2. Connect the complete Book I file to private authenticated delivery.
3. Add server-only Stripe credentials in Cloudflare.
4. Add D1 purchase and idempotency records.
5. Implement and verify Stripe raw-body webhook signatures.
6. Add receipt email and refund state handling.
7. Run test-mode and live low-value acceptance before setting checkout live.
