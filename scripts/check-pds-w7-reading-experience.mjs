import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const hash = source => crypto.createHash('sha256')
  .update(source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8')
  .digest('hex');
const registry = JSON.parse(await read('content/registry/pds-w7-reading-experience.json'));

assert.equal(registry.baseline.commit, '7c7a633549224d41ca4107bb8f384458f7322c55');
assert.equal(registry.scope.presentationOnly, true);
for (const [file, expected] of Object.entries(registry.protectedArtifacts)) {
  assert.equal(hash(await read(file)), expected, `Protected Reading artifact changed: ${file}`);
}

const page = await read('reality-reading.html');
for (const contract of [
  '/assets/css/reading-pds-w7.css',
  'data-reading-experience-panel="customer"',
  'data-reading-experience-panel="evidence" hidden',
  'data-reading-experience-panel="technical" hidden',
  'data-reading-known',
  'data-reading-unconfirmed',
  'data-reading-conflicts',
  'data-reading-confidence-summary',
  'class="reading-confidence-detail"'
]) {
  assert.equal(page.includes(contract), true, `Missing W7 page contract: ${contract}`);
}

const renderer = await read('assets/js/modules/reading-experience-render.js');
assert.equal(renderer.includes('<details class="reading-evidence-card">'), true);
assert.equal(renderer.includes('value.ready'), true);
for (const forbidden of ['fetch(', 'localStorage', 'sessionStorage']) {
  assert.equal(renderer.includes(forbidden), false, `W7 renderer crosses projection boundary: ${forbidden}`);
}

const css = await read('assets/css/reading-pds-w7.css');
for (const contract of [
  '.reading-certainty-grid',
  '.reading-experience-technical',
  '@media (max-width: 360px)',
  '@media (max-width: 768px)',
  '@media (min-width: 1440px)',
  '@media (prefers-reduced-motion: reduce)'
]) {
  assert.equal(css.includes(contract), true, `Missing W7 style contract: ${contract}`);
}

console.log('PDS-W7 Reading Experience checks passed.');
