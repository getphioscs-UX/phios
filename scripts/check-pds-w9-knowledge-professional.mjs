import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const hash = source => crypto.createHash('sha256')
  .update(source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'), 'utf8')
  .digest('hex');
const registry = JSON.parse(await read('content/registry/pds-w9-knowledge-professional.json'));

assert.equal(registry.baseline.commit, '4f074b116f29ec7346f922cc44a2aa93666e1920');
assert.equal(registry.scope.presentationOnly, true);
for (const [file, expected] of Object.entries(registry.protectedArtifacts)) {
  assert.equal(hash(await read(file)), expected, `Protected W9 artifact changed: ${file}`);
}

const pages = [
  'index.html', 'about.html', 'explore.html', 'thesis.html',
  'book-one.html', 'book-one-preview.html', 'figures.html', 'figure.html',
  'library.html', 'services.html', 'professional-workspace.html',
  'professional-appointments.html', 'professional-boundary.html',
  'professional-consent-sharing.html', 'professional-data-privacy.html',
  'professional-reports.html', 'membership.html', 'checkout.html',
  'payment-success.html', 'payment-failure.html', 'privacy.html', 'terms.html',
  'ai-disclosure.html', 'professional/external-readers/index.html',
  'professional/financial/index.html', 'professional/human-design/index.html'
];
for (const page of pages) {
  const html = await read(page);
  assert.equal(
    html.includes('/assets/css/pds-w9-knowledge-professional.css'),
    true,
    `${page} does not share the W9 presentation contract`
  );
  assert.equal(
    (html.match(/pds-w9-knowledge-professional\.css/g) || []).length,
    1,
    `${page} has a duplicate W9 stylesheet`
  );
}

const css = await read('assets/css/pds-w9-knowledge-professional.css');
for (const contract of [
  ':focus-visible',
  '--phi-control-target-min',
  'prefers-reduced-motion: reduce',
  'prefers-contrast: more',
  '@media (max-width: 360px)',
  '@media (max-width: 768px)',
  '@media (min-width: 1440px)',
  '.professional-workspace-tabs',
  '.legal-hero',
  '.knowledge-page'
]) assert.equal(css.includes(contract), true, `Missing W9 style contract: ${contract}`);
for (const forbidden of ['display: none', 'display:none', 'position: fixed']) {
  assert.equal(css.includes(forbidden), false, `W9 presentation layer reorganizes or hides product content: ${forbidden}`);
}

console.log(`PDS-W9 Knowledge and Professional checks passed for ${pages.length} pages.`);
