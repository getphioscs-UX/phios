import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildCustomerReadingIA} from '../functions/single-method-reading-r2/customer-reading-ia.js';
import {buildCustomerReadingLayout} from '../functions/single-method-reading-r2/customer-reading-layout.js';
import {R2_METHODS,buildRealR2Narrative} from './smr-r2-w9-w11-test-support.mjs';

const benchmark=JSON.parse(fs.readFileSync('content/customer-experience-rebuild/r12r4b/smr-r2/benchmark/smr-r2-competitive-product-benchmark-v1.json','utf8'));
assert.equal(benchmark.governance.meaningAuthority,false);
assert.equal(benchmark.governance.webProseCopied,false);
const order=['WHAT_STANDS_OUT','YOUR_CORE_THEMES','WHAT_SUPPORTS_YOU','WHERE_TENSION_APPEARS','WHEN_THE_PATTERN_CHANGES','WHAT_THIS_MAY_LOOK_LIKE_IN_REALITY','WHAT_TO_OBSERVE','WHY_THIS_READING'];
const summary={};
for(const methodId of R2_METHODS){
  const {narrative}=await buildRealR2Narrative(methodId);
  const ia=buildCustomerReadingIA({narrativeIR:narrative});
  const layout=buildCustomerReadingLayout({readingIA:ia});
  assert.equal(ia.methodId,methodId);
  assert.deepEqual(ia.sections.map(item=>item.sectionId),order);
  assert.equal(ia.methodDetail.defaultCollapsed,true);
  assert.equal(ia.boundary.rendererMeaningCreated,false);
  for(const section of ia.sections){
    if(section.itemCount===0)assert.equal(section.eligibility,'SECTION_NOT_ELIGIBLE',`${methodId}:${section.sectionId} empty section rendered`);
    if(section.eligibility==='SECTION_ELIGIBLE')assert.ok(section.itemCount>0,`${methodId}:${section.sectionId} eligible without content`);
  }
  const narrativeTexts=new Set();
  const visit=value=>{if(!value||typeof value!=='object')return;if(value.narrativeRef&&value.renderable&&value.text)narrativeTexts.add(value.text);for(const nested of Object.values(value))if(nested&&typeof nested==='object')visit(nested)};
  visit(narrative);
  for(const section of ia.sections)for(const item of section.items)if(item.text!==null)assert.ok(narrativeTexts.has(item.text),`${methodId}: IA introduced non-narrative text`);
  assert.ok(layout.firstScreen.blockCount<=8);
  assert.ok(layout.firstScreen.themeCount<=3);
  assert.equal(layout.firstScreen.technicalRefsIncluded,false);
  assert.equal(layout.mobile.noHorizontalOverflow,true);
  assert.equal(layout.mobile.noNestedScroll,true);
  assert.equal(layout.print.clippedChartAllowed,false);
  assert.equal(layout.print.uiOnlyControlsIncluded,false);
  assert.equal(layout.boundary.layoutMeaningCreated,false);
  summary[methodId]={eligibleSections:ia.sections.filter(item=>item.eligibility==='SECTION_ELIGIBLE').map(item=>item.sectionId),firstScreenBlocks:layout.firstScreen.blockCount,firstScreenThemes:layout.firstScreen.themeCount,technicalDefaultCollapsed:layout.technical.defaultCollapsed};
}
console.log('✓ CX-R12R4B SMR-R2 W0-W11 real-method regression passed across AST/BZR/ZWR/NUM/ECR with customer-order IA, bounded responsive layout and benchmark governance.');
for(const methodId of R2_METHODS)console.log(`  ${methodId}: ${JSON.stringify(summary[methodId])}`);
