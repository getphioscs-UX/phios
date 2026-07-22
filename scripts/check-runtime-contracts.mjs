import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const registryPath = path.join(root, 'content/registry/runtime-contracts.json');
const documentationPath = path.join(root, 'docs/runtime/M1-W2-RUNTIME-CONTRACT-CLOSURE.md');
if (!fs.existsSync(registryPath)) throw new Error('Missing Runtime Contract Registry.');
if (!fs.existsSync(documentationPath)) throw new Error('Missing M1-W2 Contract Closure document.');

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
if (registry.status !== 'closed') throw new Error('Runtime contracts are not closed.');
if (registry.breakingChangePolicy !== 'new_schema_id_and_migration_required') {
  throw new Error('Runtime breaking-change policy has drifted.');
}

const contracts = new Map((registry.contracts || []).map(contract => [contract.id, contract]));
const required = [
  'runtime-entry', 'reconstruction', 'reading-input', 'reality-reading',
  'reading-navigation', 'navigation-input', 'navigation', 'review',
  'runtime-memory', 'continuity', 'runtime-transition-execution',
  'reading-revision-request', 'entry-continuity-handoff', 'runtime-lineage',
  'runtime-snapshot', 'runtime-workspace-state', 'runtime-kernel'
];
for (const id of required) if (!contracts.has(id)) throw new Error(`Missing Runtime contract: ${id}`);

const schemaIds = new Set();
for (const contract of contracts.values()) {
  if (!/^phi-os\.[a-z0-9-]+\.v\d+$/.test(contract.schemaId)) throw new Error(`Invalid schema ID: ${contract.schemaId}`);
  if (schemaIds.has(contract.schemaId)) throw new Error(`Duplicate schema authority: ${contract.schemaId}`);
  schemaIds.add(contract.schemaId);
  if (!fs.existsSync(path.join(root, contract.validator))) throw new Error(`Missing contract authority: ${contract.validator}`);
  if (!contract.required_fields?.includes('schemaVersion')) throw new Error(`${contract.id} does not freeze schemaVersion.`);
}

for (const handoff of registry.handoffs || []) {
  if (!contracts.has(handoff.contract)) throw new Error(`Unknown handoff contract: ${handoff.contract}`);
}

const server = await import(pathToFileURL(path.join(root, 'functions/runtime/shared/schema-registry.js')).href);
const browser = await import(pathToFileURL(path.join(root, 'assets/js/core/schema-registry.js')).href);
for (const key of Object.keys(server.SCHEMA_IDS)) {
  if (browser.SCHEMA_IDS[key] !== server.SCHEMA_IDS[key]) throw new Error(`Browser/server schema drift: ${key}`);
}

const sourceChecks = [
  ['functions/runtime/navigation/reading-navigation-contract.js', 'automaticSelectionAllowed: false'],
  ['functions/runtime/continuity/reality-continuity-contract.js', 'historicalContractOverwriteAllowed: false'],
  ['assets/js/modules/runtime-transition-engine.js', 'automaticExecution: false'],
  ['assets/js/modules/runtime-transition-engine.js', 'createsNextRuntime: false'],
  ['assets/js/modules/runtime-lineage.js', 'historicalOverwriteAllowed: false'],
  ['assets/js/runtime/kernel/kernel.js', 'automaticRuntimeCreation: false']
];
for (const [file, token] of sourceChecks) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  if (!source.includes(token)) throw new Error(`Runtime guardrail missing in ${file}: ${token}`);
}

console.log('✓ M1-W2 Runtime Contract Registry, schema freeze, handoffs, and guardrail matrix checks passed.');
