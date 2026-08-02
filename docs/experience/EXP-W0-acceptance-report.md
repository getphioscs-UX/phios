# EXP-W0｜Production Experience Baseline Acceptance Report

## Decision

**EXP-W0 Failed.**

The audit itself is complete enough to establish a production baseline, but current Production does not satisfy the frozen PDS experience contract. The result is not derived from npm checks: it is derived from 12 P1 customer-task/contract failures, a 49.4% average score, contradictory journey models and incomplete professional purchase decisions.

## Baseline

| Item | Result |
|---|---|
| Repository | `getphioscs-UX/phios` |
| Latest main SHA | `4b06288a764462713453c9cc42cbba03747a84f7` |
| Production URL | `https://phios-github.pages.dev` |
| Requested surfaces audited | 19 |
| Unique public routes represented | 18 |
| P0 / P1 / P2 / P3 | **0 / 12 / 13 / 3** |
| Average page score | **8.89/18 (49.4%)** |
| Lowest pages | Reconstruction, Reading, Memory, Continuity — **5/18** each |

## Required source review completed

The audit read the current PDS design-system and public acceptance documents; PWS entry/public-navigation/professional-handoff boundaries; existing M3A/M3C/PDS acceptance reports; `assets/js/public-shell.js`; `assets/js/journey-shell.js`; English and Simplified Chinese locale modules; the requested Journey, Knowledge, Professional and Financial HTML/pages; and the current package/check definitions. The current code, not an earlier ZIP or remembered version, is the only implementation baseline.

## Production evidence and limitation

Production rendered evidence was directly inspected for Home/Discover, About, Reality Journey Overview and Demo. The remaining public routes returned HTTP 200 and were inspected through the deployed response plus the exact-baseline source/locale projection. Browser batch traversal became unstable when entering state-dependent Journey pages; therefore this report does **not** claim a completed end-to-end state-writing Journey, mobile matrix, or both-locale production pass. Default empty/blocked states are valid audit evidence because a public deep link is itself part of the experience, but they do not prove later populated states. This limitation is an additional reason Passed cannot be signed.

## Per-page score

| Page | Score /18 |
|---|---:|
| Home | 10 |
| Discover | 10 |
| About | 11 |
| Reality Journey Overview | 10 |
| Demo | 15 |
| Entry | 11 |
| Reconstruction | 5 |
| Reading | 5 |
| Navigation | 6 |
| Review | 6 |
| Memory | 5 |
| Continuity | 5 |
| Knowledge Hub | 11 |
| Book I | 12 |
| Atlas | 11 |
| Thesis | 7 |
| Figures | 11 |
| Professional | 6 |
| Financial Services | 7 |

## Ten most severe PDS violations

1. Global header contradicts the frozen primary-navigation destinations.
2. `/explore` is called both Explore and Atlas.
3. Home/Discover lacks one primary first-time task and action.
4. Six-stage PDS and seven-stage Journey models render together.
5. Journey Overview presents four competing start/resume/demo/action concepts.
6. Entry exposes Runtime representation/evidence classification during description.
7. Reconstruction defaults to Runtime chain, evidence-source, figure and inspector language.
8. Reading puts coordinates/capability/interfaces before the customer result.
9. Navigation/Review mix customer decision, execution, gate and persistence tasks.
10. Professional and Financial routes omit the facts required to select and buy a bounded service.

## User-task acceptance

| Task | Result |
|---|---|
| First encounter with PHI OS | Failed |
| Start Reality Journey | Conditional failure |
| Understand Reading | Failed |
| Find Knowledge | Conditional pass |
| Find Professional Service | Failed |

No overall acceptance can be higher than the most severe open task result.

## Next Work Packages

`EXP-W1 → EXP-W2 → EXP-W3 → EXP-W4 → EXP-W5 → EXP-W6 → EXP-W7 → EXP-W8 → EXP-W9 → EXP-W10`

The detailed scope and issue mapping is frozen in `EXP-W0-action-priority.md`.

## Regression check

`npm run check` must pass after these documentation-only additions. Its final result is recorded below after execution. A pass means the audit files did not regress the repository; it does not change the **EXP-W0 Failed** decision.

Status: **FAILED (exit code 1)**.

The command progressed through the complete precheck and a substantial portion of the main check, including PDS, PWS, Knowledge, i18n, Reading, Navigation and Runtime M1/M2 gates. It stopped in the existing `scripts/check-runtime-security-privacy.mjs` assertion at line 251. The implementation rejected access with `SecurityPrivacyError` code `security_professional_consent_required`, but the test's validation callback returned false. This audit did not modify that script, `functions/runtime/security/access-boundary.js`, or any Runtime/security file. The failure is therefore recorded as an existing baseline test blocker, not repaired inside the prohibited EXP-W0 scope.

The earlier first attempt also stopped before the check because dependencies were not installed. After `npm ci` completed from the existing lockfile, the authoritative rerun reached the Runtime security assertion described above.

## Change boundary confirmation

Only seven files under the reused `docs/experience/` governance directory were added. No public HTML, CSS, JavaScript, locale, Runtime, Runtime Contract, Registry, Migration, D1, Provider, PWS object, payment, entitlement, Knowledge Registry or Production behaviour was modified.
