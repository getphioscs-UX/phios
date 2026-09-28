import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));

const cases=json('content/civilization-atlas/cases/civilization-case-registry-v1.json');
const schema=json('content/civilization-atlas/schemas/civilization-case.schema.json');
const renderer=read('assets/js/pages/civilization-atlas/cases-renderer.js');
const trajectories=read('assets/js/pages/civilization-atlas/trajectory-renderer.js');
const compositor=read('assets/js/pages/civilization-atlas/atlas-visual-projection.js');
const evidence=json('content/civilization-atlas/evidence/civ-atlas-fr5-case-semantic-l6-overview-v1.json');

assert.equal(evidence.status,'IMPLEMENTED_READY_FOR_REVIEW');
assert.equal(cases.cases.length,120);

for(const c of cases.cases){
  assert.ok(c.runtimeSummary?.['zh-Hans']?.trim(),`${c.caseId} missing zh-Hans runtimeSummary`);
  assert.ok(c.runtimeSummary?.en?.trim(),`${c.caseId} missing en runtimeSummary`);
}
assert.equal(new Set(cases.cases.map(c=>c.runtimeSummary['zh-Hans'])).size,120,'Case runtime summaries must not collapse to a repeated customer-facing sentence.');
assert.equal(new Set(cases.cases.map(c=>c.runtimeSummary.en)).size,120,'English runtime summaries must remain case-specific.');
assert.ok(schema.$defs.case.required.includes('runtimeSummary'),'Case schema must require runtimeSummary.');
assert.ok(renderer.includes('loc(c.runtimeSummary,lang)||label(c.politicalArchitecture,lang)||label(c.economicRuntime,lang)'),'Case cards must prefer runtimeSummary over generic legacy semantic fields.');
assert.ok(!renderer.includes("label(caseRecord.legacy,lang)"),'Case inspector must not foreground the generic legacy placeholder.');
assert.ok(!renderer.includes("label(caseRecord.successorStructure,lang)"),'Case inspector must not foreground the generic successor placeholder.');
assert.ok(renderer.includes('loc(caseRecord.runtimeSummary,lang)'),'Case inspector must use the case-specific runtime summary.');

assert.ok(trajectories.includes("const focusedId=state.trajectoryIds?.[0]||null;"),'L6 must not implicitly select Population in empty state.');
assert.ok(trajectories.includes('16 条长时段轨迹总览')&&trajectories.includes('Overview of 16 long-duration trajectories'),'L6 customer reader must expose an explicit overview state.');
assert.ok(compositor.includes("const ids=state.trajectoryIds?.length?state.trajectoryIds.slice(0,4):[];"),'Template compositor must preserve empty trajectory selection as overview.');
assert.ok(compositor.includes('civ-template-trajectory-overview-grid'),'L6 template must summarize all trajectory families when no trajectory is selected.');
assert.ok(!compositor.includes("all.slice(0,1).map(x=>x.trajectoryId)"),'L6 compositor must not silently fall back to first trajectory.');

console.log('CIV-ATLAS-FR5 gate PASS: 120 case summaries are customer-distinct and L6 empty selection is a real 16-trajectory overview.');
