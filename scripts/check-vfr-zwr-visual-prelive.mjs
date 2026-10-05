import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildZwrVfrDiagramData} from '../functions/personal-reading/visual-first/ziwei-vfr-diagram-data.js';
import {validateZwrVfrPagePlan} from '../functions/personal-reading/visual-first/ziwei-vfr-page-plan.js';

const fixture=JSON.parse(fs.readFileSync('docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-02-en.json','utf8'));
const diagrams=await buildZwrVfrDiagramData({evidence:fixture.evidence});
assert.equal(diagrams.providerCalls,0);
assert.equal(diagrams.diagramCount,15);
assert.equal(new Set(diagrams.diagrams.map(d=>d.id)).size,15);
assert(diagrams.diagrams.every(d=>d.data&&typeof d.data==='object'));
const plan=validateZwrVfrPagePlan({diagramIds:diagrams.diagrams.map(d=>d.id)});
assert.equal(plan.accepted,true,plan.reasons.join(','));
assert.equal(plan.pageCount,47);
assert(plan.visualPages>=35,'visual pages too low');
assert(plan.textOnlyPages<=12,'text-only pages too high');
assert(plan.maxConsecutiveProsePages<=2);
console.log('PASS ZWR-VFR visual pre-live: diagrams='+diagrams.diagramCount+'; pages='+plan.pageCount+'/50; visualPages='+plan.visualPages+'; textOnlyPages='+plan.textOnlyPages+'; maxConsecutiveProse='+plan.maxConsecutiveProsePages+'; provider calls=0.');
