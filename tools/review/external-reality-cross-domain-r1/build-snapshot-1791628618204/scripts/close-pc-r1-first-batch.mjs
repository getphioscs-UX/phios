import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
if(fs.existsSync('content/product-convergence-r1/audits/pc-w11-closure/OWNER-ACCEPTANCE-RECEIPT.json')){execFileSync(process.execPath,['scripts/record-pc-w11-owner-closure.mjs','close'],{stdio:'inherit'});process.exit(0);}
const read=p=>JSON.parse(fs.readFileSync(p));
const root='content/product-convergence-r1/audits/';
const results=read(root+'regression/results.json');
const required=['check:profile','check:cx-r12','check:cx-r31','check:ppr-current-shared-owner','check:backend-frontend-full-production','check:pages-build'];
for(const key of required)assert.equal(results.find(r=>r.key===key)?.status,'PASS',key);
assert.equal(read(root+'pc-r1-w0-current-main-reconciliation-v1.json').status,'CURRENT_MAIN_RECONCILED');
const path=root+'pc-r1-profile-demotion-first-batch-v1.json',audit=read(path);
audit.status='READY_FOR_HUMAN_REVIEW';audit.finalRegressionGates=required.map(key=>results.find(r=>r.key===key));
assert.equal(audit.humanDecision,'PENDING');assert.equal(audit.pcW11,'BLOCKED');
fs.writeFileSync(path,JSON.stringify(audit,null,2));
for(const name of fs.readdirSync(root+'regression/').filter(n=>n.endsWith('.log'))){const p=root+'regression/'+name;fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n').replace(/[ \t]+$/gm,''));}
console.log('PC-W0–W10 READY_FOR_HUMAN_REVIEW; PC-W11 BLOCKED.');
