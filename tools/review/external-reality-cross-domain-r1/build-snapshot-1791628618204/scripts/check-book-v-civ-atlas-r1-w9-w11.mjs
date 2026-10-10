import {spawnSync} from 'node:child_process';
const steps=[
 'scripts/check-book-v-civ-atlas-r1-w9-trajectories.mjs',
 'scripts/check-book-v-civ-atlas-r1-w10-transitions.mjs',
 'scripts/check-book-v-civ-atlas-r1-w11-loss.mjs'
];
for(const s of steps){const r=spawnSync(process.execPath,[s],{stdio:'inherit'});if(r.status!==0)throw new Error('BOOK_V_CIV_ATLAS_R1_W9_W11_STEP_FAILED:'+s);}
console.log('✓ BOOK-V-CIV-ATLAS-R1-W9-W11 passed.');
