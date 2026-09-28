# REPORT-NARRATIVE-T2-R1 — Baseline / Authority Freeze

Start HEAD: `6ce925dacb0d3e21fc419cbb3f05ddf480e42de3`

## W0–W5 audit

### Existing owners preserved

- Shared paid narrative writer: `functions/personal-reading/narrative/narrative-writer.js`
- Provider adapter: `functions/personal-reading/narrative/narrative-provider.js`
- PAI routing / usage governance: `functions/_lib/pai-r1-economics.js`
- Generic claim verifier: `functions/personal-reading/narrative/narrative-claim-verifier.js`
- Narrative cache: `functions/personal-reading/narrative/narrative-generation-cache.js`
- D1 persistent adapter: `functions/personal-reading/narrative/narrative-generation-cache-d1.js`
- Paid generation service: `functions/personal-reading/narrative/narrative-generation-service.js`
- Publication brief compiler owner: `functions/personal-reading/narrative/narrative-brief-compiler.js`
- Report delivery: `functions/report-delivery/*`
- Publication renderer: `assets/customer-ui/js/personal-products/publication-report-pages.js`
- Canonical birth input: `functions/method-client-delivery/canonical-birth-input-runtime.js`
- MPA subjectReference/birth initialization: `functions/method-production-activation/birth-initialization-data-runtime.js`

### Confirmed gaps

1. `composePublicationNarrative()` falls back whenever `verifyComposition` is absent.
2. Current BaZi section publication calls T2 without an admitted section semantic verifier, so T2 label alone is not proof of natural provider composition.
3. Existing generic narrative verifier validates Narrative Draft claims, but there is no publication-section semantic verifier that checks semantic operators, condition/counterweight/timing preservation and section claim coverage.
4. Existing generation cache key does not yet include method, section, authority version, Claim IR version, verifier version, provider/model configuration.
5. Report Delivery R1 exists, but BZR is the only pilot in the current delivery contract.
6. Canonical birth authority owns date/time/place/timezone precision, but not customer display name.
7. MPA owns `subjectReference`, not a customer-visible display-name string.
8. Cover base assets are static editorial assets; customer name/date/time overlay requires a presentation successor without mutating method calculation or static asset authority.
9. Existing publication renderer does not currently own a canonical P01 subject overlay.
10. Existing production freezes remain authoritative; all changes in this successor must be additive/successor-only until owner acceptance and deployment admission.

## Non-regression

- No second provider router.
- No second method runtime.
- No renderer-owned method meaning.
- No fabricated birth time.
- No customer-name inference from e-mail/account fields.
- No silent T2/T3 claim when fallback was used.
- No semantic snapshot invalidation for CSS-only or cover-coordinate-only changes.
