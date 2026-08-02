import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { W3A_FILES, buildEditorialPackage, validateEditorialPackage } from './lib/knowledge-production/editorial-package.mjs';

const root = process.cwd();
const readText = relative => fs.readFileSync(path.join(root, relative), 'utf8').replace(/\r\n?/g, '\n');
const read = relative => JSON.parse(readText(relative));
const pkg = read('package.json');
assert.equal(pkg.scripts['check:pja-w3a'], 'npm run check:pja-w2f-c3r1 && node scripts/check-pja-w3a-editorial-package-foundation.mjs');
assert.equal(pkg.scripts['knowledge:build-editorial-package'], 'node scripts/build-pja-w3a-editorial-package.mjs');
assert.equal(pkg.scripts['knowledge:validate-editorial-package'], 'node scripts/validate-pja-w3a-editorial-package.mjs');

const expected = buildEditorialPackage(root);
assert.equal(validateEditorialPackage(root).valid, true);
const manifest = read(W3A_FILES.manifest), claims = read(W3A_FILES.claims), sources = read(W3A_FILES.sources);
const boundary = read(W3A_FILES.boundary), figures = read(W3A_FILES.figures), metadata = read(W3A_FILES.metadata), draft = readText(W3A_FILES.draft);
assert.equal(manifest.nodeCode, 'KN-PREFACE-001');
assert.equal(manifest.status, 'validated');
assert.deepEqual(manifest.stateMachine, ['draft', 'validated', 'human_review']);
assert.equal(manifest.projection.mode, 'canonical_projection_only');
assert.equal(manifest.projection.rewriteAllowed, false); assert.equal(manifest.projection.aiExpansionAllowed, false);
assert.equal(manifest.effects.productionExportGenerated, false); assert.equal(manifest.effects.published, false);
assert.equal(claims.coverage.percentage, 100); assert.equal(claims.coverage.total, claims.coverage.bound);
assert(claims.bindings.every(binding => binding.coverage === 'covered' && binding.sourceCodes.length));
const registryCodes = new Set(read('content/knowledge/registry/sources.json').sources.map(source => source.sourceCode));
assert(sources.bindings.every(binding => registryCodes.has(binding.sourceCode)));
assert(!sources.bindings.some(binding => Object.hasOwn(binding, 'url')));
assert.equal(boundary.status, 'covered'); assert.deepEqual(boundary.uncovered, []);
for (const key of ['mustEstablish', 'mustNotClaim', 'includedScope', 'excludedScope']) assert(boundary[key].every(item => item.covered && draft.includes(item.statement)));
assert(figures.bindings.every(binding => binding.generated === false && binding.status === 'decision_only'));
assert.equal(metadata.hash, manifest.contentHash); assert.equal(metadata.claimCount, claims.bindings.length); assert.equal(metadata.sourceCount, sources.bindings.length); assert.equal(metadata.figureCount, figures.bindings.length);
assert(draft.startsWith('# '));
for (const value of ['## Lead', '## Canonical Thesis', '## Body', '## Supporting Questions', '## References', '## Boundary Notes']) assert(draft.includes(value));

const mutate = (relative, change) => { const value = relative.endsWith('.md') ? readText(relative) : read(relative); const clone = structuredClone(value); const changed = change(clone) ?? clone; return { [relative]: typeof changed === 'string' ? changed : `${JSON.stringify(changed, null, 2)}\n` }; };
const guards = [
  ['Draft without Package', { [W3A_FILES.manifest]: null }],
  ['Manifest mismatch', mutate(W3A_FILES.manifest, value => { value.language = 'en'; })],
  ['Claim uncovered', mutate(W3A_FILES.claims, value => { value.coverage.percentage = 80; })],
  ['Source missing', mutate(W3A_FILES.sources, value => { value.bindings = []; })],
  ['Boundary uncovered', mutate(W3A_FILES.boundary, value => { value.uncovered = ['mustEstablish-1']; })],
  ['Unknown Figure', mutate(W3A_FILES.figures, value => { value.bindings[0].figureCode = 'FIG-UNKNOWN'; })],
  ['Duplicate Draft', mutate(W3A_FILES.manifest, value => { value.files.push(W3A_FILES.draft); })],
  ['Wrong Node', mutate(W3A_FILES.manifest, value => { value.nodeCode = 'KN-PREFACE-002'; })],
  ['Wrong Version', mutate(W3A_FILES.metadata, value => { value.version = '9.9.9'; })],
  ['Hash mismatch', mutate(W3A_FILES.metadata, value => { value.hash = 'sha256:invalid'; })]
];
for (const [name, fixture] of guards) assert.equal(validateEditorialPackage(root, fixture).valid, false, name);

const dry = spawnSync(process.execPath, ['scripts/build-pja-w3a-editorial-package.mjs', '--dry-run'], { cwd: root, encoding: 'utf8' });
assert.equal(dry.status, 0, dry.stderr); const report = JSON.parse(dry.stdout); assert.equal(report.create, 0); assert.equal(report.update, 0); assert.deepEqual(report.filesThatWouldChange, []);
const apply = spawnSync(process.execPath, ['scripts/build-pja-w3a-editorial-package.mjs', '--apply'], { cwd: root, encoding: 'utf8' });
assert.equal(apply.status, 0, apply.stderr); assert(apply.stdout.includes('apply no-op'));

console.log('✓ PJA-W3A Editorial Package Foundation passed.');
console.log(`  KN-PREFACE-001 Governed Production Package validated: ${metadata.claimCount} claims, ${metadata.sourceCount} Registry source, ${metadata.questionCount} questions and ${metadata.figureCount} figure decision.`);
console.log(`  Projection-only draft, boundary coverage, hash/version consistency, idempotency and ${guards.length} negative guards passed; 0 Production Exports and 0 publications.`);
