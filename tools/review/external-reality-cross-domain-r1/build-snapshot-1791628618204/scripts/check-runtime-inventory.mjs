import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const registryPath = path.join(root, 'content/registry/runtime-modules.json');
const documentationPath = path.join(root, 'docs/runtime/M1-W1-RUNTIME-INVENTORY.md');

if (!fs.existsSync(registryPath)) throw new Error('Missing Runtime module registry.');
if (!fs.existsSync(documentationPath)) throw new Error('Missing M1-W1 Runtime Inventory documentation.');

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const expectedStages = ['entry', 'reconstruction', 'reading', 'navigation', 'review', 'memory', 'continuity'];
const requiredModules = [
  ...expectedStages,
  'transition', 'revision', 'lineage', 'persistence', 'kernel', 'workspace',
  'recovery', 'contract-manager', 'event-bus', 'schema-registry',
  'formation-grammar', 'runtime-locales'
];

if (registry.status !== 'frozen') throw new Error('Runtime module registry is not frozen.');
if (registry.policy?.newRuntimeStagesAllowed !== false) throw new Error('Runtime registry allows new stages.');
if (JSON.stringify(registry.policy?.stageOrder) !== JSON.stringify(expectedStages)) {
  throw new Error('Canonical Runtime stage order has drifted.');
}

const modules = new Map((registry.modules || []).map(module => [module.id, module]));
for (const id of requiredModules) {
  if (!modules.has(id)) throw new Error(`Missing Runtime module: ${id}`);
}

const stageModules = [...modules.values()].filter(module => module.kind === 'stage').map(module => module.id);
if (JSON.stringify(stageModules) !== JSON.stringify(expectedStages)) {
  throw new Error(`Runtime Stage set has drifted: ${stageModules.join(', ')}`);
}

for (const module of modules.values()) {
  for (const dependency of module.dependsOn || []) {
    if (!modules.has(dependency)) throw new Error(`${module.id} references unknown dependency: ${dependency}`);
  }
  for (const canonicalPath of module.canonicalPaths || []) {
    if (!fs.existsSync(path.join(root, canonicalPath))) {
      throw new Error(`Missing canonical Runtime path for ${module.id}: ${canonicalPath}`);
    }
  }
}

for (const forbiddenPath of registry.duplicateAudit?.forbiddenPaths || []) {
  if (fs.existsSync(path.join(root, forbiddenPath))) {
    throw new Error(`Forbidden duplicate Runtime path exists: ${forbiddenPath}`);
  }
}

const pageDirectory = path.join(root, 'assets/js/pages');
const forbiddenDirectImports = [
  "../modules/runtime-transition-engine.js",
  "../modules/runtime-lineage.js",
  "../modules/runtime-persistence.js",
  "../modules/runtime-workspace.js"
];
for (const filename of fs.readdirSync(pageDirectory).filter(name => name.endsWith('.js'))) {
  const source = fs.readFileSync(path.join(pageDirectory, filename), 'utf8');
  for (const importPath of forbiddenDirectImports) {
    if (source.includes(importPath)) throw new Error(`${filename} bypasses the Runtime Kernel: ${importPath}`);
  }
}

console.log('✓ M1-W1 Runtime inventory, canonical paths, duplicate guard, and stage freeze checks passed.');
