# KNR-W0R Knowledge Inventory Reconciliation

Baseline: `getphioscs-UX/phios main@fd402e6b0565430078707a588cc5ae63e675f483`

KNR-W0R removes proven duplicate, obsolete and misplaced inventory before question routing begins. It does not reinterpret Canonical Knowledge, change publication state, archive production history, or implement KNR-W3.

## Reconciliation

The former `docs/knowledge/runtime/` directory contained seven byte-identical copies of active PKR documents plus an older canonical-data-model copy missing the v1.1 granularity rule. `docs/knowledge/` remains the only active PKR documentation location; `docs/knr/` is the only Knowledge Runtime programme location.

`EXP-W4A.patch` and `EXP-W5.patch` were unreferenced delivery residues. The misplaced `content/knowledge/registry/m3c-navigation-operationalization.json` duplicated a Navigation-owned acceptance record and broke the frozen 12-file Knowledge Registry boundary. Its correct authority remains `content/registry/m3c-navigation-operationalization.json`.

## Frozen responsibility

```text
PKR｜Canonical Knowledge Authority
↓
PJA｜Canonical Article Production
↓
Published Knowledge Assets
↓
KNR｜Question Retrieval and Adaptive Projection
```

Canonical Nodes, C2 candidates, C3 assessments, readiness records, Production history and published article content are preserved. Search Alias and Supporting Question population remains later governed work rather than cleanup-generated authority.

Earlier KH-W3.5 documents use “Knowledge Runtime Registry” as the historical expansion of PKR. Their frozen hashes are preserved. From KNR-W0R onward, PKR means Canonical Knowledge Registry and KNR means the public Question Retrieval and Adaptive Projection runtime; the reconciliation map supersedes the old naming without rewriting historical evidence.
