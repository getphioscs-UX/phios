# EXP-W0｜Production Route Inventory

Audit date: 2026-08-02 (Asia/Kuala_Lumpur)  
Repository: `getphioscs-UX/phios`  
Baseline: `main@4b06288a764462713453c9cc42cbba03747a84f7`  
Production: `https://phios-github.pages.dev`

## Method and boundary

This is a read-only inventory. Production evidence was collected from rendered public pages and read-only `GET` responses, then cross-checked against the same-baseline HTML, shared shell, locale modules and PDS/PWS documents. No Runtime, Registry, Migration, D1, Provider, PWS, payment, entitlement, Knowledge Registry or public-page behaviour was changed.

The requested audit names 19 surfaces but exposes 18 unique routes: **Home and Discover are the same `/` document**. Memory and Continuity are two states/anchors inside one `/my-reality` document, but are scored separately because they are distinct customer tasks.

## Requested production surfaces

| # | Surface | Canonical public route | Source | Production state sampled | Route finding |
|---:|---|---|---|---|---|
| 1 | Home | `/` | `index.html` | Rendered | Public, shared shell |
| 2 | Discover | `/` | `index.html` | Rendered; same document as Home | Duplicate surface name, not a separate route |
| 3 | About | `/about` | `about.html` | Rendered | Public, shared shell |
| 4 | Reality Journey Overview | `/reality-journey` | `reality-journey.html` | Rendered | Public, shared shell and journey shell |
| 5 | Demo | `/reality-demo` | `reality-demo.html` | Rendered | Public, no-save teaching route |
| 6 | Entry | `/reality-entry` | `reality-entry.html` | HTTP 200; default/recovery state inspected | Formal Journey entry |
| 7 | Reconstruction | `/reality-reconstruction` | `reality-reconstruction.html` | HTTP 200; no-entry state inspected | State-dependent |
| 8 | Reading | `/reality-reading` | `reality-reading.html` | HTTP 200; no-reading state inspected | State-dependent |
| 9 | Navigation | `/reality-navigation` | `reality-navigation.html` | HTTP 200; empty/blocked state inspected | State-dependent |
| 10 | Review | `/reality-review` | `reality-review.html` | HTTP 200; empty/blocked state inspected | State-dependent |
| 11 | Memory | `/my-reality#memory` | `my-reality.html` | HTTP 200; not-ready state inspected | State-dependent anchor |
| 12 | Continuity | `/my-reality#continuity` | `my-reality.html` | HTTP 200; not-ready state inspected | Same document as Memory |
| 13 | Knowledge Hub | `/library` | `library.html` | HTTP 200 and code projection inspected | Public, shared shell |
| 14 | Book I | `/book-one` | `book-one.html` | HTTP 200 and code projection inspected | Public product page |
| 15 | Atlas | `/explore` | `explore.html` | HTTP 200 and code projection inspected | Header label is “Explore”; footer label is “Atlas” |
| 16 | Thesis | `/thesis` | `thesis.html` | HTTP 200 and code projection inspected | Public research route |
| 17 | Figures | `/figures` | `figures.html` | HTTP 200 and code projection inspected | Public gallery |
| 18 | Professional | `/services` | `services.html` | HTTP 200 and code projection inspected | Header label is “Services” |
| 19 | Financial Services | `/professional/financial` | `professional/financial/index.html` | HTTP 200 and code projection inspected | Public service detail |

## Additional public routes discovered

The current shared shell and public files also expose `/articles`, three article routes, `/free-observation`, `/academy`, `/glossary`, `/book-one-preview`, `/figure`, `/read/book-one`, `/account`, `/reality-dashboard`, `/professional/human-design`, `/professional/external-readers`, `/professional-appointments`, `/professional-boundary`, `/privacy`, `/terms`, `/ai-disclosure`, `/contact`, `/checkout`, `/payment-success`, `/payment-failure`, `/digital-product-policy`, `/membership`, `/my-reality`, and professional workspace/report/privacy/consent pages. They are recorded as adjacent routes but are outside the 19 requested scorecard surfaces.

## Shared route evidence

`assets/js/public-shell.js:8-13` defines five primary items: Discover, Knowledge, Explore, Services and About. The frozen PDS navigation in `docs/design-system/PDS-W3-CORE-COMPONENT-CONTRACT-AND-GLOBAL-SHELL.md` requires Discover, Knowledge, Reality Journey, Professional and About. Reality Journey survives only as a separate header action; Professional is relabelled Services; Atlas is relabelled Explore in the header but Atlas in the footer (`assets/js/public-shell.js:21`). This is a route-language and hierarchy violation, not merely a naming preference.

## Inventory conclusion

All requested surfaces have an identifiable Production route, but the public information architecture is not a single coherent customer map. One requested surface is duplicated by name (Home/Discover), two are merged into one stateful page (Memory/Continuity), and two canonical destinations use conflicting labels between the PDS, header and footer (Atlas/Explore; Professional/Services).
