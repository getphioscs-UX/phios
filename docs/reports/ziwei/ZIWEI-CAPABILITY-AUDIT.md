# Zi Wei Existing Capability Audit — MR-W2

## Accepted successor scope

The user accepted this audit and the proposed architecture on 2026-10-01. MR-W3/MR-W4/MR-W5/MR-W6A are now implemented for representative review; see [capability reconciliation](ZIWEI-CAPABILITY-STATE-RECONCILIATION.md). The legacy dynamic check has been repaired to verify the canonical successor route and now passes. Pending decisions and that failure below describe the original audit, not current state.

Work: `PHI-OS-METHOD-REPORTS-PRODUCTION-ROLLOUT`  
Audit date: 2026-10-01  
Baseline: `611ddf2dd7e4bdced6358879a5bdb9656c0f0286`  
State: **READY_FOR_REVIEW**; no new Zi Wei prose or visual family authored.

## Findings

Zi Wei already has a deterministic natal calculator, canonical chart, dynamic Da Xian/Liu Nian, admitted source claims, contextual professional interpretation, bilingual customer presentation and a dynamic palace surface. It is not a blank report project.

Current PRO-R2 authority has 28 active stars, 252 professional dimension cells, 336 star×palace compositions, 12 palace units, 8 topic readings and six annual navigation rows. The current W16/W17 regression replayed 24 accepted cases through the product adapter: 288 palace units, 192 topic readings and 144 timing-year rows. This is local route-adapter evidence, not a fresh deployed-site or purchase test.

Do not infer current capability from historical pending/absent fields. The original 20-star natal projection remains frozen; extension source admission is 29/29; later eight-star **semantic** admission is 8/8. Historical W11 atomic meanings still fail closed for eight standalone extension meanings. Current PRO-R2 supplies its separately admitted semantic successor. Existing CUSTOMER_PUBLISHED authority and historical 24/24 human acceptance do not constitute this rollout's future MR-W11 full-report acceptance or MR-W12 commerce admission.

## Calculator inventory

VERIFIED means executed repository fixtures for the stated scope; it does not claim independent astronomical/traditional certification or deployment verification.

| Capability | State | Scope / limitation | Executed evidence |
|---|---|---|---|
| birth_datetime_normalization | VERIFIED | Exact local birth time and governed timezone metadata required; 23:00 next-day rule; no implicit timezone or true-solar-time correction. | `scripts/check-zwr-w7-w13-calculation-projection.mjs` |
| lunar_solar_conversion | VERIFIED | Gregorian-to-lunar supported for 1901–2100; leap-month day 16 split. Reverse lunar-input conversion is not established. | `scripts/check-zwr-w7-w13-calculation-projection.mjs` |
| life_palace | VERIFIED | Life palace derived from governed lunar month/hour. | `scripts/check-ziwei-fp-w0-w4.mjs` |
| body_palace | VERIFIED | Body palace preserved by canonical chart normalization. | `scripts/check-ziwei-fp-w0-w4.mjs` |
| twelve_palaces | VERIFIED | Twelve distinct palace codes and branch bindings required. | `scripts/check-ziwei-fp-w0-w4.mjs` |
| main_stars | VERIFIED | 14 main stars in frozen natal calculation. | `scripts/check-zwr-w7-w13-calculation-projection.mjs` |
| support_stars | VERIFIED | Six natal support stars plus governed extension; not all traditional miscellaneous stars. | `scripts/check-ziwei-fp-w0-w4.mjs` |
| malefic_stars | VERIFIED | Six malefics in eight-star extension; source admission 29/29 and later semantic admission 8/8 must not be conflated. | `scripts/check-ziwei-pro-r2-w2-w12.mjs` |
| four_transformations | VERIFIED | Four natal + four Da Xian + four Liu Nian; frozen Southern Ren table uses Zuo Fu for Hua Ke; palace-stem flying deferred. | `scripts/check-ziwei-fp-w5-w6.mjs` |
| palace_stems | VERIFIED | Palace stems calculated; presence does not imply palace-stem flying transformations. | `scripts/check-ziwei-fp-w0-w4.mjs` |
| da_xian | VERIFIED | Governed calculation sex and explicit target required; lunar nominal age; current integration checks pass. Legacy full surface check fails missing personal-runtime.html. | `scripts/check-ziwei-fp-w5-w6.mjs` |
| liu_nian | VERIFIED | Explicit target year/timezone; six-year structural navigation replayed, not event prediction. | `scripts/check-ziwei-pro-r2-w16-w17.mjs` |
| liu_yue | NOT_SUPPORTED | Monthly scope not activated; exclude from proposed report. | `scripts/check-zwd-w0-w9-zi-wei-dynamic-domain-runtime.mjs` |
| star_brightness | PARTIAL | Source-explicit states available for admitted cells; preserve UNSPECIFIED, never coerce to PING. No universal all-star/all-school coverage claimed. | `scripts/check-ziwei-fp-w0-w4.mjs` |
| palace_relationships | VERIFIED | 12 networks, 6 opposite pairs, 4 trines, flank and empty-palace opposite reference; topology alone is not meaning. | `scripts/check-ziwei-fp-w5-w6.mjs` |

The monthly row cites the legacy check for its scope assertion, **not** a passing full-suite result. The suite exits 1 at an obsolete `personal-runtime.html` frontend assertion. Independent current chart, transformation, professional-reading and cutover checks pass.

## Authority inventory

| Layer | Domain | Source | Interpretation |
|---|---|---|---|
| calculation | calendar_and_placement | [functions/zi-wei-runtime/zi-wei-calculation-ir-runtime.js](../../../functions/zi-wei-runtime/zi-wei-calculation-ir-runtime.js)<br>[content/professional/core-method-runtime/zi-wei-calculation-policy-v1.json](../../../content/professional/core-method-runtime/zi-wei-calculation-policy-v1.json) | HUMAN_FROZEN natal policy; exact time, range, school and leap rules must remain explicit. |
| calculation | extension_and_brightness | [functions/zi-wei-full-production/ziwei-source-admission-authority-v1.js](../../../functions/zi-wei-full-production/ziwei-source-admission-authority-v1.js) | 29/29 admitted source claims supersede historical engineering pending flags for source use only. |
| calculation | timing | [functions/zi-wei-dynamic/dynamic-runtime.js](../../../functions/zi-wei-dynamic/dynamic-runtime.js)<br>[content/professional/zi-wei-dynamic/authority/zi-wei-dynamic-policy-v2.json](../../../content/professional/zi-wei-dynamic/authority/zi-wei-dynamic-policy-v2.json) | Separate dynamic authority; natal + Da Xian + Liu Nian, no monthly. |
| semantic | star_palace_context | [functions/zi-wei-full-production/ziwei-professional-reading-r2-authority-v2.js](../../../functions/zi-wei-full-production/ziwei-professional-reading-r2-authority-v2.js)<br>[functions/zi-wei-full-production/ziwei-professional-reading-r2-runtime-v2.js](../../../functions/zi-wei-full-production/ziwei-professional-reading-r2-runtime-v2.js) | Current 28-star × 12-palace combinations and 252 professional cells; later eight-star semantic admission differs from placement source admission. |
| semantic | atomic_meanings | [functions/zi-wei-full-production/ziwei-meaning-authority-v1.js](../../../functions/zi-wei-full-production/ziwei-meaning-authority-v1.js)<br>[functions/zi-wei-full-production/ziwei-meaning-registry-runtime.js](../../../functions/zi-wei-full-production/ziwei-meaning-registry-runtime.js) | Historical W11 keeps eight standalone extension meanings blocked. Do not mutate or mistake this for current PRO-R2 coverage. |
| semantic | transformations_relationships_patterns | [functions/zi-wei-full-production/ziwei-four-transformation-matrix-runtime.js](../../../functions/zi-wei-full-production/ziwei-four-transformation-matrix-runtime.js)<br>[functions/zi-wei-full-production/ziwei-palace-relationship-engine.js](../../../functions/zi-wei-full-production/ziwei-palace-relationship-engine.js)<br>[functions/zi-wei-full-production/ziwei-pattern-rule-authority-v1.js](../../../functions/zi-wei-full-production/ziwei-pattern-rule-authority-v1.js) | Source-bound transformations, topology and 11 admitted patterns; opposition is not automatically conflict, triad not automatically support. |
| semantic | timing_meaning | [functions/zi-wei-dynamic/dynamic-meaning-runtime.js](../../../functions/zi-wei-dynamic/dynamic-meaning-runtime.js)<br>[functions/zi-wei-full-production/ziwei-professional-timing-navigation-runtime.js](../../../functions/zi-wei-full-production/ziwei-professional-timing-navigation-runtime.js) | Structural temporal focus, alternatives and navigation; no event certainty. |
| editorial | customer_projection | [functions/zi-wei-full-production/ziwei-customer-report-runtime.js](../../../functions/zi-wei-full-production/ziwei-customer-report-runtime.js)<br>[functions/zi-wei-full-production/ziwei-professional-reading-r2-runtime-v2.js](../../../functions/zi-wei-full-production/ziwei-professional-reading-r2-runtime-v2.js)<br>[functions/personal-reading/ziwei-visual-report-projection.js](../../../functions/personal-reading/ziwei-visual-report-projection.js) | Bilingual presentation consumes admitted data; prose/visual rendering never grants semantic authority. |
| editorial | current_publication | [functions/zi-wei-full-production/ziwei-professional-reading-v2-publication-authority.js](../../../functions/zi-wei-full-production/ziwei-professional-reading-v2-publication-authority.js)<br>[functions/zi-wei-full-production/ziwei-current-publication-envelope-runtime.js](../../../functions/zi-wei-full-production/ziwei-current-publication-envelope-runtime.js) | Existing route CUSTOMER_PUBLISHED with historical 24/24 human gate; this is not MR-W11 or new commerce release acceptance. |

Known school difference: frozen Ren Hua Ke uses Zuo Fu, while a classical witness variant uses Tian Fu. Preserve the explicit frozen table; never silently mix schools. Missing state cells remain UNSPECIFIED. Neither topology nor dictionary meanings alone qualify as a customer claim.

## Existing report disposition

| Component | Decision | Gap |
|---|---|---|
| cover | REUSE_PARTIAL | Existing commercial cover; verify personalized report cover through shared subject contract. |
| free_report | REUSE_PARTIAL | FREE branch renders palace preview; verify new delivery entitlement and leakage boundaries later. |
| paid_report | REUSE_PARTIAL | Existing full reading and non-FREE visual pages; not proof of paid snapshot delivery. |
| section_renderer | KEEP | Existing dynamic chart and source-bound palace data; adapt section routing after human architecture decision. |
| narrative | REUSE_PARTIAL | Existing 12 palace units and 8 topic readings; audit and map before composing new prose. |
| locale | REUSE_PARTIAL | ZH/EN present; stabilize terminology canon and full-report language review later. |
| visual_assets | REUSE_PARTIAL | Reuse existing motifs and dynamic chart. Section Master family completeness not yet established; do not generate new family now. |
| commerce | REUSE_PARTIAL | SKU mapping exists; delivery pilot is BaZi-only and full release remains gated. Zi Wei purchase→snapshot→account is not validated by existing customer publication. |
| legacy_audit_as_current_authority | DEPRECATE | Preserve history, but do not use historical ABSENT/PENDING fields as current capability truth. |

KEEP means preserve an existing implementation; REUSE_PARTIAL requires an adapter or scoped verification; DEPRECATE here means cease using a historical audit as current authority, not delete historical evidence.

## Proposed architecture — human decision required

This is an evidence-backed working proposal, not MR-W3 semantic canon or an accepted MR-W4 implementation. The chart/network engine supports the following 12 sections without borrowing BaZi wording:

| Section | Customer question / family | Required capabilities |
|---|---|---|
| S01 | Chart Overview / 整体命盘 | twelve_palaces |
| S02 | Core Orientation / 命身与核心运行 | life_palace, body_palace, main_stars |
| S03 | Inner Structure / 福德与内部调节 | palace_relationships |
| S04 | Work & Direction / 工作与外部方向 | palace_relationships |
| S05 | Resources & Wealth / 资源与财帛田宅 | palace_relationships |
| S06 | Relationships / 关系运行 | palace_relationships |
| S07 | Family & Support / 家庭与支持 | palace_relationships |
| S08 | Pressure & Vulnerability / 压力与脆弱点 | malefic_stars, palace_relationships |
| S09 | Long-term Cycles / 大限 | da_xian |
| S10 | Current Timing / 流年 | liu_nian |
| S11 | Navigation / 现实导航 | palace_relationships, liu_nian |
| S12 | Appendix / 计算、术语、边界与来源 | lunar_solar_conversion |

S03 and S07 require contextual evidence and counterweights rather than palace-label prose. S08 describes symbolic pressure, not medical diagnosis. S09/S10 require governed timing inputs; unavailable timing must remain unavailable, and monthly content is excluded. S11 must derive navigation from claims rather than repeat earlier sections. Section count may change after review.

Decision: **pending**, choose **ACCEPT / REJECT**. No full Zi Wei prose, new visual family or shared-engine rebuild before the two human gates.

## What is trusted, incomplete and reusable?

- **Exists:** deterministic calculation, 20-star natal authority plus eight-star successor, source admissions, relationship topology, semantic composition, ZH/EN professional route and visual projection.
- **Trusted within tested scope:** exact-time calendar/placement, 12 palaces, 28-star successor, admitted relationships/transformations, PRO-R2 compositions and historical human cutover evidence.
- **Incomplete:** monthly timing, universal brightness/miscellaneous-star scope, new publication section mapping, terminology canon review and the new paid-report release chain.
- **Needs verification:** independent calculator authority across boundary cases beyond current fixtures; current deployed route; controlled-subject full-report differentiation; full book layout/locale; purchase, entitlement, immutable snapshot, release and account delivery.
- **Reusable BaZi infrastructure:** subject contract, claim/Publication IR shapes with adapters, page composer primitives, locale checks, snapshot/release owners, customer renderer, review mechanism and SKU mapping. Preserve Zi Wei calculation, semantic, chart and narrative ownership.

## Executed checks

Passed: `check-zwr-w7-w13-calculation-projection.mjs`, `check-ziwei-fp-w0-w4.mjs`, `check-ziwei-source-claim-admission.mjs`, `check-ziwei-fp-w5-w6.mjs`, `check-ziwei-pro-r2-w2-w12.mjs`, `check-ziwei-pro-r2-w16-w17.mjs`, `check-ziwei-fp-w23.mjs`, `check-report-customer-delivery.mjs`.

Failed: `check-zwd-w0-w9-zi-wei-dynamic-domain-runtime.mjs` — ENOENT `personal-runtime.html`, at legacy frontend assertion. No fake stub was created to turn this check green. Current integration checks establish timing calculation separately; the legacy full-surface regression remains unresolved.

Machine inventories: [capabilities](../../../content/reports/ziwei/capability-inventory.json), [sources](../../../content/reports/ziwei/semantic-source-inventory.json), [report gaps and architecture](../../../content/reports/ziwei/report-gap-inventory.json).

Next: resolve BaZi subject binding and full-report human gate; obtain the proposed Zi Wei architecture decision. Only then proceed to MR-W3 and later authorized rollout stages.
