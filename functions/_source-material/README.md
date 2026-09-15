# Repository source archive

User requested the desktop Book I–IV bodies and meaning proposals be retained in this repository. `books/*-desktop-text-v1.json` preserves extracted text by PDF page, with PDF-byte and per-page text SHA256. PDF images/layout are not reproduced; original PDFs remain on the desktop. Each exceeds 100 MB, so the searchable text is stored instead of the large binary.

Book I/II registered reviewed corpora and Book III registered section text are also archived for reproducible quotation verification. Desktop PDF versions remain distinct from these historical authorities. Do not replace the canonical source hashes with new binary hashes just to satisfy a check.

This directory is evidence, not a runtime registry or a second knowledge master. The pinned Wrangler Pages asset validator excludes the top-level `functions` directory; these JSON/text/HTML/ZIP files must not be imported into Worker code or moved into public asset directories. `check:b14-sks:source-material` checks that exclusion and source hashes. Other hosting systems would need the same explicit exclusion.

Open `meaning-proposals/MEANING-40-SOURCE-COMPARISON.html` locally to compare all 40 explanations, verified quotations, 8 added evidence passages and 2 proposed wording revisions. AI comparison is not human approval. Original proposals are preserved.

`rollback/b14-sks-ee07ca1.zip` contains the affected baseline subset. Full-site rollback requires the recorded Git commit and the normal deployment workflow; this ZIP alone is not a complete website deployment.
