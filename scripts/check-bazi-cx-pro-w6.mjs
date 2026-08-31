import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildBaziMethodNativeReading} from '../functions/personal-professional-reading/bazi-method-native-reading-adapter.js';
import {buildBaziProfessionalSurfaceModules} from '../functions/personal-professional-reading/bazi-professional-surface-projection.js';
import {buildBaziFullReading} from '../functions/api/bazi-full-reading.js';
import {renderBaziPatternSurface} from '../assets/customer-ui/js/surfaces/bazi-professional-reading.js';
import {renderBaziProduct} from '../assets/customer-ui/js/specialists/bazi/product-renderer.js';
import {generateCampaignCases,buildInputs} from './lib/bazi-fp-w17-campaign.mjs';

const readJson=rel=>JSON.parse(fs.readFileSync(new URL(rel,import.meta.url),'utf8'));
const fixture=readJson('../content/professional/bzr-full-production/fixtures/bazi-da-yun-integration-fixture-v1.json');
const contract=readJson('../content/customer-experience-rebuild/bazi-cx-pro/contracts/bazi-pattern-professional-reading-v1.json');
const acceptance=readJson('../content/customer-experience-rebuild/bazi-cx-pro/acceptance/bazi-cx-pro-w6-engineering-acceptance-v1.json');
const ruleset=readJson('../content/interpretation/bazi/rulesets/bazi-pattern-ruleset-v2.json');
const claims=readJson('../content/interpretation/bazi/claims/bazi-source-claim-batch-bzr-r1-v2.1.json');

assert.equal(contract.workId,'BAZI-CX-PRO-W6');
assert.equal(acceptance.baseline.commit,'ccac579a7e81dc27f7f6403df1c6446fba38bc25');
assert.equal(acceptance.baseline.librarySnapshot,'ask(1).zip');
assert.equal(ruleset.active,true);
assert.equal(ruleset.activationGate.humanAdmissionSatisfied,true);
assert.equal(ruleset.activationGate.allReferencedClaimsRuntimeUseAllowedSatisfied,true);
const claimMap=new Map(claims.claims.map(x=>[x.claimId,x]));
for(const ref of contract.sourceFramework.requiredClaimRefs){
 const claim=claimMap.get(ref);assert(claim,`missing admitted claim ${ref}`);assert.equal(claim.reviewState,'HUMAN_ADMITTED');assert.equal(claim.runtimeUseAllowed,true);
}

const product=await buildBaziMethodNativeReading({canonicalProjection:fixture,locale:'zh-Hans'});
assert.equal(product.governance.patternProfessionalReadingAuthorized,true);
assert.equal(product.professionalModules.moduleVersion,'BAZI-CX-PRO-W6-v1.0.0');
const pattern=product.professionalModules.pattern;
assert.equal(pattern.work,'BAZI-CX-PRO-W6');
assert.equal(pattern.professionalReadingVersion,'PHI-OS-BAZI-CX-PRO-PATTERN-PROFESSIONAL-READING-v1.0.0');
assert.equal(pattern.summary.candidateCount,3);
assert.equal(pattern.summary.visibleStemCandidateCount,2);
assert.equal(pattern.summary.primaryPatternEstablished,false);
assert.deepEqual(pattern.summary.readingOrder,['MONTH_COMMAND_JIA','MONTH_COMMAND_BING','MONTH_COMMAND_WU']);
assert.equal(pattern.verdict.primaryPattern,null);
assert.equal(pattern.boundaries.primaryPatternInvented,false);
assert.equal(pattern.boundaries.formationSupportIsNotFormationVerdict,true);
assert.equal(pattern.boundaries.readingOrderIsNotQualityRank,true);
assert.equal(pattern.boundaries.sourceAdmittedFrameworkComposed,true);

const byFamily=new Map(pattern.candidates.map(c=>[c.patternFamily,c]));
const cai=byFamily.get('CAI');
assert(cai?.professionalReading);
assert.equal(cai.professionalReading.tenGodContext.count,2);
assert.equal(cai.professionalReading.tenGodContext.ratio,18.2);
assert.equal(cai.professionalReading.readingPriority,'VISIBLE_MONTH_COMMAND_CANDIDATE');
assert.equal(cai.professionalReading.formation.paths.length,3);
assert(cai.professionalReading.formation.paths.some(x=>x.pathCode==='WEALTH_GENERATES_OFFICER'&&x.state==='VISIBLE_SUPPORT_PATH'));
assert(cai.professionalReading.formation.paths.some(x=>x.pathCode==='WEALTH_RESOURCE_POSITIONAL_ORDER'&&x.state==='POSITIONAL_CONDITION_REQUIRES_REVIEW'));
assert(cai.professionalReading.relationshipModifiers.some(x=>x.type==='BRANCH_CLASH'&&x.monthCommandDirect===true));
assert(cai.professionalReading.defeatChecks.some(x=>x.checkCode==='PEER_COMPETITION_REVIEW'));
assert(cai.professionalReading.defeatChecks.some(x=>x.checkCode==='EXPOSED_SEVEN_KILLINGS_REVIEW'));
assert.deepEqual(cai.professionalReading.rescueFramework.visibleFocusGroups,['OUTPUT']);
assert.equal(cai.professionalReading.conclusionState,'OPEN_WITH_VISIBLE_FORMATION_SUPPORT');
assert.equal(cai.professionalReading.boundaries.formationPathVisibleDoesNotEqualPatternFormed,true);
assert.equal(cai.professionalReading.boundaries.defeatCheckVisibleDoesNotEqualPatternDefeated,true);
assert.equal(cai.professionalReading.boundaries.rescueFrameworkDoesNotEqualRescueMatched,true);

const qisha=byFamily.get('QI_SHA');
assert(qisha.professionalReading.formation.paths.some(x=>x.pathCode==='SEVEN_KILLINGS_WITH_CONTROL_AND_CARRYING'));
assert.equal(qisha.professionalReading.carryingContext.rootCount,1);
assert(qisha.professionalReading.relationshipModifiers.some(x=>x.dayMasterDirect&&x.monthCommandDirect));
const yin=byFamily.get('YIN');
assert.equal(yin.professionalReading.readingPriority,'HIDDEN_MONTH_COMMAND_CANDIDATE');
assert.equal(yin.professionalReading.conclusionState,'OPEN_WITH_PARTIAL_FORMATION_SUPPORT');
assert.equal(yin.professionalReading.tenGodContext.visibleCount,0);
assert.equal(yin.professionalReading.tenGodContext.hiddenCount,2);

// Browser-like rendering without introducing raw engineering/source identifiers to the customer surface.
globalThis.document={documentElement:{lang:'zh-Hans'},querySelector:()=>null,createElement:()=>({dataset:{}}),head:{appendChild:()=>{}}};
globalThis.queueMicrotask=globalThis.queueMicrotask||((fn)=>fn());
const html=renderBaziPatternSurface(product,{embedded:true});
assert.match(html,/data-bazi-cx-pro-pattern-reading="true"/);
assert.match(html,/格局 · 专业读取/);
assert.match(html,/为什么会进入格局讨论/);
assert.match(html,/成格路径/);
assert.match(html,/干支关系修正/);
assert.match(html,/败格检查/);
assert.match(html,/救应框架/);
assert.match(html,/日主承载/);
assert.match(html,/财格不是/);
assert.match(html,/七杀格从压力/);
assert.match(html,/完整解释不等于强行选一个赢家/);
assert.doesNotMatch(html,/BZR-CLM-|BAZI-AUTH-|BAZI-UNK-|Reading IR|semantic owner|Full Production/);
assert.doesNotMatch(html,/格局评分[:：]|大吉|大凶|必发财|必结婚|必离婚/);

const rendered=renderBaziProduct({product:{sourceProduct:product,state:'PUBLISHED'}});
assert.equal(rendered.status,'RENDERED');
assert.match(rendered.readingHtml,/id="bazi-section-pattern"/);
assert.match(rendered.readingHtml,/data-bazi-cx-pro-pattern-reading="true"/);

// Family coverage: the governed synthetic campaign reaches all 7 pattern families quickly.
const expectedFamilies=new Set(['ZHENG_GUAN','CAI','YIN','SHI_SHEN','QI_SHA','SHANG_GUAN','PEER_MONTH_COMMAND_REQUIRES_SPECIAL_RULE']);
const seen=new Set();let casesUsed=0;
for(const spec of generateCampaignCases()){
 const {canonicalProjection,temporalProjection}=buildInputs(spec);
 const full=await buildBaziFullReading({schemaVersion:'PHI-OS-BAZI-FULL-READING-REQUEST-v1.0.0',canonicalProjection,temporalProjection,locale:'zh-Hans'});
 const modules=buildBaziProfessionalSurfaceModules({readingIR:full.readingIR,report:full.report,temporalState:'EXPLICIT'});
 casesUsed++;
 for(const c of modules.pattern.candidates){
  seen.add(c.patternFamily);
  assert(c.professionalReading);
  assert(c.professionalReading.formation.paths.length>=1);
  assert(c.professionalReading.sourceClaimRefs.length>=4);
  assert.equal(c.professionalReading.boundaries.readingPriorityIsNotQualityRank,true);
  assert.equal(c.professionalReading.boundaries.lifeOutcomeCreated,false);
 }
 if([...expectedFamilies].every(x=>seen.has(x)))break;
}
assert.deepEqual(new Set([...seen].filter(x=>expectedFamilies.has(x))),expectedFamilies);
assert(casesUsed<=12,'W6 should achieve seven-family pattern coverage within the first scenario batch');

const css=fs.readFileSync(new URL('../assets/customer-ui/surfaces/bazi-professional-reading.css',import.meta.url),'utf8');
for(const token of ['.cx-bazi-pattern-reading-summary','.cx-bazi-pattern-reading-card','.cx-bazi-pattern-paths','.cx-bazi-pattern-evidence-grid','.cx-bazi-pattern-family-reading'])assert(css.includes(token),`W6 CSS missing ${token}`);
assert.equal(acceptance.status,'MACHINE_VERIFIED');
assert.equal(acceptance.acceptance.patternProfessionalReadingAuthorized,true);

console.log('✓ BAZI-CX-PRO W6 Pattern Professional Reading passed.');
console.log(`  Fixture 3/3 candidates composed; source-admitted framework verified; synthetic family coverage ${seen.size}/7 in ${casesUsed} cases.`);
