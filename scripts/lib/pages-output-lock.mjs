import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

// Writers and standalone readers share this lock. Never remove a stale lock
// automatically: an interrupted build requires explicit reconciliation.
export function acquirePagesOutputLock(root, role) {
  const lockPath=path.join(root,'.wrangler','pages-production-build.lock');
  fs.mkdirSync(path.dirname(lockPath),{recursive:true});
  if(role==='CHECK' && process.env.PHIOS_PAGES_BUILD_TOKEN){
    const owner=JSON.parse(fs.readFileSync(lockPath,'utf8'));
    if(owner.role!=='BUILD'||owner.token!==process.env.PHIOS_PAGES_BUILD_TOKEN)throw Error('PAGES_BUILD_LOCK_TOKEN_INVALID');
    return {token:owner.token,release(){}};
  }
  const token=randomUUID();let fd;
  try {fd=fs.openSync(lockPath,'wx');}
  catch(error){if(error.code==='EEXIST')throw Error('PAGES_OUTPUT_BUSY: active build/check or interrupted lock; output must not be inspected or rebuilt until owner finishes: '+lockPath);throw error;}
  fs.writeFileSync(fd,JSON.stringify({pid:process.pid,role,token,startedAt:new Date().toISOString()}));
  let released=false;
  const release=()=>{if(released)return;released=true;fs.closeSync(fd);const owner=JSON.parse(fs.readFileSync(lockPath,'utf8'));if(owner.token!==token)throw Error('PAGES_OUTPUT_LOCK_OWNER_CHANGED');fs.unlinkSync(lockPath);};
  process.once('exit',release);
  return {token,release};
}
