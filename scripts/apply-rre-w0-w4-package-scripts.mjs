import fs from 'node:fs';

const file = new URL('../package.json', import.meta.url);
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
pkg.scripts ??= {};

const expected = {
  'check:rre-w0-w4': 'node scripts/check-rre-w0-w4-readout-foundation.mjs',
  'check:rre-foundation': 'npm run check:rre-w0-w4',
  'check:rre': 'npm run check:rre-foundation'
};

for (const [key, value] of Object.entries(expected)) {
  if (pkg.scripts[key] && pkg.scripts[key] !== value) {
    throw new Error(`RRE_PACKAGE_SCRIPT_CONFLICT:${key}:${pkg.scripts[key]}`);
  }
  pkg.scripts[key] = value;
}

fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
console.log('✓ RRE-W0-W4 package scripts registered without modifying postcheck.');
