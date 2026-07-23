import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();

async function read(relativePath) {
  const source = await fs.readFile(path.join(root, relativePath), 'utf8');
  return source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
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
  'reality-reading.html',
  'assets/css/reading-visual-alignment.css',
  'assets/js/reading.js',
  'assets/js/modules/reading-customer-projection.js',
  'assets/js/modules/reading-visual-alignment.js',
  'assets/js/locales/en/reading.js',
  'assets/js/locales/zh-Hans/reading.js',
  'content/registry/m3c-reading-visual-alignment.json',
  'docs/public/M3C-W5-READING-VISUAL-ALIGNMENT.md'
];

for (const file of requiredFiles) {
  assert.equal(await exists(file), true, `Missing M3C-W5 deliverable: ${file}`);
}

const page = await read('reality-reading.html');
for (const contract of [
  '/assets/css/reading-visual-alignment.css',
  'data-reading-view="observed-reality"',
  'data-reading-view="runtime-pattern"',
  'data-reading-view="evidence"',
  'data-reading-view="interpretation"',
  'data-reading-view="reading-boundary"',
  'id="readingKnownReality"',
  'id="primaryRuntimePattern"',
  'id="readingEvidenceTrail"',
  'id="alternativeReading"',
  'id="readingUnknownReality"',
  'id="readingRisks"',
  'id="readingEvidenceWatch"',
  'id="continueToNavigation"'
]) {
  assert.equal(page.includes(contract), true, `Reading visual contract is missing: ${contract}`);
}

assert.deepEqual(
  [...page.matchAll(/data-reading-view="([^"]+)"/g)].map(match => match[1]),
  ['observed-reality', 'runtime-pattern', 'evidence', 'interpretation', 'reading-boundary']
);
assert.equal(
  page.indexOf('/assets/css/reading-visual-alignment.css') >
    page.indexOf('/assets/css/design/visual-acceptance.css'),
  true,
  'M3C-W5 stylesheet must load after the existing Reading layers'
);

for (const id of [
  'readingObservedStatus',
  'readingObservedSource',
  'readingPatternStatus',
  'readingPatternConfidence',
  'readingEvidenceStatus',
  'readingEvidenceSource',
  'readingInterpretationStatus',
  'readingInterpretationSource',
  'readingBoundaryStatus',
  'readingBoundaryDecision'
]) {
  assert.equal(
    (page.match(new RegExp(`id="${id}"`, 'g')) || []).length,
    1,
    `Reading customer metadata must appear exactly once: ${id}`
  );
}

const progressStart = page.indexOf('<ol data-current-stage="reading"');
const progressBlock = page.slice(
  progressStart,
  page.indexOf('</ol>', progressStart) + 5
);
assert.equal((progressBlock.match(/<li/g) || []).length, 7);
assert.deepEqual(
  [...progressBlock.matchAll(/<data value="([^"]+)"/g)].map(match => match[1]),
  ['entry', 'reconstruction', 'reading', 'navigation', 'review', 'memory', 'continuity']
);
assert.match(progressBlock, /aria-current="step"/);

const controller = await read('assets/js/reading.js');
for (const behavior of [
  "from './modules/reading-visual-alignment.js'",
  'renderReadingVisualAlignment(',
  'customerProjection',
  'renderRealityReading(',
  'bindContinueToNavigation('
]) {
  assert.equal(controller.includes(behavior), true, `Reading controller alignment is missing: ${behavior}`);
}

const projectionSource = await read('assets/js/modules/reading-customer-projection.js');
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
    `Reading customer projection must remain read-only: ${forbidden}`
  );
}

const projectionModule = await import(
  `${pathToFileURL(
    path.join(root, 'assets/js/modules/reading-customer-projection.js')
  ).href}?w5=${Date.now()}`
);

const fixture = projectionModule.buildReadingCustomerProjection({
  reading: {
    evidenceBoundary: {
      observedEvidence: ['Work decisions changed.'],
      unknownReality: ['Whether the change will continue.']
    },
    evidenceAudit: {
      observedEvidence: 1,
      reportedExperience: 1
    },
    integratedReading: {
      observedEvidence: ['Work decisions changed.'],
      primaryPattern: {
        established: true,
        confidence: 0.72,
        classification: 'established'
      },
      alternativeReading: {
        summary: 'Resource pressure may also explain the change.',
        confidence: 0.4
      },
      evidenceTrail: [
        { statement: 'Work decisions changed.' }
      ],
      risks: ['The observation window is short.'],
      evidenceWatch: ['Observe the next three decisions.']
    },
    navigationReadiness: {
      ready: true,
      blockers: []
    }
  }
});

assert.equal(fixture.observedReality.itemCount, 1);
assert.equal(fixture.runtimePattern.established, true);
assert.equal(fixture.runtimePattern.confidence, 0.72);
assert.equal(fixture.evidence.trailCount, 1);
assert.equal(fixture.interpretation.alternativeAvailable, true);
assert.equal(fixture.boundary.unknownCount, 1);
assert.equal(fixture.boundary.limitationCount, 1);
assert.equal(fixture.boundary.navigationReady, true);
assert.deepEqual(fixture.guardrails, {
  readOnlyProjection: true,
  runtimeMutationAllowed: false,
  evidenceReclassificationAllowed: false,
  navigationReadinessOwned: false,
  confidenceRepresentsFactProbability: false
});

const stylesheet = await read('assets/css/reading-visual-alignment.css');
for (const styleContract of [
  '.reading-customer-views',
  '.reading-customer-view',
  '.reading-boundary-view',
  'grid-template-columns: repeat(7',
  '@media (max-width: 900px)',
  '@media (max-width: 720px)',
  '@media (prefers-reduced-motion: reduce)'
]) {
  assert.equal(stylesheet.includes(styleContract), true, `Reading style contract is missing: ${styleContract}`);
}

const registry = await readJson('content/registry/m3c-reading-visual-alignment.json');
assert.equal(registry.baseline.commit, '8efaae557b05f0187f514798b5a592fbaebbe171');
assert.deepEqual(registry.customerViews, [
  'observed-reality',
  'runtime-pattern',
  'evidence',
  'interpretation',
  'reading-boundary'
]);
assert.equal(registry.projectionGuardrails.navigationReadinessDecisionOwned, false);
assert.equal(registry.acceptance.navigationHandoffChanged, false);

for (const [file, expectedHash] of Object.entries(registry.frozenArtifacts)) {
  assert.equal(await sha256(file), expectedHash, `Frozen M3C-W5 artifact changed: ${file}`);
}

const packageJson = await readJson('package.json');
assert.equal(
  packageJson.scripts['check:m3c-reading-visual-alignment'],
  'node scripts/check-m3c-reading-visual-alignment.mjs'
);
assert.equal(
  packageJson.scripts.check.includes('scripts/check-m3c-reading-visual-alignment.mjs'),
  true
);

console.log('✓ M3C-W5 Reading Visual Alignment passed: Observed Reality, Runtime Pattern, Evidence, Interpretation and Reading Boundary are customer-visible.');
console.log('  Reading API, evidence classes, pattern threshold, Navigation readiness, handoff, persistence and lineage remain frozen.');
