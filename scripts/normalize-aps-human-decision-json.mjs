import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const batchesRoot = path.join(root, 'content/production/article-simplification/batches');
const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);

if (!fs.existsSync(batchesRoot)) process.exit(0);

let normalized = 0;
for (const entry of fs.readdirSync(batchesRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const target = path.join(batchesRoot, entry.name, 'human-decisions.v1.json');
  if (!fs.existsSync(target)) continue;
  const bytes = fs.readFileSync(target);
  if (bytes.length >= 3 && bytes.subarray(0, 3).equals(UTF8_BOM)) {
    fs.writeFileSync(target, bytes.subarray(3));
    normalized += 1;
    console.log(`✓ APS JSON encoding normalization removed UTF-8 BOM: ${path.relative(root, target)}`);
  }
}
if (normalized === 0) console.log('✓ APS JSON encoding normalization: no UTF-8 BOM found.');
