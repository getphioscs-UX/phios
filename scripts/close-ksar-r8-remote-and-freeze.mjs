import process from 'node:process';
import { spawnSync } from 'node:child_process';

const args=process.argv.slice(2);
const corpusDir=args.find(arg=>!arg.startsWith('--'));
if(!corpusDir) throw new Error('Usage: node scripts/close-ksar-r8-remote-and-freeze.mjs <private-corpus-dir> [--upload]');

function run(script,scriptArgs=[]){
  const result=spawnSync(process.execPath,[script,...scriptArgs],{cwd:process.cwd(),stdio:'inherit'});
  if(result.status!==0) process.exit(result.status??1);
}

const verifyArgs=[corpusDir];
if(args.includes('--upload')) verifyArgs.push('--upload');
verifyArgs.push('--write');
run('scripts/verify-ksar-r2-remote.mjs',verifyArgs);
run('scripts/freeze-ksar-r8-production.mjs');
run('scripts/check-ksar-r8-production-freeze.mjs');
