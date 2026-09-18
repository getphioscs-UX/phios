# HD-INTAKE-R1 — implementation and final review packet

Baseline: `ca80d9f5a33955d6e222777ccb8c92b01f5cd4e2`.

## A. W0 implementation map / files inspected

| Existing owner | Files / finding |
|---|---|
| Customer route | `perspectives/personal/index.html`, `assets/customer-ui/js/surfaces/personal-reality.js`; module state, no HD localStorage/sessionStorage persistence |
| Localization | `assets/customer-ui/js/locale.js`, `surfaces/runtime-ui.js`; existing zh-Hans/en customer locale projection |
| Intake API | `functions/api/customer-external-profile-intake.js`; creates canonical `XPF-*` intakeId per current request, no customer/owner profile lookup |
| Extraction | `upload-document-extractor.js`, `hd-profile-parser.js`, `external-profile-extraction-ir.js`; existing governed Workers AI Markdown conversion + native field/activation parser |
| Calculation reference | `hdr-intake-calculation-reference.js`, existing internal validation report runtime, astronomy adapter and personal-structure runtime |
| Confirmation | `external-profile-confirmation.js`, confirm API and `human-design-canonical-chart.js` |
| Incarnation | Existing `incarnation-resolver.js` returns structural four-gate configuration only, explicitly excludes legacy title |
| Variable | Existing canonical chart has one free-text `variable` scalar; established input example is `PRL DRL`. Successor emits `Pxx Dxx`, accepts both orders and compact forms |
| Validation | Existing HD R2/R3 campaigns and current shared-owner registry; no historical freeze rewritten |

W0 plan was reported before implementation: isolate current input and asynchronous responses first; then provenance/reconciliation, deterministic defaults, existing parser integration, localization and progressive disclosure, arrows, machine and browser verification.

## B–C. Contamination root cause and isolation fix

Confirmed code defects: birth date/time/place edits and pasted/manual input changes did not invalidate prepared HD state. In-flight intake, confirmation, shadow and personal-reading responses could write an obsolete chart after the input changed. New uploads also retained previous manual/advanced inputs, which outranked upload extraction. These are concrete paths for A data to be reused for B.

No production TL/owner database lookup, static TL fallback, or HD browser-storage cache was found in the inspected intake path. Reported historical TL values cannot be attributed to an actual customer incident from repository evidence alone. TL-like values existed as test fixtures and manual placeholders; fixtures are not imported by the production intake. The report does **not** claim a recovered incident log.

Input changes now invalidate the draft, confirmed chart, reading, shadow and results. An in-memory revision counter rejects stale async completions; this is cancellation state, **not** a second reading identity. Provenance uses the existing intakeId. New uploads clear old manual, pasted and advanced fields. Reset/reload clears ephemeral state. Manual corrections survive locale re-render within the current draft; no new persistent cache is introduced.

## D–F. Extraction, deterministic derivation, Cross

One additive policy module, `functions/external-profile/hd-intake-reconciliation.js`, is consumed by the existing confirmation owner. It compares per-field candidates, normalizes unordered channels, preserves alternative evidence, and marks disagreements CONFLICT. The current uploaded value stays visible for chart/calculation conflicts. Confirmed edits retain prior source and evidence.

The five user-approved Type → Strategy / Not-Self mappings are owned only by that domain module. Missing values derive from the current Type. Incorrect non-manual themes retain conflicting evidence and show the deterministic value. Conflicting Type evidence blocks derivation. Explicit current-session manual corrections are retained. Type correction at confirmation recalculates unchanged dependent fields.

Each draft field includes value, currentReadingId, source, status, manuallyOverridden, lastValidatedAt and evidence. Existing extractionConfidence remains. Confirmed records carry a validation timestamp and current-session manual confirmation. Legacy records lacking source evidence remain UNKNOWN; they are never relabeled as official-chart extraction.

Cross labels use the existing current-upload parser. The current calculation only supplies gate configuration, **not a governed named-cross lookup**. That configuration remains internal metadata; it is not substituted for a Cross name. If neither current source establishes a title, the title stays UNKNOWN. The reconciliation module covers agreement/conflict if a future existing authority supplies a named label.

The existing converter is reused for PDF/image uploads. There is no new OCR/vision provider, PDF renderer or LLM runtime. Local test conversion fixtures are explicitly controlled fixtures, not evidence of actual image reading. Conversion completion is separated from recognized-field counts. Current birth calculation remains an optional reference requiring review; valid empty channel/center sets are retained.

## G–H. Customer interface / arrows

One localized review explanation replaces repeated per-field paragraphs. Compact status labels keep internal enums off the customer surface. Structures show actual counts, chips/lists and nested edit disclosure. Existing manual text editing remains available only on explicit expansion; there is no safer pre-existing structural editor in this route. Long Cross names also render as wrapping text.

Four native radio groups describe physical position and left/right direction with accessible names, keyboard interaction and selected state. They occupy corresponding left/right positions. Exact supported Variable codes preselect; unknown/conflicting codes do not. A help panel explains matching actual arrows. Confirmation requires all four directions and explicit agreement when any arrow is selected; wholly unknown arrows may remain absent. The existing scalar format is produced by the domain owner, not by frontend string concatenation. PHS meanings are not inferred.

HD-only selection now exposes optional birth inputs previously hidden by the combined-method section gate.

## I–J. Changed / added files

See `changed-files.txt` and the Delta manifest for exact relative paths and hashes. New implementation files are the intake reconciliation policy and intake stylesheet. New validation files are the machine and real-browser campaigns. Other new files are review evidence and the additive contract.

## K–N. Checks and evidence

- `machine-results.json`: executable HD-INTAKE-R1 cases; existing HD R2 campaign imports this checker.
- `browser-results.json`: real Edge, zh-Hans/en × 390/1440, current production route and actual intake/confirmation/location API modules with controlled local file/location responses and real existing local astronomy calculation. Keyboard arrows, new-reading reset and failed-upload current-calculation fallback are exercised.
- `browser/`: form screenshots; fixtures use synthetic A/B subjects. Sticky navigation is hidden only during section capture to avoid overlay artifacts; interaction and overflow checks run on the unmodified route.
- `npm-run-check.log`: original lifecycle completed precheck and the check prefix, then stopped at a legacy ECR Strategy wording assertion. `npm-resume-plan.json` records the exact remaining original commands; `npm-run-check-resume.log` reruns the failed outer group and all subsequent check/postcheck commands. The final postcheck shared-host compatibility repair and two remaining groups are in `npm-postcheck-resume.log`. Final combined status is PASS in `validation-summary.json`; this is a recorded resume, not a claim that the first command exited successfully.
- `cross-successor-regression.log`: existing 90-case HD/Profile Cross campaign, with generated evidence redirected to ignored `.tmp/hd-intake-cross-regression/` so historical review artifacts are preserved. All assertions/imported runtimes are unchanged.
- Compatibility repairs: the old HD copy assertion accepts the new localized review plus mandatory confirmation control; the Zi Wei and P1 browser shared-host assertions now use the existing strict current-owner registry and requires its historical hash as a recognized predecessor. Neither historical admission is rewritten.
- Existing R2 24-case and R3 regression outputs describe their **historical** human acceptance. They do not constitute human approval of this successor.
- Live Workers AI conversion of customer PDFs/images: **NOT_RUN**. Production provider credentials were not activated.
- Independent human review: **PENDING**. No approval is fabricated.

## O–Q. Limitations, remaining manual fields and runtime boundary

Image-only fields remain manual if the existing converter cannot recover them. Named Incarnation Cross remains manual when absent from the uploaded text. Variables require manual arrows if no valid code is recovered; no birth-derived Variable/PHS calculation is invented. Advanced PHS fields remain manual when unprovided. Refresh intentionally discards unsaved form data under existing privacy policy.

No second HD runtime, second engine, second reading identity, OCR/vision provider, Commerce runtime, or Cross runtime was introduced. Report production admission, Cross HD/Profile admission, payment gates and prior rejected report review remain unchanged. No commit, push or deployment is performed.

## Final human review — together with PIS-R1

Review after machine checks: A→B isolation, correct five-Type mapping, clear source/conflict labels, long names, center/channel/gate counts, manual edit preservation, physical arrow positions, keyboard access, bilingual parity, and incomplete PDF/image behavior. Record ACCEPT/REJECT with reviewer/date and specific observations. Do not infer approval from compilation or screenshots.

Keep this intake review with the existing [combined visual-report / Cross / PIS-R1 final packet](../visual-report-r1/final-review.html). Real provider validation remains separately visible; it is not automatically accepted by this review.
