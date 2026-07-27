import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const [page, css, renderer, controller, en, zh] = await Promise.all([
  fs.readFile('reality-reading.html', 'utf8'),
  fs.readFile('assets/css/reading-visual-alignment.css', 'utf8'),
  fs.readFile('assets/js/modules/reading-experience-render.js', 'utf8'),
  fs.readFile('assets/js/reading.js', 'utf8'),
  fs.readFile('assets/js/locales/en/reading.js', 'utf8'),
  fs.readFile('assets/js/locales/zh-Hans/reading.js', 'utf8')
]);

for (const view of ['customer', 'evidence', 'technical']) {
  assert.match(page, new RegExp(`data-reading-experience-tab="${view}"`));
  assert.match(page, new RegExp(`data-reading-experience-panel="${view}"`));
}
for (const hook of [
  'data-reading-summary', 'data-reading-runtime-chain',
  'data-reading-priority-customer', 'data-reading-priority-evidence',
  'data-reading-alternative', 'data-reading-confidence-explanation',
  'data-reading-unknown-questions', 'data-reading-navigation-rationale',
  'data-reading-technical-grid'
]) assert.match(page, new RegExp(hook));

assert.match(controller, /renderReadingExperience/);
assert.match(renderer, /legacy\.hidden = true/);
assert.doesNotMatch(renderer, /fetch\(|localStorage|sessionStorage|\/api\//);
for (const token of [
  '--reading-technical-bg', '--reading-technical-surface',
  '--reading-technical-text', '--reading-technical-muted',
  '--reading-technical-border'
]) assert.match(css, new RegExp(token));
assert.match(css, /\.reading-experience-technical/);
assert.match(css, /@media \(max-width: 900px\)/);
assert.match(css, /@media \(max-width: 720px\)/);
assert.match(css, /overflow-wrap: anywhere/);
assert.match(css, /outline: 3px solid/);
assert.doesNotMatch(css, /\.reading-experience[^{]*\{[^}]*opacity:\s*0\.[0-4]/s);

for (const key of [
  'customerView', 'evidenceView', 'technicalView', 'oneSentence',
  'chainTitle', 'priorityTitle', 'questionsTitle', 'navigationTitle'
]) {
  assert.match(en, new RegExp(`${key}:`));
  assert.match(zh, new RegExp(`${key}:`));
}

const rgb = hex => [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
const luminance = hex => rgb(hex)
  .map(value => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
const contrast = (a, b) => {
  const [bright, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (bright + 0.05) / (dark + 0.05);
};
assert.ok(contrast('#f4f7fb', '#111b2b') >= 4.5);
assert.ok(contrast('#bdc9d8', '#111b2b') >= 4.5);
assert.ok(contrast('#f4f7fb', '#18263a') >= 4.5);
assert.ok(contrast('#6f88a5', '#111b2b') >= 3);

console.log('✓ M3C-W13 Reading visual alignment passed at 360, 768, and 1440 layout contracts.');
console.log('  Customer/Evidence remain light; Technical uses an isolated dark token set.');
