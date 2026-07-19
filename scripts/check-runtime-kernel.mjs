import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const required = [
  'assets/js/runtime/index.js',
  'assets/js/runtime/kernel/kernel.js',
  'assets/js/runtime/kernel/contract-manager.js',
  'assets/js/runtime/kernel/workspace-manager.js',
  'assets/js/runtime/kernel/persistence-manager.js',
  'assets/js/runtime/kernel/transition-manager.js',
  'assets/js/runtime/kernel/lineage-manager.js',
  'assets/js/runtime/kernel/recovery-manager.js',
  'assets/js/runtime/kernel/event-bus.js'
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing Runtime Kernel file: ${file}`);
}

const kernelSource = fs.readFileSync(path.join(root, 'assets/js/runtime/kernel/kernel.js'), 'utf8');
for (const token of ['phi-os.runtime-kernel.v1', 'automaticRuntimeCreation: false', 'historicalOverwriteAllowed: false']) {
  if (!kernelSource.includes(token)) throw new Error(`Runtime Kernel guardrail missing: ${token}`);
}

const indexSource = fs.readFileSync(path.join(root, 'assets/js/runtime/index.js'), 'utf8');
if (!indexSource.includes('RuntimeKernel')) throw new Error('Runtime Kernel public entry does not export RuntimeKernel.');

const pageSource = fs.readFileSync(path.join(root, 'assets/js/pages/my-reality.js'), 'utf8');
if (!pageSource.includes("from '../runtime/index.js'")) throw new Error('My Reality is not using the Runtime Kernel boundary.');
if (pageSource.includes("from '../modules/runtime-transition-engine.js'")) throw new Error('My Reality still bypasses the Runtime Kernel transition manager.');
if (pageSource.includes("from '../modules/runtime-lineage.js'")) throw new Error('My Reality still bypasses the Runtime Kernel lineage manager.');

const eventModule = await import(pathToFileURL(path.join(root, 'assets/js/runtime/kernel/event-bus.js')).href);
let delivered = false;
const unsubscribe = eventModule.onRuntimeEvent('kernel.check', payload => { delivered = payload.detail.ok === true; });
eventModule.emitRuntimeEvent('kernel.check', { ok: true });
unsubscribe();
if (!delivered) throw new Error('Runtime Event Bus did not deliver an event.');

console.log('✓ Runtime Kernel, manager boundary, event bus, and guardrails checks passed.');
