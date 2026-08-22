const steps=[
  './check-mrm-s0-authority-baseline.mjs',
  './check-mrm-s1-rm-registry.mjs',
  './check-mrm-s2-em-registry.mjs',
  './check-mrm-s3-evidence-contract.mjs',
  './check-mrm-s4-version-staleness.mjs',
  './check-mrm-s5-capability-inventory.mjs',
  './check-mrm-s6-current-baseline.mjs',
];
for(const step of steps) await import(step);
console.log('✓ PHASE A｜MRM-S0–S6 Master maturity baseline passed.');
console.log('  No package.json alias added; S7–S9 can proceed in parallel with FDR/DAR/RRP foundations without claiming Pilot validation.');
