import fs from 'node:fs';
import path from 'node:path';
import { buildVapW5rPortfolio, stableJson, VAP_W5R_OUTPUT } from './lib/visual-article-production/scalable-article-production-portfolio-v1.mjs';

const root = process.cwd();
const output = path.join(root, VAP_W5R_OUTPUT);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, stableJson(buildVapW5rPortfolio(root)), 'utf8');
console.log(`✓ VAP-W5R Scalable Article Production Portfolio built: ${VAP_W5R_OUTPUT}`);
