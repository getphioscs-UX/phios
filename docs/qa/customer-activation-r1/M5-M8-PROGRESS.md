# M5–M8 engineering and review handoff

Baseline: `d60e1de`. Changes are local; production deployment and human acceptance have not been performed.

## Completed engineering

- Search dialog clicks now target actual opener buttons/links. The former root HTML attribute intercepted form submission and result navigation. Mobile dialog focus returns to a visible parent menu.
- Article Ask links carry a normalized source contract. The server resolves the selected published article and grounds answers in its actual text. Missing selected sources return an explicit recoverable error. Customer answers are shortened and link back to the article.
- Search prioritizes exact IDs, titles and aliases, requires informative query coverage, and provides pagination. Locale selection and bounded loading/retry behavior were improved.
- Existing Book III/IV Explorer pages support a localhost-only candidate preview with source versions and evidence. Production registries remain unchanged.
- M8 combines the existing 128 decisions with four additional source-grounded Book III candidates: 132 decisions total. The four additions contain 52 checked source excerpts; English interpretation and semantic approval remain pending.

## Evidence and limits

`local-browser-retest-v1.json` covers 10 Search/Ask interactions across desktop/mobile and English/Chinese article Ask. `candidate-preview-evidence-v1.json` covers 16 candidate topic/viewport cases. `public-browser-coverage-v1.json` contains 25 production routes in two viewports: page loading and layout sampling, not complete journey acceptance. Production interaction failures remain open until deployment and retest.

`image-health-report.json` separates completed-but-failed image loads from images not settled during sampling. `sitemap-diff.json` identifies published article routes absent from the sitemap. Neither finding is closed by this patch.

Historical freeze artifacts are unchanged. The maintenance and freeze successors bind current runtime changes while retaining missing-content and human-review gates. The Windows full-check launcher deduplicates inherited PATH entries; it does not skip assertions. Full-run output is in `npm-check-windows-retest.log`; its process exit status must be recorded separately before claiming a pass.

## Remaining work in order

1. Review the 132 source-bound decisions through `M8-REVIEW-HUB.html`; export the review draft. No approval is inferred from page readability or machine checks. The 40 meanings, 20 Book IV definitions, 51 unresolved fields, and Book I Pressure/Threshold remain explicitly governed by their individual evidence and decisions.
2. Resolve requested changes and English semantic parity, validate the exported decisions against the current digest, then perform the authorized import and repeat source/runtime checks. Do not promote article summaries into definitions automatically.
3. Retest P0 Search/Ask and admitted Book III/IV content in the actual QA website, then address the remaining image, sitemap, language, error-state and navigation cases recorded in the issue registry.
4. Verify the QA website's isolated bindings and blank test account before Commerce/account/report end-to-end tests. The supplied Stripe test dashboard currently redirects to login and does not identify a PHI OS QA website. No payment or configuration change has been made.
5. Complete human audio ON/OFF checks and customer journey review at M8. Production readiness remains false until the required evidence and decisions are present.

Run `node scripts/serve-ca-r1-preview.mjs` for the existing Explorer candidate preview. The server prints its localhost address. Stop it with Ctrl+C. Candidate values are response-only overlays and do not write production registries. The review hub is a local file; private source material is not served by this preview server.
