# Financial candidate technical repair

State: technically tested local candidate; PC-W94 human decision pending. No professional or production admission is granted.

## Proven defects and resulting behavior

| Affected steps | Before | After |
| --- | --- | --- |
| PC-W32, PC-W37 | Publication timestamp could substitute for an observation date. A valued record lacking date/source metadata could become OBSERVED. | Observation asOf requires explicit observation provenance. Publication and retrieval dates remain separate. Incomplete observations remain UNKNOWN. |
| PC-W33–W34 | Unknown-disclosure asset values and UNSPECIFIED countries could be projected as known exposure; quantity provenance was absent. | Original source values remain untouched; projection keeps contradictory/unknown disclosure values unknown. Quantity fact ID, date and source snapshot digest are retained. |
| PC-W38–W39 | Report composition did not itself reject a mismatched FCR/FAR snapshot. | FCR snapshot ID/digest and FAR FCR-result/snapshot digests must match; mismatches fail closed. Canonical FCR/FAR results remain unchanged. |
| PC-W40, PC-W74–W75 | A refresh could accept a missing holding source/date, missing price/FX digest or calculation date, future observation, negative FX or caller-supplied CURRENT flag. FX staleness and overflow were not checked. | Refresh requires holding, price and FX provenance; invalid/future observations and nonfinite values return UNKNOWN. Price and FX freshness derive from explicit calculation time. Stale price and stale FX are disclosed separately. |
| PC-W39, PC-W43 | Customer asset amounts used a default MYR label; missing asset date borrowed snapshot date; market retrieval date was hardcoded; nonempty insurance/goals still said no records. | Asset currency uses its native currency or the explicit FDR base-currency context. Missing asset dates render Unknown. Retrieval dates derive from source records. Existing insurance/goals are acknowledged without professional interpretation. All 16 customer sections retain Chinese and English. |

Exact changed code files:

- functions/professional/financial/pc-r1-current-reality.js
- functions/professional/financial/pc-r1-publication-candidate.js
- scripts/check-pc-r1-financial-successor.mjs

Actual command uses the centralized zero-cost network-denial preload and JSON import compatibility preload. `node scripts/check-pc-r1-financial-successor.mjs` exits 0 with 16 passing assertion groups, including real canonical FCR/FAR replay and byte-identical FAR results with optional context. Output is in `check-output.log`; structured assertions are in `results.json`. New outputs are scoped to this closure directory; previous review evidence remains preserved.

## Authority and remaining dependencies

FDR/FCR/FAR/HFP/PFR and Moomoo source owners were reused without edits. No market ingestion, live API call, financial engine, recommendation author, customer persistence or production route was created. The 16-section report remains a synthetic local candidate, explicitly identified as such. Professional advice requires signed, source-linked PFR authorship; an AI author label is rejected.

PC-W41 remains BLOCKED_REAL_EVIDENCE: three genuinely consented, reviewed households and real longitudinal evidence are absent. PC-W42 remains BLOCKED_EXTERNAL_AUTHORITY: licensed professional review is pending. Tests and screenshots cannot satisfy either blocker. PC-W94 candidate acceptance is separate from professional service admission, production activation and regulated recommendations.

No accepted Profile PDF/artwork was regenerated. No commit, push, freeze or deployment was performed. Provider/OpenAI API calls remain zero.
