import fs from 'node:fs';
import path from 'node:path';
import { buildVapW7Activation, stableJson, VAP_W7_ACTIVATION } from './lib/visual-article-production/governed-provider-generation-v1.mjs';

const root = process.cwd();
const activation = buildVapW7Activation(root);
const output = path.join(root, VAP_W7_ACTIVATION);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, stableJson(activation), 'utf8');
console.log(`✓ VAP-W7 built: ${VAP_W7_ACTIVATION}`);
console.log(`✓ Provider generation eligible now: ${activation.providerGenerationEligibleCount}/${activation.selectedNodeCount}`);
