import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';

const read = file => fs.readFile(file, 'utf8');
const sha256 = async file => crypto.createHash('sha256').update(await read(file)).digest('hex');

const [page, renderer, css, en, zh, contract] = await Promise.all([
  read('reality-reading.html'),
  read('assets/js/modules/reading-experience-render.js'),
  read('assets/css/reading-pds-w7.css'),
  read('assets/js/locales/en/reading.js'),
  read('assets/js/locales/zh-Hans/reading.js'),
  read('docs/experience/EXP-W5-reading-value-reveal-contract.json').then(JSON.parse)
]);

assert.equal(contract.freezeId, 'EXP-W5-v1.0.0-Frozen');
assert.equal(contract.baselineCommit, 'c428599d563cb4c98ca47ec99415ba93748d2e67');
assert.equal(contract.score.total >= 13, true);
assert.equal(Object.values(contract.boundaries).every(value => value === false), true);

const orderedHooks = [
  'data-reading-experience-field="one_sentence_reading"',
  'data-reading-value="what_changed"',
  'data-reading-value="persistence"',
  'data-reading-known',
  'data-reading-unconfirmed',
  'data-reading-observe-next'
];
let prior = -1;
for (const hook of orderedHooks) {
  const index = page.indexOf(hook);
  assert.equal(index > prior, true, `Customer sequence is out of order: ${hook}`);
  prior = index;
}
assert.equal((page.match(/class="reading-value-step /g) || []).length, 6);

const customerStart = page.indexOf('data-reading-experience-panel="customer"');
const evidenceStart = page.indexOf('data-reading-experience-panel="evidence"');
const technicalTab = page.indexOf('data-reading-experience-panel="technical"');
const coordinateModel = page.indexOf('id="coordinateSection"');
const actions = page.indexOf('class="reading-actions"');
assert(customerStart > -1 && customerStart < evidenceStart && evidenceStart < technicalTab);
assert(actions < coordinateModel, 'Technical model must follow customer result and actions.');
assert.match(page, /data-reading-experience-panel="evidence" hidden/);
assert.match(page, /data-reading-experience-panel="technical" hidden/);
assert.match(page, /<details class="reading-technical-disclosure">/);
assert.doesNotMatch(page.slice(customerStart, evidenceStart), /Runtime Coordinates|Capability Map|Reading Interfaces|Figure 13/);

for (const hook of [
  'data-reading-related-conditions', 'data-reading-priority-customer',
  'data-reading-conflicts', 'data-reading-confidence-summary',
  'data-reading-alternative', 'data-reading-kind'
]) assert.match(`${page}\n${renderer}`, new RegExp(hook));

for (const text of [
  'The core change taking place', 'Why it may continue',
  'What has been confirmed', 'What remains unclear',
  'What is worth noticing next', 'Confirm this Reading and continue',
  'Something is inaccurate — return to Reconstruction'
]) assert.match(en, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

for (const text of [
  '正在发生的核心变化', '它为什么可能持续', '已经确认什么',
  '仍然不清楚', '下一步值得关注什么', '确认这份读取并继续',
  '内容不准确——返回现实重建修正'
]) assert.match(zh, new RegExp(text));

for (const selector of [
  '.reading-value-sequence', '.reading-value-step--confirmed',
  '.reading-value-step--unknown', '.reading-supporting-layer',
  '[data-reading-kind="interpretation"]', '@media (max-width: 360px)',
  '@media (max-width: 768px)', '@media (min-width: 1440px)'
]) assert.match(css, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

const protectedArtifacts = {
  'functions/runtime/reading/reading-experience.js': '526893502a90d0769e8abd3055d7914b430f46889c596cb2070db5a71c4decf6',
  'functions/runtime/reading/rule-reading.js': '03352e4a0ae8d0d9aac9e5c4354c6f5a6e76ec0443b5cd8e7bab98a4762a5fd4',
  'functions/runtime/reading/reading-evidence-contract.js': 'eb52b681592dc9eb3f2cecb082c3385b38db05188b81ba2d2e69e6ea73a488d9',
  'functions/runtime/navigation/reading-navigation-contract.js': 'e13cbe27699a2c8ace980eab46c7ba22c379ff97d82db7e121def2726b6f3001',
  'assets/js/modules/reading-navigation.js': 'ebe4845003c7c35b5dd168a552a47c90dadb9a50a5d87656ec23058ea9d521f3',
  'assets/js/modules/reading-loader.js': 'e7c28a8ac849b68f27042508780274964660137affbdb2b666b71e8c609b4e7b'
};
for (const [file, expected] of Object.entries(protectedArtifacts)) {
  assert.equal(await sha256(file), expected, `Protected Reading boundary changed: ${file}`);
}

assert.deepEqual((await read('_redirects')).trim().split(/\r?\n/), [
  '/reality-demo /reality-journey 308',
  '/reality-demo.html /reality-journey 308'
]);

console.log('✓ EXP-W5 Reading Value Reveal passed locally.');
console.log('  Customer understanding precedes evidence and technical structure; Reading/Navigation contracts remain frozen.');
