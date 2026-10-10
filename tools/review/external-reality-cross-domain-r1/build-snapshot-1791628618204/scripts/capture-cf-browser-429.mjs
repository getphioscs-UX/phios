import fs from 'node:fs';
import crypto from 'node:crypto';
const dir='docs/reports/ziwei/production-admission/cpa-v1';
const name=process.argv[2]??'cf-browser-429';
if(!/^[a-z0-9-]+$/.test(name))throw Error('Invalid evidence name');
const path=`${dir}/${name}-raw.json`;
if(fs.existsSync(path))throw Error('Evidence already exists; no automatic repeat or overwrite.');
// One request only. No report composition, release, payment or entitlement writes.
const response=await fetch('http://127.0.0.1:8792/diagnose',{method:'POST'});
const raw=await response.text();
if(!response.ok)throw Error(`Diagnostic endpoint HTTP ${response.status}: ${raw}`);
const evidence=JSON.parse(raw);
if(evidence.upstream?.bodyBase64){
 const bytes=Buffer.from(evidence.upstream.bodyBase64,'base64');
 if(crypto.createHash('sha256').update(bytes).digest('hex')!==evidence.upstream.bodySha256)throw Error('RAW_BODY_DIGEST_MISMATCH');
 fs.writeFileSync(`${dir}/${name}-response-body.txt`,bytes);
}
fs.writeFileSync(path,JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify(evidence,null,2));
