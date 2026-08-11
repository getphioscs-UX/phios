import fs from 'node:fs';

const file = new URL('../package.json', import.meta.url);
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
pkg.scripts ??= {};

const expected = {
  'check:rne-w0-w4': 'node scripts/check-rne-w0-w4-navigation-foundation.mjs',
  'check:rne-foundation': 'npm run check:rne-w0-w4',
  'check:rne': 'npm run check:rne-foundation'
};

for (const [key, value] of Object.entries(expected)) {
  if (pkg.scripts[key] && pkg.scripts[key] !== value) {
    throw new Error(`RNE_PACKAGE_SCRIPT_CONFLICT:${key}:${pkg.scripts[key]}`);
  }
  pkg.scripts[key] = value;
}

fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
console.log('✓ RNE-W0-W4 package scripts registered without modifying check, precheck or postcheck.');
