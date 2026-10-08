import fs from 'node:fs';import http from 'node:http';import https from 'node:https';import {syncBuiltinESMExports} from 'node:module';
import './report-zero-cost-preload.mjs';
const counts={providerCalls:0,openAiCalls:0,externalAttemptsBlocked:0,localRequests:0};
const check=input=>{const url=new URL(typeof input==='string'||input instanceof URL?String(input):input?.url||`${input?.protocol||'https:'}//${input?.hostname||input?.host||''}${input?.path||'/'}`);if(!['localhost','127.0.0.1','::1','[::1]'].includes(url.hostname)){counts.externalAttemptsBlocked++;throw Object.assign(Error('ZERO_COST_REPLAY_NETWORK_BLOCKED'),{code:'ZERO_COST_REPLAY_NETWORK_BLOCKED'});}counts.localRequests++;};
const originalFetch=globalThis.fetch;
// Native fetch rejects a Promise. Preserve that API contract for security tests.
globalThis.fetch=async(input,...args)=>{check(input);return originalFetch(input,...args);};
for(const module of [http,https])for(const name of ['request','get']){const original=module[name];module[name]=(input,...args)=>{check(input);return original.call(module,input,...args);};}syncBuiltinESMExports();
process.on('exit',()=>{const directory=process.env.PC_R1_ZERO_COST_DIR||'content/product-convergence-r1/audits/w12-w95/';fs.mkdirSync(directory,{recursive:true});fs.appendFileSync(directory.replace(/\/?$/,'/')+'zero-cost-processes.jsonl',JSON.stringify({timestamp:new Date().toISOString(),pid:process.pid,guard:'PC_R1_LOCALHOST_ONLY',...counts})+'\n');});
