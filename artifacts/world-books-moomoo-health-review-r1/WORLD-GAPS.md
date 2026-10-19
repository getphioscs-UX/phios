# World UX R1 — actual remaining gaps

This is a local improvement of `/world/`, not a replacement product or content authority. Canonical manuscript, historical case, figure and accepted public-reading owners are unchanged.

| Customer gap | Type | Reusable source | Concrete next action | Acceptance condition |
|---|---|---|---|---|
| Energy / water / food / information and other topic-specific regional annual metrics are not connected | Data | Existing strict World Bank country/indicator/year adapter; current admitted indicator whitelist has population and GDP only | Select authoritative topic datasets, validate units, geography, observation period and permissions before adding an adapter | Actual topic records with source/observed year, exact-year missing and failure tests; no background-metric substitution |
| Automatic latest-available lookup is not supported | Data / API | Existing exact-year `/api/world-observations` | Add a separately verified latest-value contract and per-indicator observed-year comparison | Never silently fall back for an explicit year; mismatched observed years never produce direct difference |
| Energy/water/food have body-verified reading links; other topic recommendations remain title/summary relevance leads, not verified manuscript/argument coverage | Mapping / content | 235 accepted public explanations, original bodies loaded and SHA checked by existing reader | Review topic-to-argument relationships, attach explicit support and scope notes; preserve canonical IDs | Each recommendation explains a verified relation; coverage never inferred merely from a keyword |
| Historical references use actual topic fields and region filters; geography does not prove present-day continuity | Mapping / content | 120 canonical cases, time windows, case-specific fields and existing figures | Audit stronger thematic links where needed; keep historical dates and field excerpts visible | A case's link to a topic is supported by its actual content; no current-country inference |
| Life directions are differentiated verification prompts, not measured local/personal impacts | Content / data | Existing topic pathways and accepted readings; existing twelve-direction vocabulary retained | Add bounded local observations for each relevant direction and date | Cost/work/time/environment/safety evidence is distinct; absent evidence clearly stated |
| Legacy full Atlas, native search and alternate reading controls remain in More material | Interaction | Existing native consumers and deep links | Gradually route remaining native selections through shared state without replacing their owners | No duplicate primary workflow; all old source deep links still work |
| Map position supports selected-area-centered zoom and horizontal pan only | Interaction | Existing SVG map and encoded zoom/pan state | Add vertical drag/pan only if required, with accessible controls and bounded state | Actual viewport movement survives compare/back/refresh/share; no claim of unsupported free two-axis navigation |
| Normal Pages build may include newly tracked internal governance metadata excluded by the prior frozen release manifest | Publication policy (pre-existing) | Prior RELEASE-CANDIDATE.json excludedUnadmittedTrackedMetadata and exact public manifest | Before any future release, reconcile the publication policy against that admitted manifest; do not upload raw output blindly | Private/governance source files absent from publication and all consumed public files present |

## State and evidence

- Compact controls, public reading return, encoded map conditions and exact-year error distinction are implemented locally.
- Browser evidence includes synthetic missing/failure responses, not newly verified World Bank live data.
- Existing reviewed bodies and images are reused; no new manuscript acceptance or full-book coverage is claimed.
- No independent R2 runtime HTML is maintained; review links point to the actual `/world/` route.
- No production changes, account saves, paid Ask calls, R2 writes or production database writes were performed.

## Books II–VII / Moomoo / Health batch (2026-10-19)

| Gap / user impact | Kind | Reused evidence | Next action and acceptance | Sample blocked? |
|---|---|---|---|---|
| Moomoo history ends2024-12-23; not current2026 | Data |56 existing snapshots, new exact-plan validator and bounded paging | Explicit future free/rights-approved import, audit end window and gaps; no automatic refresh now | No; public B uses issuer history |
| Moomoo public display rights unverified | Permission | Internal snapshots and field inventory | Supply actual licence/permission before public provider display; static/API boundaries now withhold raw values | No; B clearly issuer sourced |
| One-period revenue breakdown; no historical mix claim | Data | Five company breakdown snapshots | Obtain admissible multi-period same-category data; no mixed geography/product dimension | No |
| ROI undefined; provider Equity Ratio semantics not verified | Definition | Original field names, explicit derived formula guards | Confirm source formula; no ROE/ROA substitution or guessed ratio | No; ROI stays not computed |
| Modern port employment/life effects unmeasured | Data | Historical Malacca, public II–VII explanations, World Bank national2023 | Add same-place/time local sources before making causal outcome claims | No; bounded A explains gap |
| Historical Malacca registry has no independent evidence URLs | Source |Accepted reconstructed case and illustration | Add historical bibliography through existing owner, do not imply present-day observation | A remains bounded historical explanation |
| VII approved projection Chinese-only; new EN guide is editorial candidate | Content / acceptance |Existing zh projection and source identity | Review this bounded translation separately; no full English manuscript claim | No; explicit Chinese-source link |
| Historical Health metadata-only fixture conflict — RESOLVED LOCALLY | Governance / consumer | Old checker bytes/failure preserved; current two fixture successors require actual body proof | Current check:health-knowledge-current PASS; review versioned fixture changes, keep production inactive | No local sample blocker; no clinical/live completion implied |
| Health is not production enabled or private clinical workflow | Activation / live |Default-off API/router/status and no personal data |Separate production authorization and independent live verification | No local sample; LIVE not run |
| Prior raw maintenance/completed-manuscript metadata publication risk | Publication |New static exclusion + artifact absence assertions |Keep strict publication boundary; review other unadmitted metadata before any release | Local identified paths fixed; not whole-site audit |
| All new samples are local editorial candidates, not deployed | Deployment / review |Current build and browser evidence |Human content review; no automatic acceptance or deploy | Local review available |

Health closure update: check:health-knowledge-current executed PASS after versioned, stronger body-proof fixtures; initial failure remains in HEALTH-CURRENT-INITIAL-FAILURE.json. This resolves the source test-consumer conflict only, not production activation or medical answer completeness.
