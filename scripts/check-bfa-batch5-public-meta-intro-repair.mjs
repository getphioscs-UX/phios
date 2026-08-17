import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { approvalIsCurrent } from './lib/bilingual-final-approval/bfa-runtime-v1.mjs';
const root=process.cwd(),batch='BATCH-005';const read=r=>JSON.parse(fs.readFileSync(path.join(root,r),'utf8')),exists=r=>fs.existsSync(path.join(root,r));
const review=read(`content/production/bilingual-final-approval/${batch}/review-data.json`);const source=read('content/production/bilingual-final-approval/progression-v2/composition-production/BATCH-005-article-composition-content-v1.json');
const packageMap=new Map(review.entries.map(x=>[x.nodeCode,x.package]));const approvedUnits=new Set();const approvalDir=`content/production/bilingual-final-approval/${batch}/approvals`;
if(exists(approvalDir))for(const f of fs.readdirSync(path.join(root,approvalDir)).filter(x=>x.endsWith('.json'))){const a=read(`${approvalDir}/${f}`),pkg=packageMap.get(a.nodeCode);if(pkg&&a.decision==='approve_for_publication'&&approvalIsCurrent(a,pkg))approvedUnits.add(pkg.articleUnitCode);}
const forbidden=/(Canonical Nodes?|Article Composition|索引节点|This article composes|depth through composition|one thin article per indexed node)/i;let repaired=0,grandfathered=0;
for(const [code,c] of Object.entries(source.content)){if(approvedUnits.has(code)){grandfathered++;continue;}assert.equal(forbidden.test(c.zh.body),false,`${code}/zh-Hans public production metadata leakage`);assert.equal(forbidden.test(c.en.body),false,`${code}/en public production metadata leakage`);assert.ok(c.zh.body.length>=2000,`${code} zh repaired body too short`);assert.ok(c.en.body.length>=6000,`${code} en repaired body too short`);repaired++;}
assert.equal(repaired+grandfathered,24);console.log(`✓ BATCH-005 public composition meta-purity passed: ${repaired} unapproved units clean; ${grandfathered} current TL-approved legacy units preserved by explicit user decision.`);console.log('✓ Canonical Node / Article Composition production metadata is internal-only for every repaired and future public article.');
