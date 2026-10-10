import { buildBatchPlan } from './lib/knowledge-production/book-i-batch-production.mjs';
console.log(JSON.stringify(buildBatchPlan(process.cwd()), null, 2));
