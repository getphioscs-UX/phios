import fs from 'node:fs/promises';

const file = 'package.json';
const packageJson = JSON.parse(await fs.readFile(file, 'utf8'));

packageJson.scripts['knowledge:freeze'] =
  'node scripts/knowledge-blueprints-freeze.mjs write';
packageJson.scripts['knowledge:freeze:status'] =
  'node scripts/knowledge-blueprints-freeze.mjs status';
packageJson.scripts['check:kh-w4d-w4e'] =
  'node scripts/check-kh-w4d-w4e-freeze-ownership.mjs';

const gate = 'node scripts/check-kh-w4d-w4e-freeze-ownership.mjs';
if (!packageJson.scripts.precheck.includes(gate)) {
  packageJson.scripts.precheck =
    `${packageJson.scripts.precheck} && ${gate}`;
}

await fs.writeFile(file, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
console.log('✓ package.json updated for KH-W4D/W4E.');
