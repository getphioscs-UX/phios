import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {acquirePagesOutputLock} from './lib/pages-output-lock.mjs';
const lease=acquirePagesOutputLock(process.cwd(),'DEPLOY');
try {
 // This browser-only filter refinement does not alter the compiled Worker.
 fs.copyFileSync('assets/js/pages/civilization-atlas/world-search.js','.pages-output/assets/js/pages/civilization-atlas/world-search.js');
 const result=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','pages','deploy','.pages-output','--project-name','phios-github','--branch','main','--commit-dirty=true'],{stdio:'inherit'});
 if(result.status!==0)throw Error('WORLD_PRODUCTION_DEPLOY_FAILED:'+result.status);
}finally{lease.release();}
