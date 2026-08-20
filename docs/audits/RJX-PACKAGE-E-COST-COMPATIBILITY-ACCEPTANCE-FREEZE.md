# RJX Package E — Cost + Compatibility + Acceptance + Freeze

Baseline: `311fad7653785b8f0d14d5a0a154cce3f1303eb5` (`delete reality entry`)

## Implemented

- RJX-W19: successor provider-cost policy and executable fail-closed provider gate.
- RJX-W20: seven historical Journey routes and all known runtime/surface consumers are accounted for without creating a second write authority.
- RJX-W21: five TL Human Review packages assembled; no acceptance or Node-to-Rule activation is synthesized.
- RJX-W22: read-only central checker manifest and Package E checker added.
- RJX-W23: production acceptance record added and deliberately left blocked by Human Review, browser acceptance and production provider-ledger integration.
- RJX-W24: hash-bound successor freeze candidate added; it remains blocked until every required acceptance proof is real.
- Five minimum vertical slices and product/rule/AI-cost/safety metric contracts are recorded.

## Baseline reconciliation: 311fad7 vs services.zip

GitHub `main` was verified at `311fad7`. That commit removes exactly `reality-entry.html`. The Library archive still contains the file. After CRLF→LF normalization, the archive copy has Git blob `b4f470849fbc38e15daa73bf33a12860da471099`, exactly matching the canonical file deleted from parent `444e3f0`.

Package E therefore does **not** treat the archive copy as evidence that the old page is still active. It restores that canonical legacy DOM only as an RJX-W20 compatibility shell so frozen historical checkers can continue reading their established page contract. A head-level `location.replace('/reality/')` plus zero-delay meta refresh sends real browser use immediately to `/reality/`. The old Entry Runtime is not reactivated.

This deliberately does not add a server `_redirects` rule. Phase 19's frozen checker records `redirectsActivated = false` until explicit Human UX Acceptance; W20 is not allowed to rewrite that historical fact.

## Provider-cost boundary

PDS-W5 protects the historical Runtime Entry provider router and API hashes. Package E therefore does not mutate those protected files. `functions/reality-journey-runtime/provider-cost-gate-v1.js` is the successor orchestration gate: initial result is rule-only; Workers AI requires eligibility, hard budget reservation and usage telemetry; OpenAI additionally requires explicit opt-in and entitlement; paid overage is fail-closed; provider failure never blocks the base Journey. Until production runtime consumption integrates this successor gate, metered-provider activation remains disabled.

## Human gates still required

1. TL accepts Review Packages A–E, including explicit Node-to-Rule binding scope.
2. Browser acceptance covers mobile, keyboard, screen reader, zh-Hans, en, Simple/Complex and no-provider behavior.
3. Production provider budget + usage-ledger integration is proven.
4. `npm run check:rjx` and `npm run check` pass in a real Git checkout at final freeze time.

The blocked final freeze is deliberate fail-closed behavior, not a checker bypass.
