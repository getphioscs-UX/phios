import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';

const read = file => fs.readFile(file, 'utf8');
const sha256 = async file => crypto
  .createHash('sha256')
  .update(await read(file))
  .digest('hex');

const [
  page,
  renderer,
  css,
  atlasEn,
  atlasZh,
  readingEn,
  readingZh,
  registry,
  packageJson
] = await Promise.all([
  read('reality-reading.html'),
  read('assets/js/modules/reading-experience-render.js'),
  read('assets/css/reading-visual-alignment.css'),
  read('assets/js/locales/en/atlas.js'),
  read('assets/js/locales/zh-Hans/atlas.js'),
  read('assets/js/locales/en/reading.js'),
  read('assets/js/locales/zh-Hans/reading.js'),
  read('content/registry/m3c-reading-experience.json').then(JSON.parse),
  read('package.json').then(JSON.parse)
]);

assert.match(atlasEn, /title: 'Reading Science'/);
assert.match(
  atlasEn,
  /Why reality can be observed, how evidence forms, how interpretive interfaces contribute, and how PHI OS creates a unified reading\./
);
assert.match(atlasZh, /title: '读取科学 Reading Science'/);
assert.match(
  atlasZh,
  /现实为何能够被观察，证据如何形成，解释接口如何参与，以及 PHI OS 如何形成统一 Reading。/
);
assert.doesNotMatch(`${atlasEn}\n${atlasZh}`, /Reality Reading Architecture|现实读取架构/);

assert.match(readingEn, /Start with the clearest current understanding, then review its basis and limits when you need them\./);
assert.match(readingZh, /先看目前最清楚的理解，需要时再查看它的依据与边界。/);
assert.match(readingEn, /Current Reading maturity/);
assert.match(readingZh, /当前读取成熟度/);

for (const label of [
  'Evidence Coverage',
  'Pattern Stability',
  'Interpretation Boundary',
  'Unknown Penalty',
  'Evidence Summary',
  'Observed',
  'Reported',
  'Interpretation',
  'Unknown'
]) assert.match(page, new RegExp(label));
assert.match(renderer, /renderConfidenceComponents/);
assert.match(renderer, /renderEvidenceSummary/);
assert.doesNotMatch(
  page.slice(
    page.indexOf('data-reading-confidence-components'),
    page.indexOf('data-reading-confidence-components') + 700
  ),
  /<pre>|JSON/
);

for (const hook of [
  'data-reading-unconfirmed',
  'data-reading-observe-next',
  'data-reading-may-change'
]) assert.match(page, new RegExp(hook));
assert.match(page, /data-reading-unknown-questions/);

assert.deepEqual(
  [...renderer.matchAll(/\['(Reading Contract|Runtime Metadata|Evidence Model|Confidence Components|Revision History|Navigation Handoff)'/g)]
    .map(match => match[1]),
  [
    'Reading Contract',
    'Runtime Metadata',
    'Evidence Model',
    'Confidence Components',
    'Revision History',
    'Navigation Handoff'
  ]
);
assert.match(renderer, /<pre>\$\{json\(value \|\| \{\}\)\}<\/pre>/);

for (const [figure, name] of [
  ['13A', 'Observation Layers'],
  ['13B', 'Runtime Coordinates'],
  ['13C', 'Capability Map'],
  ['13D', 'Interpretive Interfaces'],
  ['13E', 'Reading Contract']
]) {
  assert.match(page, new RegExp(`Figure ${figure}`));
  assert.match(page, new RegExp(name));
}

assert.match(readingEn, /Reading is frozen\. Navigation references the Reading Contract, Evidence, Unknown, and Current Tension without reinterpreting the Reading\./);
assert.match(readingZh, /Reading 已冻结。Navigation 将引用 Reading Contract、Evidence、Unknown 与 Current Tension，不会重新解释 Reading。/);

for (const responsive of [
  '@media (max-width: 900px)',
  '@media (max-width: 720px)',
  '.reading-confidence-components',
  '.reading-customer-unknowns',
  '.reading-evidence-summary',
  '.reading-figure-index'
]) assert.match(css, new RegExp(responsive.replace(/[()[\].]/g, '\\$&')));

assert.equal(
  await sha256('functions/runtime/reading/rule-reading.js'),
  registry.authorizedFrozenArtifactUpdates['functions/runtime/reading/rule-reading.js'],
  'W15 must not modify the W13-frozen Rule Reading integration'
);
assert.equal(
  packageJson.scripts['check:m3c-reading-production-polish'],
  'node scripts/check-m3c-reading-production-polish.mjs'
);

console.log('✓ M3C-W15 Reality Reading Production Polish passed.');
console.log('  Atlas Part 13, Reading maturity, three views, Figures 13A–13E and frozen Navigation handoff are aligned.');
console.log('  Reading Engine, Rule Engine, Runtime Contract and API remain unchanged by W15.');
