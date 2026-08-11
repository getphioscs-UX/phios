import assert from 'node:assert/strict';
import fs from 'node:fs';

const file = 'package.json';
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
assert.equal(pkg.scripts?.['check:pr-w0-w13'], 'node scripts/check-pr-w0-w13-professional-runtime-v2.mjs', 'PR_BASE_CHECK_MISSING');
assert.ok(pkg.scripts?.['check:pr'], 'PR_CHECK_ALIAS_MISSING');

pkg.scripts['check:pr-e1-e3'] = 'node scripts/check-pr-e1-e3-production-foundation.mjs';
pkg.scripts['check:pr-production-foundation'] = 'npm run check:pr-e1-e3';
pkg.scripts['check:pr-production'] = 'npm run check:pr-production-foundation';

const command = 'npm run check:pr-production-foundation';
const tokens = String(pkg.scripts.postcheck || '').split('&&').map(value => value.trim()).filter(Boolean);
const without = tokens.filter(value => value !== command);
const prIndex = without.indexOf('npm run check:pr');
assert.ok(prIndex >= 0, 'POSTCHECK_PR_BASE_COMMAND_MISSING');
// Append instead of rewriting the PR tail so parallel ORC or later runtime integration is preserved.
without.push(command);
pkg.scripts.postcheck = without.join(' && ');

fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log('✓ PR-E1-E3 package integration applied.');
console.log('✓ Existing postcheck order preserved; PR production foundation checker appended as an exact command token.');
console.log('✓ Parallel ORC or later postcheck tail commands are not removed or reordered.');
