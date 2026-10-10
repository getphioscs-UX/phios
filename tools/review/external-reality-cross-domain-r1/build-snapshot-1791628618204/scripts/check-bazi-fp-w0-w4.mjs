import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildCanonicalBaziChartIR} from '../functions/bzr-full-production/bazi-chart-runtime.js';
import {analyzeBaziStrengthSeasonal} from '../functions/bzr-full-production/bazi-strength-seasonal-runtime.js';
import {analyzeBaziRelationships} from '../functions/bzr-full-production/bazi-relationship-runtime.js';
import {analyzeBaziTenGods} from '../functions/bzr-full-production/bazi-ten-god-runtime.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const exists=p=>fs.existsSync(p);
const files=[
 'content/professional/bzr-full-production/roadmap/bazi-full-production-master-work-v1.json',
 'content/professional/bzr-full-production/authority/bazi-fp-w0-current-authority-audit-v1.json',
 'content/interpretation/bazi/authority/bzr-r1-source-strategy-v1.json',
 'content/interpretation/bazi/registries/bazi-source-tier-registry-v1.json',
 'content/interpretation/bazi/registries/bazi-source-registry-v1.json',
 'content/interpretation/bazi/registries/bazi-source-admission-registry-v1.json',
 'content/interpretation/bazi/registries/bazi-source-coverage-matrix-v1.json',
 'content/interpretation/bazi/contracts/bazi-source-claim-contract-v1.json',
 'content/professional/bzr-full-production/contracts/bazi-canonical-chart-contract-v1.json',
 'content/professional/bzr-full-production/contracts/bazi-strength-seasonal-contract-v1.json',
 'content/professional/bzr-full-production/contracts/bazi-stem-branch-relationship-contract-v1.json',
 'content/professional/bzr-full-production/contracts/bazi-ten-god-structural-contract-v1.json',
 'content/professional/bzr-full-production/acceptance/bazi-fp-w0-w4-engineering-acceptance-v1.json',
 'functions/bzr-full-production/bazi-structural-registry.js',
 'functions/bzr-full-production/bazi-chart-runtime.js',
 'functions/bzr-full-production/bazi-strength-seasonal-runtime.js',
 'functions/bzr-full-production/bazi-relationship-runtime.js',
 'functions/bzr-full-production/bazi-ten-god-runtime.js'
];
for(const p of files)assert(exists(p),`missing ${p}`);

const master=j(files[0]);
assert.equal(master.baselineCommit,'14b6735b1ffb804c160b0b5306646994ee1ab1dd');
assert.equal(master.works.find(x=>x.work==='BAZI-FP-W0').status,'COMPLETE');
assert.match(master.works.find(x=>x.work==='BAZI-FP-W4').status,/ENGINEERING_COMPLETE/);
assert.match(master.works.find(x=>x.work==='BAZI-FP-W19').status,/BLOCKED/);
assert(master.hardBoundaries.includes('NO_SECOND_CANONICAL_METHOD_PROJECTION'));

const audit=j(files[1]);
assert.equal(audit.currentRuntime.canonicalMeaning.activeMappingCount,27);
assert.equal(audit.rootCause.currentUnitShape,'ONE_UNIT_PER_YEAR_MONTH_DAY_HOUR_PILLAR');
assert.equal(audit.successorDecision.predecessorsMutated,false);
assert.equal(audit.successorDecision.secondProjectionAuthorityCreated,false);
for(const needed of ['TEN_GODS','PATTERN_CLASSIFICATION','SEMANTIC_DEDUPLICATION','BAZI_SPECIFIC_UX'])assert(audit.missingOrInsufficientForFullReading.some(x=>x.capability===needed));

const strategy=j(files[2]),tiers=j(files[3]),sources=j(files[4]),admission=j(files[5]),coverage=j(files[6]);
assert.deepEqual(strategy.tierOrder,['TIER_1_CLASSICAL_PUBLIC_DOMAIN','TIER_2_PUBLIC_ACADEMIC_WITNESS','TIER_3_MODERN_PUBLIC_PROFESSIONAL_REFERENCE','TIER_4_COMMERCIAL_GAP_FILL_ONLY']);
assert.equal(strategy.rules.tier4PurchaseRequiresNamedCoverageGap,true);
assert.equal(tiers.tiers.length,4);
assert.deepEqual(sources.sources.map(x=>x.title),['三命通会','子平真诠','滴天髓']);
assert(sources.sources.every(x=>x.runtimeClaimAuthority==='PENDING_HUMAN_ADMISSION'));
assert.equal(admission.productionVerdictGate.strengthVerdict,false);
assert.equal(admission.productionVerdictGate.patternVerdict,false);
assert.equal(admission.productionVerdictGate.usefulGodVerdict,false);
assert(coverage.topics.some(x=>x.topic==='TEN_GODS'&&x.masterWork.includes('W4')));

const oldScope=j('content/professional/bzr-production/contracts/bzr-production-scope-v1.json');
assert(oldScope.excludedFeatures.includes('TEN_GODS'));
const oldTemporal=j('content/professional/bzr-temporal/contracts/bzr-temporal-scope-v1.json');
assert(oldTemporal.excludedFeatures.includes('PATTERN_CLASSIFICATION'));

const projection=j('content/professional/bzr-production/fixtures/bzr-canonical-projection.production.valid.json');
const projectionSnapshot=JSON.stringify(projection);
const chart1=await buildCanonicalBaziChartIR({canonicalProjection:projection});
const chart2=await buildCanonicalBaziChartIR({canonicalProjection:projection});
assert.equal(chart1.chartDigest,chart2.chartDigest);
assert.equal(JSON.stringify(projection),projectionSnapshot,'W1 mutated source projection');
assert.equal(chart1.dayMaster.code,'GENG');
assert.equal(chart1.dayMaster.zh,'庚');
assert.equal(chart1.dayMaster.element,'METAL');
assert.equal(chart1.monthCommand.branch.code,'YIN');
assert.equal(chart1.monthCommand.season,'SPRING');
assert.equal(chart1.pillars.length,4);
assert.deepEqual(chart1.pillars.find(x=>x.position==='DAY').hiddenStems.map(x=>x.code),['GENG','REN','WU']);
assert.equal(chart1.boundaries.secondProjectionAuthorityCreated,false);
assert.equal(chart1.boundaries.productionEligible,false);

const three=structuredClone(projection);
three.projectionId='CMP-BAZI-FP-THREE-PILLAR';
three.calculation.structures.find(x=>x.code==='FOUR_PILLARS').items=three.calculation.structures.find(x=>x.code==='FOUR_PILLARS').items.filter(x=>!x.code.startsWith('HOUR_'));
three.calculation.status='PARTIAL';
three.projection.status='PARTIAL';
three.projection.unknownDisclosureRequired=true;
three.unknown=[{code:'BIRTH_TIME_UNKNOWN',category:'INPUT',scope:'HOUR_PILLAR',reasonCodes:['BIRTH_TIME_NOT_PROVIDED']}];
const threeChart=await buildCanonicalBaziChartIR({canonicalProjection:three});
assert.equal(threeChart.pillars.length,3);
assert.equal(threeChart.pillars.some(x=>x.position==='HOUR'),false);
assert.equal(threeChart.executionCompleteness,'PARTIAL');
assert(threeChart.unknowns.some(x=>x.code==='BIRTH_TIME_UNKNOWN'));

const strength1=await analyzeBaziStrengthSeasonal({chart:chart1});
const strength2=await analyzeBaziStrengthSeasonal({chart:chart1});
assert.equal(strength1.analysisDigest,strength2.analysisDigest);
assert.equal(strength1.seasonalContext.monthElementRelationToDayMaster,'CONTROLLED_BY_DAY_MASTER');
assert(strength1.rootEvidence.some(x=>x.hiddenStemCode==='GENG'&&x.match==='EXACT_DAY_STEM'));
assert.equal(strength1.verdict.strongWeak,null);
assert.equal(strength1.boundaries.numericalStrengthScoreCreated,false);
assert.equal(strength1.boundaries.productionEligible,false);

const rel1=await analyzeBaziRelationships({chart:chart1});
const rel2=await analyzeBaziRelationships({chart:chart1});
assert.equal(rel1.relationshipDigest,rel2.relationshipDigest);
assert(rel1.relations.some(x=>x.type==='BRANCH_CLASH'&&x.members.includes('YIN')&&x.members.includes('SHEN')));
assert(rel1.relations.every(x=>x.transformationEstablished===false));
assert.equal(rel1.boundaries.goodBadConclusionCreated,false);

const tg1=await analyzeBaziTenGods({chart:chart1});
const tg2=await analyzeBaziTenGods({chart:chart1});
assert.equal(tg1.tenGodDigest,tg2.tenGodDigest);
assert.equal(tg1.visibleStems.find(x=>x.pillar==='DAY').classification,'DAY_MASTER');
assert.equal(tg1.visibleStems.find(x=>x.pillar==='YEAR').tenGodCode,'PIAN_CAI');
assert.equal(tg1.visibleStems.find(x=>x.pillar==='MONTH').tenGodCode,'QI_SHA');
assert.equal(tg1.visibleStems.find(x=>x.pillar==='HOUR').tenGodCode,'SHI_SHEN');
assert(tg1.hiddenStems.some(x=>x.pillar==='DAY'&&x.hiddenStemCode==='GENG'&&x.tenGodCode==='BI_JIAN'));
assert.equal(tg1.distribution.weightsApplied,false);
assert.equal(tg1.boundaries.interpretationCreated,false);
assert.equal(tg1.boundaries.productionEligible,false);

const acceptance=j(files[12]);
assert.equal(acceptance.gates.CANONICAL_CHART_IR_IMPLEMENTED,true);
assert.equal(acceptance.gates.PRODUCTION_SOURCE_CLAIMS_ADMITTED,false);
assert.equal(acceptance.gates.CUSTOMER_INTERPRETATION_CHANGED,false);
assert.equal(acceptance.gates.PRODUCTION_GATE_OPEN,false);

console.log('✓ BAZI-FP-W0–W4 engineering foundation passed.');
console.log('  W0 audit + BZR-R1 four-tier source strategy + W1 chart IR + W2 evidence-only seasonal/strength + W3 relations + W4 ten-god structural classification are deterministic.');
console.log('  No predecessor freeze is rewritten, no second Canonical Method Projection is created, and production verdicts remain fail-closed until source claims receive human admission.');
