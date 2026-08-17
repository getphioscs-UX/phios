# IR-W6｜Figure Reconciliation

MIR-2 binds IR figure interpretation records to the single Canonical MFIG Authority Registry. `canonicalNumberSnapshot`, `canonicalTitleSnapshot`, version and status are references only; IR does not own MFIG identity.

The IR registry may later own supported/unsupported claims, operators, derivation edges, evidence and interpretation usability, but MIR-2 intentionally activates no Interpretation Kernel and grants no derivation authority. `UNRESOLVED` figure versions are never authoritative.

Figure dependency is not causality. Every dependency edge must carry an explicit classification (`DIRECT`, `CONDITIONAL`, `CONTEXTUAL`, `ILLUSTRATIVE`, `NO_DERIVATION`) and never transfers authority.
