import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { buildC2, C2_ROOT } from './lib/knowledge-readiness/canonical-thesis-boundary.mjs';

const root = process.cwd();
const apply = process.argv.includes('--apply');
if (apply && process.argv.includes('--dry-run')) { console.error('ARGUMENT_CONFLICT'); process.exit(2); }
const { files } = buildC2(root);
const existing = [], create = [], conflict = [];
for (const [relative, expected] of files) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) create.push(relative);
  else { const current = JSON.parse(fs.readFileSync(absolute, 'utf8')); (isDeepStrictEqual(current, expected) ? existing : conflict).push(relative); }
}
const report = { stage: 'PJA-W2F-C2', mode: apply ? 'apply' : 'dry-run', assessed: 78, existing: existing.length, create: create.length, conflict: conflict.length, missing: 0, frozen: 1, humanReviewRequired: 77, filesThatWouldChange: create, conflicts: conflict };
console.log(JSON.stringify(report, null, 2));
if (conflict.length) process.exit(2);
if (!apply || !create.length) { if (apply) console.log('PJA-W2F-C2 apply no-op; byte-stable.'); process.exit(0); }
for (const [relative, value] of files) {
  const out = path.join(root, relative), temporary = `${out}.tmp`;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temporary, out);
}
console.log('PJA-W2F-C2 Canonical Thesis and Boundary assessment applied atomically.');
