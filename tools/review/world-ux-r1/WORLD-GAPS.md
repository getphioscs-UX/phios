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
