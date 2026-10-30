# WMDA main integration and official filing check — 2026-10-30

The original candidate `88e5821b089cd7281097cbc473f23880e51e7bfc` is preserved and merged normally onto World main `60e2a4d0aad747e82fd3b63d58b06dbf1586306c`. The merge checkpoint is `206afa8f`. Existing v18, original filing observations and historical acceptance remain recoverable at that checkpoint. No author, rights or paid-data admission is fabricated.

The issuer's official index <https://ir2.chartnexus.com/kopi/financial-report.php> lists Q3 2026 as its latest quarterly report on this manual check. The announcement remains <https://ir2.chartnexus.com/kopi/onenew.php?id=3700325&type=Announcement>. Its attachment endpoint returned 404; the issuer's separate official report link works: <https://ir2.chartnexus.com/kopi/docs/qr/q3_2026.pdf>.

The 22-page PDF is 461,406 bytes, SHA256 `542364f8e59f1f5a17de729e1d2291b3415c05631efca9b2c9e5dfec94d733c8`. Document page references below count the cover as PDF page 1. This is a manual documentary check, not automatic refresh or TL semantic acceptance.

| Basis | Verified values and PDF pages |
|---|---|
| Consolidated Q3, 2026-04-01–2026-06-30; MYR thousands | Revenue 156,626; net profit 17,004; gross profit 36,774; operating profit 26,028 (page 2). Basic EPS 0.85 sen. Existing quarterly values are unchanged. |
| Consolidated balances, 2026-06-30; MYR thousands | Assets 490,140; liabilities 167,561; equity 322,579; cash and bank balances 13,933; current assets 307,407; current liabilities 42,696 (page 3). Cash excludes other investments. |
| Shares at 2026-06-30 | 2,000,000,000 issued ordinary shares, distinct from EPS weighted-average shares (page 4). No current quote or current market cap is inferred. |
| B8 borrowings; MYR thousands | Hire purchases 3,044 = current 384 + non-current 2,660 (page 19). Excludes lease liabilities; not total liabilities or all financial commitments. |
| Nine-month YTD, 2025-10-01–2026-06-30; MYR thousands | Operating cash flow 50,938; positive capex outflow 24,041 (page 6); dividends paid 20,000 (page 7). FCF 26,897 is an explicit deterministic derivation. These amounts are not labelled Q3. |
| Same YTD; MYR thousands | Revenue 443,079 vs 317,756; profit 49,083 vs 44,861 (page 2), kept separate from single-quarter values. |

The existing catalog/engine/UI are extended through exact v19 successor hashes. No second market registry, financial engine, paid provider, Cron, production migration or live intake publication path is introduced. Missing quote/TTM/annual inputs stay unknown. Local intake and refresh publication remain explicitly fixture-only.

Local Node 22.16.0 checks: WMDA 38/38; source-specific checks 11/11; existing engine 14/14; R4.2 33/33; W16 successor and actual Edge bundle PASS; actual local handler/browser 6/6 at zh-Hans/en × 360/768/1440. Sparse inputs were restored only from exact HEAD Git blobs; no fabricated fixtures or weakened assertions. Actual invocation logs and screenshots remain in the existing root review owner `tools/review/world-main-production-continuity-r1/`.

Human decisions remain PENDING in the engineering successor records. Manual source verification is not a market-data redistribution licence. Moomoo/Bursa live quote, paid API and production scheduler remain disabled. Production and Preview claims require their own exact-SHA receipts; local checks do not prove them.
