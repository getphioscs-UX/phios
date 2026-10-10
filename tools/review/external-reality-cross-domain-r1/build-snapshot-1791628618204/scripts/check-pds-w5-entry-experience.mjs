import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const readJson = async file => JSON.parse(await read(file));

function hash(source) {
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

const registry = await readJson('content/registry/pds-w5-entry-experience.json');
assert.equal(registry.baseline.commit, 'eb462d91c62144aa52f405cdceba60516665141c');
assert.equal(registry.scope.presentationOnly, true);

for (const [file, expected] of Object.entries(registry.protectedArtifacts)) {
  assert.equal(hash(await read(file)), expected, `Protected Entry behavior changed: ${file}`);
}

const page = await read('reality-entry.html');
for (const contract of [
  '/assets/css/entry-experience.css',
  '/assets/js/entry-experience.js',
  'id="entryExperienceStatus"',
  'id="entryReturnToInput"',
  'data-entry-composer-state="idle"',
  'data-i18n="entry.experience.clarityLegend"'
]) {
  assert.equal(page.includes(contract), true, `Missing W5 page contract: ${contract}`);
}
assert.equal(page.includes('Schema v1.0'), false, 'Customer View must not expose schema version');

const experience = await read('assets/js/entry-experience.js');
for (const forbidden of [
  'fetch(',
  'postJSON',
  'setSession',
  'localStorage',
  'sessionStorage',
  'entry_complete',
  'answerBindings',
  'requestSubmit'
]) {
  assert.equal(experience.includes(forbidden), false, `Presentation layer may not use: ${forbidden}`);
}
assert.equal(experience.includes("input?.focus()"), true);
assert.equal(experience.includes("return 'submitting'"), true);
assert.equal(experience.includes("return 'failed'"), true);

const css = await read('assets/css/entry-experience.css');
for (const contract of [
  '[data-entry-composer-state="inputting"]',
  '[data-entry-composer-state="submitting"]',
  '[data-entry-composer-state="failed"]',
  '[data-clarity="clear"]',
  '[data-clarity="pending"]',
  '@media (max-width: 768px)',
  '@media (max-width: 360px)',
  '@media (min-width: 1440px)',
  '@media (prefers-reduced-motion: reduce)'
]) {
  assert.equal(css.includes(contract), true, `Missing W5 visual contract: ${contract}`);
}

for (const localeFile of [
  'assets/js/locales/en/entry.js',
  'assets/js/locales/zh-Hans/entry.js'
]) {
  const locale = await read(localeFile);
  for (const key of ['idle:', 'inputting:', 'submitting:', 'failed:', 'returnToInput:', 'clear:', 'pending:']) {
    assert.equal(locale.includes(key), true, `${localeFile} is missing ${key}`);
  }
}

console.log('PDS-W5 Entry Experience checks passed.');
