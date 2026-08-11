import fs from 'node:fs';
import path from 'node:path';
import { buildVapW5Acceptance, stableJson, VAP_W5_ACCEPTANCE } from './lib/visual-article-production/pja-production-brief-export-acceptance-v1.mjs';

const root = process.cwd();
const output = path.join(root, VAP_W5_ACCEPTANCE);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, stableJson(buildVapW5Acceptance(root)), 'utf8');
console.log(`✓ VAP-W5 PJA Production Brief Export acceptance built: ${VAP_W5_ACCEPTANCE}`);
