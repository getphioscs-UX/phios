# Zi Wei general-generation failure: root cause

Authority: ZPA-W1. Frozen R2 is a reference, not the universal composer. Reproduction inputs, full stacks and palace inventories are recorded in `zpa-v1/root-causes.json`. Every case uses the real current calculation chain.

| Prior subject / successor case | Section / palace | Undefined reference | Root-cause classes |
| --- | --- | --- | --- |
| CONTROLLED-ZWR-PROD-3 / ZPA-CONTROLLED-03 | S06 / SPOUSE | `co = pair.find(ZI_WEI) || pair[1]`; the palace contains only TIAN_FU, so `name(co)` reads `undefined.starCode` at R2 line 49. | OPTIONAL_STAR_ASSUMED_REQUIRED; MULTI_STAR_ORDER_ASSUMPTION; COMPOSER_SAMPLE_BRANCH |
| CONTROLLED-ZWR-PROD-4 / ZPA-CONTROLLED-04 | S08 / HEALTH | `second = health[1]`; the palace contains only YOU_BI, so `name(second)` reads `undefined.starCode` at R2 line 61. | OPTIONAL_STAR_ASSUMED_REQUIRED; PRIMARY_STAR_SHAPE_ASSUMPTION; MULTI_STAR_ORDER_ASSUMPTION |
| CONTROLLED-ZWR-PROD-5 / ZPA-CONTROLLED-05 | S06 / SPOUSE | `co = pair[1]` after the preferred lookup fails; only TAN_LANG exists. `name(co)` reads `undefined.starCode` at R2 line 49. | OPTIONAL_STAR_ASSUMED_REQUIRED; MULTI_STAR_ORDER_ASSUMPTION; COMPOSER_SAMPLE_BRANCH |
| CONTROLLED-ZWR-PROD-6 / ZPA-CONTROLLED-06 | S07 / FRIENDS | `friend = at('FRIENDS')[0]`; this palace has no recorded placement, so `name(friend)` reads `undefined.starCode` at R2 line 57. | PALACE_EMPTY_STATE_NOT_HANDLED; OPTIONAL_STAR_ASSUMED_REQUIRED |

Call path in each case: real calculation → `buildZiweiReportEvidence` → legacy section IR → `composeZiweiEditorialR2` section branch → `name(p)` at line 9 → unchecked `p.starCode` access. The expected semantic owner is `ZIWEI_PRO_R2_STAR_PROFILES_V2` in `ziwei-professional-reading-r2-authority-v2.js`. No missing authority record causes these four errors; the reference is absent before authority lookup.

The adjacent Work branch also selects sample-specific prose using named stars. It can generate mismatched interpretation on new structures even without throwing. Exception suppression or per-fixture substitutions would not fix that problem.

The separately governed `ziwei-production-composer-v1.js` resolves each placement/dimension through the admitted authority, records PRESENT / ABSENT / UNKNOWN / NOT_ADMITTED, selects deterministically by class and canonical identity, and retains unused placements with reasons. Empty or semantically insufficient primary/modifier palaces become CONTEXT. Transformations retain bound targets and layers; unavailable targets/modifiers are explicitly unresolved. No star names or subject IDs select a narrative branch. Frozen R2 code and outputs remain unchanged.

The twelve-case gate includes all six old inputs plus six calendar/hour/sex/decade variants chosen before calculation. Semantic records are not added or modified. Additional normalized-evidence counterexamples test empty primary/supporting palaces, missing dimensions, unadmitted records, invalid keys, missing/unsupported modifiers, missing Body and missing timing independently of real-calculation coverage.
