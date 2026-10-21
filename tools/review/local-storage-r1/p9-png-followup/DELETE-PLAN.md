# P9 failed-export derivative cleanup · 2026-10-21

Exact target: C:\phios\tmp\p9-t8-r4\source

This is the failed CRLF git-archive export, not the accepted source-blob. The failed source was superseded by tmp/p9-t8-r4a/source-blob, whose accepted byte-exact/build/deployed receipts are retained. No current runtime or validation consumer references this failed target. All 48,118 files were hashed against every retained candidate.tar member: no difference, extra or missing file. Archive SHA256 8098dcfd78922c2f29af773c8b7904fc85c6ba9b8fcc8a143794dbec27841136.

Prerequisites: all PNGs independently equal accepted successor; no tracked files; no repo process; no reparse point; exclusive handle gate; same exact file count and bytes. On any failed gate retain target.

Keep: candidate.tar, failed-export receipt, authoritative source-blob and its full manifest, current source and Financial R3, old acceptance/QA evidence. This removes only a reconstructible failed extraction, not an accepted source or sole evidence copy.

Local recreate, only if requested later: create original target directory, then `tar -xf C:\phios\tmp\p9-t8-r4\candidate.tar -C C:\phios\tmp\p9-t8-r4\source`. Verify against FAILED-EXPORT-FILE-DIGESTS.json. No Git checkout/export with potential CRLF transformation.

Deletion is permanent, no Recycle Bin. One exact directory, no wildcard or extension deletion.
