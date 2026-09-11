import {spawnSync} from 'node:child_process';
for(const script of ['scripts/check-book-v-civ-atlas-r1-w12-cross-layer.mjs','scripts/check-book-v-civ-atlas-r1-w13-contextual-ask.mjs']){const r=spawnSync(process.execPath,[script],{stdio:'inherit'});if(r.status!==0)throw new Error(`BOOK_V_CIV_ATLAS_R1_W12_W13_STEP_FAILED:${script}`);}
console.log('✓ BOOK-V-CIV-ATLAS-R1-W12-W13 passed.');
