# PJA-W3R｜Knowledge Production Workflow Review

Baseline: `main@2299e008f503a4adda590c460e8734fac5500393`.

The audit confirmed that Knowledge Registry, Canonical Thesis, Boundary, Claim/Source traceability, Production Readiness and publication separation are necessary. The excessive burden lies in persisted projections, recursive stage commands and the expectation that TL understand or edit derived JSON.

W3R freezes three layers: Canonical Authority, Production Authority and the Editorial Working Layer. TL edits only `draft.md`; indexes, candidates, assessments, bindings, coverage and hashes are tool-derived. Delta ZIP files are delivery vehicles and are not authority or repository artifacts.

The daily workflow is unified behind Prepare, Draft, Review, Approve, Export and Status commands. Node checks are local and fast; PJA checks use a unique fixed topology; full repository checks remain pre-commit, CI and release gates. W3R1 implements the simplification without deleting historical tools.

Final decision: proceed through `PJA-W3R1｜Scalable Knowledge Article Production Workflow` before Human Editorial Workspace production.
