import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {prioritizeHumanDesignR3WholeChart} from '../functions/external-profile/human-design-r3-whole-chart-priority.js';
import {buildHumanDesignR3ProfessionalReadingIr} from '../functions/external-profile/human-design-r3-reading-ir-v2.js';
import {editorializeHumanDesignR3Reading,assertNoHumanDesignR3EditorialLeaks,HD_R3_EDITORIAL_VERSION} from '../functions/external-profile/human-design-r3-customer-editorial.js';

const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';
const read=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
const policy=read(`${ROOT}/editorial/HD-PRO-R3-W16-customer-editorial-policy-v1.json`);
const fixture=read(`${ROOT}/reading/HD-PRO-R3-W15-reading-ir-fixture-v1.json`);
const status=read(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v13.json`);
const historical=read(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v12.json`);

assert.equal(policy.baselineCommit,'ba3ac00864644f7ac7861df59ce8c35db7ebad97');
assert.equal(policy.technicalTracePlacement,'SOURCES_AND_TECHNICAL_ONLY');
assert.equal(policy.mechanicalTemplateRequired,false);
assert.equal(policy.variedEditorialLayoutsRequired,true);

const priority=prioritizeHumanDesignR3WholeChart(fixture.facts,{customerIntent:fixture.facts.customerIntent});
const ir=buildHumanDesignR3ProfessionalReadingIr(fixture.facts,{priorityResult:priority});
const first=editorializeHumanDesignR3Reading(fixture.facts,{readingIr:ir});
const second=editorializeHumanDesignR3Reading(JSON.parse(JSON.stringify(fixture.facts)),{readingIr:ir});
assert.equal(first.schemaVersion,HD_R3_EDITORIAL_VERSION);
assert.deepEqual(first,second);
assert.equal(assertNoHumanDesignR3EditorialLeaks(first),true);
assert.deepEqual(first.editorialPolicy.detectedForbiddenTerms,[]);
assert.equal(first.technicalTrace.defaultVisible,false);
assert(first.technicalTrace.claimIds.length>=5);
const cards=first.customerSections.flatMap(x=>x.customerCards||[]);
assert(cards.length>=8);
assert(new Set(cards.map(x=>x.layout)).size>=3,'editorial cards should not all use one mechanical layout');
assert(first.customerSections.find(x=>x.sectionId.endsWith('OPEN_QUESTIONS')).customerQuestions.length>=5);
const customerText=JSON.stringify(first.customerSections).toLowerCase();
for(const term of ['claim ir','semantic owner','source_admitted','semantic_admitted','composition supported','projection digest','authority registry']) assert(!customerText.includes(term),`customer editorial leaked ${term}`);
assert.equal(first.publication.customerPublishableR3,false);

assert.equal(status.updatedByWork,'HD-PRO-R3-W16');
assert.equal(status.successorOf,`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v12.json`);
assert.equal(historical.updatedByWork,'HD-PRO-R3-W15');
assert.equal(status.aggregate.customerEditorialLayerActive,true);
assert.equal(status.aggregate.customerEditorialInternalLanguageDefaultVisible,false);
assert.equal(status.aggregate.customerEditorialVariedLayouts,true);
assert.equal(status.aggregate.r3CustomerCutoverAllowed,false);
assert.equal(status.nextWork,'HD-PRO-R3-W17 Reality Composition v2');

console.log('✓ HD-PRO-R3-W16 Customer Editorial Layer passed.');
console.log(`  ${cards.length} customer cards use varied editorial rhythms; internal engineering terms are absent from default prose and technical trace remains separate.`);
