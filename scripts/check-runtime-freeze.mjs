import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const modules = read('content/registry/runtime-modules.json');
const contracts = read('content/registry/runtime-contracts.json');
const closure = read('content/registry/runtime-freeze-closure.json');
const audit = read('content/registry/runtime-freeze-audit.json');

if (modules.engineStatus !== 'freeze_ready') throw new Error('Runtime module registry is not Freeze Ready.');
if (contracts.status !== 'closed' || closure.status !== 'closed') throw new Error('Runtime Contract Closure is incomplete.');
if (audit.status !== 'passed' || audit.decision !== 'freeze_ready') throw new Error('Runtime Freeze Audit has not passed.');
if (audit.newRuntimeStagesAllowed !== false) throw new Error('Runtime Freeze Audit allows new Stages.');
if ((audit.auditResults || []).some(result => result.status !== 'passed')) throw new Error('A Runtime Freeze gate is not passing.');

const requiredEvidence = [
  'docs/runtime/M1-RUNTIME-FREEZE-REPORT.md',
  'scripts/check-runtime-inventory.mjs',
  'scripts/check-runtime-contracts.mjs',
  'scripts/check-runtime-gap-closure.mjs',
  'scripts/check-runtime-persistence-recovery.mjs',
  'scripts/check-runtime-lineage-timeline.mjs'
];
for (const file of requiredEvidence) if (!fs.existsSync(path.join(root, file))) throw new Error(`Freeze evidence missing: ${file}`);

const allowed = JSON.stringify(['kernel_migration','contract_closure','bug_fix']);
if (JSON.stringify(audit.allowedPostFreezeChanges) !== allowed) throw new Error('Post-freeze change policy has drifted.');

console.log('✓ M1 Runtime Engine Freeze Audit passed: Feature Complete, Contract Closed, Freeze Ready.');
