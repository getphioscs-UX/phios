# PWS-I4-W1 Product Runtime Acceptance

## Baseline

Repository: `getphioscs-UX/phios`  
Branch: `main`  
Starting commit: `5e70d816dee3652d015732ed1b711ff53d989a4b`  
Production reference: `https://phios-github.pages.dev`

## Runtime decision

`runtime/product` now has one provider-, country- and currency-independent Product Runtime. Product identity is stable across Product Versions, while each version contains one or more immutable Product Components. Access components describe what a future active Entitlement may permit; resolving a component does not create that Entitlement and does not execute the access.

The component model supports:

| Component | Required declaration | Explicit non-effect |
|---|---|---|
| Knowledge Access | governed knowledge asset and access scope | does not grant asset access |
| Journey Access | Journey type, method and count | does not create or activate Journey |
| Professional Service Access | Service plus eligibility, Consent and Assignment gates | does not assign responsibility |
| Membership Access | membership tier | does not activate membership |
| Service Credit | Service and positive units | does not issue or consume credit |

## Source-of-truth reconciliation

Product Runtime owns Product identity, version and component composition. The existing PWS-I2 Product/Offer Registry now imports those Product definitions and joins the approved Offer only at its compatibility adapter boundary. Offer amount and currency therefore remain outside Product. Book commerce continues reading the compatibility projection, so its existing RM89 Stripe behaviour is unchanged.

No Payment Provider, country, currency, amount, Entitlement ID or Journey ID is accepted inside Product, Product Version or Product Component. Recursive validation fails closed if such a binding is supplied.

## Acceptance evidence

| Requirement | Result | Evidence |
|---|---|---|
| Book I Product resolves | Pass | canonical `phios-book-one-zh-pdf` resolves to Product Version `1.0.0` and Knowledge Access for `BOOK-I` |
| Reality Journey Pass resolves | Pass | canonical `reality-journey-pass-v1` resolves to Journey Access for one `personal_reality_journey` |
| Product Version traceable | Pass | current and explicitly requested versions resolve independently; missing versions fail closed |
| Product Component composable | Pass | one version composes all five component types with unique component codes |
| Legacy Product maps | Pass | `phios-book-one` maps read-only to `phios-book-one-zh-pdf`; legacy writes remain prohibited |
| Product independent from Provider/country/currency | Pass | recursive prohibited-field fixtures are rejected |
| Product creates no Entitlement/Journey | Pass | Product, Version and Component projections carry false side-effect boundaries |

## Change boundary

- Runtime Contract: Product Runtime contract added.
- Registry: no new Registry type or authority; existing Product projection now derives from Product Runtime and records `product_version`.
- Schema, Migration and D1: unchanged.
- Payment and Entitlement behaviour: unchanged.
- Journey and Provider behaviour: unchanged.
- Public page behaviour and locale: unchanged.

## Verification

Dedicated command: `npm run check:pws-i4-w1`

The full `npm run check` reaches the main check and stops at `scripts/check-m3c-navigation-visual-alignment.mjs:237`: the current `assets/js/modules/navigation-render.js` hash is `fe8f09e6eac7f8712dc347d72295fb79e2a4e57462567317a3ae4b067db411a8`, while the frozen assertion expects `e973cc1afe8c95b6a01558ee4b747439453a773e746fbc9a4bb74886e76c0583`. PWS-I4-W1 does not alter Navigation code or its frozen assertion. A passing Product Runtime check does not override this existing full-suite blocker.

## Freeze

`PWS-I4-W1-Passed`
