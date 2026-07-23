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
  'assets/css/reconstruction-visual-alignment.css',
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
for (const [file, expectedHash] of Object.entries(registry.frozenArtifacts)) {
  assert.equal(
    await sha256(file),
    expectedHash,
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
console.log('  Customer projection is read-only; Reconstruction API, contract, inquiry, persistence, Reading gate and lineage remain frozen.');
