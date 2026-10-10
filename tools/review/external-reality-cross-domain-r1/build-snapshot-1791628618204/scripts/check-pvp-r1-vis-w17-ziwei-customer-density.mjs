import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadPhase9ZiweiCases,buildPhase9ZiweiCase} from './lib/pvp-phase9-ziwei-fixture.mjs';
const audit=JSON.parse(fs.readFileSync('content/product-visual-platform-r1/ziwei/pvp-r1-vis-w17-ziwei-customer-density-audit-v1.json','utf8'));
assert.equal(audit.status,'MACHINE_MEASURED_24_OF_24');assert.equal(audit.caseCount,24);assert.equal(audit.prePhase9.averageFirstInsightPosition,0.4354);assert.equal(audit.professionalDetailDeleted,false);
let sumPos=0,unique=0,count=0;
for(const c of loadPhase9ZiweiCases()){
 const x=await buildPhase9ZiweiCase(c);const main=`${x.plan.navigationHtml}${x.plan.visualHtml}${x.plan.readingHtml}`;const marker=main.indexOf('data-pvp-zv-w20="true"');assert(marker>=0,`${c.caseId} visual-first priority marker`);sumPos+=marker/Math.max(main.length,1);count++;
 assert.equal(x.pro.palaces.length,12);if(new Set(x.pro.palaces.map(p=>p.professionalUnit.composition)).size===12)unique++;
 assert.equal((x.plan.visualHtml.match(/data-ziwei-pro-r2-palace=/g)||[]).length,12,`${c.caseId} 12 palace detail preserved`);
}
const avg=sumPos/count,improvement=(1-avg/audit.prePhase9.averageFirstInsightPosition)*100;
assert.equal(count,24);assert.equal(unique,24);assert(avg<0.05,`first insight position ${avg}`);assert(improvement>=90,`first insight improvement ${improvement}`);assert(Math.abs(avg-audit.phase9VisualFirst.averageFirstInsightPosition)<0.005,'recorded W17 metric drift');
console.log(`✓ PVP W17 Zi Wei customer density audit passed: 24/24 cases, first insight ${(avg*100).toFixed(2)}% into surface vs 43.54% predecessor; professional 12-palace detail preserved.`);
