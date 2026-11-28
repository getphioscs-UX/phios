// Finite historical projection only; current R5 behavior is tested in tests/fraud.
// Physical current bytes are always checked. No production runtime imports this file.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const recordPath='docs/global-fraud-risk-r5-exact-successor.json',recordSHA='bb10a7a6c7d09a4daa57d3d3f268abbe99b42437f5442c97e3a4271a3b513ebd';
export function validateGlobalFraudR5({readCurrent=p=>fs.readFileSync(p),recordBytes=fs.readFileSync(recordPath)}={}){
 assert.equal(sha(recordBytes),recordSHA,'GLOBAL_FRAUD_R5_RECORD_DRIFT');const r=JSON.parse(recordBytes);
 assert.equal(r.schema,'GLOBAL_FRAUD_R5_EXACT_SUCCESSOR');assert.equal(r.status,'ENGINEERING_CANDIDATE_NOT_PRODUCTION_ACCEPTANCE');assert.equal(r.base,'9321494a63de591ac36d7ec44ff90675059b2e5a');for(const value of Object.values(r.boundaries))assert.equal(value,false);
 for(const row of r.rows){assert.equal(sha(readCurrent(row.path)),row.afterSHA256,'GLOBAL_FRAUD_R5_PHYSICAL_DRIFT:'+row.path);if(row.beforeSHA256!==null)assert.equal(sha(Buffer.from(row.beforeBytesBase64,'base64')),row.beforeSHA256,'GLOBAL_FRAUD_R5_ARCHIVE_DRIFT:'+row.path);}
 return r;
}
export function globalFraudR5Predecessor(file,bytes,options={}){
 if(!['functions/external-reality-impact/consumer-scam-navigation.js','functions/api/customer-contextual-ask.js','functions/api/client-intent-route.js','assets/customer-ui/js/surfaces/contextual-ask.js','assets/js/pages/scam-intelligence-projection.js','assets/customer-ui/js/surfaces/scam-ask-controls.js'].includes(file))return bytes;
 const row=validateGlobalFraudR5(options).rows.find(x=>x.path===file);
 // Each historical caller retains its own exact input hash/refusal assertions.
 return sha(bytes)===row.afterSHA256?(row.beforeSHA256===null?null:Buffer.from(row.beforeBytesBase64,'base64')):bytes;
}
