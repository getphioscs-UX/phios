import assert from 'node:assert/strict';
import {buildFixtureInput,composeHolisticFinancialPlan,createHfpRrSubmission} from './lib/hfp/hfp-check-lib.mjs';
const {input}=await buildFixtureInput('business-owner.json'); const a=await composeHolisticFinancialPlan(structuredClone(input)); const b=await composeHolisticFinancialPlan(structuredClone(input)); assert.equal(a.candidateDigest,b.candidateDigest,'Same HFP input must yield same digest.'); assert.deepEqual(a,b);
const r1=await createHfpRrSubmission(a,{submittedAt:'2026-08-23T00:00:00.000Z'}); const r2=await createHfpRrSubmission(a,{submittedAt:'2026-08-23T00:00:00.000Z'}); assert.deepEqual(r1,r2);
console.log('✓ HFP deterministic composition + handoff passed.');
