# BAZI-DYNAMIC-R1-BATCH-03

Baseline: `0673ea93c99c5161ac101dcb13630385850a2673`.

Scope: **P16–P19 only**, all using M06 Domain. Stop before P20. The implementation and review artifacts do not activate customer publication or checkout. Existing approval of static artwork is preserved; acceptance of these dynamic pages remains pending.

## Review

[Open Batch 3](http://127.0.0.1:8788/docs/guided-report-successor-r1/batch-3/review.html). Choose 中文, English or 双语. The page selector and “参考图并排对照” show each output beside M06; the A4 PDF link follows the selected language.

- `screenshots/`: 24 page captures (1440px and 390px) and 12 M06 comparisons.
- `bazi-p16-p19-zh-Hans.pdf`, `bazi-p16-p19-en.pdf`, `bazi-p16-p19-bilingual.pdf`: four A4 pages each.
- `pdf-review/`: all 12 rendered PDF pages and three contact sheets.
- `browser-evidence.json`: responsive geometry, print overflow/overlap and both previous batches' screenshot comparisons.
- `pdf-evidence.json`: A4 dimensions and logical numbering 16–19 / 26.
- `validation.json` and `npm-check.log`: final validation results.

## Page-to-source mapping

| Page | Topic owner | Presentation |
| --- | --- | --- |
| P16 Self & Direction | `professionalTopics.topics[LIFE_OPERATION]` | Life-operation functions and their source-selected lead. The runtime has no separate SELF topic; this page does not invent a personality or direction verdict. |
| P17 Relationships | `professionalTopics.topics[RELATIONSHIPS]` | Relationship functions, recorded interfaces and priority-theme count. No pillar-to-person or partner-outcome assignment. |
| P18 Career & Work | `professionalTopics.topics[CAREER]` | Work-domain functions, candidates and contextual demands. No profession recommendation or success prediction. |
| P19 Resources & Money | `professionalTopics.topics[WEALTH]` | Resource-exchange functions. WEALTH remains the owner's lead even when OFFICER has a larger occurrence count. No income promise. |

The corresponding `customerNarrative.topicNarratives` supplies the full approved lead and condition text in each language, without copying example claims from M06 artwork. Every visible group count, context metric, theme count and narrative has a source reference in the existing Page IR. Candidate counts are counts of candidate records, not established patterns or formation paths. Group occurrences are unweighted; root records and visible support/demand remain separate.

All four pages share the same hub/satellite composition, adjacent key-theme panel, support/demand panels and observation context. Gold emphasis identifies the source-selected lead; line geometry expresses membership in the domain, not causal influence or strength. The repeated contextual panel anchors the domain in the same reading and is not claimed as additional information gain.

## Architecture and boundaries

`projectBaziVisualReport` delegates only the explicit Batch 3 review option to a subordinate projection. The existing structural projection validates the admitted context, `createVisualPage` remains the Page IR owner, and `renderVisualReportPages` remains the renderer owner. The shared header, footer, typography and panel contracts are unchanged. All new CSS is scoped to Batch 3 and uses frozen report tokens. Web and PDF consume the same IR.

Missing or duplicate topic owners, unsupported composition states, unknown group labels, malformed counts, missing translations and missing non-prediction boundaries fail closed. The source-selected lead is not recomputed from count order. Production publication and checkout remain false, and human review remains pending. Bilingual density retains the existing conservative IR review state; the browser additionally measures real page geometry without overriding that state.

The fixture is the existing governed deterministic synthetic benchmark executed through the BaZi runtime, not a live customer. Its declared solar-term test fixtures remain in `scripts/smr-benchmark-support.mjs`. Run `node scripts/build-bazi-batch-3-review.mjs` to regenerate all three locales from that runtime.

M06 controls composition, not data authority. Its painted mountain pixels, sample icons and personalized example claims are not copied. This is the established vector/data adaptation using the existing report language; reference comparisons remain available for visual acceptance.

## Regression

`regression-baseline.json` was captured from the clean `0673ea9` checkout before edits. The targeted check requires exact prior stylesheet bytes, token bytes and HTML hashes for both previous batches and all locales. The check is prepended to `npm run check`; the required PTRC check-chain ending is preserved.

The browser checks all 60 committed Batch 1/2 screenshots without overwriting them. It preserves any historical capture mismatch and separately rerenders with the exact pre-Batch-3 stylesheet to identify whether the new CSS caused it. One historical Batch 2 Chinese desktop P15 capture differs by four pixels (maximum RGB-channel difference 5); the original stylesheet reproduces the current capture exactly. This is recorded explicitly rather than called a byte-identical historical match.

See `validation.json` for final execution status. Machine verification is separate from human dynamic visual acceptance.

Full `npm run check`: **PASS, exit 0**, including precheck, check and postcheck. Final presentation changes also passed targeted checks and browser/PDF verification. All 12 PDF pages were visually inspected. Historical screenshot comparison: 59/60 byte-identical; the remaining four-pixel raster difference is independently reproduced with the unchanged prior stylesheet. No Batch 1/2 HTML, token or stylesheet change.
