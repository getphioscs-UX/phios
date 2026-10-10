import assert from 'node:assert/strict';
import {base, readJson, getFixtures, walkFacts} from './fdr-check-lib.mjs';
const reg=readJson(`${base}/registries/financial-disclosure-state-registry-v1.json`), prog=readJson(`${base}/contracts/financial-progressive-disclosure-contract-v1.json`), complete=readJson(`${base}/contracts/financial-data-completeness-contract-v1.json`);
for(const s of ['NOT_YET_PROVIDED','DECLINED_TO_PROVIDE','UNKNOWN','NOT_APPLICABLE']) assert.ok(reg.states.includes(s));
assert.equal(reg.rules.declinedIsNotZero,true); assert.equal(reg.rules.unknownIsNotZero,true); assert.equal(prog.levelRequirements.QUICK.exactAmountsRequired,false); assert.equal(prog.levelRequirements.QUICK.rangesAllowed,true); assert.equal(prog.transitionRules.noExactAmountBlocksWholeCustomer,false);
assert.equal(complete.rules.declinedCountsAsZeroValue,false); assert.equal(complete.rules.unknownCountsAsZeroValue,false);
let declined=0,missing=0,ranges=0;
for(const {scenario,data} of getFixtures()) for(const s of data.snapshots) walkFacts(s.snapshotPayload,(f)=>{
 if(f.disclosureState==='DECLINED_TO_PROVIDE'){declined++;assert.equal(f.value,null,`${scenario} declined fact must stay null`)}
 if(f.disclosureState==='NOT_YET_PROVIDED'){missing++;assert.equal(f.value,null,`${scenario} missing fact must stay null`)}
 if(f.disclosureState==='RANGE_ONLY'){ranges++;assert.ok(f.value&&Number.isFinite(f.value.min)&&Number.isFinite(f.value.max)&&f.value.min<=f.value.max,`${scenario} invalid range`)}
});
assert.ok(declined>0&&missing>0&&ranges>0,'Disclosure fixture coverage incomplete');
console.log('✓ FDR disclosure passed: partial/range/missing/declined states remain distinct; no exact-value gate and no zero coercion.');
