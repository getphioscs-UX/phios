import assert from 'node:assert/strict';
import fs from 'node:fs';

const readText = path => fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const readJson = path => JSON.parse(readText(path));
const exists = path => fs.existsSync(path);
const count = (source, pattern) => [...source.matchAll(pattern)].length;
const section = (source, code) => {
  const marker = source.indexOf(`data-hpc2-scene="${code}"`);
  assert.ok(marker >= 0, `${code}: scene marker missing`);
  const start = source.lastIndexOf('<section', marker);
  const end = source.indexOf('</section>', marker);
  assert.ok(start >= 0 && end > marker, `${code}: section boundary missing`);
  return source.slice(start, end + '</section>'.length);
};

const paths = {
  contract: 'content/web-production/final-client-experience/contracts/part-j-final-client-experience-contract-v1.json',
  evidence: 'content/web-production/final-client-experience/evidence/part-j-final-client-experience-audit-v1.json',
  acceptance: 'content/web-production/final-client-experience/acceptance/part-j-final-client-experience-acceptance-v1.json',
  bfrH16: 'content/web-production/acceptance/bfr-production-surface-acceptance-v1.json',
  hpc2: 'content/web/homepage/hpc2/acceptance/homepage-composition-acceptance-v2.json',
  cka: 'content/client/knowledge-ask/acceptance/cka-production-acceptance-v1.json',
  ckaA: 'content/client/knowledge-ask/contracts/cka-w5-w17-batch-b-contract-v1.json',
  ckaB: 'content/client/knowledge-ask/contracts/cka-w18-w33-client-consumption-contract-v1.json',
  partI: 'content/web-production/regression/bfr-h-critical-regression-contract-v1.json',
  pocA10: 'content/web-production/production-operational-closure/poc-a/acceptance/poc-a10-live-responsive-matrix-acceptance-v1.json',
  pocA10Evidence: 'content/web-production/production-operational-closure/poc-a/evidence/poc-a10-live-responsive-matrix-evidence-v1.json',
  jrStages: 'content/runtime/journey-runtime/registries/canonical-journey-stage-registry-v2.json',
  jrFreeze: 'content/runtime/journey-runtime/freeze/jr-v2-freeze-v1.json',
  rjxFinal: 'content/runtime/journey-runtime/acceptance/rjx-final-non-negotiable-acceptance-v1.json',
  action: 'content/runtime/reality-model-runtime/contracts/action-runtime-contract-v1.json',
  outcome: 'content/runtime/reality-model-runtime/contracts/outcome-runtime-contract-v1.json',
  home: 'index.html',
  homeCss: 'assets/css/hpc2-pre-home-visuals.css',
  homeJs: 'assets/js/pages/home-production.js',
  ask: 'knowledge-search.html',
  askJs: 'assets/js/pages/knowledge-search-b.js',
  guidedRuntime: 'functions/_lib/client-knowledge-ask-b.js',
  journey: 'reality-journey.html',
  library: 'library.html',
  libraryJs: 'assets/js/pages/library.js',
  books: 'books/index.html',
  articles: 'articles.html',
  figures: 'figures.html',
  academy: 'academy.html',
  services: 'services.html',
  professional: 'professional/index.html',
  personal: 'personal-runtime.html'
};
for (const path of Object.values(paths)) assert.ok(exists(path), `PART J dependency missing: ${path}`);

const contract = readJson(paths.contract);
const evidence = readJson(paths.evidence);
const acceptance = readJson(paths.acceptance);
const bfrH16 = readJson(paths.bfrH16);
const hpc2 = readJson(paths.hpc2);
const cka = readJson(paths.cka);
const ckaA = readJson(paths.ckaA);
const ckaB = readJson(paths.ckaB);
const partI = readJson(paths.partI);
const pocA10 = readJson(paths.pocA10);
const pocEvidence = readJson(paths.pocA10Evidence);
const jrStages = readJson(paths.jrStages);
const jrFreeze = readJson(paths.jrFreeze);
const rjxFinal = readJson(paths.rjxFinal);
const home = readText(paths.home);
const homeCss = readText(paths.homeCss);
const homeJs = readText(paths.homeJs);
const ask = readText(paths.ask);
const askJs = readText(paths.askJs);
const guidedRuntime = readText(paths.guidedRuntime);
const journey = readText(paths.journey);
const library = readText(paths.library);
const libraryJs = readText(paths.libraryJs);
const books = readText(paths.books);
const articles = readText(paths.articles);
const figures = readText(paths.figures);
const academy = readText(paths.academy);
const services = readText(paths.services);
const professional = readText(paths.professional);
const personal = readText(paths.personal);

assert.equal(contract.work, 'PART-J');
assert.equal(contract.status, 'FINAL_CLIENT_EXPERIENCE_INTEGRATION_CONTRACT_ACTIVE');
assert.equal(contract.authority.newDomainAuthorityCreated, false);
assert.equal(contract.authority.secondHomepageAuthorityCreated, false);
assert.equal(contract.authority.secondAskAuthorityCreated, false);
assert.equal(contract.authority.secondJourneyAuthorityCreated, false);
assert.deepEqual(contract.homepageExperience.visibleSceneAuthority, ['H01','H02','H03','H04','H05','H06','H07','H08','H09']);
assert.equal(contract.homepageExperience.realityJourneyDefaultEntry, false);
assert.equal(contract.homepageExperience.legacyCompatibilityTailVisible, false);

// Final Homepage experience: one continuous Reality narrative, not a product catalogue.
const sceneCodes = [...home.matchAll(/data-hpc2-scene="(H\d\d)"/g)].map(match => match[1]);
assert.deepEqual(sceneCodes, contract.homepageExperience.visibleSceneAuthority);
const h01 = section(home, 'H01');
const h02 = section(home, 'H02');
const h03 = section(home, 'H03');
const h04 = section(home, 'H04');
const h05 = section(home, 'H05');
const h08 = section(home, 'H08');
const h09 = section(home, 'H09');
assert.match(h01, /Reality Navigation Platform/);
assert.match(h02, /One Reality/);
assert.match(h02, /CURRENT REALITY/);
assert.match(h03, /too many disconnected answers/);
assert.match(h03, /data-hpc2-lens-count="5"/);
assert.match(h04, /reconstruct/i);
for (const stage of ['REALITY_MODEL','READING','NAVIGATION','ACTION','OUTCOME','REVIEW','CONTINUITY']) {
  assert.match(h04, new RegExp(`data-hpc2-runtime-stage="${stage}"`), `H04 missing ${stage}`);
}
assert.match(h09, /UNDERSTAND_CHOOSE_ACT_OBSERVE_REVIEW_CONTINUE/);
assert.match(h09, /TERTIARY_CONTEXTUAL_COMPLEX_ONLY/);
const compatibilitySelectors = [
  '[data-hpc2-v8-teaser="FOUNDER"]',
  'section[aria-labelledby="value-title"]',
  'section[aria-labelledby="entries-title"]',
  '.wpr-production-band[aria-labelledby="wpr-platform-title"]',
  '.wpr-production-band[aria-labelledby="wpr-visual-title"]',
  'section[aria-labelledby="boundary-title"]'
];
for (const selector of compatibilitySelectors) assert.ok(homeCss.includes(selector), `Legacy Homepage tail suppression missing: ${selector}`);
assert.match(homeCss, /HPC2-W14[\s\S]*?display:\s*none\s*!important;/);
assert.equal(count(home, /data-hpc2-v8-teaser="FOUNDER"/g), 1, 'Compatibility source tail must remain preserved once');

// Three governed first steps: Ask, personal input, real situation.
assert.match(h05, /data-hpc2-first-interaction="SITUATION_TO_EXISTING_CKA"/);
assert.match(h05, /data-hpc2-first-interaction="QUESTION_TO_EXISTING_CKA"/);
assert.match(h05, /data-hpc2-first-interaction="PERSONAL_RUNTIME_EXISTING_ROUTE"/);
assert.match(h05, /data-hpc2-persistence="NONE"/);
assert.match(h05, /action="\/knowledge-search"/);
assert.match(h05, /href="\/personal-runtime"/);
assert.ok(personal.includes('data-page="personal-runtime"') || personal.includes('personal-runtime'), 'Personal Runtime client surface missing');

// Simple Ask: structured answer, Related Knowledge, grounding, Unknown and one limited follow-up.
for (const marker of [
  'data-cka-section="DIRECT_ANSWER"',
  'data-cka-section="WHAT_PHIOS_DOES_NOT_YET_KNOW"',
  'data-cka-section="RELATED_KNOWLEDGE"',
  'data-cka-grounding',
  'data-cka-follow-up'
]) assert.ok(ask.includes(marker), `CKA simple answer marker missing: ${marker}`);
assert.match(ask, /Ask one follow-up/);
assert.match(ask, /Guest context is temporary and supports one follow-up only/);

// Needs-context Ask: temporary guided context can personalize retrieval without creating Canonical Reality.
assert.match(ask, /Help PHI OS understand your situation/);
assert.match(ask, /data-cka-guided-form hidden/);
assert.match(guidedRuntime, /personalized:\s*Boolean\(/);
assert.match(guidedRuntime, /signals\.personalized \? 'PERSONALIZED'/);
assert.match(guidedRuntime, /temporaryOnly:\s*true/);
assert.match(guidedRuntime, /canonicalRealityCreated:\s*false/);
assert.match(askJs, /guided/i);

// Complex Ask: Journey remains hidden and explicitly consent-gated; KAP W24 owns complexity.
assert.match(ask, /<section class="cka-journey" data-cka-journey hidden>/);
assert.match(ask, /data-cka-journey-consent-checkbox/);
assert.match(askJs, /payload\.route === 'REALITY_JOURNEY_CANDIDATE'/);
const w28 = ckaB.works.find(item => item.work === 'CKA-W28');
assert.ok(w28, 'CKA-W28 missing');
assert.equal(w28.routing.simple, 'answer');
assert.equal(w28.routing['needs context'], 'guided context');
assert.match(w28.routing.complex, /KAP W24 YES \+ explicit consent/);
assert.equal(contract.answerRouting.complex.automaticJourneyActivation, false);
assert.equal(rjxFinal.technicalEvidence.realityJourneyDefaultForAllQuestions, false);

// Complex experience semantics map to existing authorities; do not rewrite canonical JR stage authority.
assert.deepEqual(contract.answerRouting.complex.experienceSemanticSequence, ['RECONSTRUCTION','READING','NAVIGATION','ACTION','OUTCOME','REVIEW','CONTINUITY']);
assert.deepEqual(jrStages.canonicalOrder, ['entry','orientation','reading','reconstruction','navigation','review','continuity','closed']);
assert.equal(jrStages.rules.uiMayInventStage, false);
assert.equal(contract.answerRouting.complex.canonicalJrStageOrderRewritten, false);
assert.equal(jrFreeze.authorityBoundary.journeyWorkflowAuthorityFrozen, true);
assert.ok(exists(paths.action) && exists(paths.outcome));
assert.match(journey, /Eight canonical workflow stages govern one Reality Journey/);
assert.match(journey, /six customer tasks(?: below)? remain a compatibility view/i);

// Knowledge path: Five Volumes -> Published Knowledge -> content formats -> contextual Ask -> Academy.
assert.equal(count(home, /data-hpc2-volume-stage="[A-Z_]+"/g), 5);
assert.ok(homeJs.includes('booksRegistry.books'));
assert.match(section(home, 'H07'), /data-hpc2-knowledge-action="READ_PUBLISHED_KNOWLEDGE"/);
for (const [name, surface] of [['books',books],['library',library],['articles',articles],['figures',figures],['academy',academy]]) {
  assert.ok(surface.length > 100, `${name} surface unexpectedly empty`);
}
assert.match(library, /reading paths/i);
assert.match(libraryJs, /Ask PHI OS Knowledge/);
const contextualWorks = ckaA.works.filter(item => ['CKA-W14','CKA-W15','CKA-W16','CKA-W17'].includes(item.work));
assert.equal(contextualWorks.length, 4, 'Book/Article/Figure/Search contextual Ask contracts missing');
assert.ok(contract.knowledgePath.sequence.includes('ACADEMY'));

// Professional path: structured PHI OS -> PHI OS Professional -> qualified external authority.
assert.equal(count(h08, /data-hpc2-authority-level="[A-Z_]+"/g), 3);
for (const level of ['PHIOS','PHIOS_PROFESSIONAL','QUALIFIED_EXTERNAL_PROFESSIONAL']) {
  assert.match(h08, new RegExp(`data-hpc2-authority-level="${level}"`));
}
assert.ok(services.length > 100 && professional.length > 100, 'Professional surfaces missing');
assert.equal(contract.professionalPath.professionalJudgmentMayBeCreatedByCka, false);
assert.equal(contract.professionalPath.regulatedAuthorityMayBeCollapsedIntoPhios, false);

// Production consumption predecessors and live responsive evidence are bound without overclaiming global Production.
assert.equal(bfrH16.status, 'BFR_H16_VISUAL_PRODUCTION_ACCEPTED_REPOSITORY_SCOPE_WPR_PF_NEXT');
assert.equal(bfrH16.exitGate.silentProductionRuntimeOrphanCount, 0);
assert.equal(bfrH16.exitGate.silentGovernedVisualAssetOrphanCount, 0);
assert.equal(hpc2.status, 'HPC2_COMPOSITION_READY');
assert.equal(hpc2.capability.requiredMapped, '13/13');
assert.equal(cka.status, 'CKA_PRODUCTION_READY');
assert.equal(cka.globalProductionAccepted, false);
assert.equal(partI.status, 'REG_01_REG_15_FAIL_CLOSED_BEFORE_BFR_H16_PRODUCTION_ACCEPTANCE');
assert.equal(pocA10.status, 'LIVE_RESPONSIVE_182_STATE_MATRIX_ACCEPTED_MACHINE_BROWSER_SCOPE');
assert.equal(pocA10.accepted, true);
assert.equal(pocEvidence.matrix.executedStateCount, 182);
assert.equal(pocEvidence.matrix.passedStateCount, 182);
assert.equal(pocEvidence.matrix.failedStateCount, 0);
assert.equal(pocA10.authorityBoundary.accessibilityAcceptance, false);
assert.equal(pocA10.authorityBoundary.globalProductionAccepted, false);

assert.equal(evidence.status, 'FINAL_CLIENT_EXPERIENCE_REPOSITORY_AND_POC_A10_RESPONSIVE_EVIDENCED');
assert.equal(evidence.homepage.visibleSceneCount, 9);
assert.equal(evidence.homepage.productCatalogueRendered, false);
assert.equal(evidence.cka.genericUnlimitedChat, false);
assert.equal(evidence.governedProductionConsumption.pocA10LiveResponsiveStates, '182/182');
assert.equal(acceptance.status, 'PART_J_FINAL_CLIENT_EXPERIENCE_ACCEPTED_REPOSITORY_AND_POC_A10_RESPONSIVE_SCOPE');
assert.equal(acceptance.accepted, true);
for (const [gate, value] of Object.entries(acceptance.gates)) assert.equal(value, true, `PART J gate failed: ${gate}`);
for (const value of Object.values(acceptance.authorityBoundary)) assert.equal(value, false);
assert.equal(acceptance.next, 'PART_K_FINAL_FREEZE');

console.log('✓ PART J Final Client Experience passed.');
console.log('  Homepage: one visible H01–H09 Reality narrative; legacy catalogue tail remains source-preserved but not rendered.');
console.log('  Ask: Simple Answer → Related Knowledge / one follow-up; needs-context → temporary Guided Context; complex → KAP W24 + explicit-consent Reality Journey candidate.');
console.log('  Knowledge and Professional paths are connected through existing governed consumers; no second Knowledge, Journey, Method or Professional authority was created.');
console.log('  POC-A10 live responsive evidence = 182/182; accessibility assistive-tech, Human visual, deployment SHA/custom-domain and global Production acceptance remain separate.');
