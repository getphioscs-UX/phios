import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildZwrVfrDeepPublicationIr} from '../functions/personal-reading/visual-first/ziwei-vfr-deep-publication.js';
import {buildZwrVfrPagePlan,validateZwrVfrPagePlan} from '../functions/personal-reading/visual-first/ziwei-vfr-page-plan.js';

const root='docs/reports/ziwei/vfr-r1/';
const repairedPath=root+'five-call-experiment/REPAIRED-RESULT.json';
const packPath=root+'COMPACT-AUTHORING-PACK.json';
const diagramPath=root+'DIAGRAM-DATA.json';
for(const p of [repairedPath,packPath,diagramPath])assert(fs.existsSync(p),'missing deep alignment input: '+p);

const repaired=JSON.parse(fs.readFileSync(repairedPath,'utf8'));
const pack=JSON.parse(fs.readFileSync(packPath,'utf8'));
const diagrams=JSON.parse(fs.readFileSync(diagramPath,'utf8'));

assert.equal(repaired.status,'PASS');
assert.equal(repaired.authorityDigest,pack.authorityDigest);
assert.equal(repaired.providerUsage.semanticReviewCalls,0);
assert(Number(repaired.providerUsage.totalEstimatedProviderCost)<=1);
assert.equal(repaired.rawManuscriptSections.length,10);

const publication=await buildZwrVfrDeepPublicationIr({pack,repairedResult:repaired});
assert.equal(publication.sections.length,10);
for(const s of publication.sections){
 const ps=pack.sections.find(x=>x.sectionId===s.sectionId);
 assert(ps,s.sectionId+': authority section missing');
 assert.deepEqual(s.authorityRefs,ps.claims.map(c=>c.claimId),s.sectionId+': authority refs must be deterministic pack binding');
 assert(s.zhHans.paragraphs.length>=5,s.sectionId+': Chinese manuscript too thin');
 assert(s.en.paragraphs.length>=5,s.sectionId+': English manuscript too thin');
}

assert.equal(diagrams.diagramCount,15);
assert.equal(diagrams.providerCalls,0);
const pages=buildZwrVfrPagePlan({sections:publication.sections});
const pageCheck=validateZwrVfrPagePlan({diagramIds:diagrams.diagrams.map(d=>d.id),pages,sections:publication.sections});
assert.equal(pageCheck.accepted,true,pageCheck.reasons.join(','));
assert(pageCheck.pageCount>=50&&pageCheck.pageCount<=80,'bilingual page count out of range');
for(let i=1;i<=15;i++){
 const id='ZWD-'+String(i).padStart(2,'0');
 assert.equal(pages.flatMap(p=>p.diagramIds).filter(x=>x===id).length,1,id+' must bind exactly once');
}

const fiveCall=fs.readFileSync('functions/personal-reading/visual-first/ziwei-vfr-five-call-composer.js','utf8');
const repair=fs.readFileSync('functions/personal-reading/visual-first/ziwei-vfr-targeted-repair.js','utf8');
assert(!fiveCall.includes('validateZwrFiveCallBatch'),'five-call live path must remain free of post-call semantic verifier');
assert(!repair.includes('validateZwrFiveCallBatch'),'repair live path must remain free of post-call semantic verifier');

const builder=fs.readFileSync('scripts/build-zwr-vfr-human-review.mjs','utf8');
assert(builder.includes('REPAIRED-RESULT.json'),'W6 must bind repaired Deep Manuscript');
assert(builder.includes('providerCallsDuringRerender:0'),'W7 rerender must be zero-provider');
assert(!builder.includes("root+'/LIVE-RESULT.json'"),'legacy one-call result must not own current publication');

const binding=fs.readFileSync('functions/report-delivery/ziwei-canonical-person-binding.js','utf8');
assert(binding.includes('ziwei-professional-synthesis-r5-generation.js'),'W10 must remain blocked before W9 HUMAN ACCEPT');

console.log(
 'PASS FR-ZWR-4R..8R deep alignment: factual authority deterministic; post-call semantic verifier=0; '+
 '15 diagrams exactly once; '+pageCheck.pageCount+'-page bilingual deep plan; repaired manuscript is W6/W8 source; rerender provider calls=0; '+
 'representative total provider cost=$'+Number(repaired.providerUsage.totalEstimatedProviderCost).toFixed(6)+
 '; production cutover still blocked.'
);
