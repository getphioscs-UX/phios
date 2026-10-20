# Global source scaling

| Domain / country | Source owner | Metric | Availability | License | Cadence | Limit / next adapter |
|---|---|---|---|---|---|---|
| Economy MYS | World P1 / DOSM | CPI, household survey income | VERIFIED local pinned bytes | Source recorded public-data terms | Monthly / survey year | No matched application cohort; owner-scoped definition adapter |
| Housing USA | World P1 / FFIEC-CFPB | HMDA action counts | EXISTING pinned snapshot; not re-fetched | Federal public data | Annual | Not unique-person approval probability; retain filters/denominator |
| Credit USA | World P1 / Federal Reserve | SLOOS balances | EXISTING pinned snapshot | Source terms | Quarterly | Survey standards/demand, not denial; institution-count adapter |
| Credit MYS | BNM / CCRIS | Applications/approvals monetary flows | PARTIAL historical audit | Recheck source terms | Monthly | No matched cohort count; no invented approval rate |
| Economy CN | NBS / PBOC | Prices, credit, housing | METADATA_ONLY / NOT_EXERCISED | Source terms unverified here | Series-specific | Definition and rights adapter required |
| Economy JP | Statistics Bureau / BOJ | Prices, rates, credit | METADATA_ONLY | Unverified here | Series-specific | Japanese definitions and vintages |
| Economy EA | Eurostat / ECB | Harmonized prices/rates | METADATA_ONLY | Source-specific | Series-specific | Area composition/metric comparability |
| Economy UK | ONS / Bank of England | Prices/credit | METADATA_ONLY | Source-specific | Series-specific | Territorial and vintage scope |
| Cross-country | BIS | Credit/property | METADATA_ONLY | Source-specific | Quarterly/series-specific | Not a substitute for national approval probability |
| Energy/water/logistics/food | Existing World/Books/Articles | Mechanisms; no new quantitative ingestion | PARTIAL published interpretation | Existing admission | Version-bound | Public authoritative dataset adapter missing |
| Demography/work/housing/resources/institutions/conflict | World Bank + existing World materials | Existing population/GDP and mechanism context | PARTIAL | Existing source terms | Snapshot/series-specific | Question-specific evidence coverage required |
| Family/financial | Customer/current-reality/Finance owner | Selected self-report and calculation | OWNER_GATED | Private consent | User version | RIC permission integration absent |
| Professional | Existing professional owner | Qualified assessment | OWNER_GATED / synthetic this run | Private | Record-specific | Real admission/recipient authorization absent |
| Symbolic methods | Canonical method owner | Method interpretation | EXISTING boundary only | Existing entitlement | Reading version | Never measurement or independent fact |

No global data completeness, fresh external availability, legal entitlement or actual professional authority is claimed by this metadata matrix. Country coverage expands through existing owners; no MYS/USA-only schema restriction.
