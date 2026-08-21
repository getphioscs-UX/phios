import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { CKA_ACCOUNT_BOUNDARY } from '../functions/_lib/client-knowledge-ask-b.js';
import { evaluateCkaProductionAnswer } from '../functions/_lib/client-knowledge-ask-c.js';

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const readText = path => readFileSync(path, 'utf8');
const mustExist = path => assert.ok(existsSync(path), `Missing PART I evidence: ${path}`);
const count = (text, regex) => [...text.matchAll(regex)].length;
const work = (contract, code) => {
  const record = contract.works?.find(item => item.work === code);
  assert.ok(record, `${code}: contract record missing`);
  return record;
};
const sectionBetween = (text, start, end) => {
  const s = text.indexOf(start);
  assert.ok(s >= 0, `Missing section start: ${start}`);
  const e = end ? text.indexOf(end, s + start.length) : -1;
  return text.slice(s, e >= 0 ? e : text.length);
};
const pass = (code, note) => console.log(`✓ ${code} ${note}`);

export function runBfrHCriticalRegressions() {
  const contractPath = 'content/web-production/regression/bfr-h-critical-regression-contract-v1.json';
  mustExist(contractPath);
  const contract = readJson(contractPath);
  assert.equal(contract.status, 'REG_01_REG_15_FAIL_CLOSED_BEFORE_BFR_H16_PRODUCTION_ACCEPTANCE');
  assert.equal(contract.regressions.length, 15);
  assert.deepEqual(contract.regressions.map(item => item.code), Array.from({ length: 15 }, (_, i) => `REG-${String(i + 1).padStart(2, '0')}`));

  const books = readJson('content/registry/books.json');
  const publicBooks = readJson('content/knowledge/public/public-book-metadata.json');
  const hpc2W8 = readJson('content/web/homepage/hpc2/contracts/hpc2-w8-five-volume-knowledge-composition-contract-v1.json');
  const homepageIntake = readJson('content/web/homepage/hpc2/homepage-capability-intake-v1.json');
  const financialRegistry = readJson('content/web-production/registries/wpr-professional-financial-projection-registry-v1.json');
  const publicAssets = readJson('content/registry/public-assets.json');
  const visualRegistry = readJson('content/web-production/registries/client-visual-asset-registry-v1.2.json');
  const v8Manifest = readJson('content/web/homepage/hpc2/v8-content-preservation-manifest-v1.json');
  const v8Migration = readJson('content/web/homepage/hpc2/v8-content-destination-migration-v1.json');
  const v8Completion = readJson('content/web/homepage/hpc2/evidence/hpc2-w14-v8-successor-completion-v1.json');
  const ckaA = readJson('content/client/knowledge-ask/contracts/cka-w5-w17-batch-b-contract-v1.json');
  const ckaB = readJson('content/client/knowledge-ask/contracts/cka-w18-w33-client-consumption-contract-v1.json');
  const publicationContext = readJson('content/web-production/registries/wpr-five-volume-publication-context-registry-v1.json');
  const publicationOwnership = readJson('content/knowledge/migrations/node-publication-ownership-v2.json');
  const professionalFinancial = readJson('content/web-production/acceptance/wpr-w22-professional-financial-acceptance-v1.json');
  const sceneRegistry = readJson('content/web/homepage/hpc2/homepage-scene-registry-v2.json');
  const fiveVolumeVisual = readJson('content/web-production/bfr-five-volume-visual-projection-v1.json');
  const homeHtml = readText('index.html');
  const homeJs = readText('assets/js/pages/home-production.js');
  const askHtml = readText('knowledge-search.html');
  const askJs = readText('assets/js/pages/knowledge-search-b.js');
  const personalHtml = readText('personal-runtime.html');
  const personalJs = readText('assets/js/pages/personal-runtime.js');
  const publicSurfaceJs = readText('assets/js/web-production/public-surface-data.js');
  const publishedContentJs = readText('assets/js/knowledge/published-content.js');

  // REG-01 — canonical five-volume truth must project as five on Homepage.
  assert.equal(books.architecture, 'five-volume-15-part');
  assert.equal(books.books.length, 5);
  assert.deepEqual(books.books.map(book => book.bookCode), ['BOOK-1', 'BOOK-2', 'BOOK-3', 'BOOK-4', 'BOOK-5']);
  assert.equal(publicBooks.recordCount, 5);
  assert.deepEqual(publicBooks.records.map(book => book.bookCode), ['BOOK-1', 'BOOK-2', 'BOOK-3', 'BOOK-4', 'BOOK-5']);
  assert.equal(hpc2W8.composition.canonicalBookCount, 5);
  assert.equal(hpc2W8.volumeSequence.length, 5);
  assert.equal(count(homeHtml, /data-hpc2-volume-stage="[A-Z_]+"/g), 5);
  assert.ok(homeJs.includes('booksRegistry.books'));
  assert.ok(homeJs.includes('.map(book => bookCard(book, locale))'));
  assert.ok(homeJs.includes('renderedBookCoverCount === 5'));
  assert.ok(!/booksRegistry\.books[\s\S]{0,120}\.slice\(\s*0\s*,\s*4\s*\)/.test(homeJs), 'Homepage may not truncate canonical books to four');
  pass('REG-01', 'five canonical books remain five Homepage volume identities.');

  // REG-02 — Financial Runtime production discovery + expected Homepage surface requires a real consumer.
  const financialProjection = financialRegistry.entries.find(entry => entry.projectionCode === 'FINANCIAL_DISCOVERY');
  assert.ok(financialProjection);
  assert.equal(financialProjection.projectionState, 'LIMITED_PRODUCTION');
  assert.ok(financialProjection.authorityReferences.includes('FINANCIAL_RUNTIME'));
  const financialIntake = homepageIntake.records.find(record => record.capabilityCode === 'FINANCIAL_REALITY');
  assert.ok(financialIntake);
  assert.equal(financialIntake.expectedSurface, 'HOMEPAGE');
  assert.equal(financialIntake.requiredVisibility, true);
  assert.equal(financialIntake.consumerState, 'ACTIVE');
  assert.notEqual(financialIntake.consumerState, 'NONE_BY_DESIGN');
  assert.equal(count(homeHtml, /data-hpc2-reality-surface="FINANCIAL_REALITY"/g), 1);
  assert.ok(sectionBetween(homeHtml, 'data-hpc2-reality-surface="FINANCIAL_REALITY"', 'data-hpc2-reality-surface="REALITY_JOURNEY"').includes('/professional/financial'));
  pass('REG-02', 'Financial Reality has an active Homepage consumer and handoff.');

  // REG-03 — governed R2 HERO-001 must be consumed through the resolver, not replaced by a local image.
  const heroPublic = publicAssets.assets.find(asset => asset.asset_code === 'HERO-001');
  const heroVisual = visualRegistry.assets.find(asset => asset.assetCode === 'HERO-001');
  assert.ok(heroPublic && heroVisual);
  assert.equal(heroPublic.status, 'remote-verified');
  assert.equal(heroPublic.verification, 'verified-remote-head-get');
  assert.equal(heroPublic.remote?.http_status, 200);
  assert.equal(heroVisual.r2?.remoteVerified, true);
  assert.equal(heroVisual.r2?.objectKey, heroPublic.object_key);
  const h01 = sectionBetween(homeHtml, 'data-hpc2-scene="H01"', 'data-hpc2-scene="H02"');
  assert.ok(h01.includes('data-hpc2-hero="HERO-001"'));
  assert.ok(!/<img\b[^>]*\bsrc=/i.test(h01), 'H01 may not hardcode a local/unrelated hero image');
  assert.ok(homeJs.includes("renderAssetTarget(heroRoot, 'HERO-001'"));
  pass('REG-03', 'Homepage hero remains the governed R2 HERO-001 resolver consumer.');

  // REG-04 — every V8 semantic block must remain directly migrated or have an explicit successor.
  assert.equal(v8Manifest.semanticBlocks.length, 39);
  const sourceBlocks = new Set(v8Manifest.semanticBlocks.map(item => item.blockCode));
  const migrated = new Set(v8Migration.verifiedBlocks.map(item => item.blockCode));
  const successors = new Set(v8Completion.successorCompletions.map(item => item.blockCode));
  const accounted = new Set([...migrated, ...successors]);
  assert.equal(migrated.size, 34);
  assert.equal(successors.size, 5);
  assert.equal(accounted.size, 39);
  assert.deepEqual([...sourceBlocks].sort(), [...accounted].sort());
  assert.equal(v8Completion.summary.unaccountedCount, 0);
  pass('REG-04', 'all 39 V8 semantic blocks remain migrated or successor-accounted.');

  // REG-05 — simple public Ask is guest-capable; account is for persistence/continuity only.
  const w7 = work(ckaA, 'CKA-W7');
  const w29 = work(ckaB, 'CKA-W29');
  assert.ok(w7.guestAllowed.includes('ASK') && w7.guestAllowed.includes('ANSWER'));
  assert.ok(CKA_ACCOUNT_BOUNDARY.guestAllowed.includes('ASK') && CKA_ACCOUNT_BOUNDARY.guestAllowed.includes('ANSWER'));
  assert.equal(w7.shadowAccountCreated, false);
  assert.equal(w29.simplePublicAskForcedLogin, false);
  const composerTag = askHtml.match(/<form\b[^>]*data-cka-composer[^>]*>/)?.[0] || '';
  assert.ok(composerTag);
  assert.ok(!/(login|account|required-account|entitlement)/i.test(composerTag), 'Simple Ask composer may not require account/login');
  pass('REG-05', 'simple Ask remains guest-capable without forced account creation/login.');

  // REG-06 — simple Ask answers in place; Journey is conditional, hidden, and consent-gated.
  const w28 = work(ckaB, 'CKA-W28');
  assert.equal(w28.routing.simple, 'answer');
  assert.equal(w28.routing['needs context'], 'guided context');
  assert.ok(/KAP W24 YES \+ explicit consent/i.test(w28.routing.complex));
  assert.ok(/<section\b[^>]*data-cka-journey[^>]*\bhidden\b/i.test(askHtml));
  assert.ok(askHtml.includes('data-cka-journey-consent-checkbox'));
  assert.ok(askJs.includes("payload.route === 'REALITY_JOURNEY_CANDIDATE'"));
  assert.ok(askJs.includes('journey.hidden = !eligible'));
  assert.ok(askJs.includes('journeyConsentCheckbox.checked = false'));
  const composer = sectionBetween(askHtml, 'data-cka-composer', '</form>');
  assert.ok(/knowledge-action--primary[^>]*type="submit"[^>]*>Ask PHI OS|type="submit"[^>]*>Ask PHI OS/.test(composer));
  pass('REG-06', 'simple Ask stays primary; Reality Journey remains complexity/consent gated.');

  // REG-07 — birth input alone cannot execute all Methods; explicit execution consent and selected entries are mandatory.
  const w12 = work(ckaA, 'CKA-W12');
  assert.equal(w12.birthDataTriggersMethod, false);
  assert.equal(w12.askIsMethodExecution, false);
  assert.ok(w12.personalRuntimePath.indexOf('CONSENT') < w12.personalRuntimePath.indexOf('EXECUTION'));
  assert.ok(personalHtml.includes('id="executionConsent"'));
  assert.ok(personalJs.includes("if(!state.ready||!checked('executionConsent'))return"));
  assert.ok(personalJs.includes('function requestedEntries()'));
  assert.ok(personalJs.includes('filter(entry=>selectedCodes.has(entry.tabCode))'));
  assert.ok(personalJs.includes('state.evaluations.map'));
  assert.ok(personalJs.includes("getElementById('processPersonalRuntime')?.addEventListener('click',processSelected)"));
  assert.ok(!/birth(Date|Time)[\s\S]{0,100}addEventListener\([^)]*(input|change)[^)]*processSelected/.test(personalJs), 'Birth input may not auto-trigger processSelected');
  pass('REG-07', 'Personal Runtime execution stays selection + explicit-consent + button gated.');

  // REG-08 — every CKA answer envelope carries grounding state and the answer surface exposes grounding evidence.
  const w9 = work(ckaA, 'CKA-W9');
  const w31 = work(ckaB, 'CKA-W31');
  assert.ok(w9.recordedFields.includes('groundingState'));
  assert.ok(w31.required.includes('grounding state'));
  assert.ok(askHtml.includes('data-cka-grounding'));
  assert.ok(askHtml.includes('data-cka-sources'));
  assert.ok(askJs.includes('renderSources(envelope)'));
  const envelopeSource = readText('functions/_lib/client-knowledge-ask-b.js');
  assert.ok(envelopeSource.includes("groundingState: groundingBundleId && (payload?.sources?.length || 0) > 0 ? 'GROUNDED' : 'INSUFFICIENT_GROUNDING'"));
  pass('REG-08', 'CKA answer envelope and surface preserve grounding state/evidence.');

  // REG-09 — evidence-incomplete production answers must not pass when Unknown is absent.
  const w10 = work(ckaA, 'CKA-W10');
  assert.ok(w10.states.includes('UNKNOWN') && w10.states.includes('PARTIALLY_ANSWERED'));
  assert.ok(w31.required.includes('unknown'));
  assert.ok(askHtml.includes('data-cka-unknown-state') && askHtml.includes('data-cka-unknown'));
  const incompleteWithoutUnknown = evaluateCkaProductionAnswer({
    answer: { content: { directAnswer: 'Bounded answer', unknowns: [], boundaries: ['Evidence is incomplete.'] } },
    sources: [{ href: '/articles/example' }]
  }, {
    answerState: 'PARTIALLY_ANSWERED',
    record: { groundingState: 'GROUNDED', unknownState: '' },
    externalAuthority: null
  }, [{ valid: true }]);
  assert.equal(incompleteWithoutUnknown.unknownVisible, false);
  assert.equal(incompleteWithoutUnknown.productionAnswerAccepted, false);
  const incompleteWithUnknown = evaluateCkaProductionAnswer({
    answer: { content: { directAnswer: 'Bounded answer', unknowns: ['The missing evidence remains unknown.'], boundaries: ['Evidence is incomplete.'] } },
    sources: [{ href: '/articles/example' }]
  }, {
    answerState: 'PARTIALLY_ANSWERED',
    record: { groundingState: 'GROUNDED', unknownState: 'UNKNOWN' },
    externalAuthority: null
  }, [{ valid: true }]);
  assert.equal(incompleteWithUnknown.unknownVisible, true);
  pass('REG-09', 'evidence-incomplete answers fail production acceptance if Unknown is not represented.');

  // REG-10 — public Book/Part context follows publication ownership, never KN-B prefix inference.
  assert.equal(publicationContext.identityPolicy.nodeBPrefixBookInferenceAllowed, false);
  assert.equal(publicationContext.identityPolicy.publicationOwnershipAuthoritative, true);
  assert.equal(publicationContext.partOwnership.length, 15);
  assert.ok(publicSurfaceJs.includes('nodeCodePrefixUsedForBookInference: false'));
  assert.ok(publicSurfaceJs.includes('publicationOwnershipAuthoritative: true'));
  assert.ok(publicSurfaceJs.includes('publicationContextRegistry.nodeOverrides?.find'));
  assert.ok(publishedContentJs.includes('resolvePublicationContextForNode('));
  assert.ok(!/nodeCode[^\n]{0,100}(split\(|match\(|startsWith\(['"]KN-B)/.test(publicSurfaceJs), 'Publication context may not infer Book from KN-B prefix');
  const rehomed = publicationOwnership.nodes.find(node => node.nodeCode === 'KN-B1-P5-001');
  assert.ok(rehomed);
  assert.equal(rehomed.sourceBookCode, 'BOOK-1');
  assert.equal(rehomed.publicationBookCode, 'BOOK-2');
  pass('REG-10', 'Article Book context remains Publication Ownership authoritative.');

  // REG-11 — the public Homepage may not silently consume private Reality context.
  const w13 = work(ckaA, 'CKA-W13');
  const w25 = work(ckaB, 'CKA-W25');
  assert.equal(w13.simpleContextEphemeral, true);
  assert.ok(['ACCOUNT', 'PERMISSION', 'PRIVACY', 'ENTITLEMENT', 'EXISTING_CASE'].every(token => w13.realityAwareRequires.includes(token)));
  assert.ok(w25.checks.includes('Reality-aware Ask requires authorization'));
  assert.ok(w25.checks.includes('No hidden case creation'));
  for (const token of ['realityCaseId', 'REALITY_AWARE', 'Using current Reality context', 'privateRealityContext']) {
    assert.ok(!homeHtml.includes(token), `Public Homepage leaks private Reality context marker: ${token}`);
  }
  pass('REG-11', 'public Homepage remains free of private Reality/case context.');

  // REG-12 — CKA may hand off to professional authority but may not create Professional Judgment.
  const w11 = work(ckaA, 'CKA-W11');
  assert.equal(w11.ckaMakesProfessionalJudgment, false);
  assert.equal(professionalFinancial.nonActivation.professionalJudgmentCreated, false);
  assert.ok(askJs.includes('CKA presents a boundary and handoff; it does not make medical, legal or financial judgments.'));
  assert.ok(!/data-cka-section="PROFESSIONAL_JUDGMENT"/.test(askHtml));
  pass('REG-12', 'Professional Judgment remains external/human authority, not CKA-generated content.');

  // REG-13 — Homepage scene authority is fixed to H01-H09; a new runtime cannot create H10 by itself.
  const expectedScenes = ['H01', 'H02', 'H03', 'H04', 'H05', 'H06', 'H07', 'H08', 'H09'];
  assert.deepEqual(sceneRegistry.sceneOrder, expectedScenes);
  assert.deepEqual(sceneRegistry.scenes.map(scene => scene.sceneCode), expectedScenes);
  const actualScenes = [...homeHtml.matchAll(/data-hpc2-scene="(H\d{2})"/g)].map(match => match[1]);
  assert.deepEqual(actualScenes, expectedScenes);
  assert.equal(new Set(actualScenes).size, 9);
  pass('REG-13', 'Homepage remains the governed nine-scene narrative; runtime existence alone adds no scene.');

  // REG-14 — volume identity must carry semantic identity/progression in addition to visual spectrum.
  assert.equal(fiveVolumeVisual.identityNotColorOnly, true);
  assert.equal(fiveVolumeVisual.volumes.length, 5);
  assert.equal(hpc2W8.volumeSequence.length, 5);
  const semanticIds = new Set();
  const progressions = new Set();
  for (let i = 0; i < 5; i += 1) {
    const visual = fiveVolumeVisual.volumes[i];
    const sequence = hpc2W8.volumeSequence[i];
    assert.ok(visual.bookCode && visual.title && visual['zh-Hans'], `Volume ${i + 1}: semantic identity missing`);
    assert.ok(sequence.bookId && sequence.titleEn && sequence.titleZhHans && sequence.progression, `Volume ${i + 1}: progression identity missing`);
    assert.equal(visual.bookCode, `BOOK-${i + 1}`);
    assert.equal(sequence.volume, i + 1);
    semanticIds.add(`${visual.bookCode}|${visual.title}|${visual['zh-Hans']}`);
    progressions.add(sequence.progression);
  }
  assert.equal(semanticIds.size, 5);
  assert.equal(progressions.size, 5);
  assert.equal(count(homeHtml, /data-hpc2-volume-stage="[A-Z_]+"/g), 5);
  pass('REG-14', 'five-volume identity remains semantic + progression + visual, never color-only.');

  // REG-15 — Ask PHI OS remains structured governed Q&A, never unlimited generic chat.
  const w27 = work(ckaB, 'CKA-W27');
  assert.equal(w27.genericUnlimitedChat, false);
  assert.equal(w27.structuredAnswerRequired, true);
  assert.deepEqual(w27.requiredWhenAvailable, ['Direct Answer', 'Unknown', 'Related Knowledge', 'Grounding']);
  for (const section of ['DIRECT_ANSWER', 'WHAT_PHIOS_DOES_NOT_YET_KNOW', 'RELATED_KNOWLEDGE']) {
    assert.ok(askHtml.includes(`data-cka-section="${section}"`), `Structured Ask section missing: ${section}`);
  }
  assert.ok(askHtml.includes('data-cka-grounding'));
  assert.ok(askHtml.includes('Ask one follow-up'));
  assert.ok(!/unlimited\s+(generic\s+)?chat/i.test(askHtml));
  pass('REG-15', 'Ask PHI OS remains structured, grounded, bounded Q&A with one limited follow-up.');

  for (const value of Object.values(contract.authorityBoundary)) assert.equal(value, false);
  console.log('✓ PART I Critical Regression Tests passed: REG-01 through REG-15 fail-closed invariants are active before BFR-H16 acceptance.');
}

if (process.argv[1]?.endsWith('check-bfr-h-critical-regressions.mjs')) runBfrHCriticalRegressions();
