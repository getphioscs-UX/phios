import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {ZWR_VFR_PAGE_PLAN,validateZwrVfrPagePlan} from '../functions/personal-reading/visual-first/ziwei-vfr-page-plan.js';

const root='docs/reports/ziwei/vfr-r1/';
const deepRoot=root+'five-call-experiment/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
for(const name of ['COMPACT-AUTHORING-PACK.json','DIAGRAM-DATA.json'])assert(fs.existsSync(root+name),'missing W8 artifact: '+name);
for(const name of ['REPAIRED-RESULT.json'])assert(fs.existsSync(deepRoot+name),'missing deep W8 artifact: '+name);

const result=read(deepRoot+'REPAIRED-RESULT.json');
const pack=read(root+'COMPACT-AUTHORING-PACK.json');
const diagrams=read(root+'DIAGRAM-DATA.json');
const pages=ZWR_VFR_PAGE_PLAN;
const pageCheck=validateZwrVfrPagePlan({diagramIds:diagrams.diagrams.map(d=>d.id)});

assert.equal(result.status,'PASS');
assert.equal(result.schemaVersion,'ZWR-VFR-R1-TARGETED-REPAIRED-RESULT-v1');
assert.equal(result.authorityDigest,pack.authorityDigest);
assert.equal(result.providerUsage.semanticReviewCalls,0);
assert.equal(result.providerUsage.originalProviderCalls,5,'deep manuscript representative generation must preserve five-call evidence');
assert(Number(result.providerUsage.repairProviderCalls)>=0);
assert(Number(result.providerUsage.totalEstimatedProviderCost)>0);
assert(Number(result.providerUsage.totalEstimatedProviderCost)<=1,'deep manuscript total provider cost exceeds USD1');
assert.equal(result.rawManuscriptSections.length,10);
assert.equal(new Set(result.rawManuscriptSections.map(s=>s.sectionId)).size,10);
assert(result.rawManuscriptSections.every(s=>String(s.zhHansManuscript||'').trim()&&String(s.enManuscript||'').trim()),'every W8 section must contain complete bilingual manuscript');
assert.equal(diagrams.diagramCount,15);
assert.equal(pageCheck.accepted,true,pageCheck.reasons.join(','));
assert.equal(pages.length,47);
for(let i=1;i<=15;i++){
 const id='ZWD-'+String(i).padStart(2,'0');
 assert.equal(pages.flatMap(p=>p.diagramIds||[]).filter(x=>x===id).length,1,id+' must bind exactly once in deep 47-page plan');
}
const digest=createHash('sha256').update(fs.readFileSync(deepRoot+'REPAIRED-RESULT.json')).digest('hex');
console.log(
 'PASS ZWR-VFR W8 representative Deep Manuscript: initialCalls='+
 result.providerUsage.originalProviderCalls+
 '; repairCalls='+result.providerUsage.repairProviderCalls+
 '; semanticReviewCalls=0; totalCost=$'+Number(result.providerUsage.totalEstimatedProviderCost).toFixed(6)+
 '; sections=10 bilingual; diagrams=15 exactly once; pages=47; repairedResultSha256='+digest+
 '; legacy one-call candidate superseded.'
);
