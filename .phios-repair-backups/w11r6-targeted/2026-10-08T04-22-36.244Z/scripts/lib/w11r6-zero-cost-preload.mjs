import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import {syncBuiltinESMExports} from 'node:module';
import './report-zero-cost-preload.mjs';
const counts={providerCalls:0,openAiCalls:0,externalAttemptsBlocked:0,localRequests:0};
const check=input=>{let url;try{url=new URL(typeof input==='string'||input instanceof URL?String(input):input?.url||`${input?.protocol||'https:'}//${input?.hostname||input?.host||''}${input?.path||'/'}`);}catch{throw Error('W11R6_INVALID_NETWORK_REQUEST');}
 if(!['localhost','127.0.0.1','::1','[::1]'].includes(url.hostname)){counts.externalAttemptsBlocked++;const error=Error('ZERO_COST_REPLAY_NETWORK_BLOCKED');error.code=error.message;throw error;}counts.localRequests++;
};
const originalFetch=globalThis.fetch;globalThis.fetch=(input,...args)=>{check(input);return originalFetch(input,...args);};
for(const module of [http,https])for(const name of ['request','get']){const original=module[name];module[name]=(input,...args)=>{check(input);return original.call(module,input,...args);};}
syncBuiltinESMExports();
process.on('exit',()=>{fs.appendFileSync('content/profile/successors/personal-evidence-r1/w11r6/zero-cost-processes.jsonl',JSON.stringify({timestamp:new Date().toISOString(),pid:process.pid,...counts})+'\n');});
