import { validateBatchSystem } from './lib/knowledge-production/book-i-batch-production.mjs';
const result = validateBatchSystem(process.cwd());
if (!result.valid) { console.error(result.errors.join('\n')); process.exit(2); }
console.log(`✓ PJA-W2F-D Batch System valid: ${result.plan.eligibleNodes.length} eligible nodes, ${result.plan.plannedBatches.length} planned batches, 0 generated exports.`);
