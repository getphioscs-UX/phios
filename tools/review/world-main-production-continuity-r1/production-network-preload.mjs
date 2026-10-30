// Separate, explicitly authorized remote Preview acceptance. Ordinary npm replay guard is unchanged.
// Only two immutable owned Preview origins; negative method probes only on current-facts.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import {syncBuiltinESMExports} from 'node:module';
import assert from 'node:assert/strict';
const identity=JSON.parse(fs.readFileSync(path.join(process.env.WORLD_PREVIEW_EVIDENCE_DIR,'R1-PRODUCTION-IDENTITY.json'),'utf8'));
assert.equal(identity.environment,'production');assert.equal(identity.latestStage.status,'success');
assert.equal(identity.commitHash,process.env.WORLD_PREVIEW_HEAD);
assert.equal(identity.url,'https://getphios.com');assert.match(identity.deploymentUrl,/^https:\/\/[0-9a-f]{8}\.phios-github\.pages\.dev$/);
const allowed=new Set([identity.url,identity.deploymentUrl]);
function check(input,options={}) {
 const raw=typeof input==='string'||input instanceof URL?String(input):input?.url||`${input?.protocol||'https:'}//${input?.hostname||input?.host||''}${input?.path||'/'}`;
 const u=new URL(raw),method=String(options.method||input?.method||'GET').toUpperCase();
 if(['localhost','127.0.0.1','::1','[::1]'].includes(u.hostname))return;
 assert(allowed.has(u.origin),'PREVIEW_ACCEPTANCE_DENIES_OTHER_NETWORK_OR_PROVIDER');
 if(!['GET','HEAD','OPTIONS'].includes(method)) {
  assert.equal(u.pathname,'/api/current-facts','PREVIEW_ACCEPTANCE_DENIES_OTHER_MUTATION_ROUTE');
  assert(['POST','PUT','PATCH','DELETE'].includes(method));
 }
}
const fetchOriginal=globalThis.fetch;
globalThis.fetch=async(input,options)=>{check(input,options);return fetchOriginal(input,options);};
for(const module of [http,https])for(const key of ['request','get']) {
 const original=module[key];module[key]=function(input,...args){check(input,args.find(x=>x&&typeof x==='object')||{});return original.call(this,input,...args);};
}
syncBuiltinESMExports();
