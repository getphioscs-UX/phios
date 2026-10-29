# WMDA-R2 local operations and release boundary

Current production state: READ_ONLY; production auto-deployment remains disabled. No WMDA Cron, new Worker, production migration, D1/R2 write or paid feed was activated. Cloudflare documentary metadata GETs and normal PR Preview builds are distinct from paid market-data/provider calls.

## Owners and infrastructure

Reuse the existing Pages/World API, Moomoo registry/import normalizers, W8A source validation, W8B claim extraction, W8C/CWA admission, Comparison, Ask and Navigation. RRE eligibility is not an RRE promotion or a customer publication decision. See IMPLEMENTATION-INVENTORY.md and INFRASTRUCTURE-READONLY.json.

The account lists two method-report renderer Workers; D1 production/sandbox databases and existing R2 buckets are retained; the Queues metadata list is empty. Worker schedule GETs were NOT_VERIFIED, so no claim is made that every existing service has no schedule. The local paid-report watchdog has a separate commercial role and is not repurposed. No existing market scheduler was identified in the inventoried source/bindings.

Pages Functions are request handlers. A future Cron entry would require a minimal Scheduled Worker acting only as orchestration, with an independently approved storage adapter; it must call existing intake/CWA/read-model owners. Do not deploy the Node SQLite QA ledger to Workers or duplicate the financial database. Proposed operational D1 schema is a review document only, outside db/migrations. Facts should remain with the existing evidence/source store; production operational rows should store references rather than another financial authority.

## Environment and switch mapping

- LOCAL_FIXTURE: executable, no global fetch; only explicitly branded synthetic transport callbacks. SQLite path is constrained to this task's ignored local-state directory. No real credential is read.
- PREVIEW_QA: only the existing PR12 public read routes and immutable build protection have real remote evidence. New WMDA source refresh is NOT enabled there.
- PRODUCTION_DISABLED: all refresh entry calls return before database or transport access. No scheduled entry or Cron configuration is installed.
- PRODUCTION_AUTHORIZED: NOT IMPLEMENTED/NOT ADMITTED. Requires separate rights, budget, secret, storage, owner and TL release approval.

Logical live-schedule / Bursa-paid-feed / Moomoo-live-refresh / OpenAI-market-explanation / production-refresh-write switches map to the absence of an admitted production runner plus the environment guard. Paid provider budget is zero; optional model/web-search orchestration remains uncalled. No duplicate global environment variables were added. Existing REPORT_PROVIDER_LIVE_ALLOWED and production READ_ONLY guards remain unchanged. Local fixture scheduleEnabled defaults false; the single killSwitch stops every source before transport/publication.

## Bounds and replay

Direct fixture requests reserve a durable per-source daily slot before transport (default 3; explicitly bounded QA policies at most 10). Scheduler uses one concurrent task and at most 2 requests per source/day; source interval defaults to 24h for filings and 1h for supported Moomoo mock checks. Rights UNKNOWN produces a local human-review reminder, not a network request or an external notification. UTC is authoritative; display is MYT UTC+8. Example 09:00 UTC = 17:00 MYT. These are proposed check cadences, not issuer publication times.

Timeout is 1500 ms for headers and the bounded body, maximum 262144 bytes, redirect policy error. No automatic retry loop. 429/5xx record bounded Retry-After/backoff; 403, unsupported market, missing/expired credentials and rights failures require a changed explicit policy/entitlement before another request. ETag/Last-Modified are used only with an authorized source. A 304 needs an existing accepted version.

Durable rows carry all contract job fields, source/period/basis/currency/share identity, a lease and receipt history. Same normalized data is NO_CHANGE. A changed same-period version is RESTATED with an immutable predecessor reference. Failed or rolled-back work cannot advance lastSuccessAt/lastAcceptedSourceHash. CWA admission leaves publication withheld. Only an explicitly hash-bound LOCAL_FIXTURE decision can publish a synthetic issuer candidate to the isolated QA ledger; this is never a customer route or production publication. Moomoo public projection remains withheld by existing rights/admission boundaries.

Run without installing dependencies or building all Pages:

    node --import ./scripts/lib/pages-json-import-preload.mjs scripts/check-world-market-wmda-r2.mjs
    node scripts/check-world-market-edge-bundle.mjs

The test resets only its own current-qa SQLite fixture tables and overwrites current receipts; it never deletes shared artifacts or creates timestamped report directories. Browser checks use explicit per-task output paths so R1 receipts are retained. Generated Worker fixture bundles and local-state DBs are ignored. Full npm run check remains TL-owned.

## Production release lanes — prepare only

1. Dated filing lane: source and field/identity/period/units verification, review hash, specific display/derivation rights, CWA, human publication approval, exact source SHA/Preview and rollback plan.
2. External chart lane: current official widget coverage and conditions must be established. MYX:KOPI website presence does not establish widget rights. Current UI uses an external link only; no iframe scraping or valuation inputs.
3. Moomoo lane: confirm exact market/endpoint/account entitlement and commercial reuse rights; source-specific credential in approved secret manager; no personal brokerage entitlement reused as a public licence. Current approved adapter plan is US; MY is withheld as unsupported in this plan, not asserted impossible for the provider generally.
4. Bursa lane: receive written clarification or licence, exact supported access channel and operational limits. Do not invent a free unrestricted Bursa API. Local manual/synthetic intake requires no key.
5. Scheduled lane: approve a production state-store owner/migration, source watchlist, low-frequency cadence, fees, kill/rollback drill and manual first replay. Only then consider a separately authorized Scheduled Worker deployment. No Cron is enabled by this document.

Source references: https://developers.cloudflare.com/pages/functions/wrangler-configuration/ ; https://developers.cloudflare.com/workers/configuration/cron-triggers/ . Pages Preview vars are shared project configuration. The earlier attempted shared READ_ONLY variable was withdrawn via v4. The final World guard is embedded in named immutable branch builds; other branch bundles inherit original settings.

## Current release blocks

PR12 Actions 40831710515 fails in check-ziwei-zpa-access.mjs:9 (Node 22.16 SQLite binding). The relevant source equals main. Node24's anonymous probe does NOT reproduce it. A SHA256-verified official Node22.16 runtime DID reproduce the same numbered-placeholder/spread-binding error using anonymous values; named-object binding passed. The temporary runtime was then deleted. See CI-SQLITE-REPRODUCTION.json and NODE22-TEST-RECEIPT.json. Do not claim resolved or mix Zi Wei/Commerce repair without owner consent. The older optional WPR/Public Assets 1.2.1 versus 1.2.0 mismatch is recorded separately, not substituted for the actual current CI failure.

TL World review and PR12 main integration precede WMDA successor review/integration. The independent local WMDA branch is not main. Rights, actual latest filing extraction, current quote/shares, production storage, complete scheduled infrastructure confirmation and production approval remain separate gates. None is bypassed by local tests.
