import {spawnSync} from 'node:child_process';
const checks=['check-iching-interpretation-source.mjs','check-iching-composition-reality.mjs','check-iching-non-divination-boundary.mjs','check-iching-reality-handoff.mjs'];
for(const f of checks){const r=spawnSync(process.execPath,[`scripts/${f}`],{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1);}
console.log('✓ PHASE 6 I CHING INTERPRETATION + REALITY ICHI-W0–W9 passed.');
