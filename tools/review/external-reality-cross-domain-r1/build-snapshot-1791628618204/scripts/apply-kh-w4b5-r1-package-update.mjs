import fs from 'node:fs/promises';

const path = 'package.json';
const packageJson = JSON.parse(await fs.readFile(path, 'utf8'));

packageJson.scripts['check:kh-w4b.5-r1'] =
  'node scripts/check-kh-w4b5-r1-blueprint-registry-authority-refresh.mjs';

const gate =
  'node scripts/check-kh-w4b5-r1-blueprint-registry-authority-refresh.mjs';

if (!packageJson.scripts.precheck.includes(gate)) {
  const existingBook2Gate =
    'node scripts/check-kh-w4b5-book-2-canonical-node-registry.mjs';
  packageJson.scripts.precheck = packageJson.scripts.precheck.includes(existingBook2Gate)
    ? packageJson.scripts.precheck.replace(
        existingBook2Gate,
        `${existingBook2Gate} && ${gate}`
      )
    : `${packageJson.scripts.precheck} && ${gate}`;
}

await fs.writeFile(path, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
console.log('✓ package.json updated for KH-W4B.5 R1.');
