import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
pkg.scripts ||= {};

pkg.scripts['check:mpa-w25'] = 'node scripts/check-mpa-w25-future-method-holding-registry.mjs';
pkg.scripts['check:mpa-future-holding'] = 'npm run check:mpa-w25';

const segment = 'npm run check:mpa-future-holding';
const current = String(pkg.scripts['check:mpa'] || '').trim();
const segments = current ? current.split(' && ').filter(Boolean) : [];
if (!segments.includes(segment)) segments.push(segment);
pkg.scripts['check:mpa'] = segments.join(' && ');

fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
console.log('✓ MPA-W25 package scripts registered.');
console.log('✓ MPA remains outside global postcheck; Future Holding adds no Production activation authority.');
