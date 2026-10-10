// Inherited by all Node children of ordinary checks/builds, even with live opt-in set.
import http from 'node:http';
import https from 'node:https';
import {syncBuiltinESMExports} from 'node:module';
process.env.REPORT_PROVIDER_LIVE_ALLOWED='false';
process.env.REPORT_ZERO_COST_REPLAY='true';
export function assertZeroCostRequest(input,options={}) {
 const raw=typeof input==='string'||input instanceof URL?String(input):input?.url||`${input?.protocol||'https:'}//${input?.hostname||input?.host||''}${input?.path||'/'}`;
 const u=new URL(raw),local=['localhost','127.0.0.1','::1','[::1]'].includes(u.hostname);
 const method=String(options.method||input?.method||'GET').toUpperCase();
 if(!local&&(/(^|\.)(openai\.com|anthropic\.com|deepseek\.com|generativelanguage\.googleapis\.com|openrouter\.ai)$/.test(u.hostname)||!['GET','HEAD','OPTIONS'].includes(method))) {
  const e=Error('ZERO_COST_REPLAY_NETWORK_BLOCKED');e.code='ZERO_COST_REPLAY_NETWORK_BLOCKED';throw e;
 }
}
const originalFetch=globalThis.fetch;
globalThis.fetch=async(input,options)=>{assertZeroCostRequest(input,options);return originalFetch(input,options);};
for(const module of [http,https])for(const key of ['request','get']) {
 const original=module[key]; module[key]=function(input,...args){assertZeroCostRequest(input,args.find(a=>a&&typeof a==='object')||{});return original.call(this,input,...args);};
}
syncBuiltinESMExports();
