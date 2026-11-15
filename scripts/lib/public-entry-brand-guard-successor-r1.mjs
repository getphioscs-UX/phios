import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const hash=b=>createHash('sha256').update(b).digest('hex');
export const PUBLIC_ENTRY_BRAND_GUARD_RECORD="content/production-closure/live-customer-commercial-convergence/final-unified-production-r1/PUBLIC-ENTRY-BRAND-GUARD-SUCCESSOR-R1.json";
const EXPECTED="bfb2751ccc9f9cec134da1bfd286a8e66482f7b2895849dfc86d68e891953ae3",paths=["assets/js/pages/public-entry-answer.js","scripts/lib/brand-scam-strict-source-successor-r1.mjs"];
export function validatePublicEntryBrandGuard({readCurrent=p=>fs.readFileSync(p),recordBytes=readCurrent(PUBLIC_ENTRY_BRAND_GUARD_RECORD)}={}){
 assert.equal(hash(recordBytes),EXPECTED,'PUBLIC_ENTRY_BRAND_RECORD_DRIFT');const r=JSON.parse(recordBytes);assert.equal(r.schema,'PUBLIC_ENTRY_BRAND_GUARD_SUCCESSOR_R1');assert.deepEqual(r.paths.map(x=>x.path),paths);for(const v of Object.values(r.boundaries))assert.equal(v,false);
 for(const p of r.parents)assert.equal(hash(readCurrent(p.path)),p.sha256,'PUBLIC_ENTRY_BRAND_PARENT_DRIFT:'+p.path);
 for(const row of r.paths){assert.equal(hash(readCurrent(row.path)),row.sha256,'PUBLIC_ENTRY_BRAND_PHYSICAL_DRIFT:'+row.path);assert.equal(hash(Buffer.from(row.previousBytesBase64,'base64')),row.previousSHA256,'PUBLIC_ENTRY_BRAND_ARCHIVE_DRIFT:'+row.path);}
 const current=readCurrent(paths[0]).toString();assert.equal(current.split(r.guard).length,2);assert.equal(hash(Buffer.from(current.replace(r.guard,''))),r.paths[0].previousSHA256,'PUBLIC_ENTRY_BRAND_ONLY_ONE_GUARD');return r;
}
export function publicEntryBrandPredecessor(file,bytes,options={}){if(!paths.includes(file))return bytes;const r=validatePublicEntryBrandGuard(options),row=r.paths.find(x=>x.path===file),digest=hash(bytes);if(digest===row.previousSHA256)return bytes;assert.equal(digest,row.sha256,'PUBLIC_ENTRY_BRAND_INPUT_DRIFT:'+file);return Buffer.from(row.previousBytesBase64,'base64');}
