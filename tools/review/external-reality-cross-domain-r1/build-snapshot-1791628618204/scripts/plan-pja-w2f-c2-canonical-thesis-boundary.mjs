import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { buildC2, C2_INDEX, C2_REPORT } from './lib/knowledge-readiness/canonical-thesis-boundary.mjs';

const root = process.cwd();
const apply = process.argv.includes('--apply');
if (apply && process.argv.includes('--dry-run')) { console.error('ARGUMENT_CONFLICT'); process.exit(2); }
const { files, index } = buildC2(root);
const mutableGenerated = new Set([C2_INDEX, C2_REPORT]);
const existing = [], create = [], update = [], conflict = [];
for (const [relative, expected] of files) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) create.push(relative);
  else {
    const current = JSON.parse(fs.readFileSync(absolute, 'utf8'));
    if (isDeepStrictEqual(current, expected)) existing.push(relative);
    else if (mutableGenerated.has(relative)) update.push(relative);
    else conflict.push(relative);
  }
}
const frozen = index.entries.filter(entry => entry.status === 'frozen').length;
const humanReviewRequired = index.entries.filter(entry => entry.status === 'human_review_required').length;
const report = {
  stage: 'PJA-W2F-C2', mode: apply ? 'apply' : 'dry-run', assessed: index.entries.length,
  existing: existing.length, create: create.length, update: update.length, conflict: conflict.length, missing: 0,
  frozen, humanReviewRequired, filesThatWouldChange: [...create, ...update], conflicts: conflict
};
console.log(JSON.stringify(report, null, 2));
if (conflict.length) process.exit(2);
if (!apply || (!create.length && !update.length)) { if (apply) console.log('PJA-W2F-C2 apply no-op; byte-stable.'); process.exit(0); }
const writeSet = new Set([...create, ...update]);
for (const [relative, value] of files) {
  if (!writeSet.has(relative)) continue;
  const out = path.join(root, relative), temporary = `${out}.tmp`;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temporary, out);
}
console.log('PJA-W2F-C2 Canonical Thesis and Boundary reconciliation applied atomically.');
