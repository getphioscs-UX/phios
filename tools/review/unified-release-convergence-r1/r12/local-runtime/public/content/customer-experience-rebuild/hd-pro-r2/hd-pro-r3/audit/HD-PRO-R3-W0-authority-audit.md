# HD-PRO-R3-W0｜Current Authority & Owner Freeze

Baseline: `dae24c1dd8de49a6c238ddffb8d52b388e8da10d`

## Decision

HD-PRO-R3 starts in **SHADOW_CANDIDATE**. HD-PRO-R2 remains the only customer-published Human Design reading authority. R3 may add census, source admission, claim IR and professional composition successors, but it may not replace the live R2 reading until a distinct R3 human review is accepted.

## Current owners

| Responsibility | Owner |
|---|---|
| canonicalIntakeOwner | `functions/external-profile/human-design-canonical-chart.js` |
| externalChartAdapterOwner | `functions/external-profile/hd-profile-parser.js` |
| chartConfirmationOwner | `functions/external-profile/external-profile-confirmation.js` |
| semanticRegistryOwner | `knowledge/external-readers/human-design/registry/entries.json` |
| categoryAuthorityOwner | `functions/external-profile/human-design-external-authority.js` |
| readingIrOwner | `functions/external-profile/human-design-reading-runtime.js` |
| realityCompositionOwner | `functions/external-profile/human-design-reality-composition.js` |
| customerConfirmApiOwner | `functions/api/customer-external-profile-confirm.js` |
| customerRendererOwner | `assets/customer-ui/js/surfaces/personal-reality.js` |
| customerRouteOwner | `perspectives/personal/index.html` |
| pprSharedRendererOwner | `assets/customer-ui/js/personal-products/personal-product-renderers.js` |
| productionPublicationAuthority | `content/professional/personal-reality/r5/authority/ppr-r5-hd-pro-r2-customer-published-successor-v1.json` |
| r2ProductionGate | `content/customer-experience-rebuild/hd-pro-r2/hd-w10-production-cutover-v1.json` |
| r2HumanAdmission | `content/customer-experience-rebuild/hd-pro-r2/review/hd-w9-human-review-results-v1.json` |
| internalHdrFreeze | `content/professional/core-method-runtime/hdr-production-freeze-v1.json` |
| internalHdrPublicBoundary | `content/professional/method-production-activation/registries/mpa-hdr-boundary-readiness-v1.json` |

## Frozen boundaries

- PHI OS Human Design birth calculation authority remains **false**.
- A confirmed imported chart remains customer-supplied external authority.
- Imported report ≠ PHI OS calculated chart.
- Atomic meaning ≠ customer reading.
- Variable/PHS values are not back-calculated from birth data.
- R2 24/24 acceptance does not admit any new R3 semantic claim.
- No second HD registry, customer renderer, reading engine or parallel Human Design tree may be created.

## R3 owner strategy

R3 semantic work must be a successor over the existing `knowledge/external-readers/human-design/registry/entries.json` source owner and must feed the existing external-profile reading path. The current customer route and renderer are protected from premature R3 cutover.
