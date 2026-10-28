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

## 2026-10-28 concentrated cleanup — checkpoint

Owner authorized retiring historical generated media and verified paused worktrees. This supersedes the older dirty-worktree retention decision only after exact source recovery is verified. Four small source ZIPs outside the repository passed SHA256/CRC and binary-patch checks. PR6's 11 unique commits and Tarot's 4 unique commits retain their original branches; detached Pages/narrative tips have local recovery refs. All four worktrees were removed normally, without force/reset/clean. A dependency junction left by normal Git removal was removed as a link only; main dependency content was checked unchanged.

Five obsolete P9 source/build snapshots have been retired after per-file manifests and unique-source preservation; internal Git metadata and receipts remain. Git itself classified abandoned temporary garbage; 153 files older than 14 days were deleted only after excluding concurrent readers/writers. ReadOnly attribute failures from the first attempt remain in CURRENT-GIT-TEMP-DELETION-FIRST.json. No valid Git objects, registered packs, LFS, reflogs or refs were deleted; no gc/repack or history rewrite.

Baseline volume serial is 3472030B, capacity 509722226688 bytes, available 14668091392 bytes at 2026-10-27T16:16:26.4735031Z. Initial main 090947e2 advanced through another window's merge to ef412baa at local 00:12; those changes are preserved. Inventory and later checks bind to that current state, not a reset to the earlier HEAD. No project batch generator was observed; existing read-only preview servers were left running. Final totals, corrected junction/hardlink accounting, retention checks and three finite stability samples follow in the current RESULT successor. The historical 22844989440-byte loss remains UNKNOWN.

## 2026-10-28 concentrated cleanup — final current result

Volume C: serial 3472030B; capacity 509,722,226,688 bytes. Available 14,668,091,392 → 78,642,417,664 bytes; measured net gain 63,974,326,272 bytes (63.974 decimal GB). Last sample 2026-10-27T20:35:01.0075764Z. Both 15/25 GB targets exceeded. Logical deletion sizes are not physical allocation/reclaim claims.

| Category | Files | Logical bytes | Decimal GB |
|---|---:|---:|---:|
| retired linked worktrees | 235,878 | 32,453,333,223 | 32.453 |
| obsolete P9/build snapshots | 249,773 | 28,457,718,571 | 28.458 |
| superseded rendered PDFs/PNG/HTML/TAR | 121 | 1,555,225,685 | 1.555 |
| Git-classified expired temporary garbage (not valid objects) | 153 | 5,006,171,843 | 5.006 |

| Retired path | Retained branch/ref | Logical GB before → after | Verified small recovery archive |
|---|---|---:|---|
| C:\phios\.worktrees\pr6-ebook-closure | codex/pr6-ebook-closure-20261025 | 12.317 → 0 | C:\phios-recovery\20261028\pr6-source-recovery.zip |
| C:\phios\.worktrees\tarot-pr8-safe | fix/tarot-read-only-execution-20261027 | 10.875 → 0 | C:\phios-recovery\20261028\tarot-source-recovery.zip |
| C:\Users\Guest Account\.codex\worktrees\pages-final-candidate\phios | codex/recovery-pages-20261028 | 8.603 → 0 | C:\phios-recovery\20261028\pages-source-recovery.zip |
| C:\Users\Guest Account\.codex\worktrees\report-narrative-validation\phios | codex/recovery-narrative-20261028 | 0.657 → 0 | C:\phios-recovery\20261028\narrative-source-recovery.zip |

Current main working files: 26,228,610,205 bytes. Shared Git directory: 19,757,534,274 bytes; objects subtree 19,747,236,309 bytes. Combined unique-file logical size 45,986,144,479 bytes; no additional linked worktree remains. PNGs remaining: 13,307, 6,258,583,618 bytes. Largest 20 files/directories are in CURRENT-AFTER-INVENTORY.json. Directory junctions are not followed in the final inventory; CURRENT-BASELINE-CORRECTED.json corrects the earlier raw traversal.

Three finite samples over 82.4s changed free bytes by +1,462,272; no obvious sustained decline observed. Paging stayed 22,362,464,256 bytes, automatic configuration untouched. The older 22,844,989,440-byte loss remains UNKNOWN. No suitable second physical data volume was found; the recovery partition is not a migration destination.

Git pack count stayed 37; packed object count stayed 47797. Loose-object count increased by 49, so an initial count-equality assertion failed and is NOT reported PASS. Only explicitly classified expired temporary garbage was deleted. Recent temporary files remain itemized; their creating-task/recovery disposition is not established. No valid-object deletion, reflog expiry, branch deletion, gc/repack or history rewrite occurred. See HISTORY-SLIMMING-PLAN.md for the separately authorized future plan.

Current runtime/assets/registries are unchanged from preserved main ef412baaba16ac497f6c94968015e66e364a729a; current review PDFs and required Numerology R20 source JSON passed exact hashes. Guard syntax, threshold rejection, explicit override, render mutual exclusion and junction-target preservation were checked. Initial sandbox TEMP/junction permission failures and their successful scoped successor checks are retained. No new product build or publication acceptance is claimed.

NEXT-REVIEW-CANDIDATES.csv names every held artifact, bytes, missing dependency evidence and next action. Official manuscripts/assets, templates, current Financial R3 and order-delivery materials were not deletion targets. Main's other-window merge is preserved. The normal deletions remain unstaged reviewable differences, including the tracked obsolete snapshot; ignore rules do not substitute for deletion. Provider/production/R2/Stripe writes, agent commit/push/deploy = 0. Development remains paused pending Owner resumption.
