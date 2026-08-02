import fs from 'node:fs';
import path from 'node:path';
import { BATCH_OUTPUT_ROOT, buildBatchPlan, buildPackageManifest, findBatchConflicts } from './lib/knowledge-production/book-i-batch-production.mjs';

const root = process.cwd(), apply = process.argv.includes('--apply'), plan = buildBatchPlan(root);
console.log(JSON.stringify({ ...plan, mode: apply ? 'apply' : 'dry-run' }, null, 2));
if (!plan.eligibleNodes.length) { console.log('PJA-W2F-D no eligible nodes; success with 0 writes.'); process.exit(0); }
if (!apply) process.exit(0);
const conflicts = findBatchConflicts(root, plan.plannedBatches);
if (conflicts.length) { console.error(JSON.stringify({ code: 'BATCH_OUTPUT_CONFLICT', batches: conflicts })); process.exit(2); }
const temporaryRoot = path.join(root, `${BATCH_OUTPUT_ROOT}.tmp`);
fs.rmSync(temporaryRoot, { recursive: true, force: true });
for (const batch of plan.plannedBatches) { const target = path.join(temporaryRoot, batch.batchId, 'production-manifest.json'); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, `${JSON.stringify(buildPackageManifest(batch, plan), null, 2)}\n`); }
fs.mkdirSync(path.dirname(path.join(root, BATCH_OUTPUT_ROOT)), { recursive: true }); fs.renameSync(temporaryRoot, path.join(root, BATCH_OUTPUT_ROOT));
console.log(`PJA-W2F-D applied ${plan.plannedBatches.length} governed batch package(s) atomically.`);
