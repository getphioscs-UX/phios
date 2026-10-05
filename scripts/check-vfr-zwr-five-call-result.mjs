import fs from 'node:fs';
import assert from 'node:assert/strict';
import {ZWR_VFR_FIVE_CALL_COMPOSER_VERSION} from '../functions/personal-reading/visual-first/ziwei-vfr-five-call-composer.js';

const root='docs/reports/ziwei/vfr-r1/five-call-experiment/';
const required=['PLAN.json','RESULT.json','PACK.json'];
for(const name of required)assert(fs.existsSync(root+name),'missing five-call artifact: '+name);
const plan=JSON.parse(fs.readFileSync(root+'PLAN.json','utf8'));
const result=JSON.parse(fs.readFileSync(root+'RESULT.json','utf8'));

assert.equal(plan.providerCallsPlanned,5);
assert.equal(plan.semanticReviewCallsPlanned,0);
assert.equal(plan.allowed,true);
assert.equal(result.status,'PASS');
assert.equal(result.composerVersion,ZWR_VFR_FIVE_CALL_COMPOSER_VERSION);
assert.equal(result.providerUsage.providerCalls,5);
assert.equal(result.providerUsage.semanticReviewCalls,0);
assert(Number(result.providerUsage.estimatedProviderCost)>0);
assert(Number(result.providerUsage.estimatedProviderCost)<=1,'five-call experiment cost exceeds USD1');
assert.equal(result.sections.length,10);
assert.equal(result.rawManuscriptSections.length,10);
assert.equal(new Set(result.rawManuscriptSections.map(s=>s.sectionId)).size,10);

for(const row of result.rawManuscriptSections){
 for(const locale of ['zhHans','en']){
  const x=row[locale];
  assert(x&&typeof x==='object',row.sectionId+':'+locale+': manuscript missing');
  assert(String(x.sectionThesis||'').length>=20,row.sectionId+':'+locale+': thesis too short');
  assert((x.structuralMechanism||[]).length>=2,row.sectionId+':'+locale+': structural mechanism too thin');
  assert.equal((x.livedScenarios||[]).length,3,row.sectionId+':'+locale+': lived scenarios must equal 3');
  assert.equal((x.constructiveExpression||[]).length,1,row.sectionId+':'+locale+': constructive expression must equal 1');
  assert.equal((x.pressureDistortion||[]).length,1,row.sectionId+':'+locale+': pressure distortion must equal 1');
  assert.equal((x.counterweight||[]).length,1,row.sectionId+':'+locale+': counterweight must equal 1');
  assert.equal((x.timingOverlay||[]).length,1,row.sectionId+':'+locale+': timing overlay must equal 1');
  assert.equal((x.realityNavigation||[]).length,1,row.sectionId+':'+locale+': reality navigation must equal 1');
 }
}

const zhText=result.rawManuscriptSections.flatMap(s=>Object.values(s.zhHans||{})).flat(Infinity).filter(x=>typeof x==='string').join('\n');
const enText=result.rawManuscriptSections.flatMap(s=>Object.values(s.en||{})).flat(Infinity).filter(x=>typeof x==='string').join('\n');
assert(zhText.length>9000,'five-call Chinese manuscript not materially deeper than summary mode');
assert(enText.split(/\s+/).length>1800,'five-call English manuscript not materially deeper than summary mode');

console.log('PASS ZWR-VFR five-call experiment: calls=5; semantic review=0; cost=$'+Number(result.providerUsage.estimatedProviderCost).toFixed(6)+'; input='+result.providerUsage.inputTokens+'; output='+result.providerUsage.outputTokens+'; sections=10; deep manuscript structure complete.');
