# WMDA-R2 existing owner inventory

- Main and origin/main: 0deb123097062750ba4d294171a2d975bff1b2a0 (fetched); unrelated dirty main preserved.
- PR12: codex/world-market-integration-r1; source fixes pushed; Draft; no merge.
- World owner: world/index.html + assets/js/pages/world.js + civilization-atlas/world-company-analysis.js.
- Financial facts owner: content/world/company-filings-r1.json. Preserve the Oriental Kopi dated quarter; no later filing presumed.
- Deterministic company owner: functions/_lib/world-company-analysis.js; projection: functions/current-facts-gateway/world-company-projection.js.
- Public API: functions/api/current-facts.js, bounded GET company query; existing POST classifier/provider contract retained.
- Moomoo importer: scripts/lib/civilization-atlas/moomoo-first-live-import-v1.mjs + moomoo-gap-closure-import-v1.mjs; reuse their normalizers and secret checks.
- Finance helpers: moomoo-financial-metrics-v1.mjs (financialRatio / independentQuarterTTM); do not create an independent calculation engine.
- Source/claim handoff: moomoo-first-data-package-v1.mjs, moomoo-first-provider-claim-extraction-v1.mjs, moomoo-provider-w8c-admission-v1.mjs; provider identity MOOMOO_OPENAPI remains canonical.
- Currentness and admission: functions/current-web-authority/current-web-authority-runtime.js.
- W8D/RRE: existing runtime-position handoff/admission and public readouts remain owners. No scheduler may synthesize an RRE promotion.
- Comparison: existing world-r42-contract.js compareWorldObjects.
- Ask / Navigation: existing routes; public summary only via explicit user action. No personal holdings inferred, no automatic personal checkpoint write.
- No market durable refresh-job schema was located in existing DB migrations. Existing commerce/report job tables belong to commercial delivery and must not be reused for market ingestion. A local SQLite operational ledger can be an isolated QA adapter, with production storage separately gated.
- No paid data calls, model calls, Cron activation or production data writes are authorized.
