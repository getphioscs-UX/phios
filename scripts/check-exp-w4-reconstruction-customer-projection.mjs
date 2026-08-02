import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(path, 'utf8');
const contract = JSON.parse(await read('docs/experience/EXP-W4-reconstruction-customer-projection-contract.json'));
const page = await read('reality-reconstruction.html');
const renderer = await read('assets/js/modules/reconstruction-experience-render.js');
const alignment = await read('assets/js/modules/reconstruction-visual-alignment.js');
const css = await read('assets/css/reconstruction-exp-w4.css');
const runtime = await read('functions/runtime/reconstruction/reconstruction-experience.js');
const en = await read('assets/js/locales/en/reconstruction.js');
const zh = await read('assets/js/locales/zh-Hans/reconstruction.js');

assert.equal(contract.freezeId, 'EXP-W4-v1.0.0-Frozen');
assert.equal(contract.baselineCommit.length, 40);
assert.equal(contract.score.total >= 13, true);
assert.deepEqual(contract.customerViews, [
  'current_change', 'development_timeline', 'influencing_conditions',
  'confirmed_facts', 'unresolved_parts'
]);
assert.equal(Object.values(contract.boundaries).every(value => value === false), true);

assert.match(page, /reconstruction-exp-w4\.css/);
assert.match(page, /data-current-stage="discover"/);
assert.deepEqual(
  [...page.matchAll(/<data value="(enter|describe|discover|understand|choose|continue)"/g)].map(match => match[1]),
  ['enter', 'describe', 'discover', 'understand', 'choose', 'continue']
);
assert.match(page, /<details class="technical-record" hidden>/);
assert.match(css, /\[data-runtime-workspace\][\s\S]*display: none !important/);
assert.match(css, /\.reconstruction-evidence-summary/);
assert.match(alignment, /summary\?\.classList\.add\('hidden'\)/);

for (const key of [
  'customerChangeTitle', 'customerProcessTitle', 'customerConditionsTitle',
  'customerConfirmedTitle', 'customerUnknownTitle'
]) assert.match(renderer, new RegExp(`reconstruction\\.${key}`));

for (const behavior of [
  "targetType: 'timeline_event'", "targetType: 'condition'",
  "targetType: 'influence_relation'", "targetType: 'evidence'",
  "targetType: 'unknown_question'", "field: 'confirmation_status'",
  'data-open-evidence-view', 'w14-version-confirmation',
  '/reality-entry?mode=revise&amp;target=timing'
]) assert.equal(renderer.includes(behavior), true, `Missing customer behavior: ${behavior}`);

const customerLayer = renderer.slice(
  renderer.indexOf('<div data-w14-view="customer">'),
  renderer.indexOf('<div data-w14-view="evidence" hidden>')
);
for (const forbidden of ['source_field', 'figure_mapping', 'raw_text', 'schema_version']) {
  assert.equal(customerLayer.includes(forbidden), false, `Default customer layer exposes ${forbidden}`);
}
assert.match(renderer, /<div data-w14-view="technical" hidden>/);
for (const key of [
  'modifyChange', 'adjustTimeline', 'addMissingEvent', 'reviewFacts',
  'removeConnection', 'unknownNotError', 'explainOrganization',
  'versionConfirmation', 'versionConfirmationCopy', 'multipleSources',
  'limitedSources', 'temporalConflict'
]) {
  assert.equal(en.includes(`${key}:`), true, `English locale missing ${key}`);
  assert.equal(zh.includes(`${key}:`), true, `Chinese locale missing ${key}`);
}

for (const behavior of [
  'previous_versions', 'revision_history', 'downstream_staleness',
  "status: materiality === 'material' ? 'stale'"
]) assert.equal(runtime.includes(behavior), true, `Revision propagation missing ${behavior}`);

console.log('✓ EXP-W4 Reconstruction customer projection acceptance passed.');
