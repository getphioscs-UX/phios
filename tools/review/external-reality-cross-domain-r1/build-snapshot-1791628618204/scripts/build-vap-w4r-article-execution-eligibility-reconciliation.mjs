import fs from 'node:fs';
import path from 'node:path';
import { buildVapW4rReconciliation, stableJson, VAP_W4R_OUTPUT } from './lib/visual-article-production/article-execution-eligibility-reconciliation-v1.mjs';

const root = process.cwd();
const output = path.join(root, VAP_W4R_OUTPUT);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, stableJson(buildVapW4rReconciliation(root)), 'utf8');
console.log(`✓ VAP-W4R Article Execution Eligibility reconciliation built: ${VAP_W4R_OUTPUT}`);
