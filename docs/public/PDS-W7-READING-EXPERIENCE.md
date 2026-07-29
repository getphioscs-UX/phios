# PDS-W7｜Reading Experience

Baseline: `main@7c7a633549224d41ca4107bb8f384458f7322c55`

W7 changes only the Reading projection and presentation. Reading Gate,
evidence thresholds, Confidence calculation, Runtime judgement and Navigation
readiness remain frozen.

Customer View now leads with the current one-sentence understanding. Core
findings progressively disclose the summary, Runtime chain and weighted
evidence. Known, unknown, conflict and certainty are presented separately.

Evidence View keeps evidence cards closed by default and reveals complete
lineage only through a second explicit disclosure. Technical View and the
system-detail inspector remain opt-in. Navigation readiness continues to
project the existing `navigation_rationale.ready` value in customer language.

Run `npm run check:pds-w7` to verify the UI contract and SHA-256 hashes of the
frozen Reading Runtime, Gate, threshold, API, loader, Navigation and customer
projection artifacts.
