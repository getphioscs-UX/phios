import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const text = path => fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const read = path => JSON.parse(text(path));
const sha256 = path => crypto.createHash('sha256').update(text(path), 'utf8').digest('hex');
const digestText = value => crypto.createHash('sha256').update(value, 'utf8').digest('hex');
const count = (source, pattern) => [...source.matchAll(pattern)].length;
const sceneMarkup = (source, sceneCode) => {
  const markerIndex = source.indexOf(`data-hpc2-scene="${sceneCode}"`);
  assert.ok(markerIndex >= 0, `${sceneCode} marker missing`);
  const start = source.lastIndexOf('<section', markerIndex);
  const end = source.indexOf('</section>', markerIndex);
  assert.ok(start >= 0 && end > markerIndex, `${sceneCode} section boundary missing`);
  return source.slice(start, end + '</section>'.length);
};

const paths = Object.freeze({
  contract: 'content/web/homepage/hpc2/contracts/hpc2-w6-first-interaction-composition-contract-v1.json',
  evidence: 'content/web/homepage/hpc2/evidence/hpc2-w6-first-interaction-audit-v1.json',
  acceptance: 'content/web/homepage/hpc2/acceptance/hpc2-w6-first-interaction-acceptance-v1.json',
  freeze: 'content/web/homepage/hpc2/freeze/hpc2-w6-first-interaction-freeze-v1.json',
  w7Contract: 'content/web/homepage/hpc2/contracts/hpc2-w7-reality-surface-composition-contract-v1.json',
  w7Freeze: 'content/web/homepage/hpc2/freeze/hpc2-w7-reality-surface-freeze-v1.json',
  index: 'index.html',
  runtime: 'assets/js/pages/home-production.js',
  package: 'package.json'
});

for (const path of Object.values(paths)) assert.ok(fs.existsSync(path), `Missing current HPC2-W6 dependency: ${path}`);
const contract = read(paths.contract);
const acceptance = read(paths.acceptance);
const freeze = read(paths.freeze);
const w7 = read(paths.w7Contract);
const w7Freeze = read(paths.w7Freeze);
const pkg = read(paths.package);
const html = text(paths.index);

assert.equal(contract.work, 'HPC2-W6');
assert.equal(contract.status, 'H01_H05_PRODUCTION_COMPOSITION_ACTIVE_H06_H09_DEFERRED');
assert.equal(acceptance.state, 'HPC2_W6_H05_REPOSITORY_IMPLEMENTATION_ACCEPTED_HUMAN_BROWSER_DEPLOYMENT_ACCEPTANCE_PENDING');
assert.equal(freeze.status, 'HPC2_W6_H05_REPOSITORY_COMPOSITION_FROZEN_ADDITIVE_SUCCESSOR_REQUIRED');
for (const artifact of freeze.immutableArtifacts) assert.equal(sha256(artifact.path), artifact.sha256, `HPC2-W6 frozen artifact drift: ${artifact.path}`);
assert.equal(w7.predecessorAuthority.w6ContractSha256, sha256(paths.contract));
assert.equal(w7.predecessorAuthority.w6FreezeSha256, sha256(paths.freeze));
assert.equal(w7.predecessorProtection.h01H05ChangedByW7, false);
assert.equal(w7Freeze.preservedBoundaries.w2ThroughW6ImmutableEvidenceRewritten, false);

for (const scene of ['H01', 'H02', 'H03', 'H04', 'H05', 'H06']) assert.equal(count(html, new RegExp(`data-hpc2-scene="${scene}"`, 'g')), 1);
for (const scene of ['H07', 'H08', 'H09']) assert.equal(count(html, new RegExp(`data-hpc2-scene="${scene}"`, 'g')), 0);
for (const scene of ['H01', 'H02', 'H03', 'H04', 'H05']) {
  assert.equal(digestText(sceneMarkup(html, scene)), w7.predecessorProtection[`${scene.toLowerCase()}MarkupSha256`], `Frozen ${scene} markup drift`);
}
const h05 = sceneMarkup(html, 'H05');
assert.equal(count(h05, /data-hpc2-first-interaction=/g), 4);
assert.equal(count(h05, /data-hpc2-user-input=/g), 1);
assert.match(h05, /action="\/knowledge-search" method="get"/);
assert.match(h05, /href="\/personal-runtime"/);
assert.match(h05, /href="\/professional\/financial"/);
assert.doesNotMatch(text(paths.runtime), /askPhios|\/api\/ask|localStorage|sessionStorage|createReality/i);
assert.equal(/href=["']\/reality\/?["']/.test(html), false);
assert.equal(acceptance.humanAcceptance.claimed, false);
assert.equal(acceptance.browserAcceptance.claimed, false);
assert.equal(acceptance.counts.humanDecisionsCreated, 0);

assert.equal(pkg.scripts['check:hpc2-w6-frozen'], 'node scripts/check-hpc2-w6.mjs');
assert.equal(pkg.scripts['check:hpc2-w6'], 'node scripts/check-hpc2-w6-current.mjs');
assert.equal(pkg.scripts['check:hpc2-w7'], 'node scripts/check-hpc2-w7.mjs');

console.log('HPC2-W6 current successor: ACCEPTED');
console.log('  frozen H01-H05 and immutable W6 evidence preserved; additive H06 is governed by HPC2-W7');
console.log('  H07-H09 and /reality/ remain inactive; no Human/browser decision fabricated');
