import fs from 'node:fs';import {start} from './ecr-r2-navigation-test-server.mjs';
import {onRequest} from '../functions/api/account-ecr-section11-local.js';
import {fixture,call} from '../tools/review/personal-evidence-r1/evidence-system-r1/local-test.mjs';
export async function startR21({port=0,file=':memory:'}={}){
 const s=await start({port,file,extraApi:onRequest,inject:'<script type="module" src="/assets/customer-ui/js/surfaces/ecr-section11-local-r21.js"></script>'});s.env.PHIOS_ECR_R21_LOCAL='true';
 const current=await call(s.env);if(!current.body.records?.length)await call(s.env,{action:'save',record:{...fixture,title:'R2.1 synthetic evidence',claimDirection:'CHALLENGES'},requestToken:crypto.randomUUID(),consent:true,retentionConsent:true,expiresAt:new Date(Date.now()+86400000).toISOString()});return s;
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/ecr-r21-server.mjs')){const out='tools/review/phi-configuration-deep-reading-r2-integrated/r2-1-gap-closure';fs.mkdirSync(out,{recursive:true});const s=await startR21({port:59841,file:out+'/human-account.sqlite'});console.log(s.url+'/perspectives/profile/?evidence=1&ecrSection11=1&locale=zh-Hans');console.log('Synthetic verified-server account; local database only. Production admission remains closed.');}
