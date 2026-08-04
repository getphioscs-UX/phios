# PHI-OS-KNR-W2R1 v1.3.0

## Frozen purpose

KNR-W2R1 v1.3.0 makes the private Candidate Markdown the only heading authority for Book I node-to-manuscript mapping.

## Corrected lifecycle

```text
Candidate Markdown
→ Heading Index
→ Monotonic Node Range Suggestions
→ Private TL Mapping Review
→ Atomic Mapping Apply
```

## Changes

1. A Mapping Review is a derived private artifact. When Candidate SHA or Mapping SHA changes, `prepare` archives the stale review and generates a fresh review.
2. Each Canonical Node receives an independent candidate range. The generator no longer assigns the entire Part boundary to every node.
3. Range starts are selected from the current Candidate Markdown in node order using semantic title similarity plus sequence constraints.
4. Start and end anchors are expanded until unique within the Candidate.
5. Low-confidence suggestions remain explicitly unresolved and require TL attention.
6. Automation may only produce `candidate`; only TL may produce `mapped`.
7. Candidate bodies and private review evidence remain outside Git, public build and production packages.

## Commands

```powershell
npm run knowledge:manuscript:v1.3 -- range-audit
npm run knowledge:manuscript:v1.3 -- range-audit P1
npm run knowledge:manuscript:v1.3 -- refresh-mapping-candidates
npm run knowledge:manuscript:v1.3 -- refresh-mapping-candidates --apply
npm run knowledge:manuscript:v1.3 -- prepare-mapping-reviews --apply
npm run knowledge:manuscript:v1.3 -- refresh-all --apply
npm run check:knr-w2r1-v1.3
```

`refresh-all --apply` stops at private TL review. It never approves or applies node mappings automatically.
