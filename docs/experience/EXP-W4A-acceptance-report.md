# EXP-W4A Public Reality Demo Retirement Acceptance

Baseline: `b34ac06692a375515d3df05a78687b6ed105e327`  
Decision: Public Reality Demo retired by the PHI OS product owner.

The old `/reality-demo` document, controller, Evidence Boundary Lab module, customer locale object and Demo-only CSS are removed. Cloudflare Pages `_redirects` sends `/reality-demo` and `/reality-demo.html` directly to `/reality-journey` with HTTP 308. No new Demo, sample Reading, Knowledge adaptation or internal public tool was created.

Home no longer exposes a Demo CTA. About, AI Disclosure, Free Observation, Privacy, Terms and Reality Journey Overview no longer present the old Demo as a current product. Where orientation remains necessary, the route is the formal Reality Journey Overview and never Checkout.

The repository had no sitemap, global robots file, canonical tag system, alternate-language URL generator, structured-data route entry or prefetch entry at baseline. Deleting the HTML therefore removes the only page-level Demo metadata; no active sitemap/canonical/alternate record remains. The permanent redirect is the stable result for old external links.

EXP-W0 remains **Failed**, with 19 audited surfaces and 18 unique routes preserved as historical facts. The active count among that requested set is now 17, and Demo is marked “Retired after EXP-W0”. Historical EXP-W2/W3 records remain evidence of their original baselines, not active route authority.

EXP-W4 Reconstruction files and acceptance are byte-identical to the start commit. Runtime, Runtime Contract, Registry authority, Schema, Migration, D1, Payment, Entitlement, Consent and Provider behavior are unchanged.

`npm run check` passed after the retirement-specific assertions were added to `postcheck`. The focused EXP-W4A, PDS-W3, PDS-W4, i18n, shared-navigation, Journey Overview, Entry recovery, Home/About and project-structure checks also passed. Wrangler 4.113.0 compiled the Pages Worker and parsed both redirect rules as valid; the container could not bind the local HTTP server because `uv_interface_addresses` returned a system error, so HTTP status, query preservation and viewport verification remain Production gates.

Local checks establish regression safety only. EXP-W4A remains Conditional Passed until the committed canonical deployment returns the permanent redirect and Production visual/interaction acceptance is completed.
