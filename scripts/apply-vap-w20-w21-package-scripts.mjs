import assert from 'node:assert/strict';
import fs from 'node:fs';

const file = 'package.json';
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
pkg.scripts ||= {};

const requiredScripts = {
  'check:vap-w20': 'node scripts/check-vap-w20-w21-article-figure-binding.mjs VAP-W20',
  'check:vap-w21': 'node scripts/check-vap-w20-w21-article-figure-binding.mjs VAP-W21',
  'check:vap-w20-w21': 'node scripts/check-vap-w20-w21-article-figure-binding.mjs',
  'check:vap-d': 'npm run check:vap-w20-w21'
};
for (const [key, value] of Object.entries(requiredScripts)) {
  if (pkg.scripts[key] && pkg.scripts[key] !== value) {
    throw new Error(`VAP_W20_W21_SCRIPT_CONFLICT:${key}`);
  }
  pkg.scripts[key] = value;
}

const token = 'npm run check:vap-d';
const postcheck = String(pkg.scripts.postcheck || '')
  .split('&&')
  .map(value => value.trim())
  .filter(Boolean);
const filtered = postcheck.filter(value => value !== token);
filtered.push(token);
pkg.scripts.postcheck = filtered.join(' && ');

assert.equal(filtered.filter(value => value === token).length, 1);
fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log('✓ VAP-W20/W21 package integration applied.');
console.log('✓ check:vap-d added as one exact postcheck token; existing parallel Runtime tokens were preserved.');
