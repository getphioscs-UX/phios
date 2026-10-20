# Minimal local candidate · source scope
3 existing product files +1 read-only helper +2 controlled JSON objects; existing 3 owner domains FACTS / PUBLIC ANSWER CONTEXT / WORLD FRONTEND. No new API route or parallel search backend.

| File | Owner / reason | Concurrent scope |
|---|---|---|
| functions/api/world-observations.js | Existing GET API dispatches typed series; original country/indicator/year World Bank branch retained | Clean at start; no identity, payment, D1 or Ask change |
| functions/_lib/world-evidence.js | Small pure validator/derivation helper, static bundled JSON; no fs, credentials, DB or network | New within existing public-data owner |
| content/world/world-evidence-series-v1.json | Definition/rights/hash allowlist and existing published explanation locators | Local bounded admission only |
| content/world/world-evidence-observations-v1.json |22 permitted public observations/counts, exact source hashes and vintage | No BNM, PMMS, NAPIC, NBS or BOJ raw numeric mirroring |
| assets/js/pages/civilization-atlas/world-reading-context.js | Reuses public context owner for bounded intent matching, typed fetch and deterministic evidence composition | Existing Ask URL helper unchanged |
| assets/js/pages/civilization-atlas/world-experience-r2.js | Actual search flow, answer-first panel, scope restoration and stale-response protection | No new page/site; R2 source readers/map/assets retained |

Existing world/index.html, world-published-reading.js, World Bank helper, Search surface, entry-context-handoff.js and all Ask/account/payment code remain unchanged. Source reads and original publication/canonical ownership remain intact. Suppress old fixed three-guide list when a question/answer is active; do not treat it as evidence.

History fix: replacing a focused year input can emit another change event. The existing setter previously pushed history even for equal values; now only an actual public-state change creates a history entry. Failed browser runs and diagnosis are retained. No reset/stash/clean/checkout/stage/commit.

Raw diffs and SHA-bound candidate file manifest accompany this report. QA worker bundles/screenshots/logs are review artifacts, not release source. Full governed .pages-output/root worker publication has not been run or modified.
