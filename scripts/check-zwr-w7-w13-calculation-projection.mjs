import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root=process.cwd();
const json=(p)=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const text=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const exists=(p)=>fs.existsSync(path.join(root,p));

const policy=json('content/professional/core-method-runtime/zi-wei-calculation-policy-v1.json');
const recon=json('content/zi-wei-runtime/reconciliation/zwr-w2h-reconciliation-on-4c1aff3-v1.json');
const oldCal=json('content/professional/zi-wei-runtime/contracts/zi-wei-calendar-conversion-runtime-contract-v1.json');
const oldPal=json('content/professional/zi-wei-runtime/contracts/zi-wei-palace-construction-runtime-contract-v1.json');
const calSucc=json('content/zi-wei-runtime/successors/zi-wei-calendar-conversion-runtime-successor-v2.json');
const palSucc=json('content/zi-wei-runtime/successors/zi-wei-palace-construction-runtime-successor-v2.json');
const mainReg=json('content/zi-wei-runtime/registries/zi-wei-main-star-placement-registry-v1.json');
const supportReg=json('content/zi-wei-runtime/registries/zi-wei-support-star-scope-registry-v1.json');
const transContract=json('content/zi-wei-runtime/contracts/zi-wei-four-transformations-runtime-contract-v1.json');
const irContract=json('content/zi-wei-runtime/contracts/zi-wei-calculation-ir-contract-v1.json');
const fixtures=json('content/zi-wei-runtime/fixtures/zi-wei-validation-fixture-corpus-v1.json');
const xref=json('content/zi-wei-runtime/evidence/zi-wei-cross-reference-validation-v1.json');
const projContract=json('content/zi-wei-runtime/contracts/zi-wei-canonical-projection-contract-v1.json');
const activation=json('content/zi-wei-runtime/successors/zwr-w7-w13-internal-calculation-activation-v1.json');
const evidenceV2=json('content/zi-wei-runtime/evidence/zi-wei-source-evidence-registry-v2.json');
const acceptance=json('content/zi-wei-runtime/acceptance/zwr-w7-w13-calculation-validation-projection-acceptance-v1.json');

// W2H reconciliation is explicit and the exact authority remains Human-frozen.
assert.equal(recon.status,'PRIOR_HUMAN_FREEZE_RESTORED_AS_EXPLICIT_PREDECESSOR_EVIDENCE');
assert.equal(recon.finding.baselineDistContainedHumanFreeze,false);
assert.equal(recon.finding.approvedDecisionCount,10);
assert.equal(policy.status,'HUMAN_FROZEN');
assert.equal(policy.freezeGate.frozenDecisionCount,10);
assert.equal(policy.freezeGate.allRequiredDecisionsFrozen,true);
assert.equal(policy.freezeGate.downstreamPolicyConsumptionAllowed,true);
assert.equal(policy.freezeGate.calculationRuntimeActivationGranted,false,'Frozen W2H policy itself must not be rewritten to grant runtime activation.');
assert.equal(policy.freezeGate.productionActivationGranted,false);
assert.equal(policy.requiredPolicies.length,10);
assert.ok(policy.requiredPolicies.every(x=>x.status==='HUMAN_FROZEN' && x.frozen===true));

// Historical W5/W6 fail-closed contracts remain historical and are not mutated into production authority.
assert.equal(oldCal.currentExecutionAllowed,false);
assert.equal(oldPal.currentExecutionAllowed,false);
assert.equal(calSucc.status,'VALIDATED_INTERNAL_SUCCESSOR');
assert.equal(palSucc.status,'VALIDATED_INTERNAL_SUCCESSOR');
assert.equal(calSucc.execution.productionDispatchAllowed,false);
assert.equal(palSucc.execution.productionDispatchAllowed,false);

const runtimePaths=[
 'functions/zi-wei-runtime/lunar-calendar-table-v1.js',
 'functions/zi-wei-runtime/runtime-activation-gate.js',
 'functions/zi-wei-runtime/zi-wei-calendar-conversion-runtime-v2.js',
 'functions/zi-wei-runtime/zi-wei-palace-construction-runtime-v2.js',
 'functions/zi-wei-runtime/zi-wei-main-star-runtime.js',
 'functions/zi-wei-runtime/zi-wei-support-star-runtime.js',
 'functions/zi-wei-runtime/zi-wei-four-transformations-runtime.js',
 'functions/zi-wei-runtime/zi-wei-calculation-ir-runtime.js',
 'functions/zi-wei-runtime/zi-wei-canonical-projection-runtime.js'
];
for(const p of runtimePaths) assert.ok(exists(p),`missing ${p}`);

const cal=await import(pathToFileURL(path.join(root,'functions/zi-wei-runtime/zi-wei-calendar-conversion-runtime-v2.js')));
const pal=await import(pathToFileURL(path.join(root,'functions/zi-wei-runtime/zi-wei-palace-construction-runtime-v2.js')));
const main=await import(pathToFileURL(path.join(root,'functions/zi-wei-runtime/zi-wei-main-star-runtime.js')));
const support=await import(pathToFileURL(path.join(root,'functions/zi-wei-runtime/zi-wei-support-star-runtime.js')));
const transforms=await import(pathToFileURL(path.join(root,'functions/zi-wei-runtime/zi-wei-four-transformations-runtime.js')));
const calcIR=await import(pathToFileURL(path.join(root,'functions/zi-wei-runtime/zi-wei-calculation-ir-runtime.js')));
const projection=await import(pathToFileURL(path.join(root,'functions/zi-wei-runtime/zi-wei-canonical-projection-runtime.js')));

// W11 calendar corpus, including HKO-aligned new year/leap-month fixtures and the frozen 23:00 boundary.
for(const fx of fixtures.calendarFixtures){
 const got=cal.buildZiWeiCalendarRepresentationV2(fx.input,{policy});
 const e=fx.expected;
 if(e.effectiveCivilDate) assert.equal(got.dayBoundary.effectiveCivilDate,e.effectiveCivilDate,fx.fixtureId);
 if(e.dayShift!==undefined) assert.equal(got.dayBoundary.dayShift,e.dayShift,fx.fixtureId);
 for(const k of ['lunarYear','lunarMonth','lunarDay','isLeap','effectiveMonthForRules']) if(e[k]!==undefined) assert.equal(got.lunar[k],e[k],`${fx.fixtureId}:${k}`);
 if(e.hourBranch) assert.equal(got.birthHour.code,e.hourBranch,fx.fixtureId);
 if(e.yearStem) assert.equal(got.birthYear.stem,e.yearStem,fx.fixtureId);
 if(e.yearBranch) assert.equal(got.birthYear.branch,e.yearBranch,fx.fixtureId);
 assert.equal(got.interpretationIncluded,false);
}
assert.throws(()=>cal.buildZiWeiCalendarRepresentationV2({birthDate:'1900-01-01',birthTime:'05:00:00',timeAccuracy:'EXACT',timezone:{iana:'Asia/Hong_Kong',utcOffsetAtBirth:'+08:00'}},{policy}),e=>e.code==='ZWR_CALENDAR_OUT_OF_RANGE');
assert.throws(()=>cal.buildZiWeiCalendarRepresentationV2({birthDate:'2023-01-22',birthTime:'05:00:00',timeAccuracy:'APPROXIMATE',timezone:{iana:'Asia/Hong_Kong',utcOffsetAtBirth:'+08:00'}},{policy}),e=>e.code==='ZWR_EXACT_BIRTH_TIME_REQUIRED');

// Documented five-element bureau examples and Zi Wei start examples.
for(const fx of fixtures.formulaFixtures.filter(x=>x.kind==='FIVE_ELEMENT_BUREAU')){
 const got=pal._test.fiveElementBureau(fx.input.stem,fx.input.branch);
 assert.equal(got.element,fx.expected.element,fx.fixtureId); assert.equal(got.bureau,fx.expected.bureau,fx.fixtureId);
}
const startFx=fixtures.formulaFixtures.find(x=>x.kind==='ZI_WEI_START');
for(const c of startFx.cases){ const got=main._test.startIndices(c.lunarDay,c.bureau); assert.equal((await import(pathToFileURL(path.join(root,'functions/zi-wei-runtime/zwr-utils.js')))).YIN_WHEEL[got.ziweiIndex],c.expectedBranch); }

// W7/W8 registry and executable star scope must match exactly.
const expectedMain=new Set(['ZI_WEI','TIAN_JI','TAI_YANG','WU_QU','TIAN_TONG','LIAN_ZHEN','TIAN_FU','TAI_YIN','TAN_LANG','JU_MEN','TIAN_XIANG','TIAN_LIANG','QI_SHA','PO_JUN']);
assert.equal(mainReg.stars.length,14); assert.deepEqual(new Set(mainReg.stars.map(x=>x.starCode)),expectedMain);
const expectedSupport=new Set(['ZUO_FU','YOU_BI','WEN_CHANG','WEN_QU','TIAN_KUI','TIAN_YUE']);
assert.equal(supportReg.stars.length,6); assert.deepEqual(new Set(supportReg.stars.map(x=>x.starCode)),expectedSupport);

const integratedInput={birthDate:'2023-01-22',birthTime:'05:00:00',timeAccuracy:'EXACT',timezone:{iana:'Asia/Hong_Kong',utcOffsetAtBirth:'+08:00',source:'ZWR_TEST'}};
const ir1=calcIR.buildZiWeiCalculationIR(integratedInput,{policy,executionMode:'INTERNAL_VALIDATION'});
const ir2=calcIR.buildZiWeiCalculationIR(JSON.parse(JSON.stringify(integratedInput)),{policy,executionMode:'INTERNAL_VALIDATION'});
assert.equal(ir1.schemaVersion,irContract.irSchema);
assert.equal(ir1.calculationDigest,ir2.calculationDigest,'same input/policy must have same calculation digest');
assert.equal(ir1.mainStars.starCount,14); assert.deepEqual(new Set(ir1.mainStars.stars.map(x=>x.starCode)),expectedMain);
assert.equal(ir1.supportStars.starCount,6); assert.deepEqual(new Set(ir1.supportStars.stars.map(x=>x.starCode)),expectedSupport);
assert.equal(ir1.palaceStructure.palaces.length,12);
assert.equal(new Set(ir1.palaceStructure.palaces.map(x=>x.palaceCode)).size,12);
assert.equal(ir1.calendar.lunar.lunarDay,1); assert.equal(ir1.palaceStructure.lifePalace.branch,'HAI'); assert.equal(ir1.palaceStructure.fiveElementBureau.code,'WATER_2');
const starByCode=new Map([...ir1.mainStars.stars,...ir1.supportStars.stars].map(s=>[s.starCode,s]));
assert.deepEqual(ir1.transformations.transformations.map(x=>x.targetStarCode),['PO_JUN','JU_MEN','TAI_YIN','TAN_LANG']);
for(const t of ir1.transformations.transformations) assert.equal(t.branch,starByCode.get(t.targetStarCode).branch);
for(const k of ['dynamicPeriodsIncluded','meaningIncluded','readingIncluded','professionalJudgmentIncluded','fortunePredictionIncluded']) assert.equal(ir1.boundaries[k],false);

// Every Human-frozen Southern-table row points to admitted 14+6 scope.
const allAdmitted=new Set([...expectedMain,...expectedSupport]);
const transPolicy=policy.requiredPolicies.find(x=>x.policyCode==='TRANSFORMATION_SCOPE');
assert.equal(transContract.schoolLabel,'SOUTHERN_TABLE');
for(const [stem,row] of Object.entries(transPolicy.decision.table)){ assert.equal(row.length,4,stem); for(const star of row) assert.ok(allAdmitted.has(star),`${stem} transformation target ${star} must be admitted`); }

// W13 projection is deterministic and explicitly internal/non-production.
const p1=projection.projectZiWeiCalculationIR(ir1,{executionMode:'INTERNAL_VALIDATION'});
const p2=projection.projectZiWeiCalculationIR(ir2,{executionMode:'INTERNAL_VALIDATION'});
assert.equal(p1.projectionId,p2.projectionId);
assert.equal(p1.schemaVersion,projContract.projectionSchema);
assert.equal(p1.method.methodCode,'ZI_WEI_DOU_SHU');
assert.equal(p1.method.status,'VALIDATED_INTERNAL_NOT_PRODUCTION_ACTIVATED');
assert.equal(p1.execution.productionDispatchAllowed,false);
assert.equal(p1.projection.productionClientContractActivated,false);
assert.equal(p1.interpretation.included,false);
assert.equal(p1.interpretation.meaningAuthorityCreated,false);
assert.equal(p1.interpretation.realityReadingCreated,false);
assert.equal(p1.calculation.mainStars.length,14);
assert.equal(p1.calculation.supportStars.length,6);
assert.equal(p1.calculation.transformations.length,4);

// Different canonical input must not collapse to the same identity.
const other=calcIR.buildZiWeiCalculationIR({birthDate:'2000-02-05',birthTime:'11:00:00',timeAccuracy:'EXACT',timezone:{iana:'Asia/Hong_Kong',utcOffsetAtBirth:'+08:00',source:'ZWR_TEST'}},{policy,executionMode:'INTERNAL_VALIDATION'});
assert.notEqual(other.calculationDigest,ir1.calculationDigest);
assert.notEqual(projection.projectZiWeiCalculationIR(other,{executionMode:'INTERNAL_VALIDATION'}).projectionId,p1.projectionId);

// W12 evidence is cross-reference only; no network/runtime authority is created.
assert.equal(xref.status,'VALIDATED_WITH_DECLARED_NON_AUTHORITY_REFERENCES');
assert.ok(xref.references.length>=4); assert.ok(xref.references.every(x=>x.runtimeAuthority===false));
assert.equal(evidenceV2.externalWebsiteAsRuntimeAuthorityAllowed,false);
assert.equal(evidenceV2.doctrinalRuleSourcesAdmittedAtRuntime,0);
assert.ok(exists('content/zi-wei-runtime/evidence/ZWR-LUNAR-TABLE-THIRD-PARTY-NOTICE.md'));
assert.ok(xref.references.some(x=>x.referenceId==='ZWR-XREF-SOLARLUNAR-TABLE' && x.license==='ISC' && x.runtimeAuthority===false));

// Internal activation successor exists, but Production/MPA/MCD/frontend gates remain closed.
assert.equal(activation.status,'INTERNAL_VALIDATION_ACTIVATED_PRODUCTION_BLOCKED');
assert.equal(activation.grants.internalDeterministicCalculationAllowed,true);
assert.equal(activation.grants.internalCanonicalProjectionAllowed,true);
assert.equal(activation.grants.productionMethodDispatchAllowed,false);
assert.equal(activation.grants.mcdAdapterAllowed,false);
assert.equal(activation.grants.frontendExecutionAllowed,false);
assert.equal(activation.grants.meaningAllowed,false);
assert.throws(()=>calcIR.buildZiWeiCalculationIR(integratedInput,{policy}),e=>e.code==='ZWR_PRODUCTION_NOT_ACTIVATED');
assert.throws(()=>projection.projectZiWeiCalculationIR(ir1),e=>e.code==='ZWR_PRODUCTION_NOT_ACTIVATED');
assert.equal(acceptance.productionState,'NOT_PRODUCTION_ACTIVATED');
assert.equal(acceptance.notAcceptedYet.meaning,true);
assert.equal(acceptance.notAcceptedYet.mpaProductionActivation,true);
assert.equal(acceptance.notAcceptedYet.mcdProductionAdapter,true);
assert.equal(acceptance.notAcceptedYet.frontendExecution,true);

const publicMethods=json('content/web-production/px2/registries/public-method-catalog-v1.json');
const zi=publicMethods.methods.find(x=>x.methodCode==='ZI_WEI_DOU_SHU');
assert.ok(zi); assert.equal(zi.runAllowed,false); assert.equal(zi.publicState,'DEFERRED_OUT_OF_SCOPE');

// Source-level guard: calculation/projection runtime must not import AI, meaning, reading, MPA or MCD.
for(const p of runtimePaths.filter(x=>!x.includes('lunar-calendar-table'))){
 const src=text(p);
 for(const forbidden of ['openai','anthropic','canonical-meaning','runtime-reading','method-production-activation','method-client-delivery']) assert.equal(src.toLowerCase().includes(forbidden),false,`${p} must not consume ${forbidden}`);
}

console.log('✓ ZWR-W7–W13 Zi Wei deterministic calculation + validation + canonical projection passed.');
console.log('  Human-frozen W2H policy is restored on 4c1aff3; historical W5/W6 contracts remain fail-closed.');
console.log('  14 main stars + 6 support stars + natal Southern four transformations are deterministic within the frozen v1 scope.');
console.log(`  Fixture calculation digest: ${ir1.calculationDigest}`);
console.log(`  Fixture projection id: ${p1.projectionId}`);
console.log('  Projection remains VALIDATED_INTERNAL: no Meaning, Reading, MPA/MCD, frontend execution or Production dispatch is created.');
