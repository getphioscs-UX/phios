# B14-SKS execution progress

Baseline: `ca1a38b150740ce74ef83b24c421c08e22cb79e7`

## Stage 1: W0–W4

Implemented and machine checked. This is foundation acceptance, not human acceptance or production freeze.

- W0: current and historical authority inventory, per-book canonical nodes, publication bindings, review campaigns, existing consumer evidence and article-checker reconciliation candidates.
- W1: structured knowledge remains a projection; publication, Ask, Reality and canonical ownership stay with existing owners.
- W2: common object schema and required canonical/manuscript provenance.
- W3: 24 universal types. Book-specific specializations must map to this vocabulary; W5's STRUCTURE is not silently added as a universal type.
- W4: 21 relationship types, explicit claim strength and evidence restrictions. Unreviewed relationships cannot claim CANONICAL or SUPPORTED status.

Book III's 103 final nodes and Book IV's 125 final nodes supersede the corresponding book-w1d records. The current seven-volume Book/Part registry owns public book identity and part assignment. Manuscript bytes and remote R2 delivery were not reverified in this local audit.

## Next stage: W5–W11

Implement Book I taxonomy, mechanisms, states, formation chains and comparisons from the approved manuscript-to-node bindings. Build the Formation Explorer through the existing book renderer and bind its selected context to existing Ask. Preserve explicit source gaps; do not treat article publication as structured-object review approval.

Subsequent stages follow the frozen order in `b14-sks-execution-ledger-v1.json`. W5–W80 remain not started. Human review W56–W59, customer acceptance W71–W74 and freeze W78–W80 are not satisfied by these machine checks.

## Seven-volume public cleanup

Public copy and legacy book entry points use seven-volume terminology and current Book IV/V identities. Public-data compatibility loaders resolve all seven books and current Part ownership. `/book-one` and `/book-one.html` redirect to `/books/reality-formation/`. The figures landing page no longer features retired FIG-001/FIG-007 five-volume diagrams. Explore uses HERO-7V-SYSTEM; the obsolete academy figure was removed. Historical registries and asset records remain intact.

## Checks

```text
node scripts/check-b14-sks-foundation.mjs --record
node scripts/check-seven-volume-public-consumers.mjs
npm run check:book-w1-public-projection
npm run check:cx-knowledge
npm run check:i18n
npm run check:tarot-current
node scripts/check-customer-image-loading.mjs
git diff --check
```

The foundation builder resets W0–W4 to pending check; rerun the checker with `--record` to record machine acceptance. No deployment or full repository regression is claimed by this stage.
