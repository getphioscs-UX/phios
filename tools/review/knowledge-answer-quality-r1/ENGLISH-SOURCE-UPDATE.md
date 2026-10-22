# English Books II–IV source update — 2026-10-21

Status: LOCAL_SOURCE_IDENTIFIED / HUMAN_REVIEW. This is a metadata and local-readability successor within Knowledge Retrieval & Answer Quality R1, not a new source authority or production admission.

The actual Windows Desktop is accessible: `C:\Users\Guest Account\Desktop`. PowerShell enumerated the three exact filenames and independently computed SHA256; a Python streaming read computed matching hashes. All PDFs are unencrypted, attributed to Teresa Lee, and have an English text layer. PDF timestamps are file metadata, not authorship acceptance or production publication dates.

| Source | Bytes | Physical PDF pages | SHA256 |
|---|---:|---:|---|
| PHI-OS-Book-2-en-v1.pdf | 115568391 | 295 | 0a2dc36302c44f5f82c47f74480ab603e5a394895422eef34aa97a5419e5d58c |
| PHI-OS-Book-3-en-v1.pdf | 75165325 | 262 | e03a4df53f00b541edb931176b2497dec4458dc082e67d21c8c9aa392f1aa6f7 |
| PHI-OS-Book-4-en-v1.pdf | 96584519 | 353 | f34059d090e589ac24b4633b430194f6b2ff99a48519c34fbf5d8b42b9b8d22f |

SOURCE-INVENTORY.json gives full local paths, source versions, creation metadata and exact evidence. Book I English remains out of this update: no duplicate record or modification was made. Original Chinese/English PDFs, accepted records, private storage permissions and historical evidence were preserved.

## Actual reading and structure

Every page was read through pypdf in memory: Book II 282/295 pages contain text; Book III 251/262; Book IV 340/353. Zero replacement characters were observed. Empty text pages are listed individually in ENGLISH-SOURCE-READABILITY.json. The second page in all three books is a visually inspected **image-only contents poster**, not missing prose. Other image-only pages have not all been visually classified in this run. Raw character counts are not deduplicated paragraph counts or lossless extraction acceptance.

The contents and first body page were rendered and visually inspected for each book; additional first/middle/end samples were checked with glyph deduplication and font metadata. The posters establish Book II Parts 5–7, Book III Parts 8–9, Book IV Parts 10–11. Their constituent groups and the body headings are locally readable. PDF outline entries include many paragraph-level entries and must not be called chapter counts. The simple numeric-heading detector found no numbered heading lines; that is a detector limitation, not absence of chapters.

Poppler rendered an opaque blue rectangle over the top of page 3 in all three PDFs. Independent PDFium renders display the expected heading and opening text. This is recorded as a renderer compatibility difference, **not a confirmed author-file defect**. No source edits, OCR, title repair or visual regeneration occurred. Full-book graphic/footnote/layout and semantic acceptance is not claimed. Private samples and heading candidates live only in the Windows temp directory recorded in the receipt and are not served by the review server.

## Reuse and correspondence

**Book II — EXISTING / VERIFIED_LOCAL.** The Desktop hash exactly matches `content/knowledge/manuscripts/completed/book-2-completed-manuscript-en-v1.json`. Reuse that record. It already records a private R2 PDF and historical remote-byte verification; no remote GET was repeated this run. Its 172 exact source-title/body boundaries, 169 exact same-part title matches plus three resolved title variants, and 3-section/6-fragment private local experiment remain the current evidence. The six local checks were re-executed via the actual existing Knowledge Access handler and in-process experiment owner: three source queries passed; no-capability, forged-capability and production-environment attempts did not expose this English source. No old receipt was rewritten. Full-book answer acceptance remains false.

**Book III — IDENTIFIED / PARTIAL.** Current English source is e03a4df5…; current accepted Chinese source identity is efbfdd21… in `content/knowledge/manuscripts/review/book-3-owner-final-20261011-efbfdd21fa21-source-acceptance.json`. The compiled active manuscript registry still names the historical Chinese 75a6b798… corpus. Its 103-section historical semantics cannot silently establish parity with the newer Chinese source or this English PDF. Part-level and terminology correspondence is recorded, but full chapter/argument alignment is not yet established. There is no English Book III source row in the compiled active manuscript registry.

**Book IV — IDENTIFIED / PARTIAL.** English source f34059d0… corresponds at book/part level to accepted Chinese ab265b90… (`book-4-owner-final-20261011-ab265b9004da-source-acceptance.json`), which the active registry also names. The legacy final section inventory references 181cb98e…; the newer source has a separate private extraction candidate. Use its actual current-source positions for future alignment; do not reuse old page offsets merely because the book title/section count resembles it. No English Book IV active source row or private corpus was found in the audited owners.

The frozen `content/knowledge/l10n/bilingual-terminology-registry.json` and `functions/knowledge-runtime/approved-terminology-context.js` remain the terminology owner. Respectively 27, 25 and 21 approved locked English terms occur in these PDFs; the inventory records the existing term IDs, Chinese labels and page locations. Occurrence proves a vocabulary anchor, **not** equivalence of every definition, mechanism, condition or exception. Chinese/English sections may align one-to-many and need not be sentence translations. No new terminology was accepted or canonical concept renamed. Book II poster “Consciousness Runtime” versus body “Conscious Runtime” remains a source presentation variation for review, not an automatic registry rename.

## Existing consumer status

| Consumer | Existing English use | These private English manuscripts |
|---|---|---|
| KIR R2 | English published article/profile bindings and content fragments | No active English Book II–IV manuscript rows; article retrieval does not prove full manuscript use. |
| KAP / Knowledge Access | Published English and existing manuscript scope/eligibility owner | Book II six local fragments pass only with existing server-held experiment capability; Book III/IV not integrated. |
| Ask | Existing published article resolver and governed grounding/composition | No new engine, content upload or paid synthesis; full private English manuscript answer route not proven. |
| Books | Existing public book identities/readers and English published content | Book II private source metadata exists; no public full-English-PDF binding or public-read permission added for any of these sources. Production access was not probed. |
| World | Existing public Articles/Books/Atlas and local bounded mechanism candidate | Existing English public articles remain usable; these three private PDF bodies were not added to World search or local public ARGUMENT-INDEX.json. |

This corrects the earlier coverage inference: **absence from the active registry is not absence of a completed private source**. The previous English coverage rows are retained under `englishDesktopSourceUpdate.previousEnglishRows`; public paragraph counts and old test results are unchanged. Production remains RUNTIME_UNVERIFIED, not automatically PASS or globally absent.

## Delivery boundary

Only metadata, scripts, audit notes, coverage and the existing human-review entry were updated. No private PDF, full body, extracted paragraph corpus or private PNG was added to the public repository/index/server. No R2 upload, permission change, production write, Provider call, commit, push or deploy occurred. Next steps are in ENGLISH-INCREMENTAL-INDEX-PLAN.md; implementation/admission and human source-quality acceptance remain separate.
