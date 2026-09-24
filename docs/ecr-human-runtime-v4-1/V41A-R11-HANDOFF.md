# ECR V4.1A / Chiron R1.1 handoff

This checkpoint implements the owner's 2026-09-24 licensing and visual-anchor decisions. No Chiron production provider is selected. No commit, push, dependency installation, license change or deployment was performed by this agent.

## R1.1 Section 39

1. **Starting HEAD:** `a2a590521ba290f2fe42e8435f76f1328ac778ce`; earlier R1.1 audit baseline remains `241aab892549432ed1903517b7bf263d0fa2d9fc`.
2. **Ending HEAD:** recorded in `v41a-change-inventory.json`; no commit by this agent.
3. **Working tree:** uncommitted successor changes, including the static review correction carried into this checkpoint. Exact created/modified inventory is in that JSON.
4. **Shared owner audit:** `content/astronomy/chiron-r1/audit/shared-astronomy-current-owner-audit-v1.json`. Core AST adapter + TRUE_NODE.V1 + existing solar-arc solver are reused; the HDR-named adapter remains a consumer path, not a new astronomy owner.
5. **Primary provider:** Astronomy Engine JS 2.1.19 has no Chiron capability. Case B applies.
6. **Provider decision:** `BLOCKED_PROVIDER_DECISION`. Swiss Ephemeris is `CANDIDATE_NOT_AUTHORIZED`: owner confirms no Professional License and no AGPL permission. Horizons remains an unselected candidate / eligible independent reference; no online runtime dependency was added. See `chiron-provider-decision-v1.json` and `chiron-provider-decision-matrix-v1.json` under `content/astronomy/chiron-r1/provider/`.
7. **Neutral contract:** `content/astronomy/chiron-r1/contracts/astronomy-body-position-v1.schema.json`; implementation is `functions/method-client-delivery/production-adapters/shared-minor-body-capability.js`. It validates and normalizes provider output, owns no ephemeris algorithm, and has no default provider. Success requires all licensing, runtime, data, precision, independent validation, determinism, date-range and reliability gates.
8. **Supported production date range:** NOT_ADMITTED. Synthetic test dates are not a supported astronomical range.
9. **Production provider/version:** NONE. `SYNTHETIC_TEST_ONLY` occurs only in contract tests.
10. **Independent reference/tolerance:** NOT_ADMITTED / NOT_RUN. No synthetic number is presented as independently validated astronomy. No existing precision tolerance was weakened.
11. **Determinism:** repeated synthetic adapter calls produce identical normalized outputs and digests. Real ephemeris determinism remains NOT_RUN.
12. **Failure states:** invalid input, unsupported date, provider exception, malformed output, missing data, provenance mismatch and denied admission return no position. No zero-longitude fallback. Error details are not forwarded. Output fields are allowlisted, preventing provider interpretation fields from entering raw astronomy.
13. **ECR D11 before/after:** UNKNOWN → UNKNOWN, deliberately. The raw-position freeze is blocked, so activation has not been enabled prematurely.
14. **Birth Chiron proof:** distinct Birth instant retained; position/P64 remain unavailable. Real CALCULATED proof NOT_RUN.
15. **Design Chiron proof:** existing 88° solver instant retained; position/P64 remain unavailable. Real CALCULATED proof NOT_RUN.
16. **P64/Line/A8:** unchanged mechanical authority. 64 Gate, 384 Line and 512 independent A8 boundary/orientation checks pass; no fabricated Chiron mapping.
17. **Bridge:** 302° → Gate 41 → ECR-H48 → upper GEN/M6 and lower DUI/M8 remains unchanged.
18. **Dependency:** no CHIRON-R1 or minor-body provider dependency was introduced into ECR calculation. The neutral raw interface is prepared; actual ECR activation waits only for its provider freeze, not for a CHIRON-R1 product.
19. **Zodiac:** existing tropical policy is production-active. A neutral exported generic transform was not confirmed; no duplicate transform was added here.
20. **House:** existing AST method validation implementation found; production policy DEFERRED. Shared House successor is AUDIT_ONLY_NOT_FROZEN, with no invented house system.
21. **Aspect:** existing AST method validation implementation found; production policy DEFERRED. Shared Aspect successor is AUDIT_ONLY_NOT_FROZEN, with no invented orb or priority policy. See `shared-derived-geometry-successor-audit-v1.json`.
22. **CHIRON-R1 semantic status:** NOT_STARTED; upstream raw capability is blocked. No Chiron prose or interpretation imported.
23. **Customer production admission:** NO.
24. **Deployed E2E:** NOT_RUN; no deployment authorized or performed. Local browser evidence is explicitly separate.
25. **Checks:** exact commands and results are in `v41a-check-results.json`. A PASS for the provider-independent contract means contract behavior passed, not astronomical capability acceptance.
26. **Remaining gaps:** a provider must satisfy every production gate; then independent numerical validation, supported-range regression, position freeze and actual Birth/Design D11 integration can proceed. Human semantic/visual admission and deployed E2E remain separate gates.

## V4.1A Section 36

1–4. Starting/ending HEAD, exact changed files and protected mechanical hashes are recorded in `v41a-change-inventory.json`. Accepted Gate/Line, 88° solver, H64 bridge, predecessor meanings, 48-card deck and Current Reality owner remain unchanged.

5. Orientation authority: `content/embodied-configuration/v4-1/ecr-p64-visual-orientation-contract-v1.json`.

6. Historical clockwise formula was `longitude - 90`. The first CCW correction retained a 212° SVG anchor; that retained position did not match the owner's colored reference.

7. New reference-aligned formula is `normalize360(238 - normalize360(longitude - 302))`, equivalent to `normalize360(180 - longitude)`. Tropical 0° is left. The Gate 41 start is **SVG 238°**, **mathematical polar 122°**, or **clockwise-from-top 328°** (approximately 10:56 on a clock face). Its label center is SVG 235.1875°. This is a display coordinate, not a replacement for the canonical 302° ecliptic longitude. The diagram convention is inferred from the reference; final rendered visual acceptance remains pending.

8–9. Gate 41 → 19 → 13 → 49 → 30 follows the left side downward; the 61 → 60 → 41 closure advances counterclockwise. All 64 sectors are traversed in unchanged canonical order. Browser SVG centers independently verify the visible first-five downward progression and wrap.

10–12. Birth markers, Design markers, sector positions, both sets of labels and all Line ticks use the same helper. A8 ticks are not displayed; 512 independent A8 coordinate transforms are tested without inventing a visible A8 layer. Text is positioned and rotated normally, not mirrored.

13–14. Dedicated orientation tests also inspect the generated en/zh HTML, preventing the previous stale-static-SVG failure. Local Edge checks cover en/zh × 1440/390, Enter/Space, fullscreen/Escape, reduced motion and print overflow. Evidence: `v41a-browser-evidence.json`.

15. Semantic-owner admission workspace has explicit required mapping fields and no invented accepted mapping. It is distinct from the architecture-address registry.

16. Review package: 14 bilingual pairs / 28 digest-bound candidates, all PENDING. Each pair exposes both languages, figure references, currently absent admitted semantic mappings, scope, provenance, claims and unknown disclosures. Review vocabulary: ACCEPT / REVISE / REJECT. See `semantic-admission-review.html` and `semantic-review-pairs.json`.

17. Phi Card workspace inventories all 48 accepted cards and six successor positions. Each candidate has semantic references, unassigned runtime slot/owner, unresolved rationale/conflicts and PENDING human decision. No ordinal/random/keyword assignment; predecessor cards are unchanged.

18. Topic audit inventories all 222 registry relations. M/A/D relations depend on predecessor geometry or driver selection; G/Q/R successor selection lineage is unresolved. Nothing is silently migrated by Hxx ordinal. `ecr-topic-projection-runtime.js` selected-owner consumption is the audit evidence; no customer successor topic mapping is enabled.

19. Current Reality candidate boundary records the observation → evidence → comparison → hypothesis → counterevidence → review → admission chain. No dynamic rule is admitted and no automatic symptom-to-state promotion was created.

20–21. Deployed E2E NOT_RUN. Human rendered acceptance PENDING; semantic admission PENDING; customer production admission false. The new review workspaces are preparation, not claims that personalized interpretations are complete.

## Review entry points

- [Admission workspace](admission-workspace.html)
- [28 bilingual candidates](semantic-admission-review.html)
- [Chinese Mandala](review-zh-Hans.html?anchor=238)
- [English Mandala](review-en.html?anchor=238)

Provider references: [Swiss Ephemeris licensing and API](https://www.astro.com/swisseph/swephprg.htm), [JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html). These are audit references, not authorization to install or call a production provider.
