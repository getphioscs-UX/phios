# BATCH-CKA-A｜CKA-W0～W4

Baseline: `316a1bcc8adc817bb8c8fb005260462bb316efdf`

This delta implements CKA-W0 through CKA-W4 as an additive client-surface successor to HPC2-W5. It reuses the existing KAP grounded answer and retrieval runtimes.

## Install on Windows PowerShell

Run from the PHI OS repository root:

```powershell
git rev-parse HEAD
Expand-Archive -Path .\PHIOS-316a1bc-BATCH-CKA-A-CKA-W0-W4.zip -DestinationPath . -Force
npm run check:cka-a
npm run check:hpc2-w5-frozen
npm run check:hpc2-w5
```

The first command must report:

```text
316a1bcc8adc817bb8c8fb005260462bb316efdf
```

Optional full predecessor/current chain:

```powershell
npm run check:hpc2
```

## Production outcome

- CKA-W0 activates the governed Homepage and Knowledge Search entry while keeping Figure contextual-only and Reality-aware entry fail-closed without permission, privacy and entitlement.
- CKA-W1 reduces the first screen to one question: “What would you like to understand?” / “你想了解什么？”.
- CKA-W2 renders Question → Direct Answer → Why This May Happen → What To Observe → What PHI OS Does Not Yet Know → Related Knowledge, with Sources / Grounding collapsed.
- CKA-W3 projects only public knowledge-card fields and does not render internal node, fragment or pipeline state.
- CKA-W4 allows one temporary Guest follow-up and stops when personal case reconstruction, persistent context, multi-factor relationships, action tracking or outcome review is required.

## Frozen boundaries

CKA remains a governed Q&A client surface. This package does not create a second Answer Runtime, second retrieval runtime, generic chatbot authority, persistent case, shadow account, Method execution, Guided Context activation or Reality Journey activation.

`scripts/check-hpc2-w5.mjs` remains the byte-exact historical checker. Current state is checked by `check:hpc2-w5`; frozen artifact integrity is checked by `check:hpc2-w5-frozen`.

