# PDS-W8｜Navigation、Review 与 Continuity

Baseline: PDS-W7 applied over `main@7c7a633549224d41ca4107bb8f384458f7322c55`.

W8 changes customer presentation and interaction language only. Navigation
paths remain bounded options rather than commands, no path is automatically
selected, and action preparation remains downstream of Reading.

Navigation now makes comparison, selection, dependencies, customer-readable
Evidence Log, Review readiness and device-local pause/resume clearer. Internal
IDs and gate blocker codes are not projected into Customer View.

Review separates what changed, what did not change and what remains unknown.
Continuity distinguishes continuing the current Journey from starting a
separate Journey. Both remain explicit customer choices; pause/resume does not
complete a path, open Review or create a Runtime.

Run `npm run check:pds-w8` to verify the UI contract and frozen SHA-256 hashes.
