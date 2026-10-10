import fs from 'node:fs';
import path from 'node:path';
import {
  buildVapW6Activation,
  buildVapW6BatchSelection,
  stableJson,
  VAP_W6_ACTIVATION,
  VAP_W6_BATCH
} from './lib/visual-article-production/batch-article-selection-production-brief-export-v1.mjs';

const root = process.cwd();
const batch = buildVapW6BatchSelection(root);
const activation = buildVapW6Activation(root, batch);

for (const [relative, value] of [
  [VAP_W6_BATCH, batch],
  [VAP_W6_ACTIVATION, activation]
]) {
  const output = path.join(root, relative);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, stableJson(value), 'utf8');
  console.log(`✓ VAP-W6 built: ${relative}`);
}
