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
 assert.equal(record.dependency.path,'content/reports/shared/report-visual-assets-r2.json');
 const next=JSON.parse(fs.readFileSync('docs/commerce/economics-20261009/bazi-editorial-asset-dependency-successor-v2.json'));
 assert.equal(next.status,'ENGINEERING_RECONCILIATION');
 assert.equal(next.predecessor.path,'docs/commerce/economics-20261009/bazi-editorial-shared-bilingual-successor-v1.json');assert.equal(sha(next.predecessor.path),next.predecessor.sha256);
 assert.equal(next.registeredPriorDependencySha256,record.dependency.sha256);assert.equal(next.registeredPriorDependencyBytesAvailable,false);
 for(const k of ['authorityOrAcceptedTextRewritten','humanAcceptanceGranted','productionActivated','currentRendererFitAccepted'])assert.equal(next[k],false);
 assert.equal(next.path,record.dependency.path);assert.equal(sha(next.path),next.sha256);
 assert.equal(next.comparisonSha256,'c2c18e7b92699831af535cab77f1379b642286e53272c893a142c85b7f3dc460');assert.equal(sha(next.comparisonPath),next.comparisonSha256);
 const before=JSON.parse(fs.readFileSync(next.comparisonPath)),current=JSON.parse(fs.readFileSync(next.path));
 assert.equal(before.revision,next.previousRevision);assert.equal(current.revision,next.revision);
 assert.deepEqual(next.changedAssets.map(a=>a.pageId),['SEC-05','SEC-07']);
 const restored=structuredClone(current);restored.revision=before.revision;
 for(const change of next.changedAssets){assert.equal(change.after.methodId,'ECR');assert.equal(change.before.methodId,'ECR');assert.equal(change.after.pageId,change.pageId);assert.deepEqual(before.assets[change.index],change.before);assert.deepEqual(current.assets[change.index],change.after);restored.assets[change.index]=change.before;}
 assert.deepEqual(restored,before,'Shared manifest has changes outside the exact ECR recovery records');
 const consumed=m=>m.assets.filter(a=>['PROFILE','ECR'].includes(a.methodId)&&/^P0[1-5]$/.test(a.pageId));
 assert.deepEqual(consumed(current),consumed(before),'Editorial registry consumed front matter changed');
 const issue=current.assets.find(a=>a.methodId==='ECR'&&a.pageId==='SEC-07');assert.equal(issue.verification,'PUBLIC_BYTES_DECODED_VISUAL_ISSUE_RECORDED');assert.match(issue.visualReviewIssue,/overlap.*human decision pending/);
}
