import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildCanonicalBaziChartIR} from '../functions/bzr-full-production/bazi-chart-runtime.js';
import {analyzeBaziStrengthSeasonal} from '../functions/bzr-full-production/bazi-strength-seasonal-runtime.js';
import {analyzeBaziRelationships} from '../functions/bzr-full-production/bazi-relationship-runtime.js';
import {analyzeBaziTenGods} from '../functions/bzr-full-production/bazi-ten-god-runtime.js';
import {analyzeBaziPatternCandidates} from '../functions/bzr-full-production/bazi-pattern-runtime.js';
import {analyzeBaziUsefulGodTiaohouViews} from '../functions/bzr-full-production/bazi-useful-god-tiaohou-runtime.js';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const files=[
 'content/interpretation/bazi/claims/bazi-source-claim-batch-bzr-r1-v1.json',
 'content/interpretation/bazi/review/bzr-r1-claim-batch-001-human-review-v1.json',
 'content/interpretation/bazi/registries/bazi-pattern-school-registry-v1.json',
 'content/interpretation/bazi/registries/bazi-useful-god-school-registry-v1.json',
 'content/professional/bzr-full-production/contracts/bazi-pattern-runtime-contract-v1.json',
 'content/professional/bzr-full-production/contracts/bazi-useful-god-tiaohou-contract-v1.json',
 'content/professional/bzr-full-production/acceptance/bazi-fp-w5-w6-engineering-acceptance-v1.json',
 'functions/bzr-full-production/bazi-pattern-runtime.js',
 'functions/bzr-full-production/bazi-useful-god-tiaohou-runtime.js',
 'docs/bzr/review/BZR-R1-CLAIM-BATCH-001-review.html'
];
for(const f of files)assert(fs.existsSync(f),`missing ${f}`);
const batch=j(files[0]);assert.equal(batch.baselineCommit,'abab6b358bff574c65b9dfacc7985d5de564d674');assert.equal(batch.claims.length,12);assert(batch.claims.every(x=>x.reviewState==='EXTRACTED_PENDING_HUMAN_REVIEW'&&x.runtimeUseAllowed===false));assert.equal(new Set(batch.claims.map(x=>x.claimId)).size,12);
for(const c of batch.claims){assert.match(c.sourceId,/^BZR-SRC-/);assert.match(c.witnessId,/^BZR-WIT-/);assert(c.sourceBoundParaphrase.length>40);assert(c.locator.sectionOrChapter);assert(c.locator.witnessUrl);}
const admission=j('content/interpretation/bazi/registries/bazi-source-admission-registry-v1.json');assert.equal(admission.claimBatches[0].extractedClaims,12);assert.equal(admission.claimBatches[0].humanAdmittedClaims,0);assert.equal(admission.productionVerdictGate.patternVerdict,false);assert.equal(admission.productionVerdictGate.usefulGodVerdict,false);assert.equal(admission.productionVerdictGate.tiaohouVerdict,false);
const patternSchool=j(files[2]),useSchool=j(files[3]);assert.equal(patternSchool.schools[0].productionVerdictEnabled,false);assert.equal(useSchool.schools.length,3);assert.equal(useSchool.crossSchoolRules.automaticMergeForbidden,true);
const projection=j('content/professional/bzr-production/fixtures/bzr-canonical-projection.production.valid.json');
const chart=await buildCanonicalBaziChartIR({canonicalProjection:projection});
const strength=await analyzeBaziStrengthSeasonal({chart});
const rel=await analyzeBaziRelationships({chart});
const tg=await analyzeBaziTenGods({chart});
const p1=await analyzeBaziPatternCandidates({chart,tenGods:tg,relationships:rel}),p2=await analyzeBaziPatternCandidates({chart,tenGods:tg,relationships:rel});assert.equal(p1.patternDigest,p2.patternDigest);assert.equal(p1.monthCommand.branchCode,'YIN');assert.deepEqual(p1.patternCandidates.map(x=>x.hiddenStemCode),['JIA','BING','WU']);assert.equal(p1.patternCandidates.find(x=>x.hiddenStemCode==='BING').visibleStemMatch,true);assert.equal(p1.patternCandidates.find(x=>x.hiddenStemCode==='BING').patternFamily,'QI_SHA');assert.equal(p1.verdict.primaryPattern,null);assert.equal(p1.boundaries.patternFormationVerdictCreated,false);assert.equal(p1.boundaries.qualityScoreCreated,false);
const u1=await analyzeBaziUsefulGodTiaohouViews({chart,strengthSeasonal:strength,patterns:p1}),u2=await analyzeBaziUsefulGodTiaohouViews({chart,strengthSeasonal:strength,patterns:p1});assert.equal(u1.usefulGodTiaohouDigest,u2.usefulGodTiaohouDigest);assert.equal(u1.schoolViews.length,3);assert.deepEqual(u1.schoolViews.map(x=>x.schoolCode),['ZI_PING_MONTH_COMMAND_USE_v1','DI_TIAN_SUI_TI_YONG_BALANCE_v1','DI_TIAN_SUI_CLIMATE_TIAOHOU_v1']);assert.equal(u1.crossSchoolSynthesis.created,false);assert.equal(u1.boundaries.usefulGodVerdictCreated,false);assert.equal(u1.boundaries.tiaohouVerdictCreated,false);assert.equal(u1.boundaries.productionEligible,false);
const acc=j(files[6]);assert.equal(acc.gates.FIRST_SOURCE_CLAIM_BATCH_EXTRACTED,true);assert.equal(acc.gates.PRODUCTION_SOURCE_CLAIMS_ADMITTED,false);assert.equal(acc.gates.W5_PATTERN_CANDIDATE_RUNTIME_IMPLEMENTED,true);assert.equal(acc.gates.W6_MULTI_SCHOOL_AUTHORITY_REGISTERED,true);assert.equal(acc.gates.PRODUCTION_GATE_OPEN,false);
console.log('✓ BAZI-FP-W5/W6 engineering + BZR-R1 first claim extraction passed.');
console.log('  12 source-bound claims are extracted but remain human-admission pending; W5 pattern candidates and W6 multi-school evidence are deterministic and production verdicts stay fail-closed.');
