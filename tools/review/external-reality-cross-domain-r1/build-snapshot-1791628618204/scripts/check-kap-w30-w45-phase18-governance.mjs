import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {
  evaluateProfessionalBoundary,
  evaluateExplanationAdviceBoundary,
  evaluatePersonalizationBoundary,
  evaluateGroundedAcceptance,
  evaluateLocaleRegression,
  buildRetrievalCachePolicy,
  buildAnswerCachePolicy,
  evaluateAiBudget,
  resolveAiFailureFallback,
  buildOutcomeSignal,
  buildKnowledgeGapSignal,
  assertNoAutomaticMutation,
  evaluateAnswerEntitlement,
  evaluateMethodJourneyEntitlement
} from '../functions/_lib/knowledge-answer-governance.js';

const mode=process.argv[2]||'ALL';
const ROOT='content/knowledge/answer-projection';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const run=(step,fn)=>{if(mode==='ALL'||mode===step)fn();};
const contract=n=>j(`${ROOT}/contracts/kap-w${n}-${({30:'professional-boundary',31:'explanation-vs-advice',32:'personalization-boundary',33:'grounded-acceptance',34:'regression-corpus',35:'locale-regression',36:'retrieval-cache',37:'answer-cache',38:'ai-budget',39:'ai-failure-fallback',40:'outcome-signals',41:'knowledge-gap-signal',42:'no-automatic-mutation',43:'free-ask-entitlement',44:'membership-answer',45:'method-journey-entitlement'})[n]}-contract-v1.json`);

run('W30',()=>{
  const c=contract(30); assert.equal(c.rules.kapMayReplaceLicensedJudgment,false);
  const explain=evaluateProfessionalBoundary({domain:'MEDICAL',mode:'EXPLAIN'}); assert.equal(explain.decision,'EXPLANATION_ALLOWED');
  const advice=evaluateProfessionalBoundary({domain:'MEDICAL',mode:'ADVISE',requiresLicensedJudgment:true}); assert.equal(advice.decision,'BOUNDARY_LIMITED'); assert.equal(advice.externalAuthorityRequired,true);
  console.log('✓ KAP-W30 Professional Boundary passed.');
});
run('W31',()=>{
  const c=contract(31); assert.deepEqual(c.rules.defaultModes,['EXPLAIN','OBSERVE','COMPARE','EXPLORE']);
  assert.equal(evaluateExplanationAdviceBoundary({statementMode:'EXPLAIN'}).status,'EXPLANATION_DEFAULT');
  assert.equal(evaluateExplanationAdviceBoundary({statementMode:'MANDATE'}).status,'CAUTION_OR_EXTERNAL_AUTHORITY_REQUIRED');
  console.log('✓ KAP-W31 Explanation vs Advice passed.');
});
run('W32',()=>{
  const c=contract(32); assert.equal(c.rules.personalAssertionRequiresEvidence,true);
  const no=evaluatePersonalizationBoundary({claimType:'PERSONAL',personalAssertion:true}); assert.equal(no.status,'PROPOSITIONAL_ONLY'); assert.equal(no.mayAssertThisIsHappeningToYou,false);
  const yes=evaluatePersonalizationBoundary({claimType:'PERSONAL',personalAssertion:true,evidenceRefs:['EVIDENCE-1']}); assert.equal(yes.status,'EVIDENCE_BOUND_PERSONALIZATION_ALLOWED');
  console.log('✓ KAP-W32 Personalization Boundary passed.');
});
run('W33',()=>{
  const c=contract(33); assert.equal(c.consumerStatus,'CONSUMER_PENDING_CKA');
  const ok=evaluateGroundedAcceptance({claims:[{claimId:'C1',grounded:true,sourceRefs:['KN-1'],certainty:'SUPPORTED',publicationContextSource:'EXPLICIT_PUBLICATION_CONTEXT'}]}); assert.equal(ok.status,'ACCEPTED');
  const bad=evaluateGroundedAcceptance({claims:[{claimId:'C1',grounded:true,sourceRefs:['KN-1'],publicationContextSource:'NODE_CODE_B_PREFIX_INFERENCE'}]}); assert.equal(bad.status,'REJECTED'); assert.equal(bad.checks.noBPrefixInference,false);
  console.log('✓ KAP-W33 Grounded Acceptance backend gate passed; CKA consumer acceptance remains pending.');
});
run('W34',()=>{
  const c=contract(34); const corpus=j(`${ROOT}/fixtures/kap-w34-regression-corpus-v1.json`); assert.ok(corpus.cases.length>=6); assert.equal(corpus.cases.every(x=>x.en&&x['zh-Hans']),true); assert.equal(new Set(corpus.cases.map(x=>x.caseCode)).size,corpus.cases.length); assert.equal(c.rules.minimumCases,6);
  console.log('✓ KAP-W34 Regression Corpus passed with six bilingual governed cases.');
});
run('W35',()=>{
  const c=contract(35); assert.equal(c.consumerStatus,'CONSUMER_PENDING_CKA_LOCALE'); const f=j(`${ROOT}/fixtures/kap-w35-locale-parity.valid.json`);
  assert.equal(evaluateLocaleRegression({en:f.en,zhHans:f['zh-Hans']}).status,'PARITY_ACCEPTED');
  assert.equal(evaluateLocaleRegression({en:f.en,zhHans:{...f['zh-Hans'],meaningKey:'DIFFERENT'}}).status,'PARITY_REJECTED');
  console.log('✓ KAP-W35 Locale Regression backend parity gate passed; CKA locale surface acceptance remains pending.');
});
run('W36',()=>{
  const c=contract(36); assert.equal(c.rules.sharedCachePrivateContextForbidden,true);
  assert.equal(buildRetrievalCachePolicy({locale:'en',knowledgeRevision:'REV-1'}).cacheable,true);
  assert.equal(buildRetrievalCachePolicy({locale:'en',knowledgeRevision:'REV-1',containsPrivateContext:true}).cacheable,false);
  console.log('✓ KAP-W36 Retrieval Cache passed; private/personal context is excluded from shared caching.');
});
run('W37',()=>{
  const c=contract(37); assert.equal(c.rules.personalizedAnswerSimpleReuseAllowed,false);
  assert.equal(buildAnswerCachePolicy({answerClass:'GENERIC'}).sharedCacheAllowed,true);
  assert.equal(buildAnswerCachePolicy({answerClass:'PERSONAL',personalized:true}).sharedCacheAllowed,false);
  console.log('✓ KAP-W37 Answer Cache passed; personalized answers cannot be simply shared/reused.');
});
run('W38',()=>{
  const c=contract(38); assert.equal(c.rules.budgetMayLowerKnowledgeAuthorityQuality,false);
  const ok=evaluateAiBudget({plan:'FREE',answerMode:'QUICK',sessionSpend:1,userSpend:2,budget:{sessionLimit:3,userLimit:5,allowedAnswerModes:['QUICK']}}); assert.equal(ok.status,'AI_BUDGET_ELIGIBLE');
  const no=evaluateAiBudget({plan:'FREE',answerMode:'DEEP',sessionSpend:4,userSpend:7,budget:{sessionLimit:3,userLimit:5,allowedAnswerModes:['QUICK']}}); assert.equal(no.status,'DETERMINISTIC_FALLBACK_REQUIRED'); assert.equal(no.knowledgeAuthorityQualityMayBeLowered,false);
  console.log('✓ KAP-W38 AI Budget passed; budget controls provider eligibility, never Knowledge Authority quality.');
});
run('W39',()=>{
  const c=contract(39); assert.equal(c.rules.aiUnavailableStillDeliversDeterministicAnswer,true);
  const out=resolveAiFailureFallback({aiAvailable:false,deterministicAnswer:{directAnswer:'grounded'}}); assert.equal(out.status,'DETERMINISTIC_FALLBACK_ACTIVE'); assert.equal(out.answer.directAnswer,'grounded'); assert.equal(out.authorityQualityReduced,false);
  assert.throws(()=>resolveAiFailureFallback({aiAvailable:false}),/KAP_W39_DETERMINISTIC_ANSWER_REQUIRED/);
  console.log('✓ KAP-W39 AI Failure Fallback passed; basic deterministic answer remains available.');
});
run('W40',()=>{
  const c=contract(40); assert.equal(c.consumerStatus,'CONSUMER_PENDING_CKA_ANALYTICS');
  const x=buildOutcomeSignal({event:'answerViewed',locale:'zh-Hans',entrySurface:'ASK',answerMode:'STANDARD',clusterCode:'QCL-1'}); assert.equal(x.privacy.rawQuestionStored,false); assert.equal(x.privacy.userIdStored,false);
  assert.throws(()=>buildOutcomeSignal({event:'answerViewed',locale:'en',userId:'U1'}),/KAP_PHASE18_PRIVATE_FIELD_FORBIDDEN:userId/);
  const reg=j(`${ROOT}/registries/kap-w40-outcome-signal-registry-v1.json`); assert.deepEqual(reg.events,[]);
  console.log('✓ KAP-W40 Outcome Signals contract passed; production emitters remain CKA-consumer pending and registries start empty.');
});
run('W41',()=>{
  const c=contract(41); assert.equal(c.rules.createsCanonicalNode,false);
  const gap=buildKnowledgeGapSignal({coverageStatus:'PARTIAL_COVERAGE',frequency:5,clusterCode:'QCL-1',matchedNodes:['KN-1']}); assert.equal(gap.status,'KNOWLEDGE_GAP_REGISTRY_ELIGIBLE'); assert.equal(gap.authority.createsCanonicalNode,false);
  const low=buildKnowledgeGapSignal({coverageStatus:'INSUFFICIENT',frequency:1,clusterCode:'QCL-2'}); assert.equal(low.status,'OBSERVE_ONLY');
  const strong=buildKnowledgeGapSignal({coverageStatus:'STRONG_COVERAGE',frequency:99}); assert.equal(strong.status,'NO_GAP_SIGNAL');
  const reg=j(`${ROOT}/registries/kap-w41-knowledge-gap-registry-v1.json`); assert.deepEqual(reg.records,[]); assert.equal(reg.canonicalMutationAuthority,false);
  console.log('✓ KAP-W41 Knowledge Gap Signal passed; only aggregated high-frequency PARTIAL/INSUFFICIENT gaps become planning signals.');
});
run('W42',()=>{
  const c=contract(42); assert.equal(c.rules.canonicalTruthMutationByDemand,false);
  assert.equal(assertNoAutomaticMutation({actions:['RECORD_SIGNAL']}).status,'NO_AUTOMATIC_CANONICAL_OR_PUBLICATION_MUTATION');
  assert.throws(()=>assertNoAutomaticMutation({actions:['CREATE_CANONICAL_NODE']}),/KAP_W42_AUTOMATIC_MUTATION_FORBIDDEN/);
  assert.throws(()=>assertNoAutomaticMutation({actions:['PUBLISH_ARTICLE']}),/KAP_W42_AUTOMATIC_MUTATION_FORBIDDEN/);
  console.log('✓ KAP-W42 No Automatic Mutation passed.');
});
run('W43',()=>{
  const c=contract(43); assert.equal(c.consumerStatus,'CONSUMER_PENDING_CKA_ENTITLEMENT'); assert.equal(c.rules.mayLowerKnowledgeAuthorityQuality,false);
  const free=evaluateAnswerEntitlement({plan:'FREE',requestedDepth:'STANDARD',requestHistory:true,policy:{allowedDepths:['QUICK','STANDARD']}}); assert.equal(free.access.depthAllowed,true); assert.equal(free.access.historyAllowed,false); assert.equal(free.knowledgeAuthorityQuality,'SAME_FOR_ALL_PLANS');
  console.log('✓ KAP-W43 Free Ask PHI OS backend policy passed; CKA enforcement remains pending.');
});
run('W44',()=>{
  const c=contract(44); assert.equal(c.consumerStatus,'CONSUMER_PENDING_CKA_ACCOUNT_ENTITLEMENT');
  const member=evaluateAnswerEntitlement({plan:'MEMBER',requestedDepth:'DEEP',requestHistory:true,requestFollowUp:true,requestGuided:true,policy:{allowedDepths:['QUICK','STANDARD','DEEP']}}); assert.equal(member.access.depthAllowed,true); assert.equal(member.access.historyAllowed,true); assert.equal(member.access.guidedReadingAllowed,true); assert.equal(member.subscriptionCreatesKnowledgeAuthority,false);
  console.log('✓ KAP-W44 Membership Answer backend policy passed; Account consumer enforcement remains pending.');
});
run('W45',()=>{
  const c=contract(45); assert.equal(c.rules.subscriptionCreatesMethodProductionAuthority,false); assert.equal(c.rules.paidHdrWhileMpaBlockedMayExecute,false);
  const hdr=evaluateMethodJourneyEntitlement({methodCode:'HUMAN_DESIGN',paidAccess:true,mpaDispatchAllowed:false,mcdProductionAvailable:false,journeyStorageAllowed:true}); assert.equal(hdr.access.methodAllowed,false); assert.equal(hdr.reason,'MPA_BLOCKED');
  const ast=evaluateMethodJourneyEntitlement({methodCode:'ASTROLOGY',paidAccess:true,mpaDispatchAllowed:true,mcdProductionAvailable:true}); assert.equal(ast.access.methodAllowed,true); assert.equal(ast.reason,'AUTHORIZED_ACCESS'); assert.equal(ast.authority.subscriptionCreatesMethodProductionAuthority,false);
  const mcd=j('content/professional/method-client-delivery/registries/mcd-1-production-method-selection-v1.json'); const hdrSource=mcd.methods.find(x=>x.pluginCode==='HDR'); assert.equal(hdrSource.dispatchAllowedByMpa,false); assert.equal(hdrSource.mcdStatus,'BLOCKED_VALIDATION_ONLY');
  console.log('✓ KAP-W45 Method / Journey Entitlement passed; Access cannot manufacture MPA authority and paid HDR remains blocked.');
});

if(mode==='ALL'){
  const policy=j(`${ROOT}/registries/kap-w30-w45-phase18-governance-policy-v1.json`); assert.equal(policy.status,'KAP_PHASE18_BACKEND_READY_CKA_CONSUMPTION_PENDING'); assert.equal(policy.noSecondRuntime,true); assert.equal(policy.finalClientAcceptanceDeclared,false);
  const successor=j(`${ROOT}/reconciliation/kap-w29-w30-phase18-governance-successor-v1.json`); assert.equal(sha(successor.predecessor.path),successor.predecessor.sha256); assert.equal(successor.predecessor.mutated,false); assert.equal(successor.newAnswerRuntimeCreated,false);
  const acceptance=j(`${ROOT}/acceptance/kap-w30-w45-phase18-backend-acceptance-v1.json`); assert.equal(acceptance.status,'ACCEPTED_PHASE18_BACKEND_GOVERNANCE_CKA_CONSUMPTION_PENDING'); assert.equal(acceptance.finalClientProductionAcceptance,false);
  const freeze=j(`${ROOT}/freeze/kap-w30-w45-phase18-backend-freeze-v1.json`); assert.equal(freeze.status,'FROZEN_PHASE18_BACKEND_GOVERNANCE_CONSUMER_ACCEPTANCE_PENDING'); for(const item of freeze.predecessorEvidence) assert.equal(sha(item.path),item.sha256,`KAP predecessor drift: ${item.path}`); for(const item of freeze.frozenOutputs) assert.equal(sha(item.path),item.sha256,`KAP Phase18 output drift: ${item.path}`);
  const pkg=j('package.json'); assert.equal(pkg.scripts['check:kap-phase18'],'node scripts/check-kap-w30-w45-phase18-governance.mjs ALL'); assert.equal(pkg.scripts['check:kap-current'],'npm run check:kap && npm run check:kap-phase18'); assert.match(pkg.scripts['check:kap'],/check:kap-complexity && npm run check:kap-handoff$/);
  console.log('✓ KAP-W30-W45 Phase 18 backend governance accepted and frozen without reopening KAP-W0-W29.');
  console.log('✓ CKA-dependent grounded surface acceptance, locale surface acceptance, analytics emitters, Free/Member client enforcement remain explicitly CONSUMER_PENDING.');
  console.log('✓ Use `npm run check:kap-current` for the current KAP chain; historical `npm run check:kap` remains byte-compatible with the W0-W29 frozen checker contract.');
}
