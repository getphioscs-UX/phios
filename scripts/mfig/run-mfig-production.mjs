import {spawnSync} from 'node:child_process';
import {requestedIds} from './mfig-lib.mjs';
const node=process.execPath;
const run=(script,args=[])=>{const r=spawnSync(node,[script,...args],{stdio:'inherit'});if(r.status!==0)process.exit(r.status??1);};
const ids=requestedIds();
for(const id of ids) run('scripts/mfig/build-mfig-production.mjs',['--raster','--id',id]);
for(const script of [
 'scripts/check-mfig-identity-production.mjs','scripts/check-mfig-semantic.mjs','scripts/check-mfig-authority.mjs','scripts/check-mfig-layout.mjs','scripts/check-mfig-geometry.mjs','scripts/check-mfig-determinism.mjs','scripts/check-mfig-staleness.mjs','scripts/check-mfig-visual-production.mjs','scripts/check-mfig-visual-regression.mjs','scripts/check-mfig-cross-figure-consistency.mjs','scripts/check-mfig-car-boundary.mjs'
]) run(script);
for(const id of ids) run('scripts/mfig/record-mfig-machine-acceptance.mjs',['--id',id]);
if(ids.length===50) run('scripts/mfig/record-mfig-machine-acceptance.mjs');
run('scripts/check-mfig-machine-acceptance.mjs');
run('scripts/check-mfig-production-freeze.mjs');
console.log(`✓ MFIG production completed for ${ids.length===50?'MFIG-001..050':ids.join(', ')}`);
