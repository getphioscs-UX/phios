import fs from 'node:fs';
import path from 'node:path';
import { buildVapW4Eligibility, stableJson, VAP_W4_ELIGIBILITY } from './lib/visual-article-production/node-production-eligibility-v1.mjs';

const root = process.cwd();
const output = path.join(root, VAP_W4_ELIGIBILITY);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, stableJson(buildVapW4Eligibility(root)), 'utf8');
console.log(`✓ VAP-W4 Node Production Eligibility built: ${VAP_W4_ELIGIBILITY}`);
