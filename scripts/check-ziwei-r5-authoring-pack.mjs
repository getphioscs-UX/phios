import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildZiweiR5AuthoringPack} from '../functions/personal-reading/narrative/ziwei-r5-authoring-pack.js';

const source=fs.readFileSync('functions/personal-reading/narrative/ziwei-r5-authoring-pack.js','utf8');
assert(!source.includes('OPENAI_API_KEY'),'Authoring pack must not depend on API key');
assert(!source.includes('ZIWEI_R5_PAI_REGISTRY'),'Authoring pack must not import provider registry');
assert(!source.includes('composeReportSectionT3('),'Authoring pack must not call live composer');

const fixture=JSON.parse(fs.readFileSync('docs/reports/ziwei/production-admission/zpa-v1/ZPA-CONTROLLED-01-en.json','utf8'));
for(const locale of ['zh-Hans','en']){
 const pack=await buildZiweiR5AuthoringPack({evidence:fixture.evidence,locale});
 assert.equal(pack.sectionCount,10);
 assert.equal(pack.apiKeyRequired,false);
 assert.equal(pack.liveProviderRequired,false);
 assert.deepEqual(pack.sections.map(s=>s.sectionId),['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11']);
 for(const section of pack.sections){
  assert(section.claims.length>=7,section.sectionId+' claims too thin');
  assert(section.claims.every(c=>c.sourceRefs.length>0),section.sectionId+' source lineage missing');
  assert(section.authoringContract.requiredShape.length>=6);
 }
}
const registry=JSON.parse(fs.readFileSync('content/professional/ziwei-r5/accepted-candidates-v1.json','utf8'));
assert.equal(registry.status,'EMPTY_AWAITING_HUMAN_ACCEPTED_CANDIDATES');
assert.equal(registry.productionUse,false);
console.log('PASS Zi Wei R5 authoring lane: deterministic governed packs, no API key, no live provider, human ACCEPT registry remains empty.');
