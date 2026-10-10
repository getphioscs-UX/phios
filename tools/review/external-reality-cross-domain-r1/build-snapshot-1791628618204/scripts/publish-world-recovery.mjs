import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {acquirePagesOutputLock} from './lib/pages-output-lock.mjs';
const lease=acquirePagesOutputLock(process.cwd(),'DEPLOY');
try {
 // These browser-only refinements do not alter the compiled Worker.
 for(const name of ['world-search.js','world-copy.js','atlas-shell.js','visual-runtime.js','atlas-static-visual.js'])
  fs.copyFileSync('assets/js/pages/civilization-atlas/'+name,'.pages-output/assets/js/pages/civilization-atlas/'+name);
 for(const name of ['world/index.html','assets/js/pages/world.js'])fs.copyFileSync(name,'.pages-output/'+name);
 const result=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','pages','deploy','.pages-output','--project-name','phios-github','--branch','main','--commit-dirty=true'],{stdio:'inherit'});
 if(result.status!==0)throw Error('WORLD_PRODUCTION_DEPLOY_FAILED:'+result.status);
}finally{lease.release();}
