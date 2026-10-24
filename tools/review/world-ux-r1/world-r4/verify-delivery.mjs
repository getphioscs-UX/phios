import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const base='tools/review/world-ux-r1/world-r4';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const receipt=JSON.parse(fs.readFileSync(`${base}/BUILD-RECEIPT.json`));
const drift=receipt.records.filter(x=>!fs.existsSync(x.path)||sha(fs.readFileSync(x.path))!==x.sha256);
const missing=[];
for(const file of [`${base}/HUMAN-REVIEW.html`]){
 const html=fs.readFileSync(file,'utf8');
 for(const [,ref] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  if(/^(?:https?:|#|mailto:)/.test(ref))continue;
  const resolved=path.resolve(path.dirname(file),ref.split('#')[0]);
  if(!fs.existsSync(resolved))missing.push({file,ref});
 }
}
const result={at:new Date().toISOString(),relevantInputs:receipt.records.length,drift,missing,buildIdentity:receipt.relevantBuildInputDigest,status:drift.length||missing.length?'BLOCKED':'PASS_RELEVANT_INPUTS_AND_REVIEW_LINKS',scope:'No repeated runtime tests; review-only delivery verification'};
fs.writeFileSync(`${base}/DELIVERY-VERIFICATION.json`,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
if(drift.length||missing.length)process.exitCode=1;
