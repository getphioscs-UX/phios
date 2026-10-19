# Moomoo coverage and metrics

Internal read-only audit: 56 snapshot objects; raw-response digests 56/56, normalized records 56/56. Normalization comparison treats absent optional meta and meta:null identically on BOTH sides, not only one side. Raw accepted snapshots/old acceptances remain unchanged.

- HISTORY_KLINE: PARTIAL_SNAPSHOTS
- CAPITAL_FLOW: SNAPSHOTS_COMPLETE_FOR_PLAN
- VALUATION: SNAPSHOTS_COMPLETE_FOR_PLAN
- FINANCIAL_STATEMENTS: SNAPSHOTS_COMPLETE_FOR_PLAN
- REVENUE_BREAKDOWN: PARTIAL_SNAPSHOTS

History is eight ETF one-page ascending responses, each 1000 rows, 2021-01-04 through 2024-12-23; absent next_time stopped the old loop, although the plan requests later coverage. Count alone and a different symbol cannot close a plan. New validator checks exact symbol/subtype, required non-null finite fields, duplicates, units/period lineage and endpoint gaps. Seven-day endpoint tolerance is NOT a trading-calendar completeness certificate. Bounded paging continuation and boundary dedup prepared; NOT executed live. Breakdown has only one period and remains partial. Capital/valuation/financial pass only the bounded recorded plan, not all markets or real-time completeness.

Company ranking:
- US.NVDA: 4 types; 50 common periods; 149 named valid currency fields
- US.MSFT: 4 types; 50 common periods; 144 named valid currency fields
- US.JPM: 4 types; 50 common periods; 139 named valid currency fields
- US.AAPL: 4 types; 50 common periods; 136 named valid currency fields
- US.AMZN: 4 types; 50 common periods; 127 named valid currency fields

PE/PB/PS actual provider trend.current_value records remain in internal MOOMOO-RECOMPUTED.json, with symbol/subtype/time and snapshot identity. No public redistribution approval was found. All moomoo-/market-provider- JSON is excluded from static publication; public Book VI/Ask projection removes unlicensed external Moomoo fields while preserving accepted positions. Admission to internal current evidence does not establish redistribution rights.

Provider field Equity Ratio exists but its definition is unconfirmed. The internal independently derived Total Equity / Total Assets is explicitly labelled provider Total Equity, not automatically parent-only equity. Public NVIDIA ratio instead uses issuer shareholders' equity/total assets, with its own provenance. ROI is undefined and not calculated; ROE/ROA/ROIC are not substitutes. Net PPE Purchase and Sale is not gross capex. No TTM is derived without four independent consecutive quarters; cumulative/annual flows cannot be summed as quarters. Missing denominators, zero denominators and currency/period mismatches return not-computed.

Source inventory includes fields, units, periods, accounting standards, retrieval times and raw digests. Announcement date absent in a snapshot stays unknown. No new Moomoo calls, credentials, account actions or storage writes were made. Rights/refresh/history gaps remain open; public sample uses explicit issuer disclosure instead.


## Internal-only measured values (not public display permission)

Valuation observations2026-10-02 09:35:49–09:36:02UTC, unit multiple. Ratio period is separately listed; it is not a same-time comparison to valuation. Original timestamp, snapshotId, field path, currency and inputs remain in [recomputed audit](integrated-r1/MOOMOO-RECOMPUTED.json); [all56 field inventories](integrated-r1/MOOMOO-SNAPSHOT-INVENTORY.json).

|Symbol|PE|PB|PS|Derived Total Equity/Assets|Balance period|
|---|---:|---:|---:|---:|---|
|US.AAPL|37.88|44.837|10.326|28.0536%|2026/Q3|
|US.MSFT|28.568|8.607|11.474|58.3335%|2026/FY|
|US.AMZN|19.97|4.853|3.451|50.3446%|2026/Q2|
|US.NVDA|29.185|24.298|18.363|71.4967%|2027/Q2|
|US.JPM|14.275|2.504|4.441|7.4694%|2026/Q2|

These dates and values belong to historical internal provider snapshots. No public rights or current quote freshness is inferred. Provider Equity Ratio field50 remains semantically unverified; this explicit independent ratio does not approve that field or ROI.
