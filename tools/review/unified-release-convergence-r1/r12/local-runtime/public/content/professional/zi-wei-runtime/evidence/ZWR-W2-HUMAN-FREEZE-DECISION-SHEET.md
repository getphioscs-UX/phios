# ZWR-W2 Human Freeze Decision Sheet

This sheet is deliberately unfilled. ZWR-W2 must not synthesize or silently choose a Zi Wei school/convention.

For each row, the human approver must provide a concrete decision, rationale, and at least one evidence reference before setting the corresponding JSON entry to `HUMAN_FROZEN` / `frozen: true`.

| # | Policy code | Required Human decision | Decision | Evidence reference(s) | Rationale | Approver | Approved at |
|---|---|---|---|---|---|---|---|
| 1 | `CALENDAR_CONVENTION` | calendar convention |  |  |  |  |  |
| 2 | `LUNAR_CONVERSION` | lunar conversion |  |  |  |  |  |
| 3 | `LEAP_MONTH_POLICY` | leap month policy |  |  |  |  |  |
| 4 | `DAY_BOUNDARY` | day boundary |  |  |  |  |  |
| 5 | `BIRTH_HOUR_BOUNDARY` | birth-hour boundary |  |  |  |  |  |
| 6 | `PALACE_CONSTRUCTION` | palace construction |  |  |  |  |  |
| 7 | `MAIN_STAR_SYSTEM` | main-star system |  |  |  |  |  |
| 8 | `AUXILIARY_STAR_SCOPE` | auxiliary-star scope |  |  |  |  |  |
| 9 | `TRANSFORMATION_SCOPE` | transformation scope |  |  |  |  |  |
| 10 | `DYNAMIC_PERIOD_SCOPE` | dynamic-period scope |  |  |  |  |  |

## Freeze mechanics

For an approved policy entry:

1. Put the approved value in `decision`.
2. Add a non-empty `rationale`.
3. Add one or more stable references to `evidenceRefs`.
4. Set `approver` and `approvedAt`.
5. Set `status` to `HUMAN_FROZEN` and `frozen` to `true`.
6. Update `freezeGate.frozenDecisionCount`.
7. Only when all 10 are frozen, set top-level `status` and `freezeGate.state` to `HUMAN_FROZEN`, set `allRequiredDecisionsFrozen` to `true`, and set `downstreamPolicyConsumptionAllowed` to `true`.
8. Do **not** change `calculationRuntimeActivationGranted` or `productionActivationGranted`; W2 does not grant runtime/Production authority.

After the first complete Human freeze, future rule changes require a versioned successor rather than in-place doctrinal mutation.
