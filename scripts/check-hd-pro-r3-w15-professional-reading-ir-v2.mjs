import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {prioritizeHumanDesignR3WholeChart} from '../functions/external-profile/human-design-r3-whole-chart-priority.js';
import {buildHumanDesignR3ProfessionalReadingIr,HD_R3_READING_IR_VERSION} from '../functions/external-profile/human-design-r3-reading-ir-v2.js';

const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';
const read=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
const contract=read(`${ROOT}/reading/HD-PRO-R3-W15-professional-reading-ir-v2-contract.json`);
const fixture=read(`${ROOT}/reading/HD-PRO-R3-W15-reading-ir-fixture-v1.json`);
const status=read(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v12.json`);
const historical=read(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v11.json`);

assert.equal(contract.baselineCommit,'ba3ac00864644f7ac7861df59ce8c35db7ebad97');
assert.equal(contract.sections.length,13);
assert.deepEqual(contract.requiredTechnicalBindings,['claimIds[]','structureRefs[]','sourceRefs[]','compositionRuleIds[]']);
assert.equal(contract.customerDefaults.internalIdsVisible,false);
assert.equal(contract.chartAuthority,'CUSTOMER_SUPPLIED_CONFIRMED_EXTERNAL_HUMAN_DESIGN_CHART');

const priority=prioritizeHumanDesignR3WholeChart(fixture.facts,{customerIntent:fixture.facts.customerIntent});
const first=buildHumanDesignR3ProfessionalReadingIr(fixture.facts,{priorityResult:priority});
const second=buildHumanDesignR3ProfessionalReadingIr(JSON.parse(JSON.stringify(fixture.facts)),{priorityResult:priority});
assert.equal(first.schemaVersion,HD_R3_READING_IR_VERSION);
assert.deepEqual(first,second);
assert.equal(first.sections.length,13);
assert.deepEqual(first.sections.map(x=>String(x.order).padStart(2,'0')),fixture.expected.sectionOrder);
for(const s of first.sections){
  assert(s.sectionId); assert(s.title?.en&&s.title?.zhHans);
  assert(Array.isArray(s.technicalRefs.claimIds));
  assert(Array.isArray(s.technicalRefs.structureRefs));
  assert(Array.isArray(s.technicalRefs.sourceRefs));
  assert(Array.isArray(s.technicalRefs.compositionRuleIds));
}
const glance=first.sections[0];
assert.equal(glance.chartSummary.confirmedExternalChart,true);
assert.equal(glance.chartSummary.type,'GENERATOR');
assert.match(glance.customerNote.en,/chart you supplied and confirmed/i);
assert.match(glance.customerNote.en,/not claiming to calculate/i);
const gates=first.sections.find(x=>x.sectionId.endsWith('PRIORITY_GATES'));
assert.equal(gates.allGatesDefaultVisible,false);
assert.equal(gates.customerIa,'DETAIL_ON_DEMAND');
const advanced=first.sections.find(x=>x.sectionId.endsWith('ADVANCED'));
assert.equal(advanced.advancedModifierOnly,true);
assert(first.sections.find(x=>x.sectionId.endsWith('DECISIONS')).findings.length>=1);
assert(first.sections.find(x=>x.sectionId.endsWith('ENGAGEMENT')).findings.length>=1);
assert(first.sections.find(x=>x.sectionId.endsWith('OPEN_QUESTIONS')).findings.length>=5);
assert.equal(first.customerDefaults.showInternalIds,false);
assert.equal(first.customerDefaults.showAllGates,false);
assert.equal(first.publication.customerPublishableR3,false);

assert.equal(status.updatedByWork,'HD-PRO-R3-W15');
assert.equal(status.successorOf,`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v11.json`);
assert.equal(historical.updatedByWork,'HD-PRO-R3-W14');
assert.equal(status.aggregate.professionalReadingIrV2Active,true);
assert.equal(status.aggregate.professionalReadingIrV2Sections,13);
assert.equal(status.aggregate.professionalReadingInternalIdsDefaultVisible,false);
assert.equal(status.aggregate.r3CustomerCutoverAllowed,false);
assert.equal(status.nextWork,'HD-PRO-R3-W16 Customer Editorial Layer');

console.log('✓ HD-PRO-R3-W15 Professional Reading IR v2 passed.');
console.log('  13 customer-oriented sections bind claim/source/structure/composition trace while internal IDs and the full Gate inventory remain hidden by default; chart authority stays customer-supplied external Human Design.');
