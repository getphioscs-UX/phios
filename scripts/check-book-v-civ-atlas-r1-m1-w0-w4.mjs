import {spawnSync} from 'node:child_process';
const steps=[
 ['npm',['run','check:book-v-atlas:r1:m1:w0-w2']],
 ['node',['scripts/check-book-v-civ-atlas-r1-m1-w3-w4-visual.mjs']],
 ['npm',['run','check:book-v-atlas:r1:complete']]
];
const npm=process.platform==='win32'?'npm.cmd':'npm';
for(const [kind,args] of steps){
 const cmd=kind==='npm'?npm:process.execPath;
 const r=spawnSync(cmd,args,{stdio:'inherit',cwd:process.cwd()});
 if(r.status!==0) throw new Error(`BOOK_V_CIV_ATLAS_R1_M1_W0_W4_FAILED:${kind} ${args.join(' ')}`);
}
console.log('✓ BOOK-V-CIV-ATLAS-R1-M1 W0–W4 passed.');
