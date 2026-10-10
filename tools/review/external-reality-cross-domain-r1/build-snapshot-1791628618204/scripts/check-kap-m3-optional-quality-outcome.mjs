import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {composeDeterministicKapAnswer} from '../functions/_lib/knowledge-answer-composition.js';
import {assertKapEvidenceOrMaintenance} from './lib/knowledge-answer-projection/kap-maintenance-successor-v1.mjs';

const root = 'content/knowledge/answer-projection';
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const bundle = read(`${root}/fixtures/knowledge-grounding-bundle.valid.json`);
const coverage = read(`${root}/fixtures/kap-coverage-decision.valid.json`);
const expected = read(`${root}/fixtures/question-scoped-knowledge-answer.strong.valid.json`);
const compose = coverageDecision => composeDeterministicKapAnswer({bundle, coverageDecision, depth: 'STANDARD', now: new Date('2026-08-14T02:00:00Z')});
// Keep the historical output exact, including key absence, rather than updating its golden fixture.
for (const extra of [{}, {ptrcQuality: null}, {ptrcQuality: {outcome: null}}]) {
  const answer = compose({...coverage, ...extra});
  assert.deepEqual(answer, expected);
  assert.equal(Object.hasOwn(answer, 'qualityOutcome'), false);
}
for (const outcome of ['SUFFICIENT', 'PARTIAL', 'AMBIGUOUS', 'CONTRADICTORY', 'INSUFFICIENT']) {
  const answer = compose({...coverage, answerCompositionEligible: outcome === 'SUFFICIENT', shortSupportedAnswerEligible: outcome === 'PARTIAL', ptrcQuality: {outcome}});
  assert.equal(answer.qualityOutcome, outcome);
  if (outcome !== 'SUFFICIENT') assert.equal(answer.content.mechanism.length, 0);
}
const predecessor = read(`${root}/maintenance/kap-m2-ptrc-ask-quality-successor-v1.json`).changes.find(x => x.path === 'functions/_lib/knowledge-answer-composition.js');
const successor = read(`${root}/maintenance/kap-m3-optional-quality-outcome-successor-v1.json`);
assert.equal(successor.changes[0].predecessorSha256, predecessor.successorSha256);
assertKapEvidenceOrMaintenance({path: predecessor.path, sha256: predecessor.successorSha256});
// Prove this successor is exactly the optional-field repair against the registered predecessor.
const source = fs.readFileSync(predecessor.path, 'utf8');
const restored = source.replace('...(ptrcOutcome ? {qualityOutcome: ptrcOutcome} : {}),', 'qualityOutcome: ptrcOutcome,');
assert.notEqual(restored, source);
if(crypto.createHash('sha256').update(source).digest('hex')===successor.changes[0].successorSha256){
  assert.equal(crypto.createHash('sha256').update(restored).digest('hex'), predecessor.successorSha256);
}else{
  // Later registered M4/M5 changes cannot be undone by reversing only the M3 line.
  assertKapEvidenceOrMaintenance({path:predecessor.path,sha256:successor.changes[0].successorSha256});
}
const manifest = read('site.webmanifest');
const brand = read('content/production-truth/brand/ptrc-w1-brand-asset-registry-v1.json');
assert.equal(manifest.icons[0].src, brand.records.find(x => x.assetId === 'LOGO-012').publicUrl);
console.log('✓ KAP-M3 legacy output exact; five PTRC outcomes retained; registered successor chain verified; approved app icon bound.');
