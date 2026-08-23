import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = relative => fs.readFile(path.join(root, relative), 'utf8');
const exists = async relative => fs.access(path.join(root, relative)).then(() => true, () => false);
const sha256 = async relative => crypto
  .createHash('sha256')
  .update((await read(relative)).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'))
  .digest('hex');

const contract = JSON.parse(await read('docs/experience/EXP-W4A-public-reality-demo-retirement-contract.json'));
const px2Successor = JSON.parse(await read(
  'content/web-production/px2/successors/px2-w11-checker-successor-v1.json'
));
const realityRouteSuccessor = JSON.parse(await read(
  'content/web-production/successors/pds-w3-current-reality-route-successor-v2.json'
));
assert.equal(contract.freezeId, 'EXP-W4A-Public-Reality-Demo-Retired');
assert.equal(contract.baselineCommit, 'b34ac06692a375515d3df05a78687b6ed105e327');
assert.equal(contract.status, 'retired');
assert.equal(contract.activePublicExperience, false);
assert.equal(contract.redirect.statusCode, 308);
assert.equal(contract.redirect.target, '/reality-journey');
assert.equal(contract.redirect.singleHop, true);
assert.equal(contract.replacement.newDemoCreated, false);
assert.equal(contract.replacement.oldContentMigrated, false);
assert.equal(Object.values(contract.boundaries).every(value => value === false), true);
assert.equal(px2Successor.successorCode, 'PX2-W11-CHECKER-SUCCESSOR');
assert.equal(px2Successor.status, 'ACTIVE');
assert.equal(realityRouteSuccessor.status, 'CURRENT');
assert.equal(realityRouteSuccessor.predecessor.realityFooterHref, '/reality-journey');
assert.equal(realityRouteSuccessor.successor.realityNavigationHref, '/reality/');

for (const retired of [
  'reality-demo.html',
  'assets/js/pages/reality-demo.js',
  'assets/js/modules/evidence-boundary-lab.js'
]) assert.equal(await exists(retired), false, `Retired public Demo artifact remains: ${retired}`);

const redirectRules = (await read('_redirects'))
  .split(/\r?\n/)
  .map(rule => rule.trim())
  .filter(Boolean);

const retiredDemoRedirects = redirectRules.filter(rule =>
  /^\/reality-demo(?:\.html)?\s/.test(rule)
);

assert.deepEqual(retiredDemoRedirects, [
  '/reality-demo /reality-journey 308',
  '/reality-demo.html /reality-journey 308'
]);
assert.equal(redirectRules.some(rule => rule.includes('/checkout')), false);
assert.equal(
  redirectRules.some(rule => /^\/reality-journey\s/.test(rule)),
  false,
  'Redirect loop or chain starts at target'
);

const activePages = [
  'index.html', 'about.html', 'ai-disclosure.html', 'free-observation.html',
  'privacy.html', 'terms.html', 'reality-journey.html'
];
for (const page of activePages) {
  const source = await read(page);
  assert.doesNotMatch(source, /href=["']\/reality-demo(?:\.html)?["']/i, `${page} retains a Demo link`);
  assert.doesNotMatch(source, /Reality Demo|现实演示|互动证据边界实验|evidence experiment/i, `${page} retains customer Demo copy`);
  const hasLegacyPublicShell = /(?:data-public-header-placeholder|<header)/.test(source);
  const hasPx2PublicShell = /data-puxr-header/.test(source) &&
    /\/assets\/css\/phios-public-v2\.css/.test(source) &&
    /\/assets\/js\/public-shell-v2\.js/.test(source);
  assert.equal(
    hasLegacyPublicShell || hasPx2PublicShell,
    true,
    `${page} has no accessible public shell`
  );
}
for (const page of ['index.html', 'ai-disclosure.html', 'free-observation.html']) {
  const source = await read(page);
  assert.equal(
    [
      realityRouteSuccessor.predecessor.realityFooterHref,
      realityRouteSuccessor.successor.realityNavigationHref
    ].some(route => source.includes(`href="${route}"`)),
    true,
    `${page} has no current or preserved Reality entry`
  );
}

for (const locale of [
  'assets/js/locales/en/public.js', 'assets/js/locales/zh-Hans/public.js',
  'assets/js/locales/en/journey.js', 'assets/js/locales/zh-Hans/journey.js',
  'assets/js/locales/en/free-observation.js', 'assets/js/locales/zh-Hans/free-observation.js'
]) {
  const source = await read(locale);
  assert.doesNotMatch(source, /^\s*demo:\s*\{/m, `${locale} retains the public Demo locale object`);
  assert.doesNotMatch(source, /Reality Demo|现实 Demo|互动证据边界实验/i, `${locale} retains customer Demo text`);
}

const css = `${await read('assets/css/public-experience.css')}\n${await read('assets/css/guided-entry.css')}`;
for (const selector of ['.demo-hero', '.demo-watch', '.evidence-explorer', '.demo-boundary', '.light-try']) {
  assert.equal(css.includes(selector), false, `Dead Demo CSS remains: ${selector}`);
}

for (const optionalSeoFile of ['sitemap.xml', 'robots.txt']) {
  if (await exists(optionalSeoFile)) assert.doesNotMatch(await read(optionalSeoFile), /reality-demo/i);
}
for (const page of activePages) {
  const source = await read(page);
  assert.doesNotMatch(source, /rel=["'](?:canonical|alternate)["'][^>]*reality-demo/i);
  assert.doesNotMatch(source, /application\/ld\+json[\s\S]*reality-demo/i);
  assert.doesNotMatch(source, /rel=["']prefetch["'][^>]*reality-demo/i);
}

const inventory = await read('docs/experience/EXP-W0-production-route-inventory.md');
assert.match(inventory, /Retired after EXP-W0/);
assert.match(inventory, /Historical unique-route baseline \| 18/);
assert.match(inventory, /Active unique routes among the originally requested set \| 17/);
assert.match(await read('docs/experience/EXP-W0-acceptance-report.md'), /\*\*EXP-W0 Failed\.\*\*/);

const w4Hashes = {
  'reality-reconstruction.html': 'ed95044243f77674dc37a0182d95970dbc6d9ae7431e64a8a2baba7534a09240',
  'assets/css/reconstruction-exp-w4.css': 'e32dcabb39d9d778f4df4d106d32ce210fd4ee17c5e3205a894e508c4374258f',
  'assets/js/modules/reconstruction-experience-render.js': 'fce763ca8c453a78dc45f923d6797c436a53c9d012d19fd929731776504457dd',
  'assets/js/modules/reconstruction-visual-alignment.js': '122da07eb3d6b883b70332a27d09183647ef531fed1c5492cc61da0423826807',
  'docs/experience/EXP-W4-acceptance-report.md': '8b8a6fb82a110094b7f74824b682b0cc2b7491b90dc05d055f6c029f8123eded',
  'docs/experience/EXP-W4-reconstruction-customer-projection-contract.json': '313825d469d27a151bf015497e90e8a4a33e7996c0f6db6efbb9d9f617660c5b',
  'scripts/check-exp-w4-reconstruction-customer-projection.mjs': 'bdcc9b5076ec920430a6054cecabd865f779ddc6910f129eee50980e0283a091'
};
for (const [file, expected] of Object.entries(w4Hashes)) {
  assert.equal(await sha256(file), expected, `EXP-W4 regression detected: ${file}`);
}

assert.equal(contract.baselineReferenceCounts.total, 350);
assert.equal(
  contract.baselineReferenceCounts.deleted +
    contract.baselineReferenceCounts.redirected +
    contract.baselineReferenceCounts.historicalRetained,
  contract.baselineReferenceCounts.total
);

console.log('✓ EXP-W4A Public Reality Demo retirement passed locally.');
console.log('  /reality-demo and /reality-demo.html → /reality-journey (308, single hop).');
console.log('  Old UI/controller/CSS/customer locale removed; EXP-W0 history and EXP-W4 hashes preserved.');
