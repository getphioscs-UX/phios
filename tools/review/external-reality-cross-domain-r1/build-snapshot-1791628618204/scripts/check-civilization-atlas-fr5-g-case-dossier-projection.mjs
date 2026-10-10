import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const renderer=read('assets/js/pages/civilization-atlas/cases-renderer.js');
const shell=read('assets/js/pages/civilization-atlas/atlas-shell.js');
const css=read('assets/css/civilization-atlas.css');
const evidence=JSON.parse(read('content/civilization-atlas/evidence/civ-atlas-fr5-g-case-dossier-projection-v1.json'));

assert.equal(evidence.status,'IMPLEMENTED_READY_FOR_HUMAN_REVIEW');
assert.equal(evidence.scope.caseCount,120);
assert.equal(evidence.scope.runtimeFields,19);
assert.equal(evidence.scope.customerProjection,'GROUPED_PROGRESSIVE_DOSSIER');

for(const token of [
  '现实基础','组织与运行','资源、能源与承载','知识与技术','基础设施与网络','安全与冲突','转型与延续',
  'Reality Base','Organization & Operation','Resources, Energy & Capacity','Knowledge & Technology','Infrastructure & Networks','Security & Conflict','Transition & Continuity'
]) assert.ok(renderer.includes(token),`Missing dossier section label: ${token}`);

for(const field of [
  'populationBase','settlementPattern','geographicReach','politicalArchitecture','economicRuntime','beliefSystem',
  'resourceBase','energyBase','capacity','load','alignment','knowledgeSystem','technology','infrastructure',
  'externalNetwork','civilizationDensity','expansionPattern','militaryStructure','successorStructure','legacy'
]) assert.ok(renderer.includes(`['${field}'`)||renderer.includes(`"${field}"`),`Dossier projection missing field: ${field}`);

assert.ok(renderer.includes('function renderCaseDossier'),'Dedicated dossier renderer missing.');
assert.ok(renderer.includes('data-case-dossier'),'Dossier focus target missing.');
assert.ok(renderer.includes('data-close-case-dossier'),'Dossier return action missing.');
assert.ok(renderer.includes('explicitlySelected'),'Dossier must require explicit case selection.');
assert.ok(renderer.includes('renderCaseDossier(explicitlySelected'),'Explicit case must project a dossier.');
assert.ok(renderer.includes("CASE_SECONDARY"),'Secondary case visual must remain available as supporting context.');
assert.ok(renderer.includes('civ-atlas-evidence-note civ-case-dossier__evidence'),'Evidence boundary must remain progressive disclosure.');
assert.ok(shell.includes("case-dossier-close"),'Shell must support clean dossier exit state.');

assert.ok(css.includes('CIV-ATLAS-FR5-G case dossier customer projection'),'FR5-G dossier CSS missing.');
assert.ok(css.includes('.civ-case-dossier__sections{display:grid;grid-template-columns:repeat(2'),'Desktop dossier section grid missing.');
assert.ok(css.includes('@media(max-width:560px)'),'Mobile dossier breakpoint missing.');

assert.ok(!renderer.includes('runtimeFamily}</'),'Customer dossier must not expose raw runtime-family enum.');
assert.ok(!renderer.includes('caseRecord.caseId}</'),'Customer dossier must not foreground raw case ID.');

console.log('CIV-ATLAS-FR5-G PASS: explicit View dossier action opens a seven-section progressive customer dossier over the merged 19-field case runtime.');
