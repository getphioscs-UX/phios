import {execFileSync} from 'node:child_process';

const checks=[
  ['scripts/generate-cx-r12r4b-smr-w0-audit.mjs','--check'],
  ['scripts/check-cx-r12r4b-smr-w0.mjs'],
  ['scripts/check-cx-r12r4b-smr-method-input.mjs'],
  ['scripts/check-cx-r12r4b-smr-no-duplicate-method-runtime.mjs'],
  ['scripts/check-cx-r12r4b-smr-claim-ir.mjs'],
  ['scripts/check-cx-r12r4b-smr-no-renderer-meaning.mjs'],
  ['scripts/check-cx-r12r4b-smr-priority.mjs'],
  ['scripts/check-cx-r12r4b-smr-theme-composition.mjs'],
  ['scripts/check-cx-r12r4b-smr-semantic-dedup.mjs'],
  ['scripts/check-cx-r12r4b-smr-information-gain.mjs'],
  ['scripts/check-cx-r12r4b-smr-contradiction.mjs'],
  ['scripts/check-cx-r12r4b-smr-narrative-ir.mjs'],
  ['scripts/check-cx-r12r4b-smr-reading-ia.mjs'],
  ['scripts/check-cx-r12r4b-smr-layout.mjs'],
  ['scripts/check-cx-r12r4b-smr-competitive-benchmark.mjs'],
  ['scripts/check-cx-r12r4b-smr-five-benchmarks.mjs'],
  ['scripts/check-cx-r12r4b-smr-w17.mjs'],
  ['scripts/check-cx-r12r4b-smr-diversity.mjs'],
  ['scripts/check-cx-r12r4b-smr-w19-pack.mjs'],
  ['scripts/check-cx-r12r4b-smr-w19-human.mjs'],
  ['scripts/check-cx-r12r4b-smr-w20-production.mjs'],
  ['scripts/check-cx-r12r4b-smr-legacy-absence.mjs']
];
for(const [script,...args] of checks)execFileSync(process.execPath,[script,...args],{stdio:'inherit'});
console.log('✓ CX-R12R4B canonical SMR W0–W20 + W20D aggregate passed.');
