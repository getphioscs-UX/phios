# Assessment matrix

| Mode | Source and scoring owner | Current measured status | Limit |
|---|---|---|---|
| Quick | self-assessment-instrument-v2 + quick selection; scoreSelfAssessment | WORKING local API and existing seven-mode campaign | 6 selected self-report items; not verified competence |
| Full | same original instrument; 6 domains × 5 facets | WORKING | not diagnosis or standardized population norms |
| Reasoning | original-reasoning-task-bank-v1, original bank authority | WORKING raw task scoring | no IQ/norm/percentile, repeated attempt/language confounds |
| External | external-profile-provider-registry; normalizeExternalProfileInput | WORKING | result is customer supplied; no provider testing license inferred |
| Big Five | IPIP 50 / NEO 120; scoreIpipAssessment | WORKING local keyed scoring, reverse keys and bounds tested by existing suite | translation equivalence and norms not established here |
| Career | O*NET Web Services V2 adapter | PARTIAL / provider-shaped fixtures; missing secret fails closed | live questions/scoring not called in this run; US taxonomy is not Malaysia vacancies |
| Financial | PHI adapted financial instrument; scoreFinancialCapabilityAssessment | WORKING local | knowledge vs self-report separated; no official OECD score or financial advice |

All seven retain bilingual UI, source classification, source versions, view graphics and explicit selection. Six offline modes produce both-language results using actual onRequest handlers. Career is not MOCK_ONLY as an implementation, but its current validation is fixture-only. Account assessment saving remains existing encrypted owner and does not overwrite past results. Dedicated current browser click-through of every full questionnaire is not claimed by the new experience journey; existing machine evidence is explicitly narrower than customer closure.
