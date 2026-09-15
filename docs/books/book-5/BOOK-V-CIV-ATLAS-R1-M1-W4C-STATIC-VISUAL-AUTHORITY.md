> 当前实施版本：用户已将 CASE_SECONDARY 改为 64 REQUIRED。现行总量 380、43 批，详见 [W4C 当前完成记录](static-visual-authority/W4C-COMPLETION.md)。以下 436／48 数字保留为历史基线。

# BOOK-V-CIV-ATLAS-R1-M1-W4C
## Civilization Static Visual Asset Authority

Status: MACHINE-READY STRUCTURAL FREEZE

This delta is additive. It does not modify the frozen R1 historical registries.

### Source authority

- 120 canonical Civilization Cases are read from `content/civilization-atlas/cases/civilization-case-registry-v1.json`.
- Case order is preserved exactly.
- Case visual IDs are derived only from existing `CA-Txx-yy` IDs.
- No `C001–C120` authority is created.

### New W4C authority

- 436 planned visual asset records
- 14 governed visual families
- 14 prompt templates
- 48 production batches
- 120 Case Hero assets
- 120 Case Secondary assets

### Authority boundary

Images are editorial/visual projections only.

```text
Image illustrates Registry.
Registry never learns from Image.
```

No generated image, OCR result, poster text, or visual geography may write historical claims back into the Atlas registries.

### Production gate

All records begin:

```text
status = PLANNED
reviewState = NOT_PRODUCED
bindingState = UNBOUND
bucketKey = null
```

Only human `ACCEPT` may authorize upload and later binding.

### Verification

Run:

```bash
node scripts/check-book-v-civ-atlas-r1-m1-w4c-static-visual-authority.mjs
```

The checker requires the existing canonical Case Registry to remain present in the repository.
