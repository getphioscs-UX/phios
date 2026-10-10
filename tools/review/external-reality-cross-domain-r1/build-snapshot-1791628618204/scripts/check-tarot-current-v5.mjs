import {spawnSync} from 'node:child_process';
for(const s of ['check:tarot-product-activation-phase-n-readiness']){const r=spawnSync('npm',['run',s],{stdio:'inherit',shell:true});if(r.status!==0)process.exit(r.status??1);}
console.log('✓ Tarot current v5 passed: LIMITED_PRODUCTION is source-governed for Phase N stabilization; live rollover/stability evidence is operational and Full Production remains explicitly separate.');
