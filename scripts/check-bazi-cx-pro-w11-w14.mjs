import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildBaziMethodNativeReading} from '../functions/personal-professional-reading/bazi-method-native-reading-adapter.js';
import {buildBaziProfessionalSurfaceModules} from '../functions/personal-professional-reading/bazi-professional-surface-projection.js';
import {buildBaziFullReading} from '../functions/api/bazi-full-reading.js';
import {buildInputs,generateCampaignCases} from './lib/bazi-fp-w17-campaign.mjs';
import {
 renderBaziCustomerNarrativeSurface,
 renderBaziPatternCustomerMainSurface,
 renderBaziRealityBridgeSummarySurface,
 renderBaziCustomerSafeStructureGraph
} from '../assets/customer-ui/js/surfaces/bazi-professional-reading.js';
import {renderBaziProduct} from '../assets/customer-ui/js/specialists/bazi/product-renderer.js';

const readJson=rel=>JSON.parse(fs.readFileSync(new URL(rel,import.meta.url),'utf8'));
const readText=rel=>fs.readFileSync(new URL(rel,import.meta.url),'utf8');
const fixture=readJson('../content/professional/bzr-full-production/fixtures/bazi-da-yun-integration-fixture-v1.json');
const realityContract=readJson('../content/customer-experience-rebuild/bazi-cx-pro/contracts/bazi-reality-bridge-v1.json');
const relocationContract=readJson('../content/customer-experience-rebuild/bazi-cx-pro/contracts/bazi-sources-technical-relocation-v1.json');
const benchmarkContract=readJson('../content/customer-experience-rebuild/bazi-cx-pro/contracts/bazi-professional-benchmark-v1.json');
const cutoverContract=readJson('../content/customer-experience-rebuild/bazi-cx-pro/contracts/bazi-market-grade-customer-cutover-v1.json');
const acceptance=readJson('../content/customer-experience-rebuild/bazi-cx-pro/acceptance/bazi-cx-pro-w11-w14-engineering-acceptance-v1.json');
const reviewCases=readJson('../content/customer-experience-rebuild/bazi-cx-pro/benchmark/bazi-cx-pro-w13-review-cases-v1.json');
const reviewResults=readJson('../content/customer-experience-rebuild/bazi-cx-pro/benchmark/bazi-cx-pro-w13-review-results-v1.json');
const reviewHtml=readText('../review/bazi-cx-pro-w13-24-chart-professional-benchmark.html');
const RUBRIC=['SPECIFICITY','BAZI_DEPTH','COMPOSITION','NON_REPETITION','COMPREHENSIBILITY','REALITY_RELEVANCE'];

assert.equal(realityContract.workId,'BAZI-CX-PRO-W11');
assert.equal(relocationContract.workId,'BAZI-CX-PRO-W12');
assert.equal(benchmarkContract.workId,'BAZI-CX-PRO-W13');
assert.equal(cutoverContract.workId,'BAZI-CX-PRO-W14');
for(const x of [realityContract,relocationContract,benchmarkContract,cutoverContract])assert.equal(x.baselineCommit,'78ac0ae651133131d162e53c07cbccd793a55672');
assert.equal(acceptance.baseline.commit,'78ac0ae651133131d162e53c07cbccd793a55672');
assert.equal(acceptance.baseline.snapshot,'read(2).zip');

const noTarget=await buildBaziMethodNativeReading({canonicalProjection:fixture,locale:'zh-Hans'});
assert.equal(noTarget.governance.realityBridgeAuthorized,true);
assert.equal(noTarget.governance.sourcesTechnicalRelocationAuthorized,true);
assert.equal(noTarget.governance.marketGradeCustomerCutoverCandidateAuthorized,true);
assert.equal(noTarget.governance.marketGradeCustomerCutoverActive,false);
assert.equal(noTarget.governance.customerDefaultSurface,'BAZI_PROFESSIONAL_READING');
assert.equal(noTarget.governance.governanceSurfaceDefault,false);
assert.equal(noTarget.governance.technicalSurfaceOnDemand,true);
assert.equal(noTarget.professionalModules.realityBridgeExtensionVersion,'BAZI-CX-PRO-W11-v1.0.0');
assert.equal(noTarget.professionalModules.technicalRelocationVersion,'BAZI-CX-PRO-W12-v1.0.0');

const bridge=noTarget.professionalModules.realityBridge;
assert.equal(bridge.schemaVersion,'PHI-OS-BAZI-CX-PRO-REALITY-BRIDGE-v1.0.0');
assert.equal(bridge.priorityPrompts.length,noTarget.professionalModules.customerNarrative.priorityChapters.length);
assert.equal(bridge.topicPrompts.length,7);
assert.equal(bridge.timingPrompts.length,0);
assert.equal(bridge.dedup.exactDuplicateCount,0);
for(const group of [...bridge.priorityPrompts,...bridge.topicPrompts]){
 assert(group.prompts.length>=1&&group.prompts.length<=2);
 for(const p of group.prompts){assert(p.prompt.en.trim());assert(p.prompt.zhHans.trim());assert.equal(p.boundaries.answerBecomesChartEvidence,false);assert.equal(p.boundaries.answerRewritesCalculation,false);assert.equal(p.boundaries.counterExampleWelcome,true);}
}
assert.equal(bridge.boundaries.separateGenericQuestionBankDefault,false);
assert.equal(bridge.boundaries.customerAnswerChangesMethodVerdict,false);

// Explicit timing must add a distinct timing bridge, not repeat priority prompts.
const first=buildInputs(generateCampaignCases()[0]);
const explicit=await buildBaziMethodNativeReading({canonicalProjection:first.canonicalProjection,temporalProjectionOverride:first.temporalProjection,locale:'zh-Hans'});
const explicitBridge=explicit.professionalModules.realityBridge;
assert.equal(explicitBridge.timingPrompts.length,2);
assert.equal(explicitBridge.dedup.exactDuplicateCount,0);
assert(explicitBridge.timingPrompts.some(x=>x.promptType==='TIMING_CORRESPONDENCE'));
assert(explicitBridge.timingPrompts.some(x=>x.promptType==='COUNTEREXAMPLE'));

// Browser-like customer rendering.
globalThis.document={documentElement:{lang:'zh-Hans'},querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({dataset:{}}),head:{appendChild:()=>{}}};
globalThis.queueMicrotask=globalThis.queueMicrotask||((fn)=>fn());
const narrativeHtml=renderBaziCustomerNarrativeSurface(noTarget,{embedded:true});
assert.match(narrativeHtml,/data-bazi-cx-pro-customer-narrative="true"/);
assert.match(narrativeHtml,/cx-bazi-reality-bridge/);
assert.match(narrativeHtml,/把这一章带回现实/);
const mainPattern=renderBaziPatternCustomerMainSurface(noTarget,{embedded:true});
assert.match(mainPattern,/data-bazi-cx-pro-pattern-main="true"/);
assert.doesNotMatch(mainPattern,/data-ppr-bazi-pattern-professional="true"/);
const mainGraph=renderBaziCustomerSafeStructureGraph(noTarget,{embedded:true,customerMain:true});
assert.match(mainGraph,/data-bazi-technical-relocation="true"/);
assert.doesNotMatch(mainGraph,/SCHOOL_ZIPING|SCHOOL_TIYONG|SCHOOL_TIAOHOU|data-kind="school"/);
const bridgeSummary=renderBaziRealityBridgeSummarySurface(noTarget,{embedded:true});
assert.match(bridgeSummary,/data-bazi-cx-pro-reality-bridge-summary="true"/);
assert.match(bridgeSummary,/每个专业章节的结尾/);

const rendered=renderBaziProduct({product:{sourceProduct:noTarget,state:'PUBLISHED'}});
assert.equal(rendered.status,'RENDERED');
assert.equal(rendered.customerDefaultSurface,'BAZI_PROFESSIONAL_READING');
assert.equal(rendered.governanceSurfaceDefault,false);
assert.equal(rendered.technicalSurfaceMode,'ON_DEMAND');
assert.equal(rendered.marketGradeCutoverState,'CANDIDATE_PENDING_W13_HUMAN_ACCEPTANCE');
assert.match(rendered.readingHtml,/data-bazi-market-grade-reading="candidate"/);
assert.match(rendered.readingHtml,/data-bazi-cx-pro-pattern-main="true"/);
assert.match(rendered.readingHtml,/data-bazi-cx-pro-reality-bridge-summary="true"/);
assert.doesNotMatch(rendered.readingHtml,/data-ppr-bazi-school-professional="true"/);
assert.doesNotMatch(rendered.readingHtml,/data-ppr-bazi-reality-comparison="true"/);
assert.doesNotMatch(rendered.readingHtml,/data-ppr-bazi-pattern-professional="true"/);
assert.doesNotMatch(rendered.readingHtml,/Evidence records|Authority records|Report digest|sourceNatalProjectionId|semantic owner|Reading IR|Full Production/i);
assert.match(rendered.technicalHtml,/data-bazi-cx-pro-technical-relocation="true"/);
assert.match(rendered.technicalHtml,/data-ppr-bazi-school-professional="true"/);
assert.match(rendered.technicalHtml,/data-ppr-bazi-pattern-professional="true"/);
assert.match(rendered.technicalHtml,/完整技术结构图/);
assert.match(rendered.technicalHtml,/证据记录/);
assert.match(rendered.technicalHtml,/权威记录（来源依据）/);
assert.match(rendered.technicalHtml,/读取溯源/);

// W13 review pack: machine preparation only; human acceptance must remain pending.
assert.equal(reviewCases.work,'BAZI-CX-PRO-W13');
assert.equal(reviewCases.baselineCommit,'78ac0ae651133131d162e53c07cbccd793a55672');
assert.equal(reviewCases.caseCount,24);
assert.equal(reviewCases.cases.length,24);
assert.deepEqual(reviewCases.criteria.map(x=>x.code),RUBRIC);
assert.equal(reviewCases.acceptanceRule.minimumPerCriterion,4);
assert.equal(reviewCases.acceptanceRule.cutoverRequiresAcceptedCases,24);
assert.equal(reviewResults.status,'HUMAN_REVIEW_PENDING');
assert.equal(reviewResults.entries.length,24);
assert.deepEqual(reviewResults.criteria,RUBRIC);
assert.equal(reviewResults.summary.accepted,0);
assert.equal(reviewResults.summary.pending,24);
assert.equal(reviewResults.summary.marketGradeCutoverAllowed,false);
for(const e of reviewResults.entries){assert.equal(e.decision,'PENDING');assert.equal(e.criticalIssue,false);for(const k of RUBRIC)assert.equal(e.scores[k],null);}
for(const c of reviewCases.cases){assert.match(reviewHtml,new RegExp(c.caseId));assert.equal(c.machinePreflight.exactRealityPromptDuplicates,0);assert(c.reading.priorityChapters.length>=3&&c.reading.priorityChapters.length<=5);assert.equal(c.reading.topics.length,7);}
for(const label of ['具体性','八字解释深度','组合能力','非重复','可理解','Reality relevance','Export results JSON'])assert(reviewHtml.includes(label),`W13 HTML missing ${label}`);

// 24-case W11 deterministic regression.
let checked=0;let timingPromptCases=0;
for(const spec of generateCampaignCases().slice(0,24)){
 const {canonicalProjection,temporalProjection}=buildInputs(spec);
 const full=await buildBaziFullReading({schemaVersion:'PHI-OS-BAZI-FULL-READING-REQUEST-v1.0.0',canonicalProjection,temporalProjection,locale:'zh-Hans'});
 const modules=buildBaziProfessionalSurfaceModules({readingIR:full.readingIR,report:full.report,temporalState:'EXPLICIT'});
 const b=modules.realityBridge;
 assert.equal(b.dedup.exactDuplicateCount,0);
 assert.equal(b.priorityPrompts.length,modules.customerNarrative.priorityChapters.length);
 assert.equal(b.topicPrompts.length,7);
 for(const g of [...b.priorityPrompts,...b.topicPrompts])assert(g.prompts.length>=1&&g.prompts.length<=2);
 if(b.timingPrompts.length){assert.equal(b.timingPrompts.length,2);timingPromptCases++;}
 checked++;
}
assert.equal(checked,24);
assert.equal(timingPromptCases,24);

// W14 is prepared but intentionally fail-closed until W13 human acceptance.
assert.equal(cutoverContract.current.candidateAuthorized,true);
assert.equal(cutoverContract.current.customerDefaultProfessionalSurfacePrepared,true);
assert.equal(cutoverContract.current.governanceDefaultDisabled,true);
assert.equal(cutoverContract.current.marketGradeCustomerCutoverActive,false);
assert.equal(cutoverContract.current.blockedBy,'W13_HUMAN_REVIEW_PENDING');
assert.equal(cutoverContract.activationGate.w13HumanAccepted24Of24Required,true);
assert.equal(acceptance.w13.humanAcceptanceClaimed,false);
assert.equal(acceptance.w14.marketGradeCustomerCutoverActive,false);

const css=readText('../assets/customer-ui/surfaces/bazi-professional-reading.css');
for(const token of ['.cx-bazi-reality-bridge','.cx-bazi-reality-bridge-summary','.cx-bazi-pattern-main','.cx-bazi-pattern-main-grid','.cx-bazi-technical-summary','.cx-bazi-w12-technical details'])assert(css.includes(token),`W11-W12 CSS missing ${token}`);

console.log('✓ BAZI-CX-PRO W11–W14 engineering gate passed.');
console.log(`  W11: ${bridge.summary.totalPromptCount} no-target prompts, exact duplicates 0; 24/24 timing cases preserve distinct chapter prompts.`);
console.log('  W12: customer main reading is interpretation-first; school/source/open technical detail is on-demand in Sources & Technical.');
console.log('  W13: 24-chart / 6-dimension human benchmark pack ready; human result remains PENDING.');
console.log('  W14: professional reading is prepared as customer default; market-grade activation remains blocked until W13 is human accepted 24/24.');
