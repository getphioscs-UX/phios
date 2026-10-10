import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {
  CKA_ACCOUNT_BOUNDARY,
  CKA_ANSWER_STATES,
  CKA_AUTHORITY_PRIORITY,
  CKA_GUIDED_FIELDS,
  composeCkaContextualRetrievalQuestion,
  composeCkaGuidedRetrievalQuestion,
  normalizeCkaGuidedContext,
  normalizeCkaKnowledgeContext,
  projectCkaW5W17Envelope
} from '../functions/_lib/client-knowledge-ask-b.js';
import { evaluateRealityComplexityGate } from '../functions/_lib/knowledge-reality-complexity.js';
import { prepareRealityJourneyHandoff } from '../functions/_lib/knowledge-reality-handoff.js';

const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const text = path => fs.readFileSync(path, 'utf8');
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const count = (source, pattern) => [...source.matchAll(pattern)].length;

const paths = Object.freeze({
  contract: 'content/client/knowledge-ask/contracts/cka-w5-w17-batch-b-contract-v1.json',
  acceptance: 'content/client/knowledge-ask/acceptance/cka-w5-w17-batch-b-acceptance-v1.json',
  evidence: 'content/client/knowledge-ask/evidence/cka-w5-w17-batch-b-audit-v1.json',
  freeze: 'content/client/knowledge-ask/freeze/cka-w5-w17-batch-b-freeze-v1.json',
  successor: 'content/client/knowledge-ask/reconciliation/cka-w5-w17-current-successor-v1.json',
  html: 'knowledge-search.html',
  css: 'assets/css/knowledge-search.css',
  client: 'assets/js/pages/knowledge-search-b.js',
  predecessorClient: 'assets/js/pages/knowledge-search.js',
  apiClient: 'assets/js/knowledge/ask-phios-client.js',
  api: 'functions/api/ask-phios.js',
  server: 'functions/_lib/client-knowledge-ask-b.js',
  entryLinks: 'assets/js/knowledge/cka-entry-links.js',
  libraryHtml: 'library.html',
  library: 'assets/js/pages/library.js',
  article: 'assets/js/pages/article.js',
  book: 'assets/js/pages/book-volume.js',
  figure: 'assets/js/pages/figure-detail.js',
  package: 'package.json',
  hpc2Successor: 'content/web-production/reconciliation/hpc2-w6-cka-client-surface-successor-v1.json'
});

for (const path of Object.values(paths)) assert.ok(fs.existsSync(path), `Missing CKA-B dependency: ${path}`);

const contract = read(paths.contract);
const acceptance = read(paths.acceptance);
const evidence = read(paths.evidence);
const freeze = read(paths.freeze);
const successor = read(paths.successor);
const html = text(paths.html);
const client = text(paths.client);
const api = text(paths.api);
const server = text(paths.server);
const entryLinks = text(paths.entryLinks);
const libraryHtml = text(paths.libraryHtml);
const library = text(paths.library);
const article = text(paths.article);
const book = text(paths.book);
const figure = text(paths.figure);
const pkg = read(paths.package);
const hpc2Successor = read(paths.hpc2Successor);

assert.equal(contract.batch, 'BATCH-CKA-B');
assert.deepEqual(contract.works.map(record => record.work), Array.from({ length: 13 }, (_, index) => `CKA-W${index + 5}`));
assert.equal(acceptance.status, 'DETERMINISTIC_ACCEPTANCE_PASSED');
assert.equal(acceptance.humanAcceptance.claimed, false);
assert.equal(acceptance.browserAcceptance.claimed, false);
assert.equal(acceptance.deploymentAcceptance.claimed, false);
assert.equal(evidence.predecessorProtection.homepageRuntimeChanged, false);
assert.equal(evidence.predecessorProtection.realityRouteActivated, false);
assert.equal(freeze.immutableBoundaries.groundedAnswerOwner, 'KAP');
assert.equal(pkg.scripts['check:cka-w5-w17'], 'node scripts/check-cka-w5-w17.mjs');

assert.equal(sha256(paths.predecessorClient), hpc2Successor.currentClientSurface.sha256);
assert.equal(sha256(paths.predecessorClient), successor.predecessor.sha256);
assert.equal(sha256(paths.client), successor.currentExtension.sha256);
assert.equal(sha256(paths.html), successor.currentExtension.loadedBySha256);
assert.equal(successor.authorityBoundary.homepageRuntimeChanged, false);
assert.equal(successor.authorityBoundary.realityRouteActivated, false);
assert.equal(hpc2Successor.authorityBoundary.guidedContextActivated, false);
assert.doesNotMatch(client, /assets\/js\/pages\/home-production|activateRealityRoute|createShadowAccount/);

assert.deepEqual(CKA_GUIDED_FIELDS, [
  'whatIsHappening',
  'howLong',
  'whoOrWhatIsInvolved',
  'whatChanged',
  'whatTried',
  'whatMattersMostNow'
]);
for (const field of CKA_GUIDED_FIELDS) assert.match(html, new RegExp(`name="${field}"`));
assert.equal(count(html, /Help PHI OS understand your situation/g), 1);
assert.match(html, /Guided Context · temporary, not a full ICR/);
assert.match(server, /classificationIsDiagnosis:\s*false/);
assert.match(server, /fullIcrCreated:\s*false/);

const guided = normalizeCkaGuidedContext({
  question: 'This has kept happening in my family for years with many conflicting factors.',
  whatIsHappening: 'A recurring family conflict affects several people.',
  howLong: 'For years; it is still unresolved.',
  whoOrWhatIsInvolved: 'Me, my partner, my family and my work team',
  whatChanged: 'Several responsibilities changed at once.',
  whatTried: 'We tried pauses, planning and several conversations.',
  whatMattersMostNow: 'A high consequence decision and long-term continuity.'
});
assert.equal(guided.temporaryOnly, true);
assert.equal(guided.classificationIsDiagnosis, false);
assert.ok(guided.classifications.includes('PERSISTENT'));
assert.ok(guided.classifications.includes('MULTI_FACTOR'));
assert.ok(guided.classifications.includes('COMPLEX'));
assert.match(composeCkaGuidedRetrievalQuestion('Why?', guided), /Temporary client-declared context/);

const knowledgeContext = normalizeCkaKnowledgeContext({
  contextLabel: 'Volume I',
  contextSummary: 'A published context summary.',
  readingPath: '/book-one#book-parts',
  relatedKnowledgeRef: 'P1'
});
assert.match(composeCkaContextualRetrievalQuestion('Explain this', knowledgeContext), /Authorized public knowledge context/);

const strongPayload = {
  answer: {
    answerId: 'KAP-A-v1-test',
    question: 'What is continuity?',
    locale: 'en',
    coverageStatus: 'STRONG_COVERAGE',
    groundingBundleId: 'KGB-v1-test',
    knowledgeRefs: {
      primaryNodeCodes: ['KN-1'],
      supportingNodeCodes: [],
      relatedNodeCodes: [],
      manuscriptRefs: [],
      publishedRefs: ['PUB-1']
    },
    content: { directAnswer: 'A bounded answer.' }
  },
  grounding: { bundleId: 'KGB-v1-test', sourceCount: 1 },
  sources: [{
    sourceType: 'PUBLISHED_CANONICAL_ARTICLE',
    authorityLabel: 'Published PHI OS',
    title: 'Continuity',
    questionScopedExcerpt: 'A governed excerpt.',
    volumeLabel: 'Volume I',
    partLabel: 'Part 1',
    href: '/articles/continuity'
  }]
};
const envelope = projectCkaW5W17Envelope(strongPayload, { displayQuestion: 'What is continuity?', locale: 'en', guidedContext: guided, knowledgeContext });
assert.equal(envelope.answerState, 'ANSWERED');
assert.deepEqual(Object.keys(envelope.record), ['answerId', 'questionId', 'retrievalContext', 'knowledgeRefs', 'groundingState', 'groundingBundleId', 'unknownState', 'locale']);
assert.equal(envelope.record.answerId, strongPayload.answer.answerId);
assert.equal(envelope.record.groundingState, 'GROUNDED');
assert.deepEqual(envelope.record.retrievalContext.authorityPriority, CKA_AUTHORITY_PRIORITY);
assert.equal(envelope.record.retrievalContext.llmMemoryOnlyAnswerAllowed, false);
assert.equal(envelope.record.retrievalContext.authoritiesSilentlyCollapsed, false);
assert.equal(envelope.governance.authoritativeAnswerGeneratedByCka, false);
assert.equal(envelope.governance.secondAnswerRuntimeCreated, false);
assert.equal(envelope.relatedKnowledgeCards.length, 1);
assert.deepEqual(Object.keys(envelope.relatedKnowledgeCards[0]), ['concept', 'volume', 'part', 'description', 'contentType', 'href']);

const inventedCardPayload = structuredClone(strongPayload);
inventedCardPayload.sources = [];
inventedCardPayload.answer.content.relatedKnowledge = [{ title: 'Ungoverned suggestion' }];
assert.equal(projectCkaW5W17Envelope(inventedCardPayload, { locale: 'en' }).relatedKnowledgeCards.length, 0);

const currentEnvelope = projectCkaW5W17Envelope(strongPayload, {
  displayQuestion: 'What is the latest financial market price today?',
  locale: 'en'
});
assert.equal(currentEnvelope.answerState, 'NEEDS_CURRENT_AUTHORITY');
assert.equal(currentEnvelope.externalAuthority.liveAuthorityInvented, false);
const professionalEnvelope = projectCkaW5W17Envelope(strongPayload, {
  displayQuestion: 'Please diagnose this medical emergency.',
  locale: 'en'
});
assert.equal(professionalEnvelope.answerState, 'PROFESSIONAL_HANDOFF');
assert.deepEqual(CKA_ANSWER_STATES, contract.works.find(record => record.work === 'CKA-W10').states);

assert.deepEqual(CKA_ACCOUNT_BOUNDARY.guestAllowed, contract.works.find(record => record.work === 'CKA-W7').guestAllowed);
assert.equal(CKA_ACCOUNT_BOUNDARY.shadowAccountCreated, false);
assert.match(html, /account is required for history, saved results, persistence and Journey continuity/i);
assert.match(html, /birth data[—-]does not execute a Method/i);
assert.equal(envelope.methodBoundary.askIsMethodExecution, false);
assert.equal(envelope.methodBoundary.birthDataTriggersMethod, false);
assert.equal(envelope.realityBoundary.questionContextIsCanonicalRealityCase, false);
assert.equal(envelope.realityBoundary.newCaseOnlyThroughRealityFlow, true);

const complexity = evaluateRealityComplexityGate({
  question: 'A long-term recurring situation with several people, relationships, goals, constraints, interventions, feedback loops and high-consequence decisions.',
  guidedContext: {
    originalQuestion: 'Why does this keep happening?',
    temporaryObservations: ['Several people and organizations have conflicting goals over years.'],
    clarifyingAnswers: [{ questionId: 'howLong', response: 'Persistent and unresolved for years.' }],
    unknownMechanisms: ['The causal structure is unclear.'],
    escalationSignals: { persistent: true, multiFactor: true, caseSpecific: true }
  },
  structuredContext: {
    multiplePeople: true,
    multipleRelationships: true,
    multipleGoals: true,
    multipleConstraints: true,
    multipleInterventions: true,
    goalConflict: true,
    longTimeline: true,
    repeatPattern: true,
    feedbackLoopPresence: true,
    unclearCausalStructure: true,
    highConsequenceDecision: true,
    persistentUnresolvedState: true
  }
});
assert.equal(complexity.realityModelRequirement.requirement, 'YES');
assert.equal(complexity.route, 'REALITY_JOURNEY_CANDIDATE');
assert.equal(count(html, /Explore this as a Reality Journey/g), 1);
assert.match(client, /payload\.realityModelRequirement\?\.requirement === 'YES'/);
assert.match(client, /scope:\s*'REALITY_JOURNEY_PERSISTENT_CASE_HANDOFF'/);

const prepared = await prepareRealityJourneyHandoff({
  action: 'PREPARE',
  locale: 'en',
  complexityEvaluation: complexity,
  guidedContext: { originalQuestion: 'Why does this keep happening?' }
});
assert.equal(prepared.status, 'CONSENT_REQUIRED');
assert.equal(prepared.governance.realityJourneyActivated, false);
const handoff = await prepareRealityJourneyHandoff({
  action: 'HANDOFF',
  locale: 'en',
  complexityEvaluation: complexity,
  guidedContext: { originalQuestion: 'Why does this keep happening?' },
  knowledgeGroundingBundle: { bundleId: 'KGB-v1-test', sources: [] },
  methodProjections: [],
  consent: {
    explicit: true,
    accepted: true,
    scope: 'REALITY_JOURNEY_PERSISTENT_CASE_HANDOFF',
    consentTextVersion: 'CKA-W6-v1.0.0',
    recordedAt: '2026-08-20T00:00:00.000Z'
  }
});
assert.equal(handoff.status, 'HANDOFF_READY');
assert.equal(handoff.governance.persistentCaseCreated, false);
assert.equal(handoff.governance.realityJourneyActivated, false);

for (const marker of [
  'Ask about this volume',
  'Ask about this article',
  'Ask about this figure',
  'Ask PHI OS about this'
]) assert.ok(entryLinks.includes(marker), `Missing contextual Ask marker: ${marker}`);
assert.match(article, /entrySurface:\s*'ARTICLE'/);
assert.match(article, /articleCode:/);
assert.match(book, /entrySurface:\s*'BOOK'/);
assert.match(book, /readingPath:/);
assert.match(figure, /entrySurface:\s*'FIGURE'/);
assert.match(figure, /contextSummary:\s*caption/);
assert.match(figure, /relatedKnowledgeRef:\s*figure\.chapter/);

assert.match(libraryHtml, /Library is for browsing, discovery, comparison and reading paths/);
assert.match(library, /data-cka-contextual-entry="LIBRARY"/);
assert.match(library, /View figure/);
assert.match(library, /'Read'/);
assert.match(client, /\/library\?query=/);
assert.equal(envelope.navigationBoundary.searchPurpose, 'FIND_KNOWLEDGE');
assert.equal(envelope.navigationBoundary.askPurpose, 'UNDERSTAND_KNOWLEDGE');
assert.equal(envelope.navigationBoundary.libraryPurpose, 'BROWSE_DISCOVER_COMPARE_FOLLOW_READING_PATHS');

assert.match(api, /runAskPhiosPipeline/);
assert.match(api, /projectCkaW5W17Envelope/);
assert.doesNotMatch(api, /runGuidedReading|createAccount|persistCase|executeMethod/i);
assert.match(text(paths.apiClient), /guidedContext\.whatIsHappening/);
assert.match(text(paths.css), /\.cka-guided__grid/);
assert.match(text(paths.css), /\.cka-journey/);

console.log('CKA-W5–W17 deterministic acceptance passed.');
console.log('  route: Simple → Grounded Answer; Contextual → temporary Guided Context; KAP W24 YES → explicit Reality handoff');
console.log('  boundaries: no second answer/retrieval runtime, no shadow account, no Method execution, no case or Reality route activation');
console.log('  integrations: Article + Book + Figure + Search/Library contextual Ask');
