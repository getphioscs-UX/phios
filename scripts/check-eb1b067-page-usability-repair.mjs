import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { isAnswerQuestionRelevant } from '../assets/js/knowledge/answer-relevance-guard.js';

const read = path => fs.readFileSync(path, 'utf8');
const json = path => JSON.parse(read(path));
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');

const reconciliationPath = 'content/web-production/reconciliation/eb1b067-page-usability-repair-successor-v1.json';
const reconciliation = json(reconciliationPath);

assert.equal(reconciliation.baselineCommit, 'eb1b0671eddb4933303b9b5444ead82bd7480945');
assert.equal(reconciliation.work, 'PUXR-W1-W4');
assert.equal(reconciliation.status, 'ACTIVE_ADDITIVE_PAGE_USABILITY_REPAIR_SUCCESSOR');

const askHtml = read('knowledge-search.html');
assert.equal((askHtml.match(/<h1\b/gi) || []).length, 1, 'Ask PHI OS must expose one canonical H1/hero only');
assert.equal(/<section\s+class=["'][^"']*knowledge-hero\b/i.test(askHtml), false, 'Legacy knowledge hero must not remain in the Ask DOM');
for (const marker of ['data-runtime-spine-surface="KNOWLEDGE_SEARCH"', 'data-cka-context-indicator', 'data-cka-composer', 'data-cka-answer']) {
  assert.ok(askHtml.includes(marker), `Ask PHI OS semantic hook missing: ${marker}`);
}

const askClient = read('assets/js/pages/knowledge-search-b.js');
assert.ok(askClient.includes("../knowledge/answer-relevance-guard.js"), 'Ask consumer must import the fail-closed relevance guard');
assert.ok(askClient.includes('INSUFFICIENT_RELEVANCE'), 'Ask consumer must expose an insufficient-relevance presentation state');
assert.ok(askClient.includes('relevanceInsufficient'), 'Ask consumer must provide explicit relevance-boundary copy');

const unrelatedAnswer = {
  question: '我的手为什么突然很痒',
  directAnswer: '人类没有发明电磁作用，也没有发明数学关系，也没有创造信息得以存在的可能性。',
  whyThisMayHappen: [],
  whatToObserve: []
};
const answeredEnvelope = { answerState: 'ANSWERED' };
assert.equal(isAnswerQuestionRelevant(unrelatedAnswer, answeredEnvelope), false, 'Known unrelated symptom/reality mismatch must fail closed');
assert.equal(isAnswerQuestionRelevant({
  question: '现实为什么会变化',
  directAnswer: '现实会随着结构、关系与运行条件的变化而变化。',
  whyThisMayHappen: [],
  whatToObserve: []
}, answeredEnvelope), true, 'A question-scoped relevant answer must remain renderable');

const askCss = `${read('assets/css/knowledge-search.css')}\n${read('assets/css/runtime-spine.css')}`;
assert.ok(askCss.includes('PUXR-W1'), 'Ask surface must carry the PUXR-W1 presentation repair');
assert.ok(/\.cka-answer__question h2[\s\S]*?font-size:\s*clamp\(/.test(askCss), 'Question typography must be explicitly bounded');
assert.ok(/\.cka-answer\s*>\s*section\s*>\s*h2[\s\S]*?font-size:\s*clamp\(/.test(askCss), 'Answer section headings must not inherit giant knowledge-release typography');

const v13 = json('content/web-production/registries/client-visual-asset-registry-v1.3.json');
const v17 = json('content/web-production/registries/client-visual-asset-registry-v1.7.json');
const ill13 = v13.assets.find(asset => asset.sequence === 'ILL-010');
const ill17 = v17.assets.find(asset => asset.sequence === 'ILL-010');
assert.ok(ill13 && ill17, 'ILL-010 must exist in both predecessor and current visual registries');
assert.equal(ill13.r2.objectKey, ill17.r2.objectKey, 'ILL-010 registry successor must preserve canonical object identity');
assert.equal(ill17.r2.remoteVerified, true, 'Current ILL-010 registry must be remotely verified');

for (const path of ['assets/js/pages/reality-workspace.js', 'assets/js/pages/runtime-spine-visuals.js']) {
  const source = read(path);
  assert.ok(source.includes('client-visual-asset-registry-v1.7.json'), `${path} must consume the verified v1.7 ILL-010 registry`);
  assert.equal(source.includes('client-visual-asset-registry-v1.3.json'), false, `${path} must not remain pinned to stale v1.3`);
}

const workspaceJs = read('assets/js/pages/reality-workspace.js');
const spineJs = read('assets/js/pages/runtime-spine-visuals.js');
const workspaceCss = read('assets/css/reality-workspace.css');
const spineCss = read('assets/css/runtime-spine.css');
assert.ok(workspaceJs.includes("media.hidden = true"), 'Reality Workspace supporting visual failure must collapse its figure');
assert.ok(spineJs.includes("figure.hidden=true"), 'Runtime Spine supporting visual failure must collapse its figure');
assert.ok(workspaceCss.includes('.rw-visual-break__grid.is-media-unavailable'), 'Reality Workspace must reflow when media is unavailable');
assert.ok(spineCss.includes('.rs-visual-grid.is-media-unavailable'), 'Runtime Spine must reflow when media is unavailable');
assert.ok(/\.rw-visual-break__media img[\s\S]*?object-fit:\s*contain/.test(workspaceCss), 'Reality Workspace supporting illustration must show the whole asset instead of clipping it');
assert.ok(/\.rs-figure img[\s\S]*?object-fit:\s*contain/.test(spineCss), 'Runtime Spine supporting figures must show the whole asset instead of clipping it');

const navigationHtml = read('reality-navigation.html');
const navigationCss = read('assets/css/navigation-visual-alignment.css');
assert.ok(navigationHtml.includes('class="runtime-workspace-main navigation-shell"'), 'Reality Navigation must retain the canonical workspace main');
assert.ok(navigationCss.includes('PUXR-W3'), 'Reality Navigation must carry the PUXR-W3 geometry repair');
assert.ok(/\.navigation-page \.runtime-workspace-layout\s*\{[\s\S]*?grid-template-columns:\s*clamp\([^;]+\)\s+minmax\(0,\s*1fr\)/.test(navigationCss), 'Desktop Navigation must reserve a bounded rail and a flexible readable main column');
assert.ok(/\.navigation-page \.runtime-workspace-main\.navigation-shell\s*\{[\s\S]*?width:\s*min\(82\.5rem/.test(navigationCss), 'Navigation main must expand to a usable workspace width');
assert.ok(/@media \(max-width:\s*900px\)[\s\S]*?\.navigation-page \.runtime-workspace-layout\s*\{[\s\S]*?grid-template-columns:\s*1fr/.test(navigationCss), 'Navigation must collapse to one column on smaller screens');

const frozenHashes = reconciliation.invariants.frozenKapAuthoritySha256;
for (const [path, expected] of Object.entries(frozenHashes)) {
  assert.equal(sha256(path), expected, `Frozen KAP authority changed unexpectedly: ${path}`);
}

for (const file of reconciliation.deltaFiles) {
  assert.ok(fs.existsSync(file.path), `Delta file missing: ${file.path}`);
  assert.equal(sha256(file.path), file.sha256, `Delta file fingerprint drift: ${file.path}`);
}

console.log('✓ PUXR-W1 Ask PHI OS single-hero + readable answer surface passed.');
console.log('✓ PUXR-W2 verified visual consumption + fail-soft blank-panel collapse passed.');
console.log('✓ PUXR-W3 Reality Navigation usable desktop/mobile geometry passed.');
console.log('✓ PUXR-W4 Ask PHI OS fail-closed question relevance guard passed without changing KAP authority.');
console.log(`✓ ${reconciliation.deltaFiles.length} delta fingerprints match eb1b067 page-usability successor.`);
