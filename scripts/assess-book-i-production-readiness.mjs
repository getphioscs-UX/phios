import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { buildProductionReadiness } from './lib/knowledge-readiness/universal-production-readiness.mjs';

const root = process.cwd(), apply = process.argv.includes('--apply');
if (apply && process.argv.includes('--dry-run')) { console.error('ARGUMENT_CONFLICT'); process.exit(2); }
const { files, index } = buildProductionReadiness(root);
const existing = [], create = [], conflict = [];
for (const [relative, expected] of files) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) create.push(relative);
  else (isDeepStrictEqual(JSON.parse(fs.readFileSync(absolute, 'utf8')), expected) ? existing : conflict).push(relative);
}
const report = { stage: 'PJA-W2F-C3', mode: apply ? 'apply' : 'dry-run', assessed: index.nodeCount, productionReady: index.productionReadyCount, productionBlocked: index.productionBlockedCount, existing: existing.length, create: create.length, conflict: conflict.length, filesThatWouldChange: create, conflicts: conflict };
console.log(JSON.stringify(report, null, 2));
if (conflict.length) process.exit(2);
if (!apply || !create.length) { if (apply) console.log('PJA-W2F-C3 apply no-op; byte-stable.'); process.exit(0); }
for (const [relative, value] of files) { const target = path.join(root, relative), temporary = `${target}.tmp`; fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); fs.renameSync(temporary, target); }
console.log('PJA-W2F-C3 Universal Production Readiness assessments applied atomically.');
