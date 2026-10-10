import {spawnSync} from 'node:child_process';
const npmExecPath=String(process.env.npm_execpath||'').trim();
function runNpm(args){
  const options={stdio:'inherit',cwd:process.cwd(),env:process.env,windowsHide:true};
  if(npmExecPath)return spawnSync(process.execPath,[npmExecPath,...args],options);
  if(process.platform==='win32')return spawnSync(process.env.ComSpec||'cmd.exe',['/d','/s','/c','npm',...args],options);
  return spawnSync('npm',args,options);
}
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
for(const [kind,args] of steps){const r=kind==='npm'?runNpm(args):spawnSync(process.execPath,args,{stdio:'inherit',cwd:process.cwd(),env:process.env,windowsHide:true});if(r.error){process.exitCode=1;throw new Error(`PPR_R2_FINAL_STEP_SPAWN_FAILED:${kind} ${args.join(' ')}:${r.error.code||r.error.message}`);}if(r.status!==0){process.exitCode=r.status||1;throw new Error(`PPR_R2_FINAL_STEP_FAILED:${kind} ${args.join(' ')}`);}}
console.log(`✓ W67–W70 unified final machine pack passed ${steps.length}/${steps.length} executable steps.`);
