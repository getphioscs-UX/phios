import fs from 'node:fs';

const file = new URL('../package.json', import.meta.url);
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
pkg.scripts ??= {};
const preservedTopLevel = Object.fromEntries(
  ['check', 'precheck', 'postcheck'].map(key => [key, pkg.scripts[key]])
);

const expected = {
  'check:rne-w0-w4': 'node scripts/check-rne-w0-w4-navigation-foundation.mjs',
  'check:rne-foundation': 'npm run check:rne-w0-w4',
  'check:rne-w5-w9': 'node scripts/check-rne-w5-w9-navigation-decision-support.mjs',
  'check:rne-decision-support': 'npm run check:rne-w5-w9',
  'check:rne-w0-w9': 'npm run check:rne-w0-w4 && npm run check:rne-w5-w9'
};

for (const [key, value] of Object.entries(expected)) {
  if (pkg.scripts[key] && pkg.scripts[key] !== value) {
    throw new Error(`RNE_PACKAGE_SCRIPT_CONFLICT:${key}:${pkg.scripts[key]}`);
  }
  pkg.scripts[key] = value;
}

const frozenRne = 'npm run check:rne-foundation';
if (pkg.scripts['check:rne'] && pkg.scripts['check:rne'] !== frozenRne) {
  throw new Error(`RNE_PACKAGE_SCRIPT_CONFLICT:check:rne:${pkg.scripts['check:rne']}`);
}
pkg.scripts['check:rne'] = frozenRne;

for (const [key, before] of Object.entries(preservedTopLevel)) {
  if (pkg.scripts[key] !== before) throw new Error(`RNE_TOP_LEVEL_SCRIPT_MUTATED:${key}`);
}

fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
console.log('✓ RNE-W5-W9 package scripts registered. check, precheck and postcheck remain untouched.');
