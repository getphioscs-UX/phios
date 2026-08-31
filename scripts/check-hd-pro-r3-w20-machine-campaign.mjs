import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const gen=spawnSync(process.execPath,['scripts/generate-hd-pro-r3-w20-machine-campaign.mjs','--check'],{stdio:'inherit'});assert.equal(gen.status,0);
const cases=read(`${ROOT}/campaign/HD-PRO-R3-W20-machine-cases-v1.json`);const results=read(`${ROOT}/campaign/HD-PRO-R3-W20-machine-results-v1.json`);const status=read(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v17.json`);const prev=read(`${ROOT}/semantics/HD-PRO-R3-semantic-production-status-v16.json`);
assert.equal(cases.cases.length,96);assert.equal(results.summary.total,96);assert.equal(results.summary.passed,96);assert.equal(results.summary.failed,0);assert.equal(results.status,'MACHINE_VERIFIED_96_OF_96');
assert.equal(results.summary.types,5);assert.equal(results.summary.authorities,8);assert.equal(results.summary.profiles,12);assert.equal(results.summary.definitions,5);assert.equal(results.summary.channels,36);assert.equal(results.summary.gates,64);
for(const state of Object.values(results.summary.centerThreeStateCoverage)){assert.equal(state.DEFINED,true);assert.equal(state.UNDEFINED,true);assert.equal(state.OPEN,true);}
assert(results.summary.advancedPresent>0);assert(results.summary.advancedAbsent>0);assert(results.summary.sparseCases>=4);assert(results.summary.schoolVariantCases>=1);assert(results.summary.contradictoryExternalReportCases>=1);assert(results.summary.personalityDesignStructuralCases>=1);
assert(results.results.every(x=>x.pass));
assert.equal(prev.updatedByWork,'HD-PRO-R3-W19');assert.equal(status.updatedByWork,'HD-PRO-R3-W20');assert.equal(status.aggregate.machineCampaignPassed,true);assert.equal(status.aggregate.machineCampaignPassedCases,96);assert.equal(status.aggregate.r3CustomerCutoverAllowed,false);
console.log('✓ HD-PRO-R3-W20 96-case machine campaign passed 96/96.');
console.log('  Coverage includes 5 Types, 8 Authorities, 12 Profiles, 5 Definitions, all three Center states, 36 Channels and all 64 Gate identities without birth-data calculation.');
