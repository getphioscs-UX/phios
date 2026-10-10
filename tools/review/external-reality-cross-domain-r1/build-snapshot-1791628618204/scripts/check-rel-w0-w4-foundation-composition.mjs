import {spawnSync} from 'node:child_process';
const scripts=['scripts/check-rel-w0-w3-foundation.mjs','scripts/check-rel-w4-method-composition.mjs'];
for(const script of scripts){const r=spawnSync(process.execPath,[script],{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1);}
console.log('✓ REL-W0–W4 aggregate passed: relationship foundation + method-specific composition candidate are machine-verified; W4 Human admission and customer publication remain pending.');
