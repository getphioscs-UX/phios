import {spawnSync} from 'node:child_process';
const scripts=['scripts/check-rel-w0-relationship-intent-contract.mjs','scripts/check-rel-w1-shared-person-b-input.mjs','scripts/check-rel-w2-method-capability-matrix.mjs','scripts/check-rel-w3-independent-reading-freeze.mjs'];
for(const script of scripts){const r=spawnSync(process.execPath,[script],{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1);}
console.log('✓ REL-W0–W3 foundation aggregate passed. REL-W4 relationship meaning remains a separate successor gate.');
