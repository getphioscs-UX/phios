import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const base='content/profile/successors/personal-evidence-r1/';
const receipt=JSON.parse(fs.readFileSync(base+'acceptance/prd-w11-human-review-receipt-v1.json','utf8'));
if(receipt.decision!=='PRD-R1 HUMAN ACCEPT'||!receipt.reviewer||!receipt.acceptedAt){
 console.error('PRD_R1_FREEZE = BLOCKED: explicit PRD-R1 HUMAN ACCEPT receipt missing. Machine cannot accept.');process.exit(1);
}
for(const key of ['prd-pre-w2','prd-w3-w5','prd-w6','prd-w7','prd-w8','prd-w9','prd-w10']){
 const result=spawnSync(process.execPath,['scripts/check-profile-personal-evidence-'+key+'.mjs'],{stdio:'inherit'});
 assert.equal(result.status,0,key);
}
const freezePath=base+'freeze/personal-evidence-r1-production-freeze-v1.json';
assert.ok(fs.existsSync(freezePath),'PRD_R1_SUCCESSOR_FREEZE_MISSING');
const freeze=JSON.parse(fs.readFileSync(freezePath,'utf8'));
assert.equal(freeze.humanAcceptanceRef,base+'acceptance/prd-w11-human-review-receipt-v1.json');
assert.ok(freeze.files?.length>0,'FREEZE_DIGEST_SET_REQUIRED');
for(const file of freeze.files)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file.path)).digest('hex'),file.sha256,file.path);
console.log('PHI_OS_PROFILE_DEMOTION_PERSONAL_EVIDENCE_R1 = PRODUCTION_FROZEN');
