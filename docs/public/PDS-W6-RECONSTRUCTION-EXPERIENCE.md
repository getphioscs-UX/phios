# PDS-W6｜Reconstruction Experience

Baseline: `main@8a7b6cfab35252dd7dd080b5e57b1a1c42035955`

## Boundary

W6 changes only Reconstruction projection and presentation. Facts, evidence
sources, canonicalization, merging, confidence, Reading Gate, Runtime state,
API payloads, persistence and lineage remain unchanged.

## Customer contract

Customer View is reduced to five stable views:

1. The change taking place
2. How it has developed
3. Conditions affecting it
4. What has been established
5. What remains unclear

Condition-level and question-level correction continue to use the existing
inline correction contract. A successful correction now leaves a persistent,
accessible update notice outside the re-rendered projection.

Evidence View renders canonical evidence once and progressively reveals only
customer-readable classification, maturity and merged-source summaries.
Raw/normalized pairs, IDs, internal source paths and lineage remain available
only after the user explicitly opens Technical View.

Technical View and the existing Technical Record are hidden on initial render.

## Verification

```sh
npm run check:pds-w6
```

The check also verifies SHA-256 hashes for frozen Reconstruction Runtime, API,
loader, renderer and customer-projection artifacts.
