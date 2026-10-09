import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {acquirePagesOutputLock} from './lib/pages-output-lock.mjs';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

const output = path.join(
  root,
  '.pages-output'
);
const config=JSON.parse(fs.readFileSync(path.join(root,'wrangler.jsonc'),'utf8'));
if(path.resolve(root,config.pages_build_output_dir)!==output)throw Error('PAGES_OUTPUT_DIRECTORY_MISMATCH: checker and wrangler configuration differ');
const lease=acquirePagesOutputLock(root,'CHECK');

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const forbidden = new Set([
  'content/civilization-atlas/reconfiguration/market-provider-intake-v1.json',
  'content/civilization-atlas/reconfiguration/market-provider-snapshots-v1.json'
]);

if (!fs.existsSync(output)) {
  throw new Error(
    'PAGES_STATIC_ASSETS: .pages-output does not exist. Run npm run build:pages first.'
  );
}

const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(
    dir,
    { withFileTypes: true }
  )) {
    const absolute = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(absolute);
      continue;
    }

    if (entry.isFile()) {
      files.push(absolute);
    }
  }
}

walk(output);

const failures = [];

for (const absolute of files) {
  const rel = path
    .relative(output, absolute)
    .replaceAll('\\', '/');

  const size = fs.statSync(absolute).size;

  if (size > MAX_FILE_SIZE) {
    failures.push(
      `${rel}: ${(size / 1024 / 1024).toFixed(2)} MiB`
    );
  }

  if (forbidden.has(rel)) {
    failures.push(
      `${rel}: governed runtime evidence leaked into Pages assets`
    );
  }
  if(rel.startsWith('output/pdf/')) failures.push(`${rel}: local review PDF leaked into Pages assets`);
  if(rel.startsWith('.phios-repair-backups/')||rel.startsWith('content/profile/successors/personal-evidence-r1/w11r6/')) failures.push(`${rel}: local repair/review evidence leaked into Pages assets`);
}

if (!fs.existsSync(path.join(output, 'index.html'))) {
  failures.push('index.html: missing');
}

if (!fs.existsSync(path.join(output, '_worker.js'))) {
  failures.push('_worker.js: missing');
} else if(fs.statSync(path.join(output,'_worker.js')).size===0){
  failures.push('_worker.js: empty, compiled Worker required');
}

if (!fs.existsSync(path.join(output, '_routes.json'))) {
  failures.push('_routes.json: missing');
} else {
  try {const routes=JSON.parse(fs.readFileSync(path.join(output,'_routes.json'),'utf8'));if(routes.version!==1||!Array.isArray(routes.include)||routes.include.length===0)failures.push('_routes.json: generated routing contract invalid');}
  catch {failures.push('_routes.json: invalid JSON');}
}

if (failures.length) {
  const statePath=path.join(root,'.wrangler','pages-publication-build-state.json');
  const state=fs.existsSync(statePath)?JSON.parse(fs.readFileSync(statePath,'utf8')):null;
  throw new Error(
    `Pages publication boundary failed:\n${failures.join('\n')}\nBuild state: ${state?JSON.stringify(state):'NO_BUILD_RECEIPT; build prerequisite not evidenced'}`
  );
}

console.log(
  `PASS Pages publication boundary: ${files.length} files; no asset exceeds 25 MiB; provider runtime payloads excluded.`
);
lease.release();
