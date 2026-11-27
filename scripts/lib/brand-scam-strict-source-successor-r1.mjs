import {globalFraudR5Predecessor} from './global-fraud-r5-source-successor.mjs';
import {releaseR5Predecessor} from './pr22-release-r5-exact-successor-r1.mjs';
import {publicEntryBrandPredecessor} from './public-entry-brand-guard-successor-r1.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
export const BRAND_SCAM_RECORD="content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/BRAND-SCAM-STRICT-RECEIVER-R1.json";
const RECORD_SHA="f3e37c5e49ea19061668598076e47dfc58b67c38464630dd13c3d42ac15ae890",paths=["functions/public/client-intent-router.js", "assets/js/ask-entry-capabilities.js", "scripts/build-ask-architecture-r1.mjs", "content/public/client-intent-router/registries/client-capability-projection-r1.json", "content/production-closure/live-customer-commercial-convergence/ask-architecture-r1/PHIOS-ASK-R1-CAPABILITY-LEDGER-FOUNDER-R3-SUCCESSOR.csv", "functions/external-reality-impact/consumer-scam-navigation.js", "scripts/lib/main-convergence-source-successor-r1.mjs", "scripts/lib/founder-legacy-route-compatibility-r1.mjs"];
export function validateBrandScamCurrent({readCurrent=p=>fs.readFileSync(p),recordBytes=readCurrent(BRAND_SCAM_RECORD)}={}){const releaseRead=readCurrent;readCurrent=p=>releaseR5Predecessor(p,globalFraudR5Predecessor(p,releaseRead(p)));
 assert.equal(sha(recordBytes),RECORD_SHA,'BRAND_SCAM_RECORD_DRIFT');const r=JSON.parse(recordBytes);assert.equal(r.schema,'BRAND_SCAM_STRICT_RECEIVER_R1');assert.equal(r.status,'ENGINEERING_SUCCESSOR_NOT_PRODUCTION_ACCEPTANCE');assert.deepEqual(r.paths.map(x=>x.path),paths);for(const flag of Object.values(r.boundaries))assert.equal(flag,false);
 for(const p of r.parents)assert.equal(sha(readCurrent(p.path)),p.sha256,'BRAND_SCAM_PARENT_DRIFT:'+p.path);
 for(const row of r.paths){assert.equal(sha(readCurrent(row.path)),row.sha256,'BRAND_SCAM_PHYSICAL_DRIFT:'+row.path);if(row.previousSHA256!==null)assert.equal(sha(Buffer.from(row.previousBytesBase64,'base64')),row.previousSHA256,'BRAND_SCAM_ARCHIVE_DRIFT:'+row.path);else assert.equal(row.previousBytesBase64,null);}
 return r;
}
export function brandScamPredecessor(path,bytes,options={}){
 bytes=globalFraudR5Predecessor(path,bytes);
 bytes=publicEntryBrandPredecessor(path,bytes);
 if(!paths.includes(path))return bytes;const r=validateBrandScamCurrent(options),row=r.paths.find(x=>x.path===path),hash=sha(bytes);
 if(row.previousSHA256!==null&&hash===row.previousSHA256)return bytes;assert.equal(hash,row.sha256,'BRAND_SCAM_INPUT_DRIFT:'+path);return row.previousSHA256===null?null:Buffer.from(row.previousBytesBase64,'base64');
}
