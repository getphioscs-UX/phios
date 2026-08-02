import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const navigation = read('reality-navigation.html');
const review = read('reality-review.html');
const memory = read('my-reality.html');
const renderer = read('assets/js/modules/navigation-render.js');
const css = read('assets/css/exp-w6-task-separation.css');
const registry = JSON.parse(read('content/registry/pds-w8-navigation-review-continuity.json'));

for (const phrase of ['whyNow', 'howToAct', 'whatChanges', 'validSignal', 'invalidSignal', 'reviewTime']) {
  assert.ok(renderer.includes(`navigation.expW6.${phrase}`), `Navigation direction missing ${phrase}`);
}
assert.ok(navigation.includes('exp-w6-supporting-status'), 'Navigation operational status must be supporting disclosure');
assert.ok(review.includes('review.expW6.primaryAction'), 'Review primary action is not customer-facing');
assert.ok(review.includes('exp-w6-review-handoff'), 'Review saved-Journey handoff is not secondary');
assert.ok(memory.includes('memory.expW6.savedJourney') && memory.includes('memory.expW6.savedReading') && memory.includes('memory.expW6.savedActions'), 'Memory customer overview incomplete');
assert.ok(memory.includes('exp-w6-technical-identifiers') && memory.includes('exp-w6-technical-history'), 'Memory technical data is not restricted');
for (const action of ['continueJourney', 'newVersion', 'newTopic', 'pause', 'resume', 'end']) {
  assert.ok(memory.includes(`memory.expW6.${action}`), `Continuity action missing ${action}`);
}
assert.ok(css.includes('.exp-w6-compatible-control { display: none !important; }'), 'Compatibility controls must stay outside customer layer');
assert.ok(css.includes('@media (max-width: 48rem)'), 'Responsive task separation missing');

for (const [artifact, expected] of Object.entries(registry.protectedArtifacts || {})) {
  const actual = createHash('sha256').update(read(artifact)).digest('hex');
  assert.equal(actual, expected, `Protected artifact changed: ${artifact}`);
}

console.log('✓ EXP-W6 Navigation, Review, Memory and Continuity passed locally.');
console.log('  Four customer tasks are separated; protected Runtime, Review, persistence and Continuity artifacts remain unchanged.');
