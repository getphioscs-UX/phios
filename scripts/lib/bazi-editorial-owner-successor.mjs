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
 assert.equal(next.path,record.dependency.path);const v2Archive='docs/commerce/economics-20261009/report-visual-assets-before-v3.json.txt';assert.equal(sha(v2Archive),next.sha256);
 assert.equal(next.comparisonSha256,'c2c18e7b92699831af535cab77f1379b642286e53272c893a142c85b7f3dc460');assert.equal(sha(next.comparisonPath),next.comparisonSha256);
 const before=JSON.parse(fs.readFileSync(next.comparisonPath)),current=JSON.parse(fs.readFileSync(v2Archive));
 assert.equal(before.revision,next.previousRevision);assert.equal(current.revision,next.revision);
 assert.deepEqual(next.changedAssets.map(a=>a.pageId),['SEC-05','SEC-07']);
 const restored=structuredClone(current);restored.revision=before.revision;
 for(const change of next.changedAssets){assert.equal(change.after.methodId,'ECR');assert.equal(change.before.methodId,'ECR');assert.equal(change.after.pageId,change.pageId);assert.deepEqual(before.assets[change.index],change.before);assert.deepEqual(current.assets[change.index],change.after);restored.assets[change.index]=change.before;}
 assert.deepEqual(restored,before,'Shared manifest has changes outside the exact ECR recovery records');
 const consumed=m=>m.assets.filter(a=>['PROFILE','ECR'].includes(a.methodId)&&/^P0[1-5]$/.test(a.pageId));
 assert.deepEqual(consumed(current),consumed(before),'Editorial registry consumed front matter changed');
 const issue=current.assets.find(a=>a.methodId==='ECR'&&a.pageId==='SEC-07');assert.equal(issue.verification,'PUBLIC_BYTES_DECODED_VISUAL_ISSUE_RECORDED');assert.match(issue.visualReviewIssue,/overlap.*human decision pending/);assertBaziAssetV3(next,v2Archive);
}


function assertBaziAssetV3(v2,archive) {
 const v3=JSON.parse(fs.readFileSync(
  'docs/commerce/economics-20261009/bazi-editorial-asset-dependency-successor-v3.json'
 ));
 assert.equal(v3.status,'ENGINEERING_RECONCILIATION');
 for(const k of ['authorityOrAcceptedTextRewritten','humanAcceptanceGranted','productionActivated'])
  assert.equal(v3[k],false);

 assert.equal(v3.predecessor.path,
  'docs/commerce/economics-20261009/bazi-editorial-asset-dependency-successor-v2.json');
 assert.equal(sha(v3.predecessor.path),v3.predecessor.sha256);
 assert.equal(v3.archivePath,archive);
 assert.equal(sha(archive),v2.sha256);
 assert.equal(v3.path,v2.path);
 assert.equal(sha(v3.path),v3.sha256);

 const before=JSON.parse(fs.readFileSync(archive));
 const now=JSON.parse(fs.readFileSync(v3.path));
 assert.equal(before.assets.length,67);
 assert.equal(now.assets.length,93);
 assert.equal(before.revision,now.revision);

 const expected=structuredClone(before);
 assert.deepEqual(now.reports.ECR.blockers,[
  'Reusable semantic/rights admission and paid-customer adapter remain separate; no commercial activation',
  'Printed A4 proof and final publication decision not performed'
 ]);
 expected.reports.ECR.blockers=now.reports.ECR.blockers;
 assert.equal(now.reports.ECR.publicationBindingRef,
  'content/reports/ecr/ecr-author-visual-binding-r33.json');
 expected.reports.ECR.publicationBindingRef=now.reports.ECR.publicationBindingRef;
 assert.equal(now.reports.ECR.fixedInventoryComplete,true);
 expected.reports.ECR.fixedInventoryComplete=true;

 assert.equal(now.assets[29].methodId,'ECR');
 assert.equal(now.assets[29].pageId,'SEC-07');
 assert.equal(now.assets[29].sha256,
  '2e9deef92d2e45c5583dd3495253c9f3dca01be534d62024e9f67ddd7a53a9f5');
 assert.equal(now.assets[29].visualAuthorAcceptance,
  'SEC07_VISUAL_AUTHOR_ACCEPTED');
 expected.assets[29]=now.assets[29];

 assert.deepEqual(now.reports.NUM.sections,
  Array.from({length:9},(_,i)=>'SEC-'+String(i+4).padStart(2,'0')));
 assert.equal(now.reports.NUM.publicationPlans.NUM_R20.status,
  'LOCAL_IMPLEMENTATION_CANDIDATE');
 expected.reports.NUM.sections=now.reports.NUM.sections;
 expected.reports.NUM.blockers=now.reports.NUM.blockers;
 expected.reports.NUM.publicationPlans=now.reports.NUM.publicationPlans;

 const added=now.assets.slice(before.assets.length);
 assert.equal(added.length,26);
 assert(added.every(a=>a.methodId==='NUM'&&a.active===true
  &&a.publicationEligibility==='LOCAL_CANDIDATE_ONLY'));
 expected.assets.push(...added);
 assert.deepEqual(expected,now,'Unexpected asset changes after V2');
}
