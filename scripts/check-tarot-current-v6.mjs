import {spawnSync} from 'node:child_process';
for(const s of ['check:tarot-human-acceptance','check:tarot-full-production-current']){const r=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['run',s],{stdio:'inherit',shell:false,windowsHide:true});if(r.status!==0)process.exit(r.status??1);}
console.log('✓ Tarot current v6 passed: FULL_PRODUCTION durable release authority is current; historical LIMITED_PRODUCTION evidence remains audit-only.');
