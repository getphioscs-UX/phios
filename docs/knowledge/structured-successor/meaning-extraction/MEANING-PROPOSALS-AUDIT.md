# 40-candidate source audit — completed

All five restored batches cover exactly 40 task IDs with definitions: Book II 12, Book III 28. All 88 quotes match the corresponding source text after NFKC/whitespace normalization. Identity fields, evidence indexes and pending-review authority flags pass.

Book II is verified against the registered reviewed corpus file digest and section text digests. The newly supplied KAU-R6D-Book-III-Manuscript-Readability-Review.html contains 106 sections; the 28 required Book III section texts rehash exactly to their registered task source digests. The HTML is parsed as JSON data only, without executing its scripts. Its source hash is recorded in meaning-proposals-audit-v1.json.

The local Book III PDF still differs from the registered binary. That does not block this chapter-text audit now that the exact registered section text is available. No PDF authority or source freeze has been replaced. The earlier SOURCE_VERSION_NOT_VERIFIED findings are closed through the matching original section-text evidence, not by changing expected hashes.

All 40 are ready for consolidated semantic review. This means source quotation and identity verification, not that every paraphrased claim has been human-approved. Definitions remain proposals; the live registries still contain 40 missing meanings until the review and versioned successor import. No automatic registry writeback, deployment or human approval was performed.

Current repository review page: functions/_source-material/meaning-proposals/MEANING-40-SOURCE-COMPARISON.html. At the user’s request, the five original batches and exact registered Book I/II corpus plus Book III section text are now archived under functions/_source-material/. The pinned Pages uploader excludes functions/ from public assets; these files are not imported into the runtime. Audit metadata remains under docs/. See MEANING-SEMANTIC-DIFFERENCES.md for the AI comparison and the user’s explicit clarification that meaning approval has not yet been given.
