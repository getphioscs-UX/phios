# BOOK-V-CIV-ATLAS-R1-M1-W4A｜Structured Dynamic Atlas Projection + HTML/SVG Readability Recovery

Baseline: `41782cebbbec8a70ce04d3327379c85ca71ab24d`

## Decision

W4A corrects the interpretation of M1-W3/W4.

The customer Atlas does **not** depend on text-heavy raster posters. The active projection contract is:

`Registry → Atlas State → HTML/SVG structured visual → detailed HTML renderer → Inspector / Ask`

Poster assets are optional editorial/marketing artwork only. They are not required for the customer Atlas and are not loaded by the active Atlas runtime after W4A.

## Layer behavior

- Timeline: SVG period spine + registry-driven period controls.
- Cases: SVG period distribution + the existing searchable 120-case HTML cards.
- Comparison: readable HTML family matrix, state-linked.
- World: 15-snapshot HTML timeline + region matrix; no fake geographic polygons.
- Trajectories: SVG vector lines with distinct evidence/reconstruction/conceptual grammar.
- Transitions: readable eight-stage HTML flow for the selected TW.
- Loss: six-family HTML matrix feeding the existing 24 loss types and profiles.

## R2 object storage cleanup

Once this delta is deployed and the production page is verified, `/images/atlas/VIS-B5-ATLAS-*` objects in Cloudflare R2 may be deleted if they are not used elsewhere. W4A intentionally removes them as a customer-runtime dependency.

No new background/hero image is required. A future text-free decorative hero may be created separately, but it is outside this maintenance gate.

## Boundaries

No OCR. No poster-derived facts. No civilization score. No new Ask Runtime. M1-W5/W6 remains the next Ask-relevance gate.
