import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const hash = source => crypto.createHash('sha256')
  .update(source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8')
  .digest('hex');
const registry = JSON.parse(await read('content/registry/pds-w10-full-site-acceptance.json'));

assert.equal(registry.baseline.commit, '1daa1bb7c3a379e77c866a6532cdc56fdd4dc027');
assert.equal(registry.scope.presentationOnly, true);
assert.deepEqual(registry.scope.viewports, [360, 768, 1440]);
assert.deepEqual(registry.scope.locales, ['en', 'zh-Hans']);
assert.equal(registry.scope.minimumTouchTargetPx, 44);
assert.deepEqual(
  registry.scope.stateCoverage,
  ['loading', 'empty', 'failure', 'blocked', 'recovery']
);

for (const [file, expected] of Object.entries(registry.protectedArtifacts)) {
  assert.equal(hash(await read(file)), expected, `Protected Runtime artifact changed: ${file}`);
}

const htmlFiles = [];
async function collectHtml(directory, prefix = '') {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory() && prefix.split(path.sep).length < 3) {
      await collectHtml(path.join(directory, entry.name), relative);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      htmlFiles.push(relative);
    }
  }
}
await collectHtml(root);

for (const file of htmlFiles) {
  const html = await read(file);
  assert.match(html, /<meta\b[^>]*\bname="viewport"/i, `${file} is missing a viewport contract`);
  const skipAnchor = [...html.matchAll(/<a\b[^>]*>/gi)]
    .map(match => match[0])
    .find(anchor => /\bclass="[^"]*(?:phi-)?skip-link[^"]*"/i.test(anchor));
  assert.ok(skipAnchor, `${file} is missing a Skip Link`);
  const skip = skipAnchor.match(/\bhref="#([^"]+)"/i);
  assert.ok(skip, `${file} Skip Link does not reference a local target`);
  assert.match(html, new RegExp(`\\bid="${skip[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), `${file} Skip Link target is missing`);
}

const foundation = await read('assets/css/design/foundation.css');
for (const contract of [
  ':focus-visible',
  '@media (max-width: 768px), (pointer: coarse)',
  '--phi-control-target-min, 44px',
  'min-inline-size:',
  'min-block-size:'
]) assert.equal(foundation.includes(contract), true, `Missing W10 foundation contract: ${contract}`);

const publicCss = await read('assets/css/public-experience.css');
assert.match(
  publicCss,
  /\.public-footer__meta a\s*\{[^}]*min-height:\s*var\(--phi-control-target-min,\s*44px\)/s,
  'Public Footer metadata links do not meet the 44px contract'
);

for (const locale of ['en', 'zh-Hans']) {
  const source = await read(`assets/js/locales/${locale}/review.js`);
  assert.equal(source.includes("skipLink:"), true, `${locale} Review/Memory Skip Link language is missing`);
}

console.log(`PDS-W10 static acceptance passed for ${htmlFiles.length} HTML documents.`);
console.log('Runtime protected artifacts remain byte-stable.');
console.log('The Runtime migration registry blocker is governance-closed; Production revalidation remains an explicit gate.');
