import {loadBookViiPublishedAdmission,BOOK_VII_ADMISSION_PATH} from '../functions/_lib/book-vii-published-admission.js';
﻿import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';

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

  if(file.startsWith('content/profile/successors/personal-evidence-r1/w11r6/')) return false;

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
      stdio: 'inherit'
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
  fs.rmSync(
    dir,
    {
      recursive: true,
      force: true
    }
  );

  fs.mkdirSync(
    dir,
    {
      recursive: true
    }
  );
}

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
if (admittedBookVii) {
  publicationFiles.add(BOOK_VII_ADMISSION_PATH);
  const currentDirectory='content/knowledge/public/successors/book-vii-v2-source-refresh-v1/retrieval';
  if(fs.existsSync(path.join(root,currentDirectory)))for(const name of fs.readdirSync(path.join(root,currentDirectory)))if(name.endsWith('.json'))publicationFiles.add(currentDirectory+'/'+name);
}

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

console.log(
  `Pages static publication: copied=${copied}, skipped=${skipped}`
);

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

const workerBytes = fs.readFileSync(
  workerSource
);

const compressedBytes =
  gzipSync(workerBytes).length;

console.log(
  `Pages Worker: ${workerBytes.length} bytes; gzip ${compressedBytes} bytes`
);

if (workerBytes.length > 25 * 1024 * 1024) {
  throw new Error(
    'Pages Functions bundle exceeds 25 MiB'
  );
}

if (compressedBytes > 3 * 1024 * 1024) {
  throw new Error(
    'Worker exceeds conservative 3 MiB preflight budget'
  );
}

fs.copyFileSync(
  workerSource,
  path.join(output, '_worker.js')
);

fs.copyFileSync(
  routeSource,
  path.join(output, '_routes.json')
);

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
