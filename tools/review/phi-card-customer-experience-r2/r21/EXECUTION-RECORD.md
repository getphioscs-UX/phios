# R2.1 execution record

Baseline 659d7b0d0a80b7b79024bd208bf972ba9a543df9; current 659d7b0d0a80b7b79024bd208bf972ba9a543df9. Protected source/hash files 18/18 unchanged. Existing dirty delivery test and BaZi guard receipt preserved.

Full build and existing Pages check both passed; the existing --check-only flag is ignored by the build script, so the check entrypoint rebuilt. No source fix outside this task was attempted.

48/48 cards, 96 runtime-text language versions; six exact source files retained. Offline HTML: 96/96, zero network. New missing viewport pairs: 96/96; previous 96 runtime cases reused only after matching hashes. Isolated HTTP/engine: 10/23 PASS. R1 accepted state unchanged.

Regression: 11 PASS / 3 FAIL. See STATUS.json and detailed logs; failures are not accepted. Real customer login and production admission remain NOT_RUN. Image strict single-language remains BLOCKED (48 images, 96 approved locale mappings needed). No new cards or images generated.

Complete text pack, CSV audits and semantic candidate issues created. All R2 human decisions remain pending. No full worktree/backup created. No production writes, fees, commit, push or deploy.

## Concurrent edit after regression

The Stripe test script changed in another window after the recorded failure. See CONCURRENT-DRIFT.json for tested/current SHA256. The 11 PASS / 3 FAIL counts are time-bound evidence; the changed Stripe test revision was not rerun or approved here. Other-window edits were preserved.
