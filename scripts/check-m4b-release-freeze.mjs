import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const json = async file => JSON.parse(await read(file));

const freeze = await json('content/registry/m4b-release-freeze.json');
const packageJson = await json('package.json');
const contractAcceptance = await json('content/registry/m4b-contract-acceptance.json');
const framework = await json('content/registry/m4b-external-reader-framework.json');
const privacy = await json('content/registry/m4b-external-reader-data-privacy.json');
const reports = await json('content/registry/m4b-professional-reports.json');
const readers = await json('knowledge/external-readers/registry/readers.json');

assert.equal(freeze.id, 'phi-os.m4b-release-freeze');
assert.equal(freeze.milestone, 'M4B-W10');
assert.match(freeze.baseline, /^[0-9a-f]{40}$/);
assert.ok(freeze.allowed_results.includes(freeze.freeze_state));
assert.equal(freeze.production_acceptance.deployment_baseline, freeze.baseline);
assert.equal(freeze.production_acceptance.url, 'https://phios-github.pages.dev');

for (const [item, result] of Object.entries(freeze.development_acceptance)) {
  assert.equal(result, 'passed', `Development acceptance failed: ${item}`);
}
assert.ok(Object.values(contractAcceptance.acceptance).every(result => result === 'passed'));

const requiredReaders = ['human_design', 'bazi', 'ziwei', 'gene_keys', 'astrology'];
assert.deepEqual(readers.readers.map(reader => reader.reader_id), requiredReaders);
assert.equal(readers.readers.find(reader => reader.reader_id === 'human_design').active, true);
for (const reader of readers.readers.filter(reader => reader.reader_id !== 'human_design')) {
  assert.equal(reader.active, false);
  assert.equal(reader.registry_status, 'scaffold');
}

assert.ok(framework);
assert.ok(privacy);
assert.ok(reports);

for (const command of [
  'check:external-reader',
  'check:professional-workspace',
  'check:reader-registry',
  'check:reader-boundary',
  'check:m4b-contract-acceptance',
  'check:m4b-release-freeze'
]) {
  assert.ok(packageJson.scripts[command], `Missing package script: ${command}`);
}

const expectedProductionChecks = [
  'professional_home', 'human_design_service', 'external_readers', 'intake',
  'consent', 'chart_upload_handoff', 'professional_workspace_shell',
  'report_preview_shell', 'pdf_export_control', 'english',
  'simplified_chinese', 'mobile', 'desktop', 'console'
];
assert.deepEqual(Object.keys(freeze.production_acceptance.checks), expectedProductionChecks);
for (const result of Object.values(freeze.production_acceptance.checks)) {
  assert.ok(['passed', 'pending_interactive_verification'].includes(result));
}
assert.equal(freeze.production_acceptance.checks.console, 'pending_interactive_verification');

for (const [boundary, modified] of Object.entries(freeze.boundaries)) {
  assert.equal(modified, false, `Frozen boundary changed: ${boundary}`);
}

assert.equal(freeze.freeze_state, 'conditional_passed');
assert.equal(freeze.production_acceptance.status, 'conditional_passed');
assert.ok(freeze.production_acceptance.remaining_acceptance.length > 0);

console.log('✓ M4B-W10 Release and Freeze passed: Development Acceptance is closed and Production remains Conditional Passed pending authorised payload acceptance.');
