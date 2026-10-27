import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export function assertBaziEditorialOwnerSuccessor(owner){
 const record=JSON.parse(fs.readFileSync('docs/commerce/economics-20261009/bazi-editorial-shared-bilingual-successor-v1.json'));
 assert.equal(record.status,'ENGINEERING_RECONCILIATION');assert.equal(record.path,owner.path);
 assert.equal(record.baselineSha256,owner.sha256);assert.equal(sha(record.previousPath),owner.sha256);
 for(const k of ['authorityOrAcceptedTextRewritten','humanAcceptanceGranted','productionActivated'])assert.equal(record[k],false);
 assert.equal(record.replacements.length,3);
 assert.equal(record.replacements[0].from,"import currentFixedManifest from '../../content/reports/shared/report-visual-assets-r2.json';\n");assert.equal(record.replacements[0].to,'');
 assert.equal(record.replacements[1].from,"(['PROFILE','ECR'].includes(p.methodId)?['bilingual']:REPORT_EDITORIAL_LOCALES)");assert.equal(record.replacements[1].to,'REPORT_EDITORIAL_LOCALES');
 assert(record.replacements[2].from.includes("if(!['PROFILE','ECR'].includes(p.methodId))return {}"));
 assert.equal(record.replacements[2].to,'...REPORT_EDITORIAL_VERIFICATION[`${p.methodId}:${locale}:${i+1}`]\n');
 let previous=fs.readFileSync(owner.path,'utf8');
 for(const r of record.replacements){assert.equal(previous.split(r.from).length,2);previous=previous.replace(r.from,r.to);}
 assert.equal(previous,fs.readFileSync(record.previousPath,'utf8'),'Unregistered editorial owner change');
 assert.equal(sha(owner.path),record.successorSha256);
 assert.equal(record.dependency.path,'content/reports/shared/report-visual-assets-r2.json');assert.equal(sha(record.dependency.path),record.dependency.sha256);
}
