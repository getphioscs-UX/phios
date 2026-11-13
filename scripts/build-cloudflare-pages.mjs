import {worldPreviewBuildPolicy,isolateWorldPreviewWorker} from './lib/world-preview-worker-isolation.mjs';
import {finalReleaseBuildPolicy,isolateFinalReleaseWorker} from './lib/final-release-publication.mjs';
import {loadBookViiPublishedAdmission,BOOK_VII_ADMISSION_PATH} from '../functions/_lib/book-vii-published-admission.js';
import {internalPublicationFile} from './lib/publication-boundary.mjs';
import {emitPublicCountryHistoryAssets} from './lib/country-history-publication-r4.mjs';
import {freeCountryPreviewBuildPolicy,isolateFreeCountryPreviewWorker} from './lib/free-country-preview-isolation-r1.mjs';
﻿import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { transformSync } from 'esbuild';
import {createHash} from 'node:crypto';
import {acquirePagesOutputLock} from './lib/pages-output-lock.mjs';
import {pagesWorkerCompactionOptions} from './lib/pages-worker-compaction.mjs';
import {assessWorkerSize} from './lib/pages-worker-size-policy.mjs';
import {requireDiskSpace} from './lib/disk-space-guard.mjs';

requireDiskSpace({label:'Pages production build',estimatedBytes:2_000_000_000});

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

const config = JSON.parse(
  fs.readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8')
);

if (config.pages_build_output_dir !== '.pages-output') {
  throw new Error(
    `PAGES_BUILD_OUTPUT_DIR must be ".pages-output", got "${config.pages_build_output_dir}"`
  );
}

const output = path.join(root, '.pages-output');
// Keep server metadata aligned even when source changes are not committed.
await import('./build-manuscript-server-metadata.mjs');

const workerBuild = path.join(
  root,
  '.wrangler',
  'pages-production-build'
);

const wrangler = path.join(
  root,
  'node_modules',
  'wrangler',
  'bin',
  'wrangler.js'
);

const git = process.env.PHIOS_GIT_BIN || 'git';

// Exclude concurrent writers before either generated directory is cleaned.
// A stale lock is retained after a killed process for explicit reconciliation.
const buildLease=acquirePagesOutputLock(root,'BUILD');
const statePath=path.join(root,'.wrangler','pages-publication-build-state.json');
let stage='STARTED',complete=false;
function recordStage(value){stage=value;fs.writeFileSync(statePath,JSON.stringify({pid:process.pid,stage,output,workerBuild,recordedAt:new Date().toISOString(),complete}));}
process.prependOnceListener('exit',code=>{if(!complete)fs.writeFileSync(statePath,JSON.stringify({pid:process.pid,stage,output,workerBuild,complete:false,status:'FAILED_OR_INTERRUPTED',exitCode:code,recordedAt:new Date().toISOString()}));});
recordStage('STARTED');

const excludedTopLevel = new Set([
  '.phios-repair-receipts',
  '.git',
  '.github',
  '.wrangler',
  '.pages-output',
  '.phios-repair-backups',
  'node_modules',
  'functions',
  'scripts',
  'workers',
  'docs',
  'output',
  'tools',
  'review',
  'tests',
  'test',
  'fixtures',
  'db',
  'dist'
]);

const excludedRootFiles = new Set([
  '.gitignore',
  '.node-version',
  'package.json',
  'package-lock.json',
  'wrangler.jsonc',
  'dev.vars.example',
  'GOVERNANCE.md',
  'INSTALL.md',
  'check.mjs',
  '_worker.js',
  '_routes.json'
]);

const excludedRuntimeAssets = new Set([
  'content/civilization-atlas/reconfiguration/market-provider-intake-v1.json',
  'content/civilization-atlas/reconfiguration/market-provider-snapshots-v1.json'
]);

function normalize(rel) {
  return rel.replaceAll('\\', '/');
}

function isPublishable(rel) {
  const file = normalize(rel);
  if (internalPublicationFile(file)) return false;

  if(file.startsWith('content/production-closure/')) return false;
  if(file.startsWith('content/profile/successors/personal-evidence-r1/w11r6/')) return false;
  if(file.startsWith('content/product-convergence-r1/audits/w12-w95/')) return false;
  if(file.startsWith('content/product-convergence-r1/audits/consolidated-closure/')) return false;

  if (!file) return false;

  const first = file.split('/')[0];

  if (excludedTopLevel.has(first)) {
    return false;
  }

  if (!file.includes('/') && excludedRootFiles.has(file)) {
    return false;
  }

  // Book VII private lineage, fixtures and unapproved candidates are review-only.
  if (file.startsWith('content/knowledge/book-vii/')) return false;

  if (excludedRuntimeAssets.has(file)) {
    return false;
  }

  return true;
}

function run(command, args) {
  const result = spawnSync(
    command,
    args,
    {
      cwd: root,
      stdio: 'inherit',
      env:{...process.env,WRANGLER_LOG_PATH:process.env.WRANGLER_LOG_PATH||path.join(root,'.tmp','pages-wrangler.log'),WRANGLER_SEND_METRICS:process.env.WRANGLER_SEND_METRICS||'false',PHIOS_PAGES_BUILD_TOKEN:buildLease.token}
    }
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `${command} failed with exit code ${result.status}`
    );
  }
}

function cleanDirectory(dir) {
  const checked=path.resolve(dir);
  if(![path.resolve(output),path.resolve(workerBuild)].includes(checked))throw Error('PAGES_GENERATED_CLEANUP_PATH_INVALID');
  if(!fs.existsSync(checked)){fs.mkdirSync(checked,{recursive:true});return;}
  const info=fs.lstatSync(checked);
  if(!info.isDirectory()||info.isSymbolicLink())throw Error('PAGES_GENERATED_CLEANUP_ROOT_INVALID');
  // Keep the validated generated root: Windows preview/CWD handles can lock
  // directory removal even when its generated children can be replaced.
  const clearFiles=parent=>{for(const name of fs.readdirSync(parent)){
    const child=path.resolve(parent,name);
    if(path.dirname(child)!==parent||!child.startsWith(checked+path.sep))throw Error('PAGES_GENERATED_CLEANUP_CHILD_INVALID');
    const entry=fs.lstatSync(child);
    if(entry.isDirectory()&&!entry.isSymbolicLink())clearFiles(child);
    else fs.rmSync(child,{force:true,maxRetries:5,retryDelay:200});
  }};
  clearFiles(checked);
}

run(process.execPath,['scripts/build-world-recovery-index.mjs']);
recordStage('STATIC_COPY');
cleanDirectory(output);

const tracked = spawnSync(
  git,
  ['ls-files', '-z'],
  {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024
  }
);

if (tracked.error || tracked.status !== 0) {
  throw tracked.error ||
    new Error('Cannot enumerate tracked repository files');
}

// Include only the validated Human-accepted successor in uncommitted local builds.
const admittedBookVii = await loadBookViiPublishedAdmission(async rel => {
  const source = path.join(root, rel);
  return fs.existsSync(source) ? JSON.parse(fs.readFileSync(source, 'utf8')) : null;
});
const publicationFiles = new Set(tracked.stdout.split('\0').filter(Boolean));
// ECR Deep Reading R2 public exploration only. Never include private review
// reports, synthetic full-reading bodies, checkpoints, or SQLite evidence.
for(const file of ['assets/customer-ui/js/surfaces/ecr-deep-reading-r2.js','assets/customer-ui/surfaces/ecr-deep-reading-r2.css','assets/customer-ui/media/ecr-deep-r2/public-explorer.json'])if(fs.existsSync(path.join(root,file)))publicationFiles.add(file);
// Customer Entry R1: only these two public discovery assets may join an uncommitted local build.
// The existing publication predicate still filters every entry; no reviews or private sources are added.
for(const file of ['assets/js/customer-entry-topic-map.js','assets/customer-ui/surfaces/customer-entry-r1.css'])if(fs.existsSync(path.join(root,file)))publicationFiles.add(file);
// Explicit public W8-I reading adapter for uncommitted local builds. This adds
// no dossier JSON, private source, review fixture, registry or production switch.
const acceptedDossierView='assets/js/pages/civilization-atlas/book6-current-view.js';
if(fs.existsSync(path.join(root,acceptedDossierView)))publicationFiles.add(acceptedDossierView);
const authorDisplayOverlay='content/civilization-atlas/reconfiguration/runtime-position-display-errata-r1.json';
if(fs.existsSync(path.join(root,authorDisplayOverlay)))publicationFiles.add(authorDisplayOverlay);

// Version-bound public admission metadata; private owner review remains excluded.
const book5AcceptancePath='content/knowledge/public/successors/book5-publication-v1/human-acceptance-successor-v1.json';
if(fs.existsSync(path.join(root,book5AcceptancePath))){
 const acceptance=JSON.parse(fs.readFileSync(path.join(root,book5AcceptancePath),'utf8'));
 const digest=file=>createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
 if(acceptance.decision!=='HUMAN_ACCEPTED'||acceptance.manifestPath!=='/content/knowledge/public/successors/book5-publication-v1/visual-article-release.json'||acceptance.manifestSHA256!==digest(acceptance.manifestPath.slice(1)))throw Error('BOOK5_ACCEPTANCE_MANIFEST_DRIFT');
 for(const record of acceptance.records||[]){if(!record.path.startsWith('/content/knowledge/public/')||record.sha256!==digest(record.path.slice(1)))throw Error('BOOK5_ACCEPTANCE_ARTICLE_DRIFT');}
 publicationFiles.add(book5AcceptancePath);
}
// The recovery error page must be reviewable before committing it. Without a
// top-level 404.html Pages serves the homepage for unknown static routes.
if(fs.existsSync(path.join(root,'404.html')))publicationFiles.add('404.html');
// Reviewable membership source-description runtime, without private manuscript
// payloads. Uncommitted additions still pass the existing publication predicate.
for(const file of ['membership-source.html','assets/js/pages/membership-source.js','assets/js/pages/membership-ask-credit-r1.js'])if(fs.existsSync(path.join(root,file)))publicationFiles.add(file);
// Explicit R2 runtime additions for uncommitted local builds. Review evidence
// and captures remain excluded by the shared publication predicate.
for(const file of ['assets/css/global-visual-r2.css','assets/js/global-visual-r2.js','data/visual/approved-r2-visual-assets.json'])if(fs.existsSync(path.join(root,file)))publicationFiles.add(file);
// Founder R1 local source additions retain the existing static publication predicate.
for(const file of ['assets/css/founder-publication-r1.css','assets/css/founder-publication-r2.css','assets/js/pages/founder-publication-r1.js'])if(fs.existsSync(path.join(root,file)))publicationFiles.add(file);
// Explicit R5 source additions for uncommitted local preview. Every file still
// passes the original publication predicate and static/Worker size checks.
for(const file of ['assets/customer-ui/surfaces/visual-binding-r5.css','assets/customer-ui/js/surfaces/visual-binding-r5-guides.js','content/customer-experience-rebuild/authority/customer-visual-asset-registry-v4.json'])if(fs.existsSync(path.join(root,file)))publicationFiles.add(file);
// Explicit World recovery source additions; standard publication boundary still applies.
for(const file of ["assets/js/pages/civilization-atlas/world-guided-readings.js","content/civilization-atlas/public/world-guided-readings-r1.json","assets/js/pages/civilization-atlas/world-copy.js","assets/js/pages/civilization-atlas/visual-runtime.js","assets/js/pages/civilization-atlas/world-search.js","assets/js/pages/civilization-atlas/world-explorer.js","assets/css/world-experience-r2.css","assets/js/pages/civilization-atlas/world-experience-r2.js","assets/js/pages/civilization-atlas/world-r2-inputs.js","content/civilization-atlas/geography/world-selection-geometry-r2.json","assets/js/pages/civilization-atlas/world-observations.js","assets/js/pages/civilization-atlas/world-published-reading.js","assets/js/locales/en/world-recovery.js","assets/js/locales/zh-Hans/world-recovery.js","content/civilization-atlas/search/world-search-index-v1.json"])if(fs.existsSync(path.join(root,file)))publicationFiles.add(file);
// Include this new local customer consumer before commit; it remains subject
// to the same public boundary, size checks and source-identity receipt.
for(const file of ['world/index.html','assets/js/pages/world.js','assets/customer-ui/surfaces/reality-structure.css','assets/customer-ui/surfaces/professional-visual-r1.css','assets/customer-ui/js/professional-visual-r1.js','assets/customer-ui/surfaces/personal-method-visual-r1.css','assets/customer-ui/js/personal-method-visual-r1.js'])if(fs.existsSync(path.join(root,file)))publicationFiles.add(file);
// Bounded External Reality customer renderer; no review fixtures are published.
for(const file of ['assets/customer-ui/js/surfaces/external-reality.js'])if(fs.existsSync(path.join(root,file)))publicationFiles.add(file);
const atlasReadingBridge='assets/js/pages/civilization-atlas/atlas-reading-bridge.js';
if(fs.existsSync(path.join(root,atlasReadingBridge)))publicationFiles.add(atlasReadingBridge);
if (admittedBookVii) {
  publicationFiles.add(BOOK_VII_ADMISSION_PATH);
  const currentDirectory='content/knowledge/public/successors/book-vii-v2-source-refresh-v1/retrieval';
  if(fs.existsSync(path.join(root,currentDirectory)))for(const name of fs.readdirSync(path.join(root,currentDirectory)))if(name.endsWith('.json'))publicationFiles.add(currentDirectory+'/'+name);
}


// Bounded W4/W5/W9/W10 integration: public UI only; existing exclusions remain authoritative.
for(const file of ["assets/customer-ui/js/surfaces/journey-method-visual-model-r1.js","assets/customer-ui/js/surfaces/journey-method-visual-r1.js","assets/customer-ui/surfaces/journey-method-visual-r1.css","assets/customer-ui/js/surfaces/profile-observation-panels-r1.js","assets/customer-ui/js/personal-products/profile-observation-prompts-r1.js"]){if(!fs.existsSync(path.join(root,file)))throw Error("VISUAL_INTEGRATION_INPUT_MISSING:"+file);publicationFiles.add(file);}
const visualPointer=JSON.parse(fs.readFileSync(path.join(root,"content/web-production/registries/current-client-visual-registry.json"),"utf8"));
if(!/^\/content\/web-production\/registries\/client-visual-asset-registry-v\d+(?:\.\d+)*\.json$/.test(visualPointer.currentRegistryPath))throw Error("VISUAL_REGISTRY_PATH_INVALID");
publicationFiles.add(visualPointer.currentRegistryPath.slice(1));
// Never promote legacy QA builds, review exports or private operational QA config
// merely because those files remain tracked in the current main snapshot.
for(const file of [...publicationFiles])if(/^(?:tmp\/|artifacts\/|config\/qa\/)/.test(file)||/^config\/reports\/(?:zero-cost-check-(?:commands|successors)|tarot-qa-provider)\.json$/.test(file))publicationFiles.delete(file);
let copied = 0;
let skipped = 0;

for (
  const raw of publicationFiles
) {
  const rel = normalize(raw);

  if (!isPublishable(rel)) {
    skipped++;
    continue;
  }

  const source = path.join(root, rel);

  if (!fs.existsSync(source)) {
    continue;
  }

  const stat = fs.statSync(source);

  if (!stat.isFile()) {
    continue;
  }

  const destination = path.join(
    output,
    rel
  );

  fs.mkdirSync(
    path.dirname(destination),
    { recursive: true }
  );

  fs.copyFileSync(
    source,
    destination
  );

  copied++;
}

if (!fs.existsSync(path.join(output, 'index.html'))) {
  throw new Error(
    'Pages publication boundary did not contain index.html'
  );
}

// Source-controlled R4 review candidates are not public-content admission.
// Omit their prose in both static representations; server consumers apply the same gate.
console.log('Country public admission boundary:',JSON.stringify(emitPublicCountryHistoryAssets(root,output)));

console.log(
  `Pages static publication: copied=${copied}, skipped=${skipped}`
);

recordStage('WORKER_COMPILE');
cleanDirectory(workerBuild);

const emptyAssets = path.join(
  workerBuild,
  'empty-assets'
);

fs.mkdirSync(
  emptyAssets,
  { recursive: true }
);

run(
  process.execPath,
  [
    wrangler,
    'pages',
    'functions',
    'build',
    '--minify',
    '--build-output-directory',
    emptyAssets,
    '--outdir',
    workerBuild,
    '--output-routes-path',
    path.join(workerBuild, '_routes.json'),
    '--compatibility-date',
    config.compatibility_date,
    '--compatibility-flags',
    ...(config.compatibility_flags || [])
  ]
);

const workerSource = path.join(
  workerBuild,
  'index.js'
);

const routeSource = path.join(
  workerBuild,
  '_routes.json'
);

if (!fs.existsSync(workerSource)) {
  throw new Error(
    'Pages Functions worker bundle was not generated'
  );
}

if (!fs.existsSync(routeSource)) {
  throw new Error(
    'Pages Functions _routes.json was not generated'
  );
}

const routes = JSON.parse(
  fs.readFileSync(
    routeSource,
    'utf8'
  )
);

if (
  routes.version !== 1 ||
  !Array.isArray(routes.include) ||
  routes.include.length === 0
) {
  throw new Error(
    'Missing generated Pages Functions routes'
  );
}

// Compact generated bindings and whitespace, preserving runtime names, syntax
// and legal comments. Apply the current platform policy to shipped modules.
const worldPreviewPolicy=worldPreviewBuildPolicy(process.env);
const finalReleasePolicy=finalReleaseBuildPolicy(process.env);
const freeCountryPolicy=freeCountryPreviewBuildPolicy(process.env);
const compiledWorker = freeCountryPolicy.active?isolateFreeCountryPreviewWorker(workerSource,freeCountryPolicy):finalReleasePolicy.active?isolateFinalReleaseWorker(workerSource,finalReleasePolicy):isolateWorldPreviewWorker(workerSource,worldPreviewPolicy);
console.log('Free/Country isolated build scope: '+JSON.stringify(freeCountryPolicy));
console.log('World immutable build scope: '+JSON.stringify(worldPreviewPolicy));
const compactWorker = transformSync(compiledWorker, pagesWorkerCompactionOptions).code;
fs.writeFileSync(workerSource, compactWorker);
const workerBytes = fs.readFileSync(
  workerSource
);

const compressedBytes =
  gzipSync(workerBytes).length;

console.log(
  `Pages Worker: ${workerBytes.length} bytes; gzip ${compressedBytes} bytes`
);

// Count generated runtime payloads, not website assets or route/source-map metadata.
// The current publisher emits a single bundled entry. Fail explicitly if Wrangler
// begins emitting additional modules instead of silently measuring only the entry.
const workerModules = [];
function collectWorkerModules(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) collectWorkerModules(file);
    else if (entry.isFile() && file !== routeSource && !file.endsWith('.map')) {
      workerModules.push({path:path.relative(workerBuild,file).replaceAll('\\','/'),bytes:fs.statSync(file).size});
    }
  }
}
collectWorkerModules(workerBuild);
const sizePolicy = assessWorkerSize({
  uncompressedBytes:workerModules.reduce((sum,module)=>sum+module.bytes,0),
  gzipBytes:compressedBytes
});
console.log(sizePolicy.gzipStatus + ': no compressed-size hard limit.');
console.log(sizePolicy.status + ': ' + JSON.stringify({...sizePolicy,modules:workerModules}));
if (sizePolicy.status === 'WORKER_SIZE_PLATFORM_FAIL') {
  throw new Error('WORKER_SIZE_PLATFORM_FAIL: Worker exceeds Cloudflare 64 MiB uncompressed size limit');
}
if (sizePolicy.warning) console.warn('WORKER_SIZE_WARNING: bundle exceeds 48 MiB; review dependencies and startup performance.');
if (workerModules.length !== 1 || workerModules[0].path !== 'index.js') {
  throw new Error('WORKER_ADDITIONAL_MODULE_PUBLICATION_REQUIRED: reconcile Wrangler Total Upload and publisher before release');
}

recordStage('PUBLISH_GENERATED_WORKER_AND_ROUTES');
fs.copyFileSync(
  workerSource,
  path.join(output, '_worker.js')
);

fs.copyFileSync(
  routeSource,
  path.join(output, '_routes.json')
);

recordStage('PUBLICATION_BOUNDARY_CHECK');
run(
  process.execPath,
  [
    path.join(
      root,
      'scripts',
      'check-pages-static-assets.mjs'
    )
  ]
);

console.log(
  'PASS Cloudflare Pages build boundary: .pages-output'
);
complete=true;
recordStage('COMPLETE');
