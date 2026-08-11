# PHI OS — PR Production Extension Final

PR-E1 through PR-E10 extend the frozen PR v2 authority without reopening `PR-W0-W13`.

The production extension now supports governed Case Version materialization, reference-only Evidence Package resolution, human-attributable Decision materialization, PWS handoff intents, RR Professional approval handoff, append-only Decision revisions with mandatory re-review, and operation-scoped security / RDG enforcement.

The extension remains fail-closed where repository infrastructure is not implemented. It does **not** claim that PR writes Case Versions to D1, that PR mutates PWS Deliverables, or that PR owns RR report assembly. Those authorities remain external.

A released Professional Decision Package is immutable. Any material change creates a new package reference and higher semantic version, links the predecessor digest and release reference, and starts again in DRAFT. Review, Approval, Signature, and Release cannot be inherited from the previous version.

Security enforcement consumes existing Assignment, Consent, Capability/Credential, Professional Authorisation, and RDG decisions. Account roles, AI, providers, visibility, or prior release state never grant Professional authority by themselves.
