# npm run check repair｜main@f03ed86

## Repaired

The repository contained a valid, accepted `PHI-OS-KSAR-R8-PRODUCTION-FREEZE-v1.0.0` from `836eef3`, but the later state checker required an optional status companion that did not exist and imported a checker restricted to a different v1.1 schema.

The repair preserves the exact v1.0 freeze and its evidence bytes. `check:ksar-r8-state` and `check:ksar-r8` now validate the accepted v1.0 authority directly; a later status companion is optional, but must bind to the exact freeze SHA when present.

VAP-W5R was also reconciled as a frozen 716-node predecessor production projection. It is checked against the exact KAU-R5 predecessor Node set rather than rebuilt from the 718-node successor. The two KAU-R5 P7 admissions remain outside VAP until a separate governed VAP successor is accepted.

## Verification

- `npm run check:ksar-r8-state` — passed.
- `npm run check:ksar-r8` — passed.
- `npm run check:vap-w5r` — passed.
- `npm run precheck` — passed, including BOOK-W1B, W1C and W1D candidate gates.

The full `npm run check` now passes the reported KSAR-R8 failure and the VAP-W5R predecessor gate. Its next existing blocker is VAP-W8: the frozen validation projection contains earlier PJA Candidate digests while six current Candidate files have later byte digests. Those Human/production-lineage artifacts require a separate governed VAP-W8 successor reconciliation and are not rewritten by BOOK-W1D.
