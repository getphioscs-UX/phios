# KNR-W2R1-T09｜P2–P5 Progressive Extraction

Baseline supplied by TL: current repository after P1 human review and private R2 upload.

Copy this package's contents into the repository root and allow `package.json` to be replaced.

## Contract check

```powershell
npm run check:knr-w2r1-t09-p2-p5
```

## Required order

Complete each Part independently. Do not approve multiple Parts in one command.

### P2

```powershell
npm run knowledge:manuscript:extract-p2 -- --dry-run
npm run knowledge:manuscript:extract-p2 -- --apply
npm run knowledge:manuscript:review-p2
```

After TL edits the real candidate file and automatic checks pass:

```powershell
npm run knowledge:manuscript:review-p2 -- `
  --approve `
  --candidate-sha256 "<LATEST_SHA256>" `
  --reviewer-role "TL" `
  --confirm "titles,paragraphs,order,encoding,completeness,headings,page-numbers,figure-captions,theoretical-meaning"

npm run knowledge:manuscript:upload-p2
npm run knowledge:manuscript:upload-p2 -- --apply
```

Repeat the same sequence for P3, P4 and P5 by replacing `p2` with `p3`, `p4` or `p5`.

R2 targets:

```text
books/book-1/extracted/p2-projection-system.md
books/book-1/extracted/p3-runtime-dynamics.md
books/book-1/extracted/p4-human-runtime-carrier.md
books/book-1/extracted/p5-conscious-runtime.md
```

P5 uses `END_OF_BOOK_I` as the controlled end boundary. It does not invent a P6 heading.

## Inventory and Mapping

After each approved R2 upload, follow the existing governed commands:

```powershell
npm run knowledge:manuscript:inventory -- --dry-run
npm run knowledge:manuscript:inventory -- --apply
npm run knowledge:manuscript:map -- --dry-run
npm run knowledge:manuscript:map -- --apply
```

Then prepare and approve the corresponding Part mapping separately:

```powershell
npm run knowledge:manuscript:review-map-p2 -- --prepare
npm run knowledge:manuscript:apply-map-p2 -- --dry-run
npm run knowledge:manuscript:apply-map-p2 -- --apply
```

Use the corresponding P3, P4 or P5 command only after that Part has completed TL mapping review.

## Final checks

```powershell
npm run check:knr-w2r1-t09-p2-p5
npm run check:knr-w2r1-t07
npm run check:knr-w2r1-t08
npm run check:pja
npm run check
```
