# Repository cleanup execution record

Local only; no commit, push, deploy, history rewrite, gc, repack, production or Provider operations. No applicable AGENTS.md was found in root/ancestor discovery.

Initial C: free: 595,939,328 bytes. Final measurement is in RESULT.json; disk free changed rapidly during concurrent work. Manifested logical deletion: 25349728855 bytes / 14,109 files. Additional initial test-directory exception: 82 directories, 10,431,907 bytes; manifest write failed before deletion and is explicitly not claimed as a pre-deletion manifest.

## Kept worktrees

All four have modifications: pr6-ebook-closure (15), tarot-pr8-safe (5), pages-final-candidate (6), report-narrative-validation (1). Branch worktrees have no commits absent from main in the initial audit; detached worktrees are registered in Git and retained regardless of reachability. No worktree was removed. Read-only process audit found active Codex, Node and review processes; ambiguous working directories were treated as active.

## Git storage

Objects occupy about 19.42 GB, including approximately 5.20 GB Git-reported garbage, intentionally untouched. Reachable blobs contain 12648491247 logical bytes (compressed physical reachable size is not established). Historical deletion does not reclaim these objects.

Largest historical paths and exact sizes are in git-history.json. Candidates include obsolete QA PDFs under output/pdf/report-visual-asset-convergence-r2/, output/pdf/w11r6/, docs/guided-report-successor-r2/, historic embedded-image review HTML, and accidentally tracked .tmp manuscript PDFs. Their migration requires preserving private originals/approved assets, changing historical references, coordinated clone/branch migration and separate authorization. Uncompressed blob sizes are upper bounds, not estimated pack savings. No shared history change performed.

## Verification

PASS: three-process durable Financial save/resume/reopen; temporary success directory removed. PASS: syntax checks of three JavaScript generators and two Python scripts. PASS: targeted git diff --check. PASS: scoped ignore rules. PASS: current Master has zero references to deleted files/directories. Full browser generation and full historical builds were not rerun, avoiding new large evidence. Existing historical JSON receipts may name retired screenshots; they are retained as historical records, not current image links.

## Prevention and changed source

- .gitignore: scoped generated browser/snapshot/compile outputs, no global media rules.
- GOVERNANCE.md: one current review, failed diagnostics, ephemeral rasters, sparse-first worktree policy and required pre-deletion manifest.
- scripts/build-external-reality-r1-snapshot.mjs: stable current snapshot, replace disposable current copy; exclude worktrees/tmp trees.
- scripts/verify-visual-binding-r5-financial.mjs and scripts/verify-visual-binding-r6-browser.mjs: stable current output; successful screenshots removed unless --keep-review-images; failures retained.
- scripts/ecr-r33-inspect.py: temporary successful PDF rasters by default; --keep-review-images opts in; failed Poppler rasters retained.
- scripts/ecr-r33-closeout.py: PDF/page-map review supports optional raster retention.
- tests/financial-preparation/durable-report.test.mjs: successful fixture cleanup, failure preservation.
- Existing Master: appended cleanup evidence links only.

## Not deleted

Current HD/Numerology and other-window outputs, active runtime databases/assets, accepted manuscripts, official visuals, order-related PDFs, current reviews, unresolved diagnostics, all dirty worktrees and Git objects. Old source checkouts under tmp contain potential unique overlays; they are retained pending exact uniqueness proof, rather than treated as cache. No R2 access or modification.

## Follow-up growth investigation (2026-10-27T07:27:01.3734963Z)

PARTIAL: complete historical attribution and disk stability are not established. All values use bytes; decimal GB = bytes / 1e9. Both earlier commands targeted C:, and recorded capacity matches current Windows-SSD / 3472030B (509722226688 bytes). The old serial was not stored. Peak 25,748,410,368 bytes is bounded by the 07:04:39Z deletion-manifest time and first retained quote at 07:05:47Z; exact time is unavailable. RESULT.json recorded 2,903,420,928 bytes at its original 07:09:47Z mtime (UTC+8 local: approximately 15:04–15:09). Log matches found in local session files are later quoted messages, not original tool events. They cannot prove exact measurement times.

Three initial 30-second rounds plus a corrected normalized bounded scan series were completed. Corrected verified rounds:

- 2026-10-27T07:24:56.569Z: C: free 2463178752 bytes; Git pack 2138495941 bytes; scan 9677 ms.
- 2026-10-27T07:25:53.127Z: C: free 2351980544 bytes; Git pack 2138495941 bytes; scan 11513 ms.
- 2026-10-27T07:26:27.397Z: C: free 2102808576 bytes; Git pack 2138495941 bytes; scan 19392 ms.

Specific writers: HD physical-qa.py/render.mjs -> .tmp/hd-r64/pages, current R64 contact sheets and owner PDFs; Numerology build -> current R20 page PNGs; other task Pages builds PIDs 19940/56716 -> generated publication output. Codex creates and discards MB-scale agent-host-git-diff temporary indexes. These are active other-window tasks, not proven orphan work from this cleanup. None was killed or deleted. See GROWTH-INVESTIGATION.json for exact observed paths, PIDs, file sizes and caveats.

Git objects grew about 9.77 MB relative to the previous inventory; verified pack totals were unchanged. C:/pagefile.sys is 28394450944 bytes, last modified 2026-10-27T07:13:21.3080295Z; no earlier size exists, so it remains a hypothesis for part of the historical loss. No paging settings changed.

Final C: free 1961590784 bytes at 2026-10-27T07:27:01.3734963Z. Global free space is not stable. The 22.845 GB historical loss remains incompletely attributed. No new eligible abandoned garbage was proven, so follow-up deletion = 0. All finite samplers exited; no polling service remains. No build, PDF rendering, screenshot capture, install, checkout, commit/push/deploy or paid Provider call was initiated. Earlier scoped ignore/retention fixes remain in place.
