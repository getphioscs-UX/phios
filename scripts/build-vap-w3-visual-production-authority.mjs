import fs from 'node:fs';
import path from 'node:path';
import { buildVapW3Authority, stableJson, VAP_W3_AUTHORITY } from './lib/visual-article-production/visual-production-authority-v1.mjs';

const root = process.cwd();
const output = path.join(root, VAP_W3_AUTHORITY);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, stableJson(buildVapW3Authority(root)), 'utf8');
console.log(`✓ VAP-W3 Visual Production Authority built: ${VAP_W3_AUTHORITY}`);
