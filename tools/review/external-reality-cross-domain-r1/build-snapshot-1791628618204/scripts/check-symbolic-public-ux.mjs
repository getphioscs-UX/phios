import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createSymbolicPublicViewModel } from '../functions/symbolic-method-public-ux/symbolic-public-view-model.js';

const text = path => fs.readFileSync(path, 'utf8');
const json = path => JSON.parse(text(path));
const base = 'content/public-ux/symbolic-method';

for (const path of [
  'contracts/symbolic-entry-positioning-contract-v1.json',
  'contracts/symbolic-method-context-screen-contract-v1.json',
  'contracts/symbolic-question-input-contract-v1.json',
  'contracts/symbolic-result-hierarchy-contract-v1.json',
  'contracts/symbolic-evidence-visibility-contract-v1.json',
  'contracts/symbolic-source-visibility-contract-v1.json',
  'contracts/symbolic-save-contract-v1.json',
  'contracts/symbolic-continue-contract-v1.json',
  'contracts/symbolic-reality-context-disclosure-contract-v1.json',
  'contracts/symbolic-guest-contract-v1.json',
  'contracts/symbolic-complex-case-handoff-contract-v1.json',
  'acceptance/symbolic-public-ux-acceptance-v1.json'
]) assert.ok(fs.existsSync(`${base}/${path}`), path);

const perspectives = text('perspectives/index.html');
assert.ok(perspectives.includes('data-cx-surface="PERSPECTIVES"'));
assert.ok(perspectives.includes('href="/perspectives/iching/"'));
assert.ok(perspectives.includes('href="/perspectives/tarot/"'));

const iching = text('perspectives/iching/run/index.html');
const layers = [...iching.matchAll(/data-result-layer="([A-Z_]+)"/g)].map(match => match[1]);
assert.deepEqual(layers, [
  'YOUR_INPUT',
  'METHOD_EVIDENCE',
  'PROJECTION',
  'SYMBOLIC_INTERPRETATION',
  'REALITY_COMPARISON',
  'WHAT_REMAINS_UNCERTAIN',
  'POSSIBLE_NEXT_QUESTIONS_ACTIONS'
]);
for (const marker of [
  'data-cx-surface="ICHING_FULL_PRODUCTION"',
  'What are you trying to understand?',
  'Current Reality context is not being used.',
  'View sources',
  'Ask PHI OS',
  'Continue in My Reality',
  'data-complex-journey hidden',
  'data-iching-execute disabled'
]) assert.ok(iching.includes(marker), marker);
for (const bad of ['Get your fortune', 'I Ching prediction', 'What will happen?</']) {
  assert.equal(iching.includes(bad), false, bad);
}

const tarot = text('perspectives/tarot/index.html');
for (const marker of [
  'data-cx-surface="TAROT_READING"',
  'This is not a guaranteed prediction.',
  'data-symbolic-execute disabled',
  'data-symbolic-save disabled',
  'href="/knowledge/ask/"',
  'href="/reality/"'
]) assert.ok(tarot.includes(marker), marker);

for (const runtimePath of [
  'assets/customer-ui/js/surfaces/iching-full.js',
  'assets/customer-ui/js/surfaces/tarot.js'
]) {
  const runtime = text(runtimePath);
  for (const primitive of ['localStorage', 'sessionStorage']) {
    assert.equal(runtime.includes(primitive), false, `hidden persistence primitive ${runtimePath}:${primitive}`);
  }
}

const ichingView = createSymbolicPublicViewModel({
  method: 'I_CHING',
  question: 'What am I trying to understand?',
  methodEvidence: {
    sixLines: [7, 7, 7, 7, 7, 7],
    primaryHexagram: { hexagramId: 'HEXAGRAM-01' },
    changingLines: [],
    relatingHexagram: { hexagramId: 'HEXAGRAM-01' }
  },
  projection: { type: 'HEXAGRAM' },
  interpretation: { sourceId: 'ICH-SRC-LEGGE-1882', perspectiveId: 'ICH-PERSPECTIVE-LEGGE' },
  unknowns: ['Future outcome is not established.']
});
assert.equal(ichingView.hierarchy[1].data.sixLines.length, 6);
assert.equal(ichingView.authority.establishesFacts, false);

const tarotView = createSymbolicPublicViewModel({
  method: 'TAROT',
  question: 'What deserves attention?',
  methodEvidence: {
    deck: { deckId: 'RWS_1909_STRUCTURAL_FAMILY' },
    draw: [{ cardId: 'RWS-MAJOR-00' }],
    orientation: 'UPRIGHT',
    spread: 'ONE_CARD',
    position: ['WHAT_DESERVES_ATTENTION']
  },
  projection: { type: 'CARD' },
  interpretation: { sourceId: 'TAR-SRC-WAITE-PKT-1910', perspectiveId: 'TAR-PERSPECTIVE-WAITE-AUTHOR-SPECIFIC' },
  complexity: { isComplex: false }
});
assert.equal(tarotView.hierarchy[1].data.orientation, 'UPRIGHT');
assert.equal(tarotView.complexCaseHandoff.show, false);

const catalog = json('content/web-production/px2/successors/public-method-catalog-v5.json');
const tarotMethod = catalog.methods.find(method => method.methodCode === 'TAROT');
assert.equal(tarotMethod.route, '/perspectives/tarot/');
assert.equal(tarotMethod.legacyCompatibilityRoute, '/readings/symbolic/');
assert.equal(tarotMethod.staticCatalogMayGrantRunAllowed, false);
assert.equal(tarotMethod.runtimeAuthorityRequired, true);

assert.equal(fs.existsSync('readings/symbolic/index.html'), false);
console.log('✓ PHASE 10 Public UX UX-W0–W10 passed on canonical I Ching and Tarot perspectives; the retired shared symbolic page remains absent.');
