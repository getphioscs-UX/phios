# BaZi visual publication and commerce ownership

Baseline: `575884962b1aaef79ecc55dfbb5adbcceb540f80`. Implementation continues after Addendum E commit `e0364c6e`; its recorded model failures and historical PDFs remain separate evidence.

## Actual predecessor call graph

`assets/customer-ui/js/surfaces/personal-reality.js` → `renderProductRoute` in `personal-products/personal-product-renderers.js` → `mountApprovedSpecialistRenderer` → registry module `specialists/bazi/product-renderer.js` → `renderBaziProduct` → `readingHtml(native)` → `cx-bazi-w12-workspace`.

The baseline BaZi renderer did not call `renderPresentedReport` or `renderPublicationReport`. Its complete professional reading was the default surface. Guided Report R2 was a separate publication projection/review path.

## New call graph

`functions/api/customer-personal-reality.js` retains the existing method execution, native reading and product-route owners, then calls `attachBaziPublicationAccess`.

That adapter reads only trusted middleware identity and existing `ownedReportPresentation` → `digital_entitlements` + `commerce_purchases` + `commerce_checkout_attempts`. The existing product is `COM-REPORT-BAZI-FULL`, contract product `BAZI_FULL_REPORT`, entitlement `report:bazi:full`. Purchase state, owner, active entitlement, expiry, fulfilled order and purchased language remain server checks. The existing Commerce contract supplies the price; neither the client return page nor a request field grants access.

The adapter projects the existing native reading through `projectBaziSectionPublication` → registered `primaryVisualRef` → `buildBaziPublicationVisual` → the existing R2 snapshot and `renderPublicationReport`. Free responses contain the bounded report and omit alternate complete BaZi payloads. Other methods and the governed Cross owner retain their own payloads.

Purchased Preview customers receive the full report first. The original specialist renderer is retained as `renderBaziSpecialistWorkspace` and exposed in collapsed technical detail. Its professional structure, five elements, carrying conditions, graph, pattern, relationships, timing and topic rendering functions remain intact. Existing specialist regression checks call that retained owner; the new access regression tests the default renderer and server response separately.

## Isolation and release boundaries

- No calculation, admitted interpretation, method source owner, payment product, entitlement store or D1 migration is added or replaced.
- The visual adapter copies admitted counts, ratios and relations; only bar geometry is calculated. It does not assign new strength or pattern verdicts.
- Ten registered visual modules use existing page families. Pagination follows content; the current fixture has 48 full pages and 11 free pages.
- T3 remains governed by Addendum E. Customer projection currently uses T2; model rejection does not remove visual pages or unlock controls. Visual interpretation boundaries survive a future accepted T3 section.
- BODY intensity is family-specific; existing motif 1 and motif 2 alternate by section. Both original SVG files remain intact.
- Production full-report activation remains closed pending release acceptance. No Production deployment or migration is performed here.
- Static paid review fixtures are synthetic layout evidence, not proof of a paid account, RR release, private delivery or production acceptance.

## Review entry points

- `free/review.html`
- `locked/review.html`
- `paid/en/review.html`
- `paid/zh-Hans/review.html`

Machine checks: `npm run check:bazi-visual-commerce`, full `npm run check`, browser geometry/asset checks and rendered A4 PDFs. Real Preview purchase/entitlement acceptance must be recorded separately from these local checks.
