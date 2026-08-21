import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readText = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const readJson = rel => JSON.parse(readText(rel));

const contractPath = 'content/web/homepage/hpc2/contracts/hpc2-cka-direct-mapping-contract-v1.json';
const auditPath = 'content/web/homepage/hpc2/evidence/hpc2-cka-direct-mapping-audit-v1.json';
const acceptancePath = 'content/web/homepage/hpc2/acceptance/hpc2-cka-direct-mapping-acceptance-v1.json';
const freezePath = 'content/web/homepage/hpc2/freeze/hpc2-cka-direct-mapping-freeze-v1.json';
const successorPath = 'content/client/knowledge-ask/reconciliation/cka-hpc2-direct-mapping-current-successor-v1.json';
const sceneRegistryPath = 'content/web/homepage/hpc2/homepage-scene-registry-v2.json';
const ckaW15Path = 'content/client/knowledge-ask/contracts/cka-w5-w17-batch-b-contract-v1.json';
const ckaW18Path = 'content/client/knowledge-ask/contracts/cka-w18-w33-client-consumption-contract-v1.json';
const w10Path = 'content/web/homepage/hpc2/contracts/hpc2-w10-continuity-final-cta-contract-v1.json';

const contract = readJson(contractPath);
const audit = readJson(auditPath);
const acceptance = readJson(acceptancePath);
const freeze = readJson(freezePath);
const successor = readJson(successorPath);
const sceneRegistry = readJson(sceneRegistryPath);
const ckaW5W17 = readJson(ckaW15Path);
const ckaW18W33 = readJson(ckaW18Path);
const w10 = readJson(w10Path);
const homepage = readText('index.html');

const scene = code => {
  const marker = `data-hpc2-scene="${code}"`;
  const start = homepage.indexOf(marker);
  assert.notEqual(start, -1, `${code} missing from index.html`);
  const next = homepage.indexOf('data-hpc2-scene="H', start + marker.length);
  return homepage.slice(start, next === -1 ? homepage.length : next);
};
const scenes = Object.fromEntries(Array.from({ length: 9 }, (_, i) => {
  const code = `H0${i + 1}`;
  return [code, scene(code)];
}));

// Contract and ownership invariant.
assert.equal(contract.work, 'PART-D-HPC2-X-CKA-DIRECT-MAPPING');
assert.equal(contract.baselineCommit, '64ead9a9addf56f4f83c28736bf205cdc9380c10');
assert.equal(contract.invariant.hpc2OwnsCka, false);
assert.equal(contract.invariant.hpc2ConsumesCkaEntry, true);
assert.equal(contract.invariant.ckaRuntimeOwner, 'CKA');
assert.equal(contract.invariant.groundedAnswerOwner, 'KAP');
assert.equal(contract.invariant.secondAskRuntimeCreated, false);
assert.equal(contract.invariant.secondAnswerRuntimeCreated, false);
assert.deepEqual(contract.mapping.map(item => item.scene), ['H01','H02','H03','H04','H05','H06','H07','H08','H09']);

// Frozen scene authority already carried the direct-mapping roles; Part D projects current consumption without rewriting it.
const expectedRegistryRoles = {
  H01: 'NO_FULL_ASK_UI_AND_NO_ASK_PRIMARY',
  H02: 'PUBLIC_EXAMPLE_QUESTIONS_ALLOWED_NO_PRIVATE_CONTEXT',
  H03: 'EXPLAIN_WHY_ASK_IS_NOT_ANOTHER_DISCONNECTED_ANSWER_NO_CHAT_UI',
  H04: 'FIRST_FORMAL_CONTEXTUAL_ASK_ENTRY_AFTER_RUNTIME_EXPLANATION',
  H05: 'ASK_SITUATION_PERSONAL_RUNTIME_SPLIT_NO_FORCED_JOURNEY',
  H06: 'ASK_IS_CROSS_SURFACE_INTERACTION_NOT_A_FIFTH_GIANT_CARD',
  H07: 'CONTEXTUAL_ASK_OVER_BOOK_ARTICLE_OR_FIGURE_NO_FAKE_ENTRY_BEFORE_CKA',
  H08: 'ESCALATE_ONLY_WHEN_ANSWER_OR_AUTHORITY_REQUIRES_NO_FORCED_PROFESSIONAL',
  H09: 'FOLLOW_UP_OR_ASK_AGAIN_JOURNEY_ONLY_WHEN_COMPLEXITY_REQUIRES'
};
for (const [code, role] of Object.entries(expectedRegistryRoles)) {
  const item = sceneRegistry.scenes.find(entry => entry.sceneCode === code);
  assert.ok(item, `${code} missing from scene registry`);
  assert.equal(item.ckaRole, role, `${code} frozen ckaRole changed`);
}

// H01: no full Ask UI, focus stays platform entry.
assert.doesNotMatch(scenes.H01, /data-cka-|cka-composer|cka-answer|Ask PHI OS/i);
assert.match(scenes.H01, /Reality Navigation Platform/);

// H02: synthetic/public example only; no private context or CKA runtime.
assert.match(scenes.H02, /SYNTHETIC_PUBLIC_EXAMPLE_NO_PRIVATE_CASE_DATA/);
assert.doesNotMatch(scenes.H02, /data-cka-|cka-composer|cka-answer|entrySurface=HOMEPAGE/);

// H03: explain fragmentation before Ask; no chat UI.
assert.match(scenes.H03, /too many disconnected answers/i);
assert.doesNotMatch(scenes.H03, /data-cka-|cka-composer|cka-answer|entrySurface=HOMEPAGE/);
const h04Start = homepage.indexOf('data-hpc2-scene="H04"');
assert.equal(homepage.slice(0, h04Start).includes('data-cka-entry-surface='), false, 'formal CKA entry appears before H04');

// H04: first formal CKA entry after runtime explanation.
assert.match(scenes.H04, /data-hpc2-ask-position="H04_CONTEXTUAL_ENTRY"/);
assert.match(scenes.H04, /href="\/knowledge-search\?entrySurface=HOMEPAGE&amp;mode=GLOBAL"/);
assert.match(scenes.H04, /data-cka-entry-surface="HOMEPAGE"/);
assert.match(scenes.H04, /no generic chat authority, no persistent case, no automatic Method execution and no forced Reality Journey/i);

// H05: Situation / Question / Personal Runtime split, no forced Journey.
for (const mode of ['SITUATION_TO_EXISTING_CKA','QUESTION_TO_EXISTING_CKA','PERSONAL_RUNTIME_EXISTING_ROUTE']) {
  assert.match(scenes.H05, new RegExp(`data-hpc2-first-interaction="${mode}"`));
}
assert.match(scenes.H05, /creates no account or persistent case, executes no Method and starts no Reality Journey/i);
assert.doesNotMatch(scenes.H05, /href="\/reality-journey/);

// H06: Ask is cross-surface, embedded in the 4-card surface composition, not a fifth giant card.
assert.match(scenes.H06, /data-hpc2-surface-anchor-count="4"/);
assert.equal((scenes.H06.match(/class="hpc2-surface-card(?:\s|\")/g) || []).length, 4);
assert.match(scenes.H06, /data-hpc2-cross-surface-ask="CKA_W5_W17_REUSED"/);
const knowledgeCardStart = scenes.H06.indexOf('data-hpc2-reality-surface="KNOWLEDGE_AND_LEARNING"');
const askStart = scenes.H06.indexOf('data-hpc2-cross-surface-ask="CKA_W5_W17_REUSED"');
assert.ok(knowledgeCardStart >= 0 && askStart > knowledgeCardStart, 'H06 Ask must be inside/after Knowledge & Learning surface start');

// H07: contextual Ask consumes CKA-W15's Book / Article / Figure contract.
assert.match(scenes.H07, /mode=CONTEXTUAL&amp;contextType=FIVE_VOLUME_KNOWLEDGE/);
assert.match(scenes.H07, /data-hpc2-consumer-state="ACTIVE_CKA_W5_W17_CONTEXTUAL_LINK_ONLY"/);
const w15 = ckaW5W17.works.find(item => item.work === 'CKA-W15');
assert.ok(w15, 'CKA-W15 missing');
assert.deepEqual(w15.ctas, ['Ask about this volume','Ask about this article','Ask about this figure']);

// H08: professional escalation is bounded and never forced by CKA.
assert.match(scenes.H08, /data-hpc2-path-count="2"/);
assert.match(scenes.H08, /data-hpc2-professional-route-activation="NONE"/);
for (const level of ['PHIOS','PHIOS_PROFESSIONAL','QUALIFIED_EXTERNAL_PROFESSIONAL']) {
  assert.match(scenes.H08, new RegExp(`data-hpc2-authority-level="${level}"`));
}
assert.doesNotMatch(scenes.H08, /data-cka-|entrySurface=HOMEPAGE/);
assert.match(scenes.H08, /creates no professional judgment/i);

// H09: Ask again is secondary; Journey is tertiary/contextual/complex only.
assert.match(scenes.H09, /data-hpc2-final-action="ASK_PHIOS"[^>]*data-hpc2-action-hierarchy="SECONDARY"/);
assert.match(scenes.H09, /data-cka-entry-surface="HOMEPAGE"/);
assert.match(scenes.H09, /data-hpc2-final-action="EXPLORE_REALITY_JOURNEY"[^>]*data-hpc2-action-hierarchy="TERTIARY_CONTEXTUAL_COMPLEX_ONLY"/);
assert.match(scenes.H09, /data-hpc2-journey-emphasis="COMPLEX_ONLY"/);
assert.match(scenes.H09, /only when the situation is complex, persistent, multi-factor or needs continuity beyond a question-scoped answer/i);

// CKA-W18 is historical and must not be rewritten; H09 later became active under HPC2-W10.
const w18 = ckaW18W33.works.find(item => item.work === 'CKA-W18');
assert.ok(w18, 'CKA-W18 missing');
assert.equal(w18.placements.find(item => item.placement === 'H09_CONTINUATION_SECONDARY_ACTION').state, 'NONE_BY_DESIGN_HPC2_H09_DEFERRED');
assert.equal(successor.historicalPredecessor.historicalH09State, 'NONE_BY_DESIGN_HPC2_H09_DEFERRED');
assert.equal(successor.historicalPredecessor.rewritten, false);
assert.deepEqual(successor.successorFacts.currentHomepageActiveCkaScenes, ['H04','H05','H06','H07','H09']);
assert.equal(successor.successorFacts.h09CurrentState, 'ACTIVE_SECONDARY_CKA');
assert.equal(successor.successorFacts.h09ActivationAuthority, 'HPC2-W10');
assert.equal(successor.ownership.hpc2OwnsCka, false);
assert.equal(successor.ownership.hpc2ConsumesCkaEntry, true);
assert.equal(w10.composition.secondaryAction.label, 'Ask PHI OS');
assert.equal(w10.composition.tertiaryAction.emphasis, 'COMPLEX_ONLY');

// Acceptance/freeze/evidence close only this mapping scope.
assert.equal(audit.result, 'HPC2_CKA_DIRECT_MAPPING_REPOSITORY_ACCEPTED');
assert.equal(audit.findings.length, 11);
assert.ok(audit.findings.every(item => item.result === 'PASS'));
assert.equal(acceptance.status, 'HPC2_CKA_DIRECT_MAPPING_ACCEPTED');
assert.ok(Object.values(acceptance.gates).every(Boolean));
assert.equal(acceptance.globalProductionAccepted, false);
assert.equal(freeze.status, 'PART_D_HPC2_CKA_DIRECT_MAPPING_FROZEN_AFTER_REPOSITORY_ACCEPTANCE');
assert.ok(freeze.frozenInvariants.includes('HPC2 does not own CKA'));
assert.ok(freeze.frozenInvariants.includes('HPC2 consumes CKA entry'));

console.log('✓ PART D HPC2 × CKA Direct Mapping passed.');
console.log('  H01-H03: no Ask/chat UI before the formal H04 entry; H02 remains public synthetic only.');
console.log('  H04-H07: first formal Ask → split first interaction → cross-surface Ask → contextual Book/Article/Figure Ask.');
console.log('  H08-H09: no forced professional; Ask stays secondary and Journey stays contextual-complex-only.');
console.log('  Invariant: HPC2 does not own CKA; HPC2 consumes CKA entry. Historical CKA-W18 H09 deferment remains frozen and is reconciled by successor.');
