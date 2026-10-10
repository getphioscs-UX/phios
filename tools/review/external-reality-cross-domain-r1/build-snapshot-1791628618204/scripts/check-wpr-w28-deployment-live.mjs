import {execFileSync} from 'node:child_process';
import {deriveWprObservation} from './lib/web-production/wpr-observability-v1.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
let originMain,head;
try{originMain=git('rev-parse','origin/main');head=git('rev-parse','HEAD');}catch(error){console.error('WPR_DEPLOYMENT_LIVE_GIT_UNAVAILABLE');process.exit(2);}
const o=deriveWprObservation();
console.log(`HEAD: ${head}`);console.log(`origin/main: ${originMain}`);console.log(`last verified Cloudflare SHA: ${o.lastVerifiedDeploymentCommit}`);
if(head!==originMain){console.error('WPR_DEPLOYMENT_LIVE_HEAD_NOT_ORIGIN_MAIN');process.exit(3);}
if(originMain!==o.lastVerifiedDeploymentCommit){console.error('WPR_DEPLOYMENT_SHA_REVALIDATION_REQUIRED');process.exit(4);}
console.log('✓ WPR live deployment SHA matches current origin/main using the last recorded full-SHA Cloudflare evidence.');
