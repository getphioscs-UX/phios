import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

import './check-hpc2-w7-frozen-artifacts.mjs';

const text = path => fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const read = path => JSON.parse(text(path));
const digest = value => crypto.createHash('sha256').update(value, 'utf8').digest('hex');
const count = (source, pattern) => [...source.matchAll(pattern)].length;
const sceneMarkup = (source, code) => {
  const marker = source.indexOf(`data-hpc2-scene="${code}"`);
  assert.ok(marker >= 0, `${code} marker missing`);
  const start = source.lastIndexOf('<section', marker);
  const end = source.indexOf('</section>', marker);
  assert.ok(start >= 0 && end > marker, `${code} section boundary missing`);
  return source.slice(start, end + '</section>'.length);
};

const html = text('index.html');
const w7Freeze = read('content/web/homepage/hpc2/freeze/hpc2-w7-reality-surface-freeze-v1.json');
const w8 = read('content/web/homepage/hpc2/contracts/hpc2-w8-five-volume-knowledge-composition-contract-v1.json');
const w9 = read('content/web/homepage/hpc2/contracts/hpc2-w9-academy-services-professional-composition-contract-v1.json');
const pkg = read('package.json');

for (const scene of ['H01', 'H02', 'H03', 'H04', 'H05', 'H06', 'H07', 'H08']) {
  assert.equal(count(html, new RegExp(`data-hpc2-scene="${scene}"`, 'g')), 1, `${scene} count drift`);
}
assert.equal(count(html, /data-hpc2-scene="H09"/g), 0, 'H09 implemented before HPC2-W10');
for (const scene of ['H01', 'H02', 'H03', 'H04', 'H05', 'H06']) {
  assert.equal(digest(sceneMarkup(html, scene)), w7Freeze.structuralFreeze[`${scene.toLowerCase()}MarkupSha256`], `Frozen W7 ${scene} markup drift`);
}
assert.equal(w8.predecessorProtection.h01H06ChangedByW8, false);
assert.equal(w9.predecessorProtection.h01H07ChangedByW9, false);
assert.equal(/href=["']\/reality\/?["']/.test(html), false, '/reality/ activated prematurely');
assert.equal(pkg.scripts['check:hpc2-w7-frozen'], 'node scripts/check-hpc2-w7-frozen-artifacts.mjs');
assert.equal(pkg.scripts['check:hpc2-w7'], 'node scripts/check-hpc2-w7-current.mjs');

console.log('HPC2-W7 current successor: ACCEPTED');
console.log('  frozen H01-H06 and immutable W7 evidence preserved; additive H07/H08 are governed by HPC2-W8/W9');
console.log('  H09 and /reality/ remain inactive; no Human/browser decision fabricated');
