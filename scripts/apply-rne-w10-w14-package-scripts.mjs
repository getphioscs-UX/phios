import fs from 'node:fs';

const file = new URL('../package.json', import.meta.url);
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
pkg.scripts ??= {};
const preservedTopLevel = Object.fromEntries(
  ['check', 'precheck', 'postcheck'].map(key => [key, pkg.scripts[key]])
);

const expected = {
  'check:rne-w10-w14': 'node scripts/check-rne-w10-w14-integration-feedback-freeze.mjs',
  'check:rne-integration-feedback': 'npm run check:rne-w10-w14',
  'check:rne-w0-w14': 'npm run check:rne-w0-w4 && npm run check:rne-w5-w9 && npm run check:rne-w10-w14',
  'check:rne-v1': 'npm run check:rne-w0-w14',
  'check:rne-final': 'npm run check:rne-v1'
};

for (const [key, value] of Object.entries(expected)) {
  if (pkg.scripts[key] && pkg.scripts[key] !== value) {
    throw new Error(`RNE_PACKAGE_SCRIPT_CONFLICT:${key}:${pkg.scripts[key]}`);
  }
  pkg.scripts[key] = value;
}

// RNE-W0-W4 froze this historical alias. Do not rewrite a prior freeze just to make
// the latest aggregate convenient; RNE v1 receives versioned final aliases instead.
const historicalRneAlias = 'npm run check:rne-foundation';
if (pkg.scripts['check:rne'] && pkg.scripts['check:rne'] !== historicalRneAlias) {
  throw new Error(`RNE_HISTORICAL_ALIAS_DRIFT:check:rne:${pkg.scripts['check:rne']}`);
}
pkg.scripts['check:rne'] = historicalRneAlias;

for (const [key, before] of Object.entries(preservedTopLevel)) {
  if (pkg.scripts[key] !== before) throw new Error(`RNE_TOP_LEVEL_SCRIPT_MUTATED:${key}`);
}

fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
console.log('✓ RNE-W10-W14 package scripts registered.');
console.log('✓ Historical check:rne freeze alias preserved; canonical RNE v1 alias is check:rne-v1.');
console.log('✓ check, precheck and postcheck remain untouched.');
