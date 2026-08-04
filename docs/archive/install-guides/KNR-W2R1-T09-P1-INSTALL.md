# KNR-W2R1-T09-P1 Progressive Extraction

Baseline: `getphioscs-UX/phios@fe75cc304eadcbee76e9fe9066441c697c486dcb`

## Install

Extract this ZIP directly into the repository root:

`C:\Users\Guest Account\OneDrive\Desktop\PHIOS\phios`

Allow replacement of `package.json`. The remaining files are new P1 files.

## Acceptance already run for this delta

```powershell
npm run check:knr-w2r1-t09-p1
npm run check:knr-w2r1-t07
npm run check:knr-w2r1-t08
```

## P1 execution order

### 1. Extract candidate

```powershell
npm run knowledge:manuscript:extract-p1 -- --dry-run
npm run knowledge:manuscript:extract-p1 -- --apply
```

If the automatic heading boundary is ambiguous, use the pages reported by the dry run:

```powershell
npm run knowledge:manuscript:extract-p1 -- --dry-run --start-page <PAGE> --end-page <PAGE>
npm run knowledge:manuscript:extract-p1 -- --apply --start-page <PAGE> --end-page <PAGE>
```

Expected private files:

```text
.tmp/knowledge-manuscripts/book-1/p1-reality-physics-candidate.md
.tmp/knowledge-manuscripts/book-1/p1-reality-physics-extraction-report.json
```

### 2. Review candidate

```powershell
npm run knowledge:manuscript:review-p1 -- --dry-run
```

After manually checking the complete candidate, approve it with the SHA returned by the tool:

```powershell
npm run knowledge:manuscript:review-p1 -- --approve `
  --candidate-sha256 "<ACTUAL_SHA256>" `
  --reviewer-role "TL" `
  --confirm "titles,paragraphs,order,encoding,completeness,headings,page-numbers,figure-captions,theoretical-meaning"
```

### 3. Upload approved P1 to private R2

```powershell
npm run knowledge:manuscript:upload-p1 -- --dry-run
npm run knowledge:manuscript:upload-p1 -- --apply
```

Target object key:

```text
books/book-1/extracted/p1-reality-physics.md
```

### 4. Update Inventory and generate Mapping Candidates

```powershell
npm run knowledge:manuscript:inventory -- --dry-run
npm run knowledge:manuscript:inventory -- --apply
npm run knowledge:manuscript:map -- --dry-run
npm run knowledge:manuscript:map -- --apply
```

### 5. Prepare P1 Mapping Review

```powershell
npm run knowledge:manuscript:review-map-p1 -- --prepare
```

Review and complete:

```text
.tmp/knowledge-manuscripts/book-1/p1-node-mapping-review.json
```

Every P1 Node requires all eight checks, at least one approved primary range, current Section Hash, cleared unresolved items, TL reviewer evidence and controlled paid-book substitution risk.

### 6. Apply P1 Mapping atomically

```powershell
npm run knowledge:manuscript:apply-map-p1 -- --dry-run
npm run knowledge:manuscript:apply-map-p1 -- --apply
```

### 7. Final checks

```powershell
npm run check:knr-w2r1-t09-p1
npm run check:knr-w2r1
npm run check:pja
npm run check

git status --short
git diff --stat
git diff --check
```

Do not commit `.tmp`, the PDF, extracted manuscript body, credentials, or R2 URLs. Commit only governed source and metadata files intentionally changed by the approved commands.
