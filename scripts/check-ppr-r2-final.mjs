import {spawnSync} from 'node:child_process';
const npm=process.platform==='win32'?'npm.cmd':'npm';
const steps=[
  ['npm',['run','check:ppr-r2:w67-unified-final-pack']],
  ['npm',['run','check:mfp-r']],
  ['npm',['run','check:ppr-r5']],
  ['npm',['run','check:ppr-r2:w47-w66']],
  ['npm',['run','check:cross-final-production-admission']],
  ['node',['scripts/check-ppr-current-reality-w42-w46.mjs']],
  ['npm',['run','check:profile:final']],
  ['npm',['run','check:relationship:w0-w8']],
  ['npm',['run','check:runtime-security-privacy']],
  ['npm',['run','check:ppr-r2-shared-ownership']],
  ['npm',['run','check:ppr-current-shared-owner']],
  ['npm',['run','check:ppr-r2:w68-shared-ownership-no-legacy-leak']],
  ['npm',['run','check:ppr-r2:w69-deterministic-generative-stability']],
  ['npm',['run','check:ppr-r2:w70-paid-narrative-e2e']]
];
for(const [kind,args] of steps){const cmd=kind==='npm'?npm:process.execPath;const r=spawnSync(cmd,args,{stdio:'inherit',cwd:process.cwd(),env:process.env});if(r.status!==0){process.exitCode=r.status||1;throw new Error(`PPR_R2_FINAL_STEP_FAILED:${kind} ${args.join(' ')}`);}}
console.log(`✓ W67–W70 unified final machine pack passed ${steps.length}/${steps.length} executable steps.`);
