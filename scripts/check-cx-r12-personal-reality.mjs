import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=process.cwd();
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const json=relative=>JSON.parse(read(relative));
const sha=relative=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,relative))).digest('hex');
const base='content/customer-experience-rebuild';
const baseline='74fba1c9dfc48656011535e8b87e46631bb398ba';

const html=read('perspectives/personal/index.html');
const client=read('assets/customer-ui/js/surfaces/personal-reality.js');
const finalClient=read('assets/customer-ui/js/personal-products/final-personal-reading-experience.js');
const api=read('functions/api/customer-personal-reality.js');
const redirects=read('_redirects');
const legacyDelete=json(`${base}/migration/p1-legacy-delete-plan-v1.json`);
const contract=json(`${base}/contracts/personal-reality-customer-workspace-contract-v1.json`);
const authority=json(`${base}/authority/personal-reality-customer-surface-v2.json`);
const acceptanceV1=json(`${base}/acceptance/cx-r12-acceptance-v1.json`);
const acceptance=json(`${base}/acceptance/cx-r12-acceptance-v2.json`);
const audit=json(`${base}/audits/cx-r12-current-main-reconciliation-v1.json`);
const finalModule=await import(pathToFileURL(path.join(root,'assets/customer-ui/js/personal-products/final-personal-reading-experience.js')).href);

// Historical CX-R12 evidence remains historical; the successor is additive.
assert.equal(sha(`${base}/acceptance/cx-r12-acceptance-v1.json`),'af3aadc853b122a22b5a2c289e15f3c8a757c68989a84596ef4e7c14f6ea65b3');
assert.equal(acceptanceV1.baselineCommit,'40cb9e71450ebb817998cde8222225cd941c0aa0');
assert.match(acceptanceV1.status,/BROWSER.*PENDING|PENDING.*BROWSER/);

for(const artifact of [contract,authority,acceptance,audit])assert.equal(artifact.baselineCommit,baseline);
assert.equal(contract.work,'CX-R12');
assert.deepEqual(contract.inputExperience,['ABOUT_YOU','BIRTH_INFORMATION','WHAT_YOU_WANT_TO_EXPLORE','OPTIONAL_DEEPEN_MY_PROFILE','CONSENT']);
assert.deepEqual(contract.resultOverview,['HOW_YOU_TEND_TO_OPERATE','DECISION_CONTEXT','PATTERNS','ENVIRONMENT','CURRENT_TIMING_CONTEXT']);
assert.deepEqual(contract.topLevelResultTabs,['OVERVIEW','STRUCTURE','CURRENT_CONTEXT','PATTERNS','DETAILS']);
assert.equal(contract.profileAssessment.optional,true);
assert.equal(contract.profileAssessment.blocksPersonalReality,false);
assert.equal(contract.profileAssessment.cxMayScore,false);
assert.equal(contract.myRealityHandoff.explicitSelectionRequired,true);
assert.equal(contract.myRealityHandoff.explicitConsentRequired,true);
assert.equal(contract.myRealityHandoff.automaticPersistence,false);
for(const forbidden of ['INFER_NEW_PERSONAL_MEANING','SCORE_PROFILE_OR_ASSESSMENT','HARD_CODE_METHOD_AVAILABILITY','AUTO_PERSIST_TO_MY_REALITY'])assert.ok(contract.forbiddenOperations.includes(forbidden));

assert.equal(authority.status,'PERSONAL_REALITY_SUCCESSOR_PRESENTATION_ACCEPTED');
assert.equal(authority.identity.customerName,'Personal Reality');
assert.equal(authority.identity.canonicalRoute,'/perspectives/personal/');
assert.equal(authority.customerComposition.methodNamesAreTopLevelTabs,false);
assert.equal(authority.customerComposition.profileAssessmentOptional,true);
assert.equal(authority.rules.createsSecondMethodAuthority,false);
assert.equal(authority.rules.createsSecondMeaningAuthority,false);
assert.equal(authority.rules.hardCodesAvailability,false);
assert.equal(authority.rules.performsP1RouteCutover,false);
assert.equal(authority.rules.physicallyDeletesLegacy,false);

// W0/W1: one Personal Reality identity and a human five-stage input map.
assert.match(html,/data-cx-surface="PERSONAL_REALITY"/);
assert.match(html,/data-cx-r12-successor="true"/);
assert.match(html,/rel="canonical" href="\/perspectives\/personal\/"/);
assert.match(html,/href="\/assets\/customer-ui\/surfaces\/personal-reality-r12\.css"/);
for(const stage of ['about-you','birth-information-intro','what-you-want-to-explore','optional-profile','consent'])assert.ok(html.includes(`data-cx-r12-input-stage="${stage}"`),`missing R12 input stage ${stage}`);
for(const label of ['About you','Birth information','What you want to explore','Optional: Deepen my profile','Consent'])assert.ok(html.includes(label),`missing customer input label ${label}`);
assert.match(html,/href="\/perspectives\/profile\/"/);
assert.match(html,/Profile or assessment is never required|Profile & Assessment is a separate optional source class/);
assert.doesNotMatch(html,/Available in this reading/,'Personal method cards may not hard-code availability');
assert.match(html,/Availability checked when you continue/);

// W2: processing is human language; runtime machinery is not the customer status.
assert.match(client,/Preparing your perspectives…/);
assert.match(client,/正在准备你的视角…/);
assert.doesNotMatch(html,/Preparing your perspectives[^<]*(?:MPA|projection runtime|canonical method dispatch)/i);

// W3-W6: customer-first overview + five top-level tabs; method detail is behind Details.
assert.deepEqual(finalModule.CX_R12_RESULT_TAB_IDS,['overview','structure','current-context','patterns','details']);
for(const label of ['How you tend to operate','Decision context','Patterns','Environment','Current timing / context'])assert.ok(finalClient.includes(label),`missing results overview label ${label}`);
for(const token of ['data-cx-r12-perspectives-used','PERSPECTIVES USED','data-cx-r12-result-tab','data-cx-r12-result-panel'])assert.ok(finalClient.includes(token),`missing R12 results token ${token}`);
assert.match(finalClient,/externalPanelState/);
assert.match(finalClient,/active==='details'/);
assert.match(finalClient,/active==='patterns'/);
assert.match(finalClient,/active!=='current-context'/);
assert.equal(finalModule.CX_R12_RESULT_TAB_IDS.some(id=>['astrology','bazi','numerology','numeric','ziwei','human-design','hd','ecr'].includes(id)),false,'method names may not be top-level R12 tabs');
assert.match(html,/data-cx-r12-external-panel="details"/);
assert.match(html,/data-cx-r12-external-panel="patterns"/);
assert.match(html,/data-cx-r12-external-panel="current-context"/);

// Existing Product/PPR authority remains the meaning owner.
for(const token of ['renderProductRoute','mountFinalPersonalReadingExperience','mountEcrHumanDesignRealityBridge','installCurrentRealityExperience'])assert.ok(client.includes(token),`Personal current product capability lost ${token}`);
for(const token of ['validateCanonicalBirthInput','projectMethodsForCustomer','resolveBirthPlace','runMethodExecute','runZiWeiExecute','buildPersonalRealityProductRoute'])assert.ok(api.includes(token),`Personal API authority chain lost ${token}`);
assert.equal(client.includes('canonicalProjection'),false,'Personal CX client must not bind raw method output');
assert.match(api,/PERSONAL_REALITY_PROCESSING_CONSENT_REQUIRED/);

// W7: return to My Reality remains explicit and selected-context only.
assert.match(html,/Add this perspective to My Reality/);
assert.match(html,/data-cx-personal-handoff-consent/);
assert.match(client,/collectMyRealityHandoffSelection/);
assert.match(client,/automaticPersistence:false/);
assert.match(client,/customerSelected:true/);

// W8 / P1 boundary: legacy route is compatibility-only; canonical route has zero legacy CSS.
for(const route of ['/personal-runtime','/personal-runtime.html','/professional/personal-runtime','/professional/personal-runtime/'])assert.ok(redirects.includes(`${route} /perspectives/personal/ 308`),`missing Personal compatibility redirect ${route}`);
for(const bad of ['public-shell-v2','wpr-personal-runtime.css','runtime-spine.css','ast-production-meaning.css','bzr-production-meaning.css','num-production-meaning.css','zi-wei-dynamic-runtime.css','/assets/css/'])assert.equal(html.includes(bad),false,`canonical Personal route has legacy presentation dependency: ${bad}`);
assert.ok(legacyDelete.candidates.some(item=>item.path==='personal-runtime.html'&&item.deleteAfter==='P1_BROWSER_ACCEPTED'));
assert.equal(fs.existsSync(path.join(root,'personal-runtime.html')),true,'physical legacy file remains until P1 browser acceptance');

assert.equal(acceptance.status,'ACCEPTED_PERSONAL_REALITY_CURRENT_MAIN_SUCCESSOR');
assert.equal(acceptance.exit,'PERSONAL_REALITY_REPLACEMENT_READY_FOR_PRIORITY_TRANCHE');
assert.equal(acceptance.newP1RouteCutoverPerformedByR12,false);
assert.equal(acceptance.physicalLegacyDeletePerformed,false);
assert.equal(acceptance.backendAuthorityRebuilt,false);
assert.equal(acceptance.methodMeaningAuthorityChanged,false);
assert.equal(acceptance.profileScoringAuthorityCreated,false);
assert.equal(acceptance.readyForCxR13,true);

console.log('✓ CX-R12 Personal Reality current-main successor passed at 74fba1c: five-stage customer input, customer-first overview, five method-hidden result tabs, returned-perspective disclosure and explicit My Reality handoff are active.');
console.log('  PPR/method meaning remains upstream; profile scoring is not recreated; method availability is not hard-coded; missing overview areas remain open rather than inferred.');
console.log('  Legacy personal-runtime routes remain redirected compatibility only; canonical Personal Reality loads zero legacy CSS; physical legacy deletion stays deferred to P1 production browser acceptance.');
console.log('✓ CX-R12 ACCEPTED: PERSONAL_REALITY_REPLACEMENT_READY_FOR_PRIORITY_TRANCHE · READY_FOR_CX_R13 · NO_NEW_P1_ROUTE_CUTOVER');
