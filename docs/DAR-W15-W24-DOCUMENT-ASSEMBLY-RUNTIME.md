# DAR-W15–W24 — Document Assembly Runtime

Baseline: `1fcbb4216db77cbc6d0e2cabb85dafcce1488bdf`.

## Frozen boundary

DAR owns approved structured inputs, approved clause-component consumption, deterministic assembly state and document lifecycle. DAR does not own legal judgment, AI clause generation, Will validity, execution authority, FDR financial facts, RR report authority, CPR presentation authority or professional judgment.

## Runtime chain

`structured input → escalation gate → approved-clause resolver → Document Assembly IR → validation → human review confirmation → renderer → immutable export version → private time-limited download`

All renderers consume Assembly IR only. HTML, PDF and DOCX cannot read the clause registry or intake input directly.

## Current production state

The runtime is implemented and `npm run check:dar` is admitted at DAR-W24. Will production export intentionally remains blocked because the current jurisdiction registry has zero `PRODUCTION_APPROVED` jurisdictions and the clause registry has zero `APPROVED_TEMPLATE_COMPONENT` clauses.

Malaysia therefore remains `LEGAL_VALIDATION_REQUIRED_BEFORE_PRODUCTION`.

## FDR consumption

DAR references FDR facts through explicit lineage only: `fdrRealityId`, `fdrVersion`, `fdrDigest`, with `WILL_ASSEMBLY` consent. Raw FDR fact authority is not copied into DAR and unknown financial facts cannot become assumptions.

## Determinism

Assembly IR contains no runtime timestamp. Its digest is bound to canonical input, immutable template and registry versions/digests, selection rules and resolver version. Export `createdAt` belongs only to the immutable W21 export-version record.

## W23 fixtures

Eleven Will fixtures cover simple beneficiary, minor children, multiple beneficiaries, property, business, residue, digital assets, missing executor, invalid share, unsupported jurisdiction and custom clause. Under current authority all remain non-exportable by design.
