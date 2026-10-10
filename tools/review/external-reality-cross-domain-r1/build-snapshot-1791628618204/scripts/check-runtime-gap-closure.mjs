import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const modules = read('content/registry/runtime-modules.json');
const contracts = read('content/registry/runtime-contracts.json');
const closure = read('content/registry/runtime-freeze-closure.json');

const statuses = new Set(closure.moduleStatusVocabulary);
for (const module of modules.modules || []) {
  if (!statuses.has(module.status)) throw new Error(`Invalid or missing status for Runtime module: ${module.id}`);
}

const expectedStates = [
  'entry_collecting', 'entry_complete', 'reconstruction_ready',
  'reading_ready', 'navigation_ready', 'review_ready', 'continuity_active'
];
if (JSON.stringify(closure.canonicalStageStates) !== JSON.stringify(expectedStates)) {
  throw new Error('Canonical Runtime lifecycle states have drifted.');
}

const capabilities = Object.keys(closure.kernelContract?.capabilities || {});
const expectedCapabilities = ['initializeRuntime', 'loadRuntime', 'applyTransition', 'commitRevision', 'appendEvent', 'recoverRuntime'];
if (JSON.stringify(capabilities) !== JSON.stringify(expectedCapabilities)) throw new Error('Runtime Kernel capability contract has drifted.');
const kernel = fs.readFileSync(path.join(root, 'assets/js/runtime/kernel/kernel.js'), 'utf8');
for (const capability of expectedCapabilities) if (!kernel.includes(`${capability}:`) && !kernel.includes(`function ${capability}`)) throw new Error(`Kernel capability missing: ${capability}`);

const metadataKeys = closure.contractMetadataStandard?.requiredKeys || [];
for (const key of ['id','version','status','input','output','required_fields','optional_fields','errors','dependencies']) {
  if (!metadataKeys.includes(key)) throw new Error(`Contract metadata key missing: ${key}`);
}
if ((contracts.contracts || []).length < 12) throw new Error('Contract Inventory is incomplete.');
for (const contract of contracts.contracts || []) {
  for (const key of metadataKeys) if (!(key in contract)) throw new Error(`${contract.id} metadata missing: ${key}`);
}

const deprecated = closure.deprecatedFields || [];
for (const field of deprecated) {
  if (!field.oldName || !field.newName || !field.deprecatedSince || !field.removalVersion) throw new Error('Deprecated Field Map entry is incomplete.');
}

const expectedTests = ['valid_input','missing_required_field','invalid_field_type','unknown_field','backward_compatible_input'];
if (JSON.stringify(closure.contractTestMatrix) !== JSON.stringify(expectedTests)) throw new Error('Contract test matrix has drifted.');
if ((closure.duplicateResponsibilityAudit || []).some(item => item.status !== 'closed')) throw new Error('Duplicate responsibility audit is not closed.');

const landing = fs.readFileSync(path.join(root, 'assets/js/pages/landing.js'), 'utf8');
const reality = fs.readFileSync(path.join(root, 'assets/js/pages/my-reality.js'), 'utf8');
if (!landing.includes('RuntimeKernel.initializeRuntime')) throw new Error('Landing bypasses Kernel initialization.');
if (!reality.includes('RuntimeKernel.contracts.save')) throw new Error('My Reality bypasses Kernel contract persistence.');

console.log('✓ M1 detailed inventory, Kernel, metadata, naming, deprecation, and test-matrix gaps are closed.');
