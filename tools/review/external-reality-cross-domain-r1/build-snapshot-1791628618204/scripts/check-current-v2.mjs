import {spawnSync} from 'node:child_process';
const run=(cmd,args=[])=>{const r=spawnSync(cmd,args,{stdio:'inherit',shell:true});if(r.status!==0)process.exit(r.status??1);};
run('npm',['run','check:current-carc-v2']);
for(const c of ['check:symbolic-method','check:iching-current','check:tarot-current','check:runtime-frontend-parity'])run('npm',['run',c]);
console.log('✓ CURRENT v2 successor passed with historical-current successor reconciliation + symbolic-method + I Ching current + Tarot current + runtime/frontend parity.');
