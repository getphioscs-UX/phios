import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();

async function read(relativePath) {
  const source = await fs.readFile(path.join(root, relativePath), 'utf8');
  return source
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n');
}

async function readJson(relativePath) {
  return JSON.parse(await read(relativePath));
}

async function exists(relativePath) {
  try {
    await fs.access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function sha256(relativePath) {
  return crypto.createHash('sha256')
    .update(await read(relativePath), 'utf8')
    .digest('hex');
}

const requiredFiles = [
  'reality-reconstruction.html',
  'assets/css/runtime-workspace.css',
  'assets/css/reconstruction-visual-alignment.css',
  'assets/css/reconstruction-experience.css',
  'assets/js/reconstruction.js',
  'assets/js/modules/reconstruction-customer-projection.js',
  'assets/js/modules/reconstruction-visual-alignment.js',
  'assets/js/locales/en/reconstruction.js',
  'assets/js/locales/zh-Hans/reconstruction.js',
  'content/registry/m3c-reconstruction-visual-alignment.json',
  'docs/public/M3C-W4-RECONSTRUCTION-VISUAL-ALIGNMENT.md'
];

for (const file of requiredFiles) {
  assert.equal(await exists(file), true, `Missing M3C-W4 deliverable: ${file}`);
}

const page = await read('reality-reconstruction.html');
for (const contract of [
  '/assets/css/reconstruction-visual-alignment.css',
  '/assets/css/reconstruction-experience.css',
  'id="reconstructionEvidenceSummary"',
  'id="reconstructionEvidenceSource"',
  'id="reconstructionConfidence"',
  'id="reconstructionMissingCount"',
  'id="missingEvidencePanel"',
  'id="customerMissingEvidence"',
  'id="continueToReading"',
  'href="/reality-entry?mode=revise"',
  'data-i18n="reconstruction.editAnswer"',
  'data-i18n="reconstruction.evidenceSourceLabel"',
  'data-i18n="reconstruction.confidenceLabel"',
  'data-i18n="reconstruction.missingEvidenceLabel"',
  'data-i18n="reconstruction.continueButton"',
  'data-i18n="reconstruction.returnToEntryButton"'
]) {
  assert.equal(
    page.includes(contract),
    true,
    `Reconstruction visual contract is missing: ${contract}`
  );
}

assert.equal(
  page.indexOf('/assets/css/reconstruction-visual-alignment.css') >
    page.indexOf('/assets/css/runtime-workspace.css'),
  true,
  'M3C-W4 stylesheet must load after the frozen Reconstruction layers'
);
assert.equal(
  page.indexOf('/assets/css/reconstruction-experience.css') >
    page.indexOf('/assets/css/reconstruction-visual-alignment.css'),
  true,
  'M3C-W14 contrast stylesheet must load after all frozen Reconstruction layers'
);
assert.equal(
  (page.match(/data-i18n="reconstruction\.editAnswer"/g) || []).length,
  5,
  'Each customer Reconstruction card must provide Edit answer'
);

for (const target of [
  'observed_change',
  'timing',
  'context',
  'evidence',
  'unknown_reality'
]) {
  assert.match(
    page,
    new RegExp(`mode=revise&amp;target=${target}`),
    `Edit answer route is missing target: ${target}`
  );
}

for (const id of [
  'customerChangeSource',
  'customerChangeConfidence',
  'customerProcessSource',
  'customerProcessConfidence',
  'customerConditionsSource',
  'customerConditionsConfidence',
  'customerConfirmedSource',
  'customerConfirmedConfidence',
  'customerUnclearSource',
  'customerUnclearConfidence'
]) {
  assert.equal(page.includes(`id="${id}"`), true, `Missing customer metadata: ${id}`);
}

const progressBlock = page.slice(
  page.indexOf('<ol data-current-stage="reconstruction"'),
  page.indexOf('</ol>', page.indexOf('<ol data-current-stage="reconstruction"')) + 5
);
assert.equal(
  (progressBlock.match(/<li/g) || []).length,
  7,
  'Reconstruction header must show all seven Runtime Journey stages'
);
assert.deepEqual(
  [...progressBlock.matchAll(/<data value="([^"]+)"/g)].map(match => match[1]),
  ['entry', 'reconstruction', 'reading', 'navigation', 'review', 'memory', 'continuity']
);
assert.match(progressBlock, /aria-current="step"/);

const controller = await read('assets/js/reconstruction.js');
for (const behavior of [
  "from './modules/reconstruction-visual-alignment.js'",
  'renderReconstructionVisualAlignment(',
  'visualAlignment,',
  'renderReconstructionResult(',
  'updateContinueToReadingButton(',
  'bindContinueToReading('
]) {
  assert.equal(
    controller.includes(behavior),
    true,
    `Reconstruction controller alignment is missing: ${behavior}`
  );
}

const projectionSource = await read(
  'assets/js/modules/reconstruction-customer-projection.js'
);
for (const forbidden of [
  'sessionStorage',
  'localStorage',
  'fetch(',
  'postJSON(',
  'setSession(',
  '/api/'
]) {
  assert.equal(
    projectionSource.includes(forbidden),
    false,
    `Customer projection must remain read-only: ${forbidden}`
  );
}

const projectionModule = await import(
  `${pathToFileURL(
    path.join(root, 'assets/js/modules/reconstruction-customer-projection.js')
  ).href}?w4=${Date.now()}`
);

const fixture = projectionModule.buildReconstructionCustomerProjection({
  runtimeEntry: {
    realityChange: { rawStatement: 'A visible work change began.' },
    reconstructionEvidence: [
      { target: 'runtime_conditions', statement: 'It is clearer under time pressure.' }
    ],
    knownReality: ['Decision flow changed.'],
    unknownReality: ['Cause remains unknown.']
  },
  reconstruction: {
    maturityScore: 0.63,
    grammarStates: [
      { code: 'G1', confidence: 0.8 },
      { code: 'G5', confidence: 0.6 }
    ],
    inquiry: {
      remainingTargets: ['identity_style']
    },
    evidenceBoundary: {
      observedEvidence: ['Decision flow changed.'],
      unknownReality: ['Cause remains unknown.']
    }
  }
});

assert.deepEqual(
  fixture.summary.sourceCodes,
  ['runtimeEntry', 'reconstructionAnswers', 'observedEvidence']
);
assert.equal(fixture.summary.structuralConfidence, 0.63);
assert.equal(fixture.summary.missingCount, 2);
assert.equal(fixture.cards.process.confidence, 0.7);
assert.equal(fixture.cards.conditions.sourceCode, 'reconstructionAnswers');
assert.equal(fixture.cards.confirmed.confidenceCode, 'evidenceSupported');
assert.equal(fixture.cards.unclear.confidenceCode, 'unresolved');
assert.deepEqual(fixture.guardrails, {
  readOnlyProjection: true,
  runtimeMutationAllowed: false,
  confidenceRepresentsFactProbability: false,
  historicalOverwriteAllowed: false
});

const visualRenderer = await read(
  'assets/js/modules/reconstruction-visual-alignment.js'
);
for (const behavior of [
  'buildReconstructionCustomerProjection',
  'reconstructionEvidenceSource',
  'reconstructionConfidence',
  'reconstructionMissingCount',
  'customerMissingEvidence',
  'reconstruction.confidenceStates.',
  'reconstruction.evidenceSources.'
]) {
  assert.equal(
    visualRenderer.includes(behavior),
    true,
    `Reconstruction visual renderer is missing: ${behavior}`
  );
}

const css = await read('assets/css/reconstruction-visual-alignment.css');
for (const visualContract of [
  '.reconstruction-page .reconstruction-header',
  'grid-template-columns: repeat(7',
  '.reconstruction-evidence-summary',
  '.customer-summary-meta',
  '.customer-missing-evidence',
  '.reconstruction-primary-action',
  '.reconstruction-secondary-action',
  '@media (max-width: 1120px)',
  '@media (max-width: 760px)',
  '@media (max-width: 520px)',
  '@media (prefers-reduced-motion: reduce)'
]) {
  assert.equal(
    css.includes(visualContract),
    true,
    `Reconstruction visual stylesheet is missing: ${visualContract}`
  );
}
for (const token of [
  '--phi-font-display',
  '--phi-font-body',
  '--phi-space-',
  '--phi-border-subtle',
  '--phi-radius-',
  '--phi-action-primary',
  '--phi-state-warning'
]) {
  assert.equal(css.includes(token), true, `M3C-W4 must use Design Token: ${token}`);
}

const experienceCss = await read('assets/css/reconstruction-experience.css');
const runtimeCss = await read('assets/css/runtime-workspace.css');

for (const token of [
  '--technical-bg',
  '--technical-surface',
  '--technical-surface-elevated',
  '--technical-text-primary',
  '--technical-text-secondary',
  '--technical-text-muted',
  '--technical-border',
  '--technical-accent'
]) {
  assert.equal(
    experienceCss.includes(token),
    true,
    `M3C-W14 Technical View token is missing: ${token}`
  );
}

for (const contract of [
  '[data-w14-view="technical"]',
  '.technical-record-body',
  '.technical-record-body .formation-arc',
  '.technical-record-body .coordinate-card',
  '.technical-record-body .conscious-stage',
  '.technical-record-body .evidence-columns section',
  '.technical-record-body .lineage-section',
  '.technical-record-body .conflict-details',
  '.technical-record-body .confidence-components',
  '.technical-record-body .revision-metadata',
  '.reconstruction-page .runtime-workspace-sidebar',
  '.runtime-workspace-brand strong',
  'li.is-current a',
  'li.is-complete a',
  'li.is-locked',
  ':focus-visible',
  '@media (max-width: 768px)',
  '@media (max-width: 360px)'
]) {
  assert.equal(
    experienceCss.includes(contract),
    true,
    `M3C-W14 contrast contract is missing: ${contract}`
  );
}

assert.match(
  experienceCss,
  /\[data-w14-view="technical"\][\s\S]*?color:\s*var\(--technical-text-primary\)/,
  'Technical View primary text must use the light Technical token'
);
assert.match(
  experienceCss,
  /\.technical-record-body[\s\S]*?background:\s*var\(--technical-bg\)/,
  'Technical Record must use the dark Technical surface token'
);
assert.match(
  experienceCss,
  /\.reconstruction-page \.runtime-workspace-sidebar[\s\S]*?color:\s*var\(--runtime-sidebar-text-primary\)/,
  'Runtime Sidebar must override the light-page inherited text color'
);
assert.match(
  runtimeCss,
  /\.runtime-workspace-sidebar\{[^}]*background:rgba\(7,12,20,\.92\)/,
  'Runtime Sidebar baseline must remain a dark surface'
);

for (const lightView of ['customer', 'evidence']) {
  assert.match(
    experienceCss,
    new RegExp(
      `\\[data-w14-view="${lightView}"\\][\\s\\S]*?color:\\s*var\\(--phi-text-primary`
    ),
    `${lightView} View must retain an explicit light-theme text contract`
  );
}

assert.doesNotMatch(
  experienceCss,
  /(?:technical-record-body|data-w14-view="technical")[^{]*\{[^}]*(?:color:\s*var\(--(?:ink|text-primary|text-muted)\)|opacity:\s*(?:0?\.[0-6]\d?|0))/,
  'Technical body text must not reuse light-page text tokens or low opacity'
);
assert.match(
  experienceCss,
  /(?:button:disabled|aria-disabled)[\s\S]*?opacity:\s*\.72/,
  'Disabled Technical controls must keep a readable opacity floor'
);
assert.match(
  experienceCss,
  /li\.is-locked[\s\S]*?opacity:\s*1/,
  'Sidebar locked stages must use a muted color without parent opacity loss'
);

function hexToRgb(value) {
  const match = /^#([0-9a-f]{6})$/i.exec(value);
  assert.ok(match, `Expected six-digit hex color, received: ${value}`);
  return [0, 2, 4].map(offset => Number.parseInt(match[1].slice(offset, offset + 2), 16));
}

function relativeLuminance(value) {
  const channels = hexToRgb(value).map(channel => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(foreground, background) {
  const light = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const dark = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (light + 0.05) / (dark + 0.05);
}

function technicalToken(name) {
  const match = new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, 'i').exec(experienceCss);
  assert.ok(match, `Unable to resolve Technical token: ${name}`);
  return match[1];
}

const technicalColors = Object.fromEntries(
  [
    '--technical-bg',
    '--technical-surface',
    '--technical-surface-elevated',
    '--technical-text-primary',
    '--technical-text-secondary',
    '--technical-text-muted',
    '--technical-border',
    '--technical-accent',
    '--technical-positive'
  ].map(name => [name, technicalToken(name)])
);

for (const background of [
  '--technical-bg',
  '--technical-surface',
  '--technical-surface-elevated'
]) {
  for (const foreground of [
    '--technical-text-primary',
    '--technical-text-secondary',
    '--technical-text-muted',
    '--technical-accent',
    '--technical-positive'
  ]) {
    assert.ok(
      contrastRatio(technicalColors[foreground], technicalColors[background]) >= 4.5,
      `${foreground} on ${background} must meet WCAG AA for normal text`
    );
  }
  assert.ok(
    contrastRatio(technicalColors['--technical-border'], technicalColors[background]) >= 3,
    `--technical-border on ${background} must meet the 3:1 non-text contrast threshold`
  );
}

const registry = await readJson(
  'content/registry/m3c-reconstruction-visual-alignment.json'
);
assert.equal(registry.status, 'w4-reconstruction-visual-alignment-ready');
assert.equal(
  registry.baseline.commit,
  '26451dff0b974daaed9c84aa505361ae0bd4d466'
);
assert.deepEqual(registry.alignedSurfaces, [
  'edit-answer',
  'evidence-source',
  'confidence',
  'missing-evidence',
  'continue',
  'return-to-entry'
]);
assert.equal(registry.confidenceBoundary.representsFactProbability, false);
assert.equal(registry.editBoundary.inlineRuntimeMutation, false);
assert.equal(registry.editBoundary.lineagePreserved, true);
assert.equal(registry.missingEvidenceBoundary.assumptionsConvertedToFacts, false);
assert.equal(registry.projectionGuardrails.readOnlyProjection, true);
assert.equal(registry.projectionGuardrails.readingReadinessDecisionOwned, false);

assert.deepEqual(registry.hashPolicy, {
  algorithm: 'sha256',
  encoding: 'utf8',
  textNormalization: 'lf',
  byteOrderMarkIgnored: true
});
const reconstructionExperienceRegistry = await readJson(
  'content/registry/m3c-reconstruction-experience.json'
);
const authorizedW14Updates =
  reconstructionExperienceRegistry.authorizedFrozenArtifactUpdates || {};
for (const [file, expectedHash] of Object.entries(registry.frozenArtifacts)) {
  assert.equal(
    await sha256(file),
    authorizedW14Updates[file] || expectedHash,
    `Frozen M3C-W4 artifact changed: ${file}`
  );
}

const runtimeContracts = await readJson('content/registry/runtime-contracts.json');
const reconstructionContract = runtimeContracts.contracts.find(
  contract => contract.id === 'reconstruction'
);
assert.equal(reconstructionContract.version, '1.0.0');
assert.equal(reconstructionContract.schemaId, 'phi-os.reconstruction.v1');
assert.equal(reconstructionContract.status, 'stable');

for (const localePath of [
  'assets/js/locales/en/reconstruction.js',
  'assets/js/locales/zh-Hans/reconstruction.js'
]) {
  const locale = await read(localePath);
  for (const key of [
    'editAnswer:',
    'evidenceSourceLabel:',
    'confidenceLabel:',
    'missingEvidenceLabel:',
    'missingEvidenceTitle:',
    'evidenceSources:',
    'confidenceStates:',
    'actionBoundary:'
  ]) {
    assert.equal(
      locale.includes(key),
      true,
      `Reconstruction locale is missing M3C-W4 key: ${localePath} ${key}`
    );
  }
}

const packageJson = await readJson('package.json');
assert.equal(
  packageJson.scripts['check:m3c-reconstruction-visual-alignment'],
  'node scripts/check-m3c-reconstruction-visual-alignment.mjs'
);
assert.match(
  packageJson.scripts.check,
  /check-m3c-reconstruction-visual-alignment\.mjs/
);

console.log('✓ M3C-W4 Reconstruction Visual Alignment passed: Edit answer, Evidence source, Confidence, Missing evidence, Continue and Return to Entry are customer-visible.');
console.log('  The W4 projection boundary remains intact; W14 changes are limited to the registered additive Reconstruction Experience extension.');
