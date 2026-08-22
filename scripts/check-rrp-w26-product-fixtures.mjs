import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRuntimeReadingReportCandidate } from '../functions/runtime-reading/report-candidate-runtime.js';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const reg=j('content/products/runtime-reading/fixtures/runtime-reading-fixture-registry-v1.json');
assert.ok(reg.baselineCommit.startsWith('f010b29'));
assert.equal(reg.positiveFixtures.length,12);
assert.ok(reg.negativeFixtures.length>=9);
assert.equal(reg.rules.fixturesAreNotPilotCases,true);
assert.equal(reg.rules.fixturesCannotPromoteToEM3,true);

const got=new Map();
for (const f of reg.positiveFixtures) {
  const input=j(f.inputFile), expected=j(f.expectedCandidateFile);
  const a=await createRuntimeReadingReportCandidate(input);
  const b=await createRuntimeReadingReportCandidate(input);
  assert.deepEqual(a,b,`${f.fixtureId}: same input/versions must produce same candidate`);
  assert.deepEqual(a,expected,`${f.fixtureId}: golden candidate drift`);
  assert.ok(a.candidateDigest.startsWith('sha256:'),`${f.fixtureId}: digest missing`);
  got.set(f.fixtureId,{input,candidate:a});
}

assert.deepEqual(got.get('F01').candidate.selectedMethods,[]);
assert.deepEqual(got.get('F02').candidate.selectedMethods,['AST']);
assert.deepEqual(got.get('F03').candidate.selectedMethods,['BZR']);
assert.deepEqual(got.get('F04').candidate.selectedMethods,['AST','BZR']);
assert.equal(got.get('F04').input.governanceContext.objectiveTruthClaimAllowed,false);
assert.equal(got.get('F05').input.governanceContext.noonFallbackAllowed,false);
assert.ok(got.get('F05').candidate.unknowns.some(x=>x.sourceReferences.includes('INPUT:BIRTH_TIME')));
assert.deepEqual(got.get('F06').input.governanceContext.methodExecutions,[]);
assert.equal(got.get('F07').input.governanceContext.inventMeaningAllowed,false);
assert.ok(got.get('F08').candidate.contradictions.length>0);
assert.ok(got.get('F09').candidate.unknowns.length>=10);
assert.equal(got.get('F10').candidate.professionalCompletionRequired,true);
assert.ok(got.get('F10').candidate.professionalCompletionReasons.includes('HDR_MANUAL_FIELD_REQUIRED'));
assert.ok(got.get('F11').candidate.sections.flatMap(s=>s.statements).some(s=>s.statementType==='PROFESSIONAL_JUDGMENT'));
assert.equal(got.get('F12').candidate.sections.flatMap(s=>s.visualSemanticReferences)[0].visualState,'UNAVAILABLE');

for (const f of reg.negativeFixtures) {
  const input=j(f.inputFile);
  let err=null; try { await createRuntimeReadingReportCandidate(input); } catch(e){ err=e; }
  assert.ok(err,`${f.fixtureId} must fail closed`);
  assert.equal(err.code,f.expectedFailureCode,`${f.fixtureId}: wrong failure code (${err?.message})`);
}

console.log('✓ RRP-W26 product fixtures passed.');
console.log(`  ${reg.positiveFixtures.length} positive/golden fixtures PASS deterministically; ${reg.negativeFixtures.length} prohibited fixtures FAIL CLOSED with governed failure codes.`);
