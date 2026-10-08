import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

const output = path.join(
  root,
  '.pages-output'
);

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
}

if (!fs.existsSync(path.join(output, 'index.html'))) {
  failures.push('index.html: missing');
}

if (!fs.existsSync(path.join(output, '_worker.js'))) {
  failures.push('_worker.js: missing');
}

if (!fs.existsSync(path.join(output, '_routes.json'))) {
  failures.push('_routes.json: missing');
}

if (failures.length) {
  throw new Error(
    `Pages publication boundary failed:\n${failures.join('\n')}`
  );
}

console.log(
  `PASS Pages publication boundary: ${files.length} files; no asset exceeds 25 MiB; provider runtime payloads excluded.`
);
