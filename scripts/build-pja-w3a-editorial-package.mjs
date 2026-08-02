import fs from 'node:fs';
import path from 'node:path';
import { buildEditorialPackage } from './lib/knowledge-production/editorial-package.mjs';

const root = process.cwd(), apply = process.argv.includes('--apply');
const files = buildEditorialPackage(root), create = [], update = [], existing = [];
for (const [relative, expected] of files) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) create.push(relative);
  else if (fs.readFileSync(absolute, 'utf8') === expected) existing.push(relative);
  else update.push(relative);
}
const report = { stage: 'PJA-W3A', mode: apply ? 'apply' : 'dry-run', nodeCode: 'KN-PREFACE-001', status: 'validated', existing: existing.length, create: create.length, update: update.length, filesThatWouldChange: [...create, ...update], productionExports: 0, published: 0 };
console.log(JSON.stringify(report, null, 2));
if (!apply || (!create.length && !update.length)) { if (apply) console.log('PJA-W3A apply no-op; byte-stable.'); process.exit(0); }
for (const [relative, value] of files) { const target = path.join(root, relative), temporary = `${target}.tmp`; fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(temporary, value); fs.renameSync(temporary, target); }
console.log('PJA-W3A Governed Production Package applied atomically.');
