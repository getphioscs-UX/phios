import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildArticleReleaseExecution, executionPaths } from './lib/visual-article-production/article-release-execution-v1.mjs';
const expected = buildArticleReleaseExecution();
for (const [key, relative] of Object.entries(executionPaths)) { const actual = fs.readFileSync(relative, 'utf8'); assert.deepEqual(key === 'route' ? actual : JSON.parse(actual), expected[key]); }
for (const key of ['title','summary','body','figureReferences','href','slug','version','lineage']) assert.ok(Object.hasOwn(expected.authority, key), key);
assert.equal(expected.authority.figureReferences[0].assetCode, 'ASSET-KN-PREFACE-001-MECHANISM-ZH-HANS-002');
assert.equal(expected.website.deploymentPerformed, false);
const source = fs.readFileSync('scripts/check-vap-w26-w27-article-release.mjs','utf8');
for (const name of ['writeFileSync','writeFile','rename','mkdir','publish','deploy']) assert.equal(new RegExp(`(?:fs\\.)?${name}\\s*\\(`).test(source), false);
console.log('✓ VAP-W26 authority projection and VAP-W27 website artifact release passed; deployment remains separate.');
