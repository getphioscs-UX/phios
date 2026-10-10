import assert from 'node:assert/strict';
import {runHfpFixture} from './lib/hfp/hfp-check-lib.mjs';
const c=await runHfpFixture('continuity-t0-t1-t2.json'); const st=c.candidate.sections.find(s=>s.sectionCode==='REVIEW_CONTINUITY').statements[0]; assert.deepEqual(st.payload.snapshotReferences,['SNAP:t0','SNAP:t1','SNAP:t2']); assert.equal(st.payload.stalenessState,'CURRENT');
const sc=await runHfpFixture('scenario-comparison.json'); const scenarios=sc.candidate.sections.find(s=>s.sectionCode==='SCENARIO_ANALYSIS').statements; assert.equal(scenarios.length,2); assert.deepEqual(scenarios.map(s=>s.payload.scenarioCode),['BASE','STRESS']);
const pro=await runHfpFixture('professional.json'); const action=pro.candidate.sections.find(s=>s.sectionCode==='ACTION_PLAN').statements[0]; assert.equal(action.statementType,'ACTION'); assert.equal(action.sourceAuthority,'FIXTURE_PFR'); assert.ok(action.professionalAuthorship?.authorReference);
console.log('✓ HFP-W21/W23 continuity + action + scenario composition passed.');
