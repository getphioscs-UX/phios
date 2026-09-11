import {spawnSync} from 'node:child_process';
const steps=['scripts/check-book-v-civ-atlas-r1-m1-w0-baseline.mjs','scripts/check-phios-global-favicon-r1.mjs','scripts/check-book-v-civ-atlas-r1-m1-w2-entry.mjs','scripts/check-book-v-civ-atlas-r1-w16-production-freeze.mjs'];
for(const s of steps){const r=spawnSync(process.execPath,[s],{stdio:'inherit'});if(r.status!==0)throw new Error('BOOK_V_CIV_ATLAS_R1_M1_W0_W2_FAILED:'+s);}
console.log('✓ BOOK-V-CIV-ATLAS-R1-M1-W0-W2 passed.');
