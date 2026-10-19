# Original workbooks → current financial owner tools

Both originals were read as OOXML only, without macros, external links, recalculation or edits. File hashes and cell/formula/error records are in INPUT-WORKBOOK-AUDIT.json. Original workbook bytes and private input values are not copied into the repository. These mappings are engineering provenance, not current tax/legal approval or bank-statement parity.

| Loan sheet `Property name` | Current input/result | Difference / boundary |
| --- | --- | --- |
| E3 loan amount | principal + principalType + asOfDate | Explicit ORIGINAL / OUTSTANDING; blank is invalid, known zero remains zero |
| E4 years | remainingMonths,1–600 integer | UI uses explicit months; no hidden multiplication/rounding of fractional terms |
| E5 rate | annualRatePercent + FIXED_NOMINAL_ANNUAL | Monthly nominal rate only; not effective annual/daily-rest/variable rate |
| E6 date | firstPaymentDate | Saved date fixed; original-day anchor, short month ends; full-month first-period assumption displayed |
| E7 monthly payment | paymentMode DERIVED_PMT / ACTUAL_FIXED + actualPayment | Original E7 blank/no PMT formula; UI now offers both strategies. Fixed input does not create a hidden final balloon |
| H13:H612 extras | extraMonthly / stable extraPaymentEvents | Explicit event ID, period range, ONCE/MONTHLY, currency; duplicates and out-of-range/currency mismatch fail; requested/applied extras separate |
| C13:I612 ledger | schedule period/date/opening/interest/regularPayment/principalPaid/requestedExtra/appliedExtra/fees/closing | Integer minor units and per-period HALF_UP; stops at payoff, maximum600 explicit |
| H3 / I3 / H4 | due-date ledger / final paid period / comparison.periodsSaved | No TODAY-driven historical result changes; no age inferred |
| H5 / I5 / H6 | same-strategy baselineInterest / totalInterest / interestSaved | Do not compare term-PMT baseline against a different actual-payment strategy |
| E13 → I12 | Correct opening balance is principal | I12 is a text header, not opening principal; do not reproduce cached #VALUE! |
| defined names / caches | Structural audit |14 invalid names;428 cached errors, including419 age-column errors; no failed-cache values are goldens |

Loan goldens: 1200/0%/12→100.00; +20→10 periods;1000/12%/2→507.51,total interest15.02;100000/6%/360→599.55,total interest115838.45; +100→252 periods,interest75938.04,savings39900.41; first-period extra200000→applied99900.45,payoff in1 period. Tests also cover actual-payment residual, zero principal, dates, unsupported money scales, negative amortization and events.

| Rental sheet `Calculator 计算器` | Current input/result | Difference / boundary |
| --- | --- | --- |
| B5 receipts | ACTUAL rentReceived OR FORECAST monthly rent × occupied months | Actual receipts already include vacancy. Explicit forecast never overwrites actual inventory |
| B6 other income | otherRentalIncome | Separate cash receipt, same period/currency |
| B11:B20 expenses | Stable cost IDs/labels/kind/amount | Operating, financing interest and capital separated; direct customer cash amount or explicit cashShareRatio |
| C11:C20 tax/rental allocation | rentalUseRatio 0–1 | Distinct from cashShareRatio.25 rejected, not guessed as25%. Unknown tax allocation leaves tax candidate unknown without blocking operating cash |
| D11:D20 arithmetic | rows.allocated (candidate only) / rows.cashAllocated | Arithmetic does not prove deductibility; sinking-fund labels do not grant approval |
| D24 net candidate | netBeforeTaxEligibility | Not debt-service cashflow or tax payable; missing eligibility remains unverified |
| D25/D26 positive/loss | positiveCandidate / lossCandidate; portfolio pre-tax aggregate | No per-property clamp before aggregation; tax grouping/loss-order authority absent |
| B29/B30/B31 area helper | calculateRentalAreaShare | Unknown distinct from invalid zero denominator/over-allocation and real0%; no automatic tax eligibility |
| Missing original tax engine | taxableIncome / taxPayable = null | Current year/residency/reliefs/rates/eligibility require approved bundles; no invented tax output |

Master synthetic rental sample:24000+600 gross;5900 operating cash and9000 financing-interest candidate→14900 candidate costs and9700 net candidate. Cash layers remain18700 operating,700 after18000 debt payments,−2300 after3000 capital. Interest within debt service is not charged twice. A separate cash share0.5/tax share0.25 fixture proves these are not conflated.

Source→tool inputs are saved inside the v2 account draft. Server calculation returns the exact saved source version/digest or EPHEMERAL; CSV/JSON preserve that distinction. Loan and rental mapping require explicit customer actions and are idempotent. Existing inventory references can be reviewed rather than silently sharing data or inferring ownership/borrower liability. Tax/legal conclusions, multi-property UI completeness and real lender reconciliation are not established by workbook arithmetic.
