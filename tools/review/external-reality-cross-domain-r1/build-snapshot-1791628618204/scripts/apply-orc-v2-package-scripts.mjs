import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
pkg.scripts ??= {};

const additions = {
  'check:orc-w0-w12': 'node scripts/check-orc-v2-w0-w12.mjs',
  'check:orc-v2': 'npm run check:orc-w0-w12',
  'check:orc': 'npm run check:orc-v2',
  'check:runtime:v4': 'node scripts/run-runtime-checker-v4.mjs',
  'check:runtime:v4:all': 'npm run check:runtime:v4 -- --group=ALL_REGISTERED',
  'check:orc:rg': 'npm run check:runtime:v4 -- ORC-W12'
};

for (const [key, value] of Object.entries(additions)) {
  const existing = pkg.scripts[key];
  if (existing && existing !== value) {
    throw new Error(`PACKAGE_SCRIPT_CONFLICT:${key}:${existing}`);
  }
  pkg.scripts[key] = value;
}

// Historical RG v1 global alias is intentionally untouched.
if (pkg.scripts['check:runtime'] !== 'node scripts/run-runtime-checker-v3.mjs') {
  throw new Error(`RG_V1_GLOBAL_ALIAS_DRIFT:${pkg.scripts['check:runtime']}`);
}

fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log('✓ ORC v2 package scripts registered.');
console.log('✓ Historical check:runtime remains on frozen RG v1/v3; ORC uses explicit RG v4 successor entry.');
