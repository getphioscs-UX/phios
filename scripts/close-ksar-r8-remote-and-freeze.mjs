import {spawnSync} from 'node:child_process';
import process from 'node:process';

const args=process.argv.slice(2);
const corpusDir=args.find(arg=>!arg.startsWith('--'));
if(!corpusDir) throw new Error('Usage: npm run ksar:r8:close -- <KSAR-reviewed-dir> [--upload]');
const upload=args.includes('--upload');
function run(script,scriptArgs=[]){
  const result=spawnSync(process.execPath,[script,...scriptArgs],{cwd:process.cwd(),stdio:'inherit'});
  if(result.status!==0) process.exit(result.status||1);
}
const verifyArgs=[corpusDir,'--write'];
if(upload) verifyArgs.push('--upload');
run('scripts/verify-ksar-r2-remote.mjs',verifyArgs);
run('scripts/freeze-ksar-r8-production.mjs');
run('scripts/check-ksar-r8-production-freeze.mjs');
console.log('✓ KSAR-R8 Remote R2 Gate Closure → successor Production Acceptance → Freeze complete.');
