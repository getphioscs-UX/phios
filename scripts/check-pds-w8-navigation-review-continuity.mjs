import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const hash = source => crypto.createHash('sha256')
  .update(source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8')
  .digest('hex');
const registry = JSON.parse(await read('content/registry/pds-w8-navigation-review-continuity.json'));

assert.equal(registry.scope.presentationOnly, true);
assert.equal(registry.protectedPrinciples.nonPrescriptiveNavigation, true);
for (const [file, expected] of Object.entries(registry.protectedArtifacts)) {
  assert.equal(hash(await read(file)), expected, `Protected W8 artifact changed: ${file}`);
}

const navigationPage = await read('reality-navigation.html');
const reviewPage = await read('reality-review.html');
const memoryPage = await read('my-reality.html');
for (const contract of [
  'navigation.w8.compareTitle',
  'navigation.w8.pauseTitle',
  'data-navigation-execution'
]) assert.equal(navigationPage.includes(contract), true, `Missing Navigation W8 contract: ${contract}`);
for (const contract of [
  'review-change-state is-changed',
  'review-change-state is-unchanged',
  'review-change-state is-unknown',
  'review.w8.pauseTitle'
]) assert.equal(reviewPage.includes(contract), true, `Missing Review W8 contract: ${contract}`);
for (const contract of [
  'memory.w8.sameJourneyTitle',
  'memory.w8.newJourneyTitle',
  'memory.w8.resumeNote'
]) assert.equal(memoryPage.includes(contract), true, `Missing Continuity W8 contract: ${contract}`);

const renderer = await read('assets/js/modules/navigation-execution-render.js');
for (const contract of [
  'function evidenceLog(action)',
  'function reviewGate(action)',
  'action.review_gate?.review_payload_ready === true',
  '<details class="navigation-evidence-log">'
]) assert.equal(renderer.includes(contract), true, `Missing W8 renderer contract: ${contract}`);
const evidenceLogBlock = renderer.slice(
  renderer.indexOf('function evidenceLog(action)'),
  renderer.indexOf('function reviewGate(action)')
);
for (const forbidden of ['log.log_id', 'navigation_action_id', 'blocking_items.join']) {
  assert.equal(evidenceLogBlock.includes(forbidden), false, `Customer projection exposes internal field: ${forbidden}`);
}

const css = await read('assets/css/pds-w8-navigation-review-continuity.css');
for (const contract of [
  '.navigation-choice-boundary',
  '.navigation-review-gate',
  '.review-change-state.is-unknown',
  '.continuity-branch-explainer',
  '@media (max-width: 360px)',
  '@media (max-width: 768px)',
  '@media (min-width: 1440px)',
  '@media (prefers-reduced-motion: reduce)'
]) assert.equal(css.includes(contract), true, `Missing W8 style contract: ${contract}`);

console.log('PDS-W8 Navigation, Review and Continuity checks passed.');
