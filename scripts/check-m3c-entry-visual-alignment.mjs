import {effectivePackageScripts} from './lib/effective-package-scripts.mjs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root = process.cwd();

async function read(relativePath) {
  return (await fs.readFile(path.join(root, relativePath), 'utf8'))
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
  const source = await fs.readFile(path.join(root, relativePath), 'utf8');
  const normalized = source
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n');
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

const requiredFiles = [
  'reality-entry.html',
  'assets/css/entry-visual-alignment.css',
  'assets/js/reality-entry.js',
  'assets/js/locales/en/entry.js',
  'assets/js/locales/zh-Hans/entry.js',
  'content/registry/m3c-entry-visual-alignment.json',
  'docs/public/M3C-W3-ENTRY-VISUAL-ALIGNMENT.md'
];

for (const file of requiredFiles) {
  assert.equal(await exists(file), true, `Missing M3C-W3 deliverable: ${file}`);
}

const page = await read('reality-entry.html');
for (const contract of [
  '/assets/css/entry-visual-alignment.css',
  'data-runtime-workspace',
  'id="entryWorkspace"',
  'id="chatForm"',
  'id="messageInput"',
  'id="sendButton"',
  'id="continueButton"',
  'id="reviseButton"',
  'id="entryCard"',
  'aria-describedby="loadingText roundIndicator"',
  'aria-atomic="true"',
  'class="entry-send-button phi-button phi-button--primary"'
]) {
  assert.match(page, new RegExp(contract), `Entry page is missing: ${contract}`);
}

const progressBlock = page.slice(
  page.indexOf('<ol class="runtime-progress"'),
  page.indexOf('</ol>', page.indexOf('<ol class="runtime-progress"')) + 5
);
assert.equal(
  (progressBlock.match(/<li/g) || []).length,
  6,
  'Entry header must show the complete six-stage customer Journey'
);
assert.match(progressBlock, /data-current-stage="describe"/);
assert.match(progressBlock, /aria-current="step"/);
assert.deepEqual(
  [...progressBlock.matchAll(/<data value="([^"]+)"/g)].map(match => match[1]),
  ['enter', 'describe', 'discover', 'understand', 'choose', 'continue']
);

const stylesheetOrder = [
  '/assets/css/entry-workspace.css',
  '/assets/css/evidence-depth.css',
  '/assets/css/runtime-workspace.css',
  '/assets/css/design/visual-acceptance.css',
  '/assets/css/entry-visual-alignment.css'
].map(stylesheet => page.indexOf(stylesheet));
assert.equal(
  stylesheetOrder.every((position, index) => (
    position >= 0 && (index === 0 || position > stylesheetOrder[index - 1])
  )),
  true,
  'Entry visual alignment stylesheet must load after the frozen legacy layers'
);

const controller = await read('assets/js/reality-entry.js');
for (const frozenBehavior of [
  "postJSON(\n      '/api/reconstruct-reality'",
  'withLanguageContract({',
  'setSession(SESSION.entry, result)',
  "location.href = '/reality-reconstruction'",
  'initializeNewRuntimeEntry()',
  'restoreEntryState()',
  "quick: { minimum: 3, maximum: 4 }",
  "guided: { minimum: 5, maximum: 7 }",
  "deep: { minimum: 7, maximum: 10 }"
]) {
  assert.equal(
    controller.includes(frozenBehavior),
    true,
    `Entry behavior changed or disappeared: ${frozenBehavior}`
  );
}

for (const visualState of [
  "item.tone === 'error'",
  'role="alert" aria-atomic="true"',
  "els.load.dataset.tone = 'error'",
  "els.input.setAttribute('aria-invalid', 'true')",
  "item => item.tone !== 'error'",
  "'entry.requestFailed',\n      'error'"
]) {
  assert.equal(
    controller.includes(visualState),
    true,
    `Entry error-state alignment is missing: ${visualState}`
  );
}

const css = await read('assets/css/entry-visual-alignment.css');
for (const visualContract of [
  '.entry-workspace-page .entry-site-header',
  '.entry-workspace-shell',
  '.entry-workspace-grid',
  '.workspace-heading',
  '.entry-send-button',
  '.live-entry-block',
  '.entry-ready-panel',
  '.runtime-progress',
  'grid-template-columns: repeat(7',
  '.message.is-error',
  '.entry-loading[data-tone="error"]',
  '@media (max-width: 1120px)',
  '@media (max-width: 760px)',
  '@media (max-width: 520px)',
  '@media (prefers-reduced-motion: reduce)'
]) {
  assert.equal(
    css.includes(visualContract),
    true,
    `Entry visual stylesheet is missing: ${visualContract}`
  );
}

for (const token of [
  '--phi-font-display',
  '--phi-font-body',
  '--phi-space-',
  '--phi-border-subtle',
  '--phi-radius-',
  '--phi-action-primary',
  '--phi-state-danger'
]) {
  assert.match(css, new RegExp(token), `Entry alignment must use Design Token: ${token}`);
}

const registry = await readJson('content/registry/m3c-entry-visual-alignment.json');
assert.equal(registry.status, 'w3-entry-visual-alignment-ready');
assert.equal(registry.baseline.commit, '096575e95502e9144f03ec29d0ef4930f74be4b0');
assert.equal(registry.baseline.entryContractVersion, '1.0.0');
assert.equal(registry.baseline.entrySchemaId, 'phi-os.runtime-entry.v1');
assert.deepEqual(
  registry.scope.alignedSurfaces,
  ['header', 'spacing', 'button', 'card', 'typography', 'progress', 'error-state']
);
assert.deepEqual(
  registry.progress.stageOrder,
  ['entry', 'reconstruction', 'reading', 'navigation', 'review', 'memory', 'continuity']
);
assert.equal(registry.progress.automaticAdvance, false);
assert.equal(registry.errorState.retryPreservesEntry, true);
assert.equal(registry.errorState.providerFailureClearsRuntime, false);
assert.deepEqual(registry.hashPolicy, {
  algorithm: 'sha256',
  encoding: 'utf8',
  textNormalization: 'lf',
  byteOrderMarkIgnored: true
});

const wranglerReconciliation = await readJson('content/knowledge/registry/m3c-w3-wrangler-successor-reconciliation-v1.json');
for (const [file, expectedHash] of Object.entries(registry.frozenArtifacts)) {
  if (file === 'wrangler.jsonc') continue;
  assert.equal(
    await sha256(file),
    expectedHash,
    `Frozen M3C-W3 artifact changed: ${file}`
  );
}
assert.equal(wranglerReconciliation.predecessor.wranglerSha256, registry.frozenArtifacts['wrangler.jsonc']);
const readOnlyReconciliation=await readJson('content/knowledge/registry/m3c-w3-wrangler-successor-reconciliation-v2.json');
assert.equal(readOnlyReconciliation.status,'ENGINEERING_RECONCILIATION');
assert.equal(readOnlyReconciliation.predecessor,'content/knowledge/registry/m3c-w3-wrangler-successor-reconciliation-v1.json');
assert.equal(await sha256(readOnlyReconciliation.predecessor),readOnlyReconciliation.predecessorSha256);
assert.equal(readOnlyReconciliation.previousPath,'content/knowledge/registry/m3c-w3-wrangler-before-read-only-v2.jsonc');
assert.equal(readOnlyReconciliation.previousSha256,wranglerReconciliation.successor.wranglerSha256);
assert.equal(await sha256(readOnlyReconciliation.previousPath),readOnlyReconciliation.previousSha256);
assert.deepEqual(readOnlyReconciliation.allowedVars,{PHIOS_D1_MAINTENANCE_MODE:'READ_ONLY'});
for(const key of ['productionActivationVerified','deploymentExecuted','d1MutationExecuted'])assert.equal(readOnlyReconciliation[key],false);
const worldPreviewReconciliation=await readJson('content/knowledge/registry/m3c-w3-wrangler-successor-reconciliation-v3.json');
assert.equal(worldPreviewReconciliation.status,'ENGINEERING_RECONCILIATION');assert.equal(worldPreviewReconciliation.humanDecision,'PENDING');
assert.equal(worldPreviewReconciliation.predecessor,'content/knowledge/registry/m3c-w3-wrangler-successor-reconciliation-v2.json');
assert.equal(await sha256(worldPreviewReconciliation.predecessor),worldPreviewReconciliation.predecessorSha256);
assert.equal(worldPreviewReconciliation.previousSha256,readOnlyReconciliation.successorSha256);
assert.equal(await sha256(worldPreviewReconciliation.previousPath),readOnlyReconciliation.successorSha256);
assert.equal(await sha256('wrangler.jsonc'),worldPreviewReconciliation.successorSha256);
assert.deepEqual(worldPreviewReconciliation.allowedPreviewVars,{PHIOS_D1_MAINTENANCE_MODE:'READ_ONLY'});
for(const key of ['productionActivationVerified','deploymentExecuted','d1MutationExecuted','projectSettingsChanged'])assert.equal(worldPreviewReconciliation[key],false);
const wrangler=await readJson(worldPreviewReconciliation.previousPath),worldPreview=await readJson('wrangler.jsonc');
const expectedPreview=structuredClone(wrangler);Object.assign(expectedPreview.env.preview.vars,worldPreviewReconciliation.allowedPreviewVars);
assert.deepEqual(worldPreview,expectedPreview,'Only the recorded Preview maintenance variable may differ; production and QA bindings are preserved');
const publicationDelta=wranglerReconciliation.allowedDelta.pagesPublication;
assert.equal(publicationDelta.commit,'25226cd27f50c4b7197bd5a6f0371d56202861bf');
assert.equal(publicationDelta.predecessorOutputDirectory,wranglerReconciliation.preserved.pagesBuildOutputDirectory);
assert.equal(publicationDelta.successorOutputDirectory,'.pages-output');
assert.equal(wrangler.pages_build_output_dir,publicationDelta.successorOutputDirectory);
const historicalWrangler=JSON.parse(execFileSync('git',['show',publicationDelta.commit+':wrangler.jsonc'],{cwd:root,encoding:'utf8'}));
const priorWrangler=JSON.parse(execFileSync('git',['show',publicationDelta.commit+'^:wrangler.jsonc'],{cwd:root,encoding:'utf8'}));
assert.equal(priorWrangler.pages_build_output_dir,publicationDelta.predecessorOutputDirectory);
assert.deepEqual({...historicalWrangler,pages_build_output_dir:publicationDelta.predecessorOutputDirectory},priorWrangler,'Pages publication commit must change only output directory');
const rendererDelta=wranglerReconciliation.allowedDelta.productionRendererPreparation;
assert.equal(rendererDelta.commit,'d29bc63cdc9b30af6cf4b6425c820409b31c403f');
assert.equal(rendererDelta.previewChanged,false);
assert.equal(rendererDelta.productionActivationVerified,false);
const rendererPredecessor=JSON.parse(execFileSync('git',['show',rendererDelta.commit+'^:wrangler.jsonc'],{cwd:root,encoding:'utf8'}));
const rendererSuccessor=JSON.parse(execFileSync('git',['show',rendererDelta.commit+':wrangler.jsonc'],{cwd:root,encoding:'utf8'}));
assert.deepEqual(rendererPredecessor,historicalWrangler,'Renderer preparation must inherit the pinned publication successor');
assert.deepEqual(rendererSuccessor,{...historicalWrangler,services:rendererDelta.services,vars:rendererDelta.vars},'Only the recorded production renderer and preparation flags may change');
assert.deepEqual(rendererDelta.services,[{binding:'METHOD_REPORT_RENDERER',service:'phios-method-report-renderer-production'}]);
assert.deepEqual(rendererDelta.vars,{PHIOS_ENVIRONMENT:'production',STRIPE_ENVIRONMENT:'LIVE',PHIOS_SHARED_PAID_REPORT_ENABLED:'true',PHIOS_P9_CANARY_ENABLED:'false',PHIOS_P9_CHECKOUT_ENABLED:'false',PHIOS_P9_REFUND_ENABLED:'false',REPORT_PROVIDER_LIVE_ALLOWED:'false'});
assert.deepEqual(await readJson(readOnlyReconciliation.previousPath),rendererSuccessor);
assert.deepEqual(wrangler,{...rendererSuccessor,vars:{...rendererSuccessor.vars,...readOnlyReconciliation.allowedVars}},'Only the recorded read-only maintenance flag may differ from renderer preparation');
assert.equal(wrangler.ai.binding, wranglerReconciliation.preserved.aiBinding);
assert.equal(wrangler.d1_databases.length, 1);
assert.equal(wrangler.d1_databases[0].binding, wranglerReconciliation.preserved.d1Binding);
assert.equal(wrangler.d1_databases[0].database_name, wranglerReconciliation.preserved.d1DatabaseName);
assert.deepEqual(wrangler.r2_buckets, [
  { binding: wranglerReconciliation.allowedDelta.r2Binding, bucket_name: wranglerReconciliation.allowedDelta.bucketName },
  { binding: 'PRIVATE_REPORTS', bucket_name: 'phios-private-reports' }
]);
assert.equal(wranglerReconciliation.allowedDelta.privateReports.previewBucket, 'phios-private-reports-sandbox');
assert.equal(wrangler.env.preview.vars.RNT2_S04_REVIEW, wranglerReconciliation.allowedDelta.previewRnt2S04Review);
assert.equal(wrangler.vars?.RNT2_S04_REVIEW, undefined, 'Review flag must remain Preview-only');
assert.equal(wranglerReconciliation.preserved.runtimeContractsChanged, false);
assert.equal(wranglerReconciliation.preserved.entryPresentationChanged, false);

for (const [key, value] of Object.entries(registry.acceptance)) {
  if (key.endsWith('Changed')) {
    assert.equal(value, false, `M3C-W3 must not change ${key}`);
  }
}
assert.equal(registry.acceptance.mobileContractsPresent, true);
assert.equal(registry.acceptance.languageParityRequired, true);

const runtimeContracts = await readJson('content/registry/runtime-contracts.json');
const entryContract = runtimeContracts.contracts.find(
  contract => contract.id === 'runtime-entry'
);
assert.equal(entryContract.version, '1.0.0');
assert.equal(entryContract.schemaId, 'phi-os.runtime-entry.v1');
assert.equal(entryContract.status, 'stable');

const en = await read('assets/js/locales/en/entry.js');
const zh = await read('assets/js/locales/zh-Hans/entry.js');
for (const locale of [en, zh]) {
  assert.match(locale, /progressMemory:/);
  assert.match(locale, /progressContinuity:/);
  assert.match(locale, /errorLabel:/);
}

const packageJson = await effectivePackageScripts(readJson('package.json'));
assert.equal(
  packageJson.scripts['check:m3c-entry-visual-alignment'],
  'node scripts/check-m3c-entry-visual-alignment.mjs'
);
assert.match(packageJson.scripts.check, /check-m3c-entry-visual-alignment\.mjs/);

console.log('✓ M3C-W3 Entry Visual Alignment passed: Header, spacing, buttons, cards, typography, progress and errors.');
console.log('  Runtime Entry v1, API, persistence, revision and Reconstruction handoff remain unchanged.');
