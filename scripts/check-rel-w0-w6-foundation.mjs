import {spawnSync} from 'node:child_process';
const commands=[
 ['node','scripts/check-rel-w0-w3-foundation.mjs'],
 ['node','scripts/check-rel-w4-method-composition.mjs'],
 ['node','scripts/check-rel-w4-human-admission.mjs'],
 ['node','scripts/check-rel-method-authority-successor-human-admission.mjs'],
 ['node','scripts/check-rel-w4-all-method-current-reconciliation.mjs'],
 ['node','scripts/check-rel-w4-all-method-current-freeze.mjs'],
 ['node','scripts/check-rel-w5-current-reality.mjs'],
 ['node','scripts/check-rel-w6-cross-method-synthesis.mjs']
];
for(const [cmd,arg] of commands){const r=spawnSync(cmd,[arg],{stdio:'inherit',shell:false});if(r.status!==0)process.exit(r.status??1)}
console.log('✓ REL-W0–W6 relationship foundation aggregate passed.');
